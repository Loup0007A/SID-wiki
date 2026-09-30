# Archives S.I.D. — Wiki

Wiki RP (lieux, armes, mobs, objets) branché sur le **même projet Supabase** que le Dossier Central et la Cartographie : mêmes comptes, mêmes rôles.

## Installation

1. `cp .env.example .env.local` et renseigne l'URL + la clé **anon** du projet Supabase existant.
2. Exécute `supabase/migrations/0200_wiki.sql` dans le SQL Editor (après tes migrations existantes).
3. Donne la permission `manage_wiki` à un rôle (bloc commenté en fin de migration — adapte les noms de colonnes de `role_permissions`). Le Fondateur l'a d'office via `has_permission`.
4. `npm install && npm run dev`

## Fonctionnement

- **Numérotation** : chaque fiche a un numéro 000–999, unique par catégorie.
- **Découverte** : une fiche non découverte s'affiche « ? ». Le masquage est fait **côté base** (RPC `security definer`) : titre, texte, image et tags ne quittent jamais la base pour un non-admin.
- **Admins** (`manage_wiki`) : dashboard `/admin` (découvrir/masquer, éditer, supprimer, tags, images, liens). Ils voient aussi les fiches masquées, marquées « Masqué ».
- **Recherche** : multi-mots, sans accents ni casse, sur titre / résumé / contenu / tags / numéro. Seules les fiches découvertes sont trouvables.
- **Markdown** : GFM (tableaux, listes…), HTML brut désactivé.
- **Liens type Wikipédia** : `[[armes/012]]` ou `[[armes/012|texte]]`, aperçu au survol ; section « Voir aussi » pour les liens explicites.
- **Accès** : compte `active` requis (comme la Cartographie).

## Points à vérifier chez toi

- La migration suppose `public.profiles(id, status)` et `public.has_permission(uuid, text)` comme décrits dans ton résumé.
- L'insertion de `manage_wiki` dans `role_permissions` dépend du schéma réel de cette table.
