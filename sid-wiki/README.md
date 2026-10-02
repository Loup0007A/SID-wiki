# Wiki du S.I.D.

Wiki RP (lieux, armes, mobs, objets, skills) branché sur le **même projet Supabase** que le Dossier Central et la Cartographie : mêmes comptes, mêmes rôles.

## Installation

1. `cp .env.example .env.local` et renseigne l'URL + la clé **anon** du projet Supabase existant.
2. Exécute `supabase/migrations/0200_wiki.sql` puis `0201_wiki_hide_names_for_admins.sql` puis `0202_wiki_comments_discoverer.sql` puis `0203_wiki_skills_3d_extras.sql` puis `0204_wiki_save_space.sql` dans le SQL Editor.
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

## Skills et modèles 3D animés

- **Skills** est une 5ᵉ catégorie (✨), avec les mêmes règles que les autres : numéros 000–999, « ? » tant que non découvert, commentaires, recherche…
- N'importe quelle fiche peut avoir un **modèle 3D** : dans le formulaire admin, envoie un fichier **.glb** (50 Mo max avant allègement ; export Blender « glTF 2.0 → glTF Binary », ou Mixamo / Sketchfab). Le formulaire détecte les animations du fichier et te laisse choisir celle à conserver.
- Côté lecteur : rotation à la souris/au doigt, pause/lecture, rotation auto, plein écran, et un sélecteur si le modèle contient plusieurs animations (ex. « Charge », « Impact », « Fin »).
- Un modèle non découvert n'est jamais envoyé aux non-admins (comme le reste de la fiche).

## Autres fonctions

- **Fiche technique** (encadré à la Wikipédia : PV, dégâts, élément, faiblesse…) et **rareté ★** (1–8) par fiche.
- **Favoris** ⭐ personnels (`/favoris`), **fiche au hasard** 🎲 (`/hasard`), navigation **← précédent / suivant →**.
- **Accueil** : dernières découvertes et top des découvreurs.
- **Raccourci** : `/` met le focus sur la recherche.
- **Historique des versions** : chaque modification est sauvegardée (50 versions par fiche) ; « Restaurer » recharge une ancienne version dans le formulaire.
- **Dashboard** : sélection multiple (découvrir / masquer / supprimer en masse), **export** et **import JSON** par catégorie.

## Téléphone et installation

- **Mobile first** : sous 768 px, barre d'onglets en bas (Accueil, Chercher, Favoris, Hasard, Menu), menu coulissant avec les 5 catégories, cartes en 2 colonnes, tableaux markdown défilables, infobulles gardées dans l'écran, boutons de 40 px minimum, champs en 16 px (pas de zoom iOS), barre « Enregistrer » collée en bas dans l'éditeur.
- **Installable (PWA)** : « Ajouter à l'écran d'accueil » (Android : menu ⋮ → Installer l'application ; iPhone : Partager → Sur l'écran d'accueil). Manifest dans `src/app/manifest.ts`, icônes dans `public/icons/` (remplace-les par les tiennes si tu veux).
- Pas de mode hors-ligne pour l'instant.

## Look & économie d'espace

- **Thème** : fond noir, vagues bleues transparentes animées + bulles (100 % CSS, désactivées si le système demande moins de mouvement ; 2 vagues et les bulles masquées sur téléphone), cartes en verre, titres dégradés, apparition en fondu des pages et des cartes.
- **En-tête ordinateur** : logo, grande barre de recherche centrée (raccourci `/`), accès favoris / hasard / admin / déconnexion, et onglets des catégories avec l'onglet actif souligné.
- **Modèles 3D allégés** : à l'enregistrement, le site ne garde que l'animation (« action » Blender) choisie, supprime les autres, les caméras et tout objet / matériau / texture inutilisé, puis envoie un seul fichier léger. Les visiteurs ne voient que cette animation. Un ancien modèle à plusieurs animations est allégé automatiquement au prochain enregistrement de sa fiche.
- **Nettoyage du stockage** : ancien modèle, anciennes images et brouillons sont supprimés au remplacement ; supprimer une fiche (Dashboard) supprime aussi son image et son modèle.
- **Images** : réduites automatiquement avant envoi (WebP, 1600 px max).
- **Limites** (migration 0204) : modèles 10 Mo, images 3 Mo, 20 versions d'historique par fiche.

