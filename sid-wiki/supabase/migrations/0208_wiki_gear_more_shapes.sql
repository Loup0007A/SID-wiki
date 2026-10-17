-- =====================================================================
-- 0208 — Nouvelles formes d'armes pour le porte-armure :
--   arbalète, mitraillette, AK-47, grenades, shuriken, kunai, dagues doubles,
--   ordinateur, lames secrètes, pistolet à main, fiole, fusil à pompe.
-- (On élargit seulement la liste des valeurs acceptées par gear_shape.)
-- À exécuter APRÈS 0207.
-- =====================================================================

alter table public.wiki_entries drop constraint if exists wiki_entries_gear_shape_check;
alter table public.wiki_entries
  add constraint wiki_entries_gear_shape_check
  check (gear_shape is null or gear_shape in (
    'sword', 'dagger', 'axe', 'spear', 'staff', 'bow', 'shield',
    'crossbow', 'smg', 'ak47', 'grenade', 'shuriken', 'kunai', 'dual_daggers',
    'computer', 'hidden_blades', 'pistol', 'vial', 'shotgun'
  ));
