-- =====================================================================
-- 0212 — Proposer une nouvelle fiche
-- À exécuter APRÈS 0211. Peut être relancée sans risque.
--
-- Un membre peut proposer une fiche qui n'existe pas encore (catégorie,
-- nom, résumé, texte, tags, fiche technique, rareté suggérée). L'équipe la
-- relit dans « Propositions » comme une modification. Acceptée, la fiche
-- est créée avec le numéro suivant de sa catégorie, déjà découverte, et
-- son auteur en est le découvreur (plus la renommée habituelle). L'image et
-- le modèle 3D s'ajoutent ensuite depuis l'édition de la fiche.
-- =====================================================================

alter table public.wiki_proposals alter column entry_id drop not null;
alter table public.wiki_proposals add column if not exists kind text not null default 'edit';
alter table public.wiki_proposals add column if not exists category text;
alter table public.wiki_proposals add column if not exists rarity int;
alter table public.wiki_proposals drop constraint if exists wiki_proposals_kind_check;
alter table public.wiki_proposals add constraint wiki_proposals_kind_check check (
  (kind = 'edit' and entry_id is not null)
  or (kind = 'new' and category in ('lieux', 'armes', 'mobs', 'objets', 'skills'))
);
alter table public.wiki_proposals drop constraint if exists wiki_proposals_rarity_check;
alter table public.wiki_proposals add constraint wiki_proposals_rarity_check check (rarity is null or rarity between 1 and 8);

-- ---------------------------------------------------------------------
-- Proposer une nouvelle fiche
-- ---------------------------------------------------------------------
create or replace function public.wiki_proposal_submit_new(
  p_category text, p_title text, p_summary text, p_content text,
  p_tags text[], p_infobox jsonb, p_rarity int default null, p_note text default null)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_id uuid;
  v_title text := nullif(btrim(coalesce(p_title, '')), '');
  v_summary text := nullif(btrim(coalesce(p_summary, '')), '');
  v_content text := coalesce(p_content, '');
  v_tags text[] := coalesce((select array_agg(distinct lower(btrim(t))) from unnest(coalesce(p_tags, '{}')) t where btrim(t) <> ''), '{}');
  v_info jsonb := coalesce(p_infobox, '[]'::jsonb);
begin
  if not public.wiki_can_read() then raise exception 'Accès refusé' using errcode = '42501'; end if;
  if p_category not in ('lieux', 'armes', 'mobs', 'objets', 'skills') then raise exception 'Catégorie inconnue.'; end if;
  if v_title is null then raise exception 'Le nom est obligatoire.'; end if;
  if char_length(v_title) > 120 then raise exception 'Nom trop long (120 caractères au plus).'; end if;
  if char_length(coalesce(v_summary, '')) > 600 then raise exception 'Résumé trop long (600 caractères au plus).'; end if;
  if char_length(btrim(v_content)) < 20 then raise exception 'Écris au moins quelques phrases dans le texte de la fiche.'; end if;
  if char_length(v_content) > 40000 then raise exception 'Texte trop long.'; end if;
  if cardinality(v_tags) > 15 or exists (select 1 from unnest(v_tags) t where char_length(t) > 30) then
    raise exception 'Tags : 15 au plus, de 30 caractères au plus.';
  end if;
  if jsonb_typeof(v_info) <> 'array' or jsonb_array_length(v_info) > 30 then
    raise exception 'Fiche technique : 30 lignes au plus.';
  end if;
  if p_rarity is not null and (p_rarity < 1 or p_rarity > 8) then raise exception 'Rareté de 1 à 8.'; end if;
  -- Doublons : même nom dans la catégorie (fiche existante ou proposition en attente).
  if exists (select 1 from public.wiki_entries where category = p_category and lower(title) = lower(v_title)) then
    raise exception 'Une fiche porte déjà ce nom dans cette catégorie : propose plutôt une modification.';
  end if;
  if exists (select 1 from public.wiki_proposals where kind = 'new' and status = 'pending'
             and category = p_category and lower(title) = lower(v_title)) then
    raise exception 'Une fiche de ce nom est déjà proposée et attend d''être relue.';
  end if;
  if (select count(*) from public.wiki_proposals where author_id = v_uid and status = 'pending') >= 5 then
    raise exception 'Tu as déjà 5 propositions en attente : attends qu''elles soient relues.';
  end if;

  insert into public.wiki_proposals (kind, category, entry_id, author_id, title, summary, content, tags, infobox, rarity, note)
  values ('new', p_category, null, v_uid, v_title, v_summary, v_content, v_tags, v_info, p_rarity,
          nullif(btrim(coalesce(p_note, '')), ''))
  returning id into v_id;
  return v_id;
end;
$$;

-- ---------------------------------------------------------------------
-- Lire : les nouvelles fiches n'ont pas (encore) de fiche liée
-- ---------------------------------------------------------------------
create or replace function public.wiki_proposals_list(p_status text default 'pending', p_mine boolean default false)
returns jsonb
language sql stable security definer set search_path = public
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', p.id, 'kind', p.kind, 'status', p.status, 'created_at', p.created_at, 'reviewed_at', p.reviewed_at,
    'note', p.note, 'review_note', p.review_note,
    'author', a.nickname, 'mine', p.author_id = auth.uid(),
    'category', coalesce(w.category, p.category), 'number', w.number, 'entry_title', w.title, 'title', p.title,
    'outdated', p.kind = 'edit' and p.base_updated_at is distinct from w.updated_at
  ) order by p.created_at desc), '[]'::jsonb)
  from public.wiki_proposals p
  left join public.wiki_entries w on w.id = p.entry_id
  left join public.profiles a on a.id = p.author_id
  where public.wiki_can_read()
    and (p_status is null or p_status = 'all' or p.status = p_status)
    and (p.author_id = auth.uid() or (public.wiki_is_admin() and not coalesce(p_mine, false)));
$$;

create or replace function public.wiki_proposal_get(p_id uuid)
returns jsonb
language sql stable security definer set search_path = public
as $$
  select jsonb_build_object(
    'id', p.id, 'kind', p.kind, 'status', p.status, 'created_at', p.created_at, 'reviewed_at', p.reviewed_at,
    'note', p.note, 'review_note', p.review_note, 'author', a.nickname, 'mine', p.author_id = auth.uid(),
    'reviewer', r.nickname, 'outdated', p.kind = 'edit' and p.base_updated_at is distinct from w.updated_at,
    'category', coalesce(w.category, p.category), 'number', w.number, 'rarity', p.rarity,
    'proposed', jsonb_build_object('title', p.title, 'summary', p.summary, 'content', p.content,
                                   'tags', to_jsonb(coalesce(p.tags, '{}')), 'infobox', coalesce(p.infobox, '[]'::jsonb)),
    -- Nouvelle fiche : rien à comparer. Modification en attente : la fiche
    -- actuelle ; déjà traitée : la fiche d'alors.
    'current', case
      when p.kind = 'new' then jsonb_build_object('title', '', 'summary', '', 'content', '', 'tags', '[]'::jsonb, 'infobox', '[]'::jsonb)
      when p.status <> 'pending' and p.base is not null then p.base
      else jsonb_build_object('title', w.title, 'summary', w.summary, 'content', w.content,
                              'tags', to_jsonb(coalesce(w.tags, '{}')), 'infobox', coalesce(w.infobox, '[]'::jsonb)) end
  )
  from public.wiki_proposals p
  left join public.wiki_entries w on w.id = p.entry_id
  left join public.profiles a on a.id = p.author_id
  left join public.profiles r on r.id = p.reviewer_id
  where p.id = p_id and public.wiki_can_read() and (p.author_id = auth.uid() or public.wiki_is_admin());
$$;

-- ---------------------------------------------------------------------
-- Relire : accepter une nouvelle fiche la crée
-- ---------------------------------------------------------------------
create or replace function public.wiki_proposal_review(p_id uuid, p_accept boolean, p_note text default null)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  p public.wiki_proposals;
  w public.wiki_entries;
  v_rep int := coalesce((select value::int from public.wiki_settings where key = 'proposal_reputation'), 5);
  v_note text := nullif(btrim(coalesce(p_note, '')), '');
  v_number int;
  v_entry uuid;
  v_name text;
begin
  if not public.wiki_is_admin() then raise exception 'Réservé aux admins du Wiki.'; end if;
  select * into p from public.wiki_proposals where id = p_id for update;
  if p.id is null then raise exception 'Proposition introuvable.'; end if;
  if p.status <> 'pending' then raise exception 'Proposition déjà relue.'; end if;
  if char_length(coalesce(v_note, '')) > 500 then raise exception 'Mot trop long (500 caractères au plus).'; end if;

  if p.kind = 'new' then
    v_name := p.title;
    if p_accept then
      if exists (select 1 from public.wiki_entries where category = p.category and lower(title) = lower(p.title)) then
        raise exception 'Une fiche porte déjà ce nom dans cette catégorie.';
      end if;
      perform pg_advisory_xact_lock(hashtext('wiki_number:' || p.category));
      select coalesce(max(number), 0) + 1 into v_number from public.wiki_entries where category = p.category;
      if v_number > 999 then raise exception 'Plus de numéro libre dans cette catégorie.'; end if;
      insert into public.wiki_entries (category, number, title, summary, content, tags, infobox, rarity,
                                       discovered, discovered_at, discovered_by, created_by)
      values (p.category, v_number, p.title, coalesce(p.summary, ''), coalesce(p.content, ''), coalesce(p.tags, '{}'),
              coalesce(p.infobox, '[]'::jsonb), p.rarity, true, now(), p.author_id, p.author_id)
      returning id into v_entry;
    end if;
  else
    select * into w from public.wiki_entries where id = p.entry_id;
    v_name := w.title;
    if p_accept then
      update public.wiki_entries
         set title = p.title, summary = p.summary, content = p.content, tags = p.tags, infobox = p.infobox
       where id = p.entry_id;
    end if;
  end if;

  update public.wiki_proposals
     set status = case when p_accept then 'accepted' else 'rejected' end,
         entry_id = coalesce(entry_id, v_entry),
         reviewer_id = v_uid, review_note = v_note, reviewed_at = now()
   where id = p.id;

  if p_accept and v_rep > 0 then
    update public.profiles set reputation = coalesce(reputation, 0) + v_rep where id = p.author_id;
  end if;

  begin
    insert into public.notifications (user_id, type, title, body, link)
    values (p.author_id, 'wiki',
            case when p_accept then 'Proposition acceptée' else 'Proposition refusée' end,
            case
              when p.kind = 'new' and p_accept then
                'Ta fiche « ' || coalesce(v_name, 'nouvelle') || ' » est en ligne (n° ' || lpad(v_number::text, 3, '0') || ')'
                || case when v_rep > 0 then ', +' || v_rep || ' de renommée' else '' end || '.'
              when p.kind = 'new' then 'Ta fiche « ' || coalesce(v_name, 'nouvelle') || ' » n''a pas été retenue.'
              when p_accept then 'Ta modification de « ' || coalesce(v_name, 'la fiche') || ' » est en ligne'
                || case when v_rep > 0 then ' (+' || v_rep || ' de renommée)' else '' end || '.'
              else 'Ta modification de « ' || coalesce(v_name, 'la fiche') || ' » n''a pas été retenue.' end
            || coalesce(' Mot de l''équipe : ' || v_note, ''),
            null);
  exception when others then null; -- notifications indisponibles : la relecture compte quand même
  end;
end;
$$;

revoke all on function public.wiki_proposal_submit_new(text, text, text, text, text[], jsonb, int, text) from public, anon;
grant execute on function public.wiki_proposal_submit_new(text, text, text, text, text[], jsonb, int, text) to authenticated;
revoke all on function public.wiki_proposals_list(text, boolean) from public, anon;
revoke all on function public.wiki_proposal_get(uuid) from public, anon;
revoke all on function public.wiki_proposal_review(uuid, boolean, text) from public, anon;
grant execute on function public.wiki_proposals_list(text, boolean) to authenticated;
grant execute on function public.wiki_proposal_get(uuid) to authenticated;
grant execute on function public.wiki_proposal_review(uuid, boolean, text) to authenticated;

-- Devlog du Dossier Central (onglet Wiki), s'il est installé (0107 du Dossier Central).
do $$
begin
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'devlog_entries' and column_name = 'site') then
    insert into public.devlog_entries (slug, site, title, body, tag, published_at)
    values ('wiki-nouvelles-fiches', 'wiki', 'Proposer une nouvelle fiche',
            'Tu as croisé quelque chose qui n''a pas encore sa fiche ? « Proposer une fiche » (dans chaque catégorie et dans Propositions) : catégorie, nom, texte, fiche technique et rareté suggérée. Acceptée par l''équipe, la fiche est créée avec le numéro suivant, tu en es le découvreur et tu gagnes de la renommée.',
            'nouveau', '2026-11-19 19:00+01')
    on conflict (slug) do nothing;
  end if;
end $$;
