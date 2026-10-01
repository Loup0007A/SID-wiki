# Wiki du S.I.D.

Wiki RP (lieux, armes, mobs, objets) branché sur le **même projet Supabase** que le Dossier Central et la Cartographie : mêmes comptes, mêmes rôles.

## Installation

1. `cp .env.example .env.local` et renseigne l'URL + la clé **anon** du projet Supabase existant.
2. Exécute `supabase/migrations/0200_wiki.sql` puis `0201_wiki_hide_names_for_admins.sql` puis `0202_wiki_comments_discoverer.sql` dans le SQL Editor.
3. Donne la permission `manage_wiki` à un rôle (bloc commenté en fin de migration — adapte les noms de colonnes de `role_permissions`). Le Fondateur l'a d'office via `has_permission`.
4. `npm install && npm run dev`

## Fonctionnement

- **Numérotation** : chaque fiche a un numéro 000–999, unique par catégorie.
- **Découverte** : une fiche non découverte s'affiche « ? ». Le masquage est fait **côté base** (RPC `security definer`) : titre, texte, image et tags ne quittent jamais la base pour un non-admin.
- **Admins** (`manage_wiki`) : dashboard `/admin` (découvrir/masquer, éditer, supprimer, tags, images, liens). Sur le wiki, une fiche masquée reste « ? » même pour eux ; ils voient les noms dans le Dashboard.
- **Recherche** : multi-mots, sans accents ni casse, sur titre / résumé / contenu / tags / numéro. Seules les fiches découvertes sont trouvables.
- **Markdown** : GFM (tableaux, listes…), HTML brut désactivé.
- **Liens type Wikipédia** : `[[armes/012]]` ou `[[armes/012|texte]]`, aperçu au survol ; section « Voir aussi » pour les liens explicites.
- **Accès** : compte `active` requis (comme la Cartographie).

## Points à vérifier chez toi

- La migration suppose `public.profiles(id, status)` et `public.has_permission(uuid, text)` comme décrits dans ton résumé.
- L'insertion de `manage_wiki` dans `role_permissions` dépend du schéma réel de cette table.
- **Sections à la Wikipédia** : `##` / `###` dans le contenu deviennent des sections numérotées (1, 1.1…) avec ancres et un sommaire (dès 3 titres).
- **Découvreur** : champ « Découvert par » dans le formulaire admin → « 🏆 Découvert par @pseudo » sur la fiche.
- **Mentions** : `@pseudo` dans le markdown et les commentaires devient une pastille.
- **Commentaires** : en bas des fiches découvertes ; chaque membre actif peut commenter et supprimer les siens, les admins modèrent. Limite : 2000 caractères, 10 par minute.
