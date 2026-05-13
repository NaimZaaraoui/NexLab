## Project Summary
NexLab CSSB est un système de gestion d'informations de laboratoire (LIMS) conçu pour les Centres de Santé de Services de Base. Il permet de gérer les analyses, de saisir les résultats, de valider les dossiers et d'imprimer des rapports professionnels.

## Tech Stack
- **Framework**: Next.js (App Router)
- **Base de données**: SQLite avec Prisma ORM
- **Stylisation**: Tailwind CSS avec un design "Bento" moderne
- **Composants UI**: Lucide React pour les icônes, composants personnalisés
- **Validation**: React Server Actions et API Routes

## Architecture
- `app/analyses/`: Gestion des analyses (liste, nouvelle, détails)
- `components/analyses/`: Composants métiers pour la saisie des résultats
- `components/print/`: Modèles d'impression des rapports
- `prisma/`: Schéma de la base de données et migrations
- `lib/`: Utilitaires, types et instance Prisma

## User Preferences
- **Esthétique**: Design "Premium" et "Bento", utilisant des ombres douces et des arrondis généreux (`rounded-3xl`).
- **Rapports**: Suppression des lignes de séparation rigides au profit de zébrures subtiles et d'espacement aéré.
- **Productivité**: Navigation au clavier optimisée et calculs automatiques.

## Project Guidelines
- Pas de commentaires inutiles dans le code.
- Utilisation de Server Components par défaut.
- Typage strict avec TypeScript.
- Gestion des erreurs avec des Toasts de notification.

## Common Patterns
- **Calculs Automatiques**: Utilisation de `useEffect` ou de gestionnaires de changement pour calculer les indices hématologiques (VGM, TGMH, CCMH) en temps réel.
- **Delta Check**: Affichage de l'historique des résultats précédents pour un même patient directement dans le formulaire de saisie pour détecter les variations anormales.
- **Navigation Rapide**: La touche `Enter` permet de passer d'un champ de résultat au suivant pour accélérer la saisie.
