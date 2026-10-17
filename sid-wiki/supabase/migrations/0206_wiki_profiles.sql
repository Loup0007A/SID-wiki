-- =====================================================================
-- 0206 — Profils des chasseurs + équipement façon « armor-stand » :
--         7 emplacements (tête, torse, jambes, pieds, main droite, main gauche, dos)
--         dans lesquels on pose une fiche DÉCOUVERTE des catégories Armes ou Objets.
-- À exécuter APRÈS 0200 … 0205. Suppose public.profiles(id, nickname, status).
--
-- Qui peut modifier ? Chaque membre actif modifie SON profil ;
-- les admins (manage_wiki) peuvent modifier celui de n'importe qui.
-- Comme le reste du wiki : aucune lecture directe de la table, tout passe par des RPC
-- qui ne renvoient jamais le titre / l'image d'une fiche non découverte.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Table : une fiche par emplacement et par membre
-- ---------------------------------------------------------------------
create table if not exists public.wiki_profile_gear (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  slot       text not null check (slot in ('tete', 'torse', 'jambes', 'pieds', 'main_droite', 'main_gauche', 'dos')),
  entry_id   uuid not null references public.wiki_entries(id) on delete cascade,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now(),
  primary key (user_id, slot)
);
create index if not exists wiki_profile_gear_entry_idx on public.wiki_profile_gear (entry_id);

alter table public.wiki_profile_gear enable row level security;  -- aucune policy : RPC uniquement

-- ---------------------------------------------------------------------
-- 2. Helper interne : l'équipement d'un membre en JSON
--    (une fiche re-masquée après coup redevient « ? » : ni titre, ni image)
-- ---------------------------------------------------------------------
create or replace function public.wiki_profile_gear_json(p_user uuid)
returns jsonb
language sql stable security definer set search_path = public
as $$
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'slot',       g.slot,
      'category',   e.category,
      'number',     e.number,
      'discovered', e.discovered,
      'title',      case when e.discovered then e.title end,
      'summary',    case when e.discovered then e.summary end,
      'image_url',  case when e.discovered then e.image_url end,
      'rarity',     case when e.discovered then e.rarity end
    ) order by g.slot), '[]'::jsonb)
  from public.wiki_profile_gear g
  join public.wiki_entries e on e.id = g.entry_id
  where g.user_id = p_user;
$$;

-- ---------------------------------------------------------------------
-- 3. Liste de tous les profils (membres actifs), le sien en premier
-- ---------------------------------------------------------------------
create or replace function public.wiki_profiles_list()
returns table (id uuid, nickname text, is_me boolean, discoveries int, gear jsonb)
language plpgsql stable security definer set search_path = public
as $$
begin
  if not public.wiki_can_read() then
    raise exception 'Accès refusé' using errcode = '42501';
  end if;

  return query
  select p.id,
         p.nickname,
         (p.id = auth.uid()),
         (select count(*)::int from public.wiki_entries e where e.discovered and e.discovered_by = p.id),
         public.wiki_profile_gear_json(p.id)
  from public.profiles p
  where p.status = 'active' and p.nickname is not null
  order by (p.id = auth.uid()) desc, lower(p.nickname);
end;
$$;

-- ---------------------------------------------------------------------
-- 4. Un profil : équipement + dernières découvertes créditées
-- ---------------------------------------------------------------------
create or replace function public.wiki_profile_get(p_id uuid)
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare
  v_nick  text;
  v_found jsonb;
  v_total int;
begin
  if not public.wiki_can_read() then
    raise exception 'Accès refusé' using errcode = '42501';
  end if;

  select p.nickname into v_nick
  from public.profiles p
  where p.id = p_id and p.status = 'active' and p.nickname is not null;
  if not found then return null; end if;

  select count(*)::int into v_total
  from public.wiki_entries e
  where e.discovered and e.discovered_by = p_id;

  select coalesce(jsonb_agg(to_jsonb(d) order by d.discovered_at desc nulls last, d.category, d.number), '[]'::jsonb)
  into v_found
  from (
    select e.category, e.number, e.title, e.image_url, e.discovered_at
    from public.wiki_entries e
    where e.discovered and e.discovered_by = p_id
    order by e.discovered_at desc nulls last, e.category, e.number
    limit 12
  ) d;

  return jsonb_build_object(
    'id',                p_id,
    'nickname',          v_nick,
    'is_me',             p_id = auth.uid(),
    'can_edit',          (p_id = auth.uid() or public.wiki_is_admin()),
    'gear',              public.wiki_profile_gear_json(p_id),
    'discoveries_total', v_total,
    'discoveries',       v_found
  );
end;
$$;

-- ---------------------------------------------------------------------
-- 5. Poser / retirer une pièce d'équipement.
--    p_category = null  =>  l'emplacement est vidé.
--    Renvoie l'équipement à jour.
-- ---------------------------------------------------------------------
create or replace function public.wiki_profile_gear_set(p_user uuid, p_slot text, p_category text, p_number int)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_entry uuid;
begin
  if not public.wiki_can_read() then
    raise exception 'Accès refusé' using errcode = '42501';
  end if;
  if p_user is null or not (p_user = auth.uid() or public.wiki_is_admin()) then
    raise exception 'Tu ne peux modifier que ton propre profil.' using errcode = '42501';
  end if;
  if p_slot is null or p_slot not in ('tete', 'torse', 'jambes', 'pieds', 'main_droite', 'main_gauche', 'dos') then
    raise exception 'Emplacement invalide.';
  end if;
  if not exists (select 1 from public.profiles p where p.id = p_user and p.status = 'active') then
    raise exception 'Profil introuvable.';
  end if;

  if p_category is null then
    delete from public.wiki_profile_gear g where g.user_id = p_user and g.slot = p_slot;
    return public.wiki_profile_gear_json(p_user);
  end if;

  if p_category not in ('armes', 'objets') then
    raise exception 'Seules les fiches Armes et Objets peuvent être équipées.';
  end if;

  select e.id into v_entry from public.wiki_entries e
  where e.category = p_category and e.number = p_number and e.discovered;
  if v_entry is null then
    raise exception 'Fiche introuvable ou non découverte.';
  end if;

  insert into public.wiki_profile_gear (user_id, slot, entry_id, updated_by)
  values (p_user, p_slot, v_entry, auth.uid())
  on conflict (user_id, slot)
  do update set entry_id = excluded.entry_id, updated_by = excluded.updated_by, updated_at = now();

  return public.wiki_profile_gear_json(p_user);
end;
$$;

-- ---------------------------------------------------------------------
-- Droits d'exécution
-- ---------------------------------------------------------------------
revoke all on function public.wiki_profile_gear_json(uuid)                 from public, anon, authenticated;
revoke all on function public.wiki_profiles_list()                         from public, anon;
revoke all on function public.wiki_profile_get(uuid)                       from public, anon;
revoke all on function public.wiki_profile_gear_set(uuid, text, text, int) from public, anon;

grant execute on function public.wiki_profiles_list()                         to authenticated;
grant execute on function public.wiki_profile_get(uuid)                       to authenticated;
grant execute on function public.wiki_profile_gear_set(uuid, text, text, int) to authenticated;
