-- =====================================================================
-- 0211 — Propositions de modification
-- À exécuter APRÈS 0210. Peut être relancée sans risque.
--
-- * Tout membre qui lit le Wiki peut proposer une correction d'une fiche
--   découverte (titre, résumé, texte, tags, fiche technique), avec un mot
--   pour l'équipe.
-- * Les admins du Wiki (manage_wiki) comparent avec la fiche actuelle et
--   acceptent ou refusent, avec un mot en retour. Une proposition acceptée
--   remplace la fiche (l'ancienne version reste dans l'historique) et
--   rapporte de la renommée à son auteur (réglage wiki_settings
--   « proposal_reputation », 5 par défaut).
-- * Les auteurs des propositions acceptées sont crédités sur la fiche.
-- =====================================================================

create table if not exists public.wiki_proposals (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.wiki_entries (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  title text,
  summary text,
  content text,
  tags text[],
  infobox jsonb,
  note text check (note is null or char_length(note) <= 500),
  base_updated_at timestamptz,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected', 'withdrawn')),
  reviewer_id uuid references public.profiles (id) on delete set null,
  review_note text check (review_note is null or char_length(review_note) <= 500),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);
-- Fiche telle qu'elle était au moment de la proposition (pour relire une
-- proposition déjà traitée).
alter table public.wiki_proposals add column if not exists base jsonb;
create index if not exists wiki_proposals_status_idx on public.wiki_proposals (status, created_at desc);
create index if not exists wiki_proposals_entry_idx on public.wiki_proposals (entry_id, status);
create index if not exists wiki_proposals_author_idx on public.wiki_proposals (author_id, created_at desc);
alter table public.wiki_proposals enable row level security;
drop policy if exists "wiki_proposals_select" on public.wiki_proposals;
create policy "wiki_proposals_select" on public.wiki_proposals for select
  using (author_id = auth.uid() or public.wiki_is_admin());
-- Aucune écriture directe : tout passe par les fonctions ci-dessous.

insert into public.wiki_settings (key, value) values ('proposal_reputation', '5')
on conflict (key) do nothing;

-- Types de notification : « wiki » (ajouté à la liste existante).
do $$
declare
  v_def text;
  v_list text[];
begin
  select pg_get_constraintdef(oid) into v_def from pg_constraint where conname = 'notifications_type_check';
  if v_def is null then return; end if;
  v_list := string_to_array((regexp_match(v_def, '\{([^}]*)\}'))[1], ',');
  if 'wiki' = any (v_list) then return; end if;
  alter table public.notifications drop constraint notifications_type_check;
  execute format('alter table public.notifications add constraint notifications_type_check check (type = any (%L::text[]))', v_list || 'wiki'::text);
end $$;

-- ---------------------------------------------------------------------
-- Proposer
-- ---------------------------------------------------------------------
create or replace function public.wiki_proposal_submit(
  p_category text, p_number int, p_title text, p_summary text, p_content text,
  p_tags text[], p_infobox jsonb, p_note text default null)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  w public.wiki_entries;
  v_id uuid;
  v_title text := nullif(btrim(coalesce(p_title, '')), '');
  v_summary text := nullif(btrim(coalesce(p_summary, '')), '');
  v_content text := coalesce(p_content, '');
  v_tags text[] := coalesce((select array_agg(distinct lower(btrim(t))) from unnest(coalesce(p_tags, '{}')) t where btrim(t) <> ''), '{}');
  v_info jsonb := coalesce(p_infobox, '[]'::jsonb);
begin
  if not public.wiki_can_read() then raise exception 'Accès refusé' using errcode = '42501'; end if;
  select * into w from public.wiki_entries where category = p_category and number = p_number;
  if w.id is null then raise exception 'Fiche introuvable.'; end if;
  if not w.discovered then raise exception 'Cette fiche n''est pas encore découverte.'; end if;
  if v_title is null then raise exception 'Le nom est obligatoire.'; end if;
  if char_length(v_title) > 120 then raise exception 'Nom trop long (120 caractères au plus).'; end if;
  if char_length(coalesce(v_summary, '')) > 600 then raise exception 'Résumé trop long (600 caractères au plus).'; end if;
  if char_length(v_content) > 40000 then raise exception 'Texte trop long.'; end if;
  if cardinality(v_tags) > 15 or exists (select 1 from unnest(v_tags) t where char_length(t) > 30) then
    raise exception 'Tags : 15 au plus, de 30 caractères au plus.';
  end if;
  if jsonb_typeof(v_info) <> 'array' or jsonb_array_length(v_info) > 30 then
    raise exception 'Fiche technique : 30 lignes au plus.';
  end if;
  if (v_title, v_summary, v_content, v_tags, v_info)
     is not distinct from (w.title, nullif(btrim(coalesce(w.summary, '')), ''), coalesce(w.content, ''),
                           coalesce((select array_agg(distinct lower(btrim(t))) from unnest(coalesce(w.tags, '{}')) t where btrim(t) <> ''), '{}'),
                           coalesce(w.infobox, '[]'::jsonb)) then
    raise exception 'Rien n''a changé par rapport à la fiche actuelle.';
  end if;
  if (select count(*) from public.wiki_proposals where author_id = v_uid and status = 'pending') >= 5 then
    raise exception 'Tu as déjà 5 propositions en attente : attends qu''elles soient relues.';
  end if;
  if exists (select 1 from public.wiki_proposals where author_id = v_uid and entry_id = w.id and status = 'pending') then
    raise exception 'Tu as déjà une proposition en attente sur cette fiche : retire-la pour en faire une autre.';
  end if;

  insert into public.wiki_proposals (entry_id, author_id, title, summary, content, tags, infobox, note, base_updated_at, base)
  values (w.id, v_uid, v_title, v_summary, v_content, v_tags, v_info, nullif(btrim(coalesce(p_note, '')), ''), w.updated_at,
          jsonb_build_object('title', w.title, 'summary', w.summary, 'content', w.content,
                             'tags', to_jsonb(coalesce(w.tags, '{}')), 'infobox', coalesce(w.infobox, '[]'::jsonb)))
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.wiki_proposal_withdraw(p_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  update public.wiki_proposals set status = 'withdrawn', reviewed_at = now()
   where id = p_id and author_id = auth.uid() and status = 'pending';
  if not found then raise exception 'Proposition introuvable ou déjà relue.'; end if;
end;
$$;

-- ---------------------------------------------------------------------
-- Lire
-- ---------------------------------------------------------------------
-- Liste : toutes pour les admins (selon le statut), les siennes pour les autres.
create or replace function public.wiki_proposals_list(p_status text default 'pending', p_mine boolean default false)
returns jsonb
language sql stable security definer set search_path = public
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', p.id, 'status', p.status, 'created_at', p.created_at, 'reviewed_at', p.reviewed_at,
    'note', p.note, 'review_note', p.review_note,
    'author', a.nickname, 'mine', p.author_id = auth.uid(),
    'category', w.category, 'number', w.number, 'entry_title', w.title, 'title', p.title,
    'outdated', p.base_updated_at is distinct from w.updated_at
  ) order by p.created_at desc), '[]'::jsonb)
  from public.wiki_proposals p
  join public.wiki_entries w on w.id = p.entry_id
  left join public.profiles a on a.id = p.author_id
  where public.wiki_can_read()
    and (p_status is null or p_status = 'all' or p.status = p_status)
    and (p.author_id = auth.uid() or (public.wiki_is_admin() and not coalesce(p_mine, false)));
$$;

-- Détail : la proposition et la fiche actuelle, pour comparer.
create or replace function public.wiki_proposal_get(p_id uuid)
returns jsonb
language sql stable security definer set search_path = public
as $$
  select jsonb_build_object(
    'id', p.id, 'status', p.status, 'created_at', p.created_at, 'reviewed_at', p.reviewed_at,
    'note', p.note, 'review_note', p.review_note, 'author', a.nickname, 'mine', p.author_id = auth.uid(),
    'reviewer', r.nickname, 'outdated', p.base_updated_at is distinct from w.updated_at,
    'category', w.category, 'number', w.number,
    'proposed', jsonb_build_object('title', p.title, 'summary', p.summary, 'content', p.content,
                                   'tags', to_jsonb(coalesce(p.tags, '{}')), 'infobox', coalesce(p.infobox, '[]'::jsonb)),
    -- En attente : la fiche actuelle ; déjà traitée : la fiche d'alors.
    'current', case when p.status <> 'pending' and p.base is not null then p.base
                    else jsonb_build_object('title', w.title, 'summary', w.summary, 'content', w.content,
                                            'tags', to_jsonb(coalesce(w.tags, '{}')), 'infobox', coalesce(w.infobox, '[]'::jsonb)) end
  )
  from public.wiki_proposals p
  join public.wiki_entries w on w.id = p.entry_id
  left join public.profiles a on a.id = p.author_id
  left join public.profiles r on r.id = p.reviewer_id
  where p.id = p_id and public.wiki_can_read() and (p.author_id = auth.uid() or public.wiki_is_admin());
$$;

create or replace function public.wiki_proposals_pending_count()
returns int
language sql stable security definer set search_path = public
as $$
  select case when public.wiki_is_admin() then (select count(*)::int from public.wiki_proposals where status = 'pending') else 0 end;
$$;

-- Contributeurs crédités sur une fiche.
create or replace function public.wiki_contributors(p_category text, p_number int)
returns jsonb
language sql stable security definer set search_path = public
as $$
  select coalesce(jsonb_agg(jsonb_build_object('nickname', x.nickname, 'count', x.n) order by x.n desc, x.nickname), '[]'::jsonb)
  from (
    select a.nickname, count(*) as n
    from public.wiki_proposals p
    join public.wiki_entries w on w.id = p.entry_id
    join public.profiles a on a.id = p.author_id
    where w.category = p_category and w.number = p_number and p.status = 'accepted' and w.discovered
    group by a.nickname
  ) x
  where public.wiki_can_read();
$$;

-- ---------------------------------------------------------------------
-- Relire (admins du Wiki)
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
begin
  if not public.wiki_is_admin() then raise exception 'Réservé aux admins du Wiki.'; end if;
  select * into p from public.wiki_proposals where id = p_id for update;
  if p.id is null then raise exception 'Proposition introuvable.'; end if;
  if p.status <> 'pending' then raise exception 'Proposition déjà relue.'; end if;
  if char_length(coalesce(v_note, '')) > 500 then raise exception 'Mot trop long (500 caractères au plus).'; end if;
  select * into w from public.wiki_entries where id = p.entry_id;

  update public.wiki_proposals
     set status = case when p_accept then 'accepted' else 'rejected' end,
         reviewer_id = v_uid, review_note = v_note, reviewed_at = now()
   where id = p.id;

  if p_accept then
    update public.wiki_entries
       set title = p.title, summary = p.summary, content = p.content, tags = p.tags, infobox = p.infobox
     where id = p.entry_id;
    if v_rep > 0 then
      update public.profiles set reputation = coalesce(reputation, 0) + v_rep where id = p.author_id;
    end if;
  end if;

  begin
    insert into public.notifications (user_id, type, title, body, link)
    values (p.author_id, 'wiki',
            case when p_accept then 'Proposition acceptée' else 'Proposition refusée' end,
            case when p_accept
                 then 'Ta modification de « ' || coalesce(w.title, 'la fiche') || ' » est en ligne'
                      || case when v_rep > 0 then ' (+' || v_rep || ' de renommée)' else '' end || '.'
                 else 'Ta modification de « ' || coalesce(w.title, 'la fiche') || ' » n''a pas été retenue.' end
            || coalesce(' Mot de l''équipe : ' || v_note, ''),
            null);
  exception when others then null; -- notifications indisponibles : la relecture compte quand même
  end;
end;
$$;

create or replace function public.wiki_proposal_reputation_set(p_value int)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not public.wiki_is_admin() then raise exception 'Réservé aux admins du Wiki.'; end if;
  if p_value is null or p_value < 0 or p_value > 100 then raise exception 'De 0 à 100.'; end if;
  insert into public.wiki_settings (key, value) values ('proposal_reputation', p_value::text)
  on conflict (key) do update set value = excluded.value, updated_at = now();
end;
$$;

revoke all on function public.wiki_proposal_submit(text, int, text, text, text, text[], jsonb, text) from public, anon;
revoke all on function public.wiki_proposal_withdraw(uuid) from public, anon;
revoke all on function public.wiki_proposals_list(text, boolean) from public, anon;
revoke all on function public.wiki_proposal_get(uuid) from public, anon;
revoke all on function public.wiki_proposals_pending_count() from public, anon;
revoke all on function public.wiki_contributors(text, int) from public, anon;
revoke all on function public.wiki_proposal_review(uuid, boolean, text) from public, anon;
revoke all on function public.wiki_proposal_reputation_set(int) from public, anon;
grant execute on function public.wiki_proposal_submit(text, int, text, text, text, text[], jsonb, text) to authenticated;
grant execute on function public.wiki_proposal_withdraw(uuid) to authenticated;
grant execute on function public.wiki_proposals_list(text, boolean) to authenticated;
grant execute on function public.wiki_proposal_get(uuid) to authenticated;
grant execute on function public.wiki_proposals_pending_count() to authenticated;
grant execute on function public.wiki_contributors(text, int) to authenticated;
grant execute on function public.wiki_proposal_review(uuid, boolean, text) to authenticated;
grant execute on function public.wiki_proposal_reputation_set(int) to authenticated;
