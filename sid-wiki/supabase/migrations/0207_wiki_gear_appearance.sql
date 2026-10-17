-- =====================================================================
-- 0207 — Apparence des armes et objets sur le porte-armure (réglée par les admins).
--   gear_shape : forme dessinée quand la fiche est tenue en main ou portée dans le dos
--                (null = devinée d'après le nom de la fiche)
--   gear_color : couleur de la pièce, « #rrggbb » (null = couleur de la rareté ★)
-- Les admins écrivent ces colonnes depuis le formulaire d'édition (accès direct via RLS, comme le reste).
-- À exécuter APRÈS 0206.
-- =====================================================================

alter table public.wiki_entries
  add column if not exists gear_shape text,
  add column if not exists gear_color text;

alter table public.wiki_entries drop constraint if exists wiki_entries_gear_shape_check;
alter table public.wiki_entries
  add constraint wiki_entries_gear_shape_check
  check (gear_shape is null or gear_shape in ('sword', 'dagger', 'axe', 'spear', 'staff', 'bow', 'shield'));

alter table public.wiki_entries drop constraint if exists wiki_entries_gear_color_check;
alter table public.wiki_entries
  add constraint wiki_entries_gear_color_check
  check (gear_color is null or gear_color ~ '^#[0-9a-fA-F]{6}$');

-- L'équipement d'un membre renvoie maintenant la forme et la couleur choisies
-- (jamais pour une fiche non découverte).
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
      'color',      case when e.discovered then e.gear_color end
    ) order by g.slot), '[]'::jsonb)
  from public.wiki_profile_gear g
  join public.wiki_entries e on e.id = g.entry_id
  where g.user_id = p_user;
$$;

revoke all on function public.wiki_profile_gear_json(uuid) from public, anon, authenticated;
