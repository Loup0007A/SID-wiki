-- =====================================================================
-- 0209 — Porte-armure :
--   1. placement de chaque arme / objet (réglé par les admins dans l'édition de la fiche) :
--        gear_dx, gear_dy : décalage en « pixels » du mannequin (grille 96 × 144)
--        gear_scale       : taille (1 = normale)
--        gear_rot         : rotation en degrés
--   2. image transparente qui remplace le mannequin en bois (Dashboard → Réglages).
-- À exécuter APRÈS 0208.
-- =====================================================================

alter table public.wiki_entries
  add column if not exists gear_dx    int     not null default 0,
  add column if not exists gear_dy    int     not null default 0,
  add column if not exists gear_scale numeric not null default 1,
  add column if not exists gear_rot   int     not null default 0;

alter table public.wiki_entries drop constraint if exists wiki_entries_gear_transform_check;
alter table public.wiki_entries
  add constraint wiki_entries_gear_transform_check
  check (gear_dx between -60 and 60 and gear_dy between -60 and 60
         and gear_scale between 0.3 and 3 and gear_rot between -180 and 180);

-- L'équipement d'un membre renvoie aussi le placement (jamais pour une fiche non découverte).
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
      'rarity',     case when e.discovered then e.rarity end,
      'shape',      case when e.discovered then e.gear_shape end,
      'color',      case when e.discovered then e.gear_color end,
      'dx',         case when e.discovered then e.gear_dx else 0 end,
      'dy',         case when e.discovered then e.gear_dy else 0 end,
      'scale',      case when e.discovered then e.gear_scale else 1 end,
      'rot',        case when e.discovered then e.gear_rot else 0 end
    ) order by g.slot), '[]'::jsonb)
  from public.wiki_profile_gear g
  join public.wiki_entries e on e.id = g.entry_id
  where g.user_id = p_user;
$$;

revoke all on function public.wiki_profile_gear_json(uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- Image du porte-armure (une seule pour tout le site ; vide = mannequin en bois)
-- ---------------------------------------------------------------------
create or replace function public.wiki_stand_image_get()
returns text
language plpgsql stable security definer set search_path = public
as $$
begin
  if not public.wiki_can_read() then
    raise exception 'Accès refusé' using errcode = '42501';
  end if;
  return (select nullif(s.value, '') from public.wiki_settings s where s.key = 'stand_image');
end;
$$;

create or replace function public.wiki_stand_image_set(p_url text)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not public.wiki_is_admin() then
    raise exception 'Accès refusé' using errcode = '42501';
  end if;
  if p_url is not null and p_url <> '' and (p_url !~ '^https://' or char_length(p_url) > 1000) then
    raise exception 'Adresse d''image invalide.';
  end if;
  insert into public.wiki_settings (key, value) values ('stand_image', coalesce(p_url, ''))
  on conflict (key) do update set value = excluded.value, updated_at = now();
end;
$$;

revoke all on function public.wiki_stand_image_get()     from public, anon;
revoke all on function public.wiki_stand_image_set(text) from public, anon;
grant execute on function public.wiki_stand_image_get()     to authenticated;
grant execute on function public.wiki_stand_image_set(text) to authenticated;
