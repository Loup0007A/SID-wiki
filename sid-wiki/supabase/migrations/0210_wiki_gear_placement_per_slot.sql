-- =====================================================================
-- 0210 — Placement des armes INDÉPENDANT par emplacement (main droite, main gauche, dos)
--         et rotation possible sur un tour complet dans les deux sens (−360° … +360°).
--   gear_placement : { "main_droite": {"dx":0,"dy":0,"scale":1,"rot":0}, "main_gauche": {…}, "dos": {…} }
--   Un emplacement absent = placement normal. Les anciennes colonnes gear_dx / gear_dy / gear_scale / gear_rot
--   (migration 0209, un seul placement pour les trois emplacements) sont recopiées puis ne servent plus.
-- À exécuter APRÈS 0209.
-- =====================================================================

alter table public.wiki_entries
  add column if not exists gear_placement jsonb not null default '{}'::jsonb;

alter table public.wiki_entries drop constraint if exists wiki_entries_gear_placement_check;
alter table public.wiki_entries
  add constraint wiki_entries_gear_placement_check check (jsonb_typeof(gear_placement) = 'object');

-- Reprise des placements déjà réglés avec la 0209 : le même pour les trois emplacements, comme avant.
update public.wiki_entries e
set gear_placement = jsonb_build_object(
  'main_droite', jsonb_build_object('dx', e.gear_dx, 'dy', e.gear_dy, 'scale', e.gear_scale, 'rot', e.gear_rot),
  'main_gauche', jsonb_build_object('dx', e.gear_dx, 'dy', e.gear_dy, 'scale', e.gear_scale, 'rot', e.gear_rot),
  'dos',         jsonb_build_object('dx', e.gear_dx, 'dy', e.gear_dy, 'scale', e.gear_scale, 'rot', e.gear_rot)
)
where e.gear_placement = '{}'::jsonb
  and (e.gear_dx <> 0 or e.gear_dy <> 0 or e.gear_scale <> 1 or e.gear_rot <> 0);

-- L'équipement d'un membre : le placement est celui de l'emplacement où la fiche est portée.
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
      'dx',         case when e.discovered then e.gear_placement -> g.slot -> 'dx' end,
      'dy',         case when e.discovered then e.gear_placement -> g.slot -> 'dy' end,
      'scale',      case when e.discovered then e.gear_placement -> g.slot -> 'scale' end,
      'rot',        case when e.discovered then e.gear_placement -> g.slot -> 'rot' end
    ) order by g.slot), '[]'::jsonb)
  from public.wiki_profile_gear g
  join public.wiki_entries e on e.id = g.entry_id
  where g.user_id = p_user;
$$;

revoke all on function public.wiki_profile_gear_json(uuid) from public, anon, authenticated;
