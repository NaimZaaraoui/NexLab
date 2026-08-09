# NexLab LIMS

**NexLab** est un système de gestion d'informations de laboratoire (LIMS) conçu pour les laboratoires de biologie médicale des centres de santé de base (CSSB) et structures hospitalières similaires. Il couvre l'intégralité du flux quotidien : enregistrement des patients, commandes d'analyses, saisie des résultats, validation, impression de rapports professionnels, contrôle qualité, gestion des stocks, audit, sauvegarde et supervision opérationnelle.

> **Version actuelle : 1.0.0** — Première version commerciale.

---

## Pourquoi NexLab

NexLab est né d'un besoin réel, formulé depuis l'intérieur d'un laboratoire en activité. L'objectif n'est pas de simplement stocker des résultats, mais de rendre le travail quotidien **plus rapide, plus sûr, et entièrement traçable**.

- Moins d'erreurs de transcription grâce à la saisie rapide au clavier
- Navigation `Entrée → champ suivant` pour une saisie fluide
- Workflow de validation clair (technique → biologique)
- Rapports imprimés de qualité professionnelle, identiques sur tous les documents
- Déploiement local/hors-ligne, sans dépendance à Internet
- Outils de sauvegarde et de récupération robustes

---

## Fonctionnalités Principales

### Workflow d'Analyse

- Enregistrement et recherche de patients
- Création d'analyse avec catégories, présets (bilans) et panier de tests
- Workflow d'analyse par lot (batch)
- Saisie des résultats groupée par catégorie, avec navigation au clavier
- Validation technique et biologique
- Contrôle d'accès par rôle : Admin, Technicien, Biologiste/Médecin, Réceptionniste
- Suivi des analyses urgentes et monitoring du délai de rendu (TAT)
- Notes, spécimens, paiement et métadonnées de rapport

### Calculs Cliniques Natifs

- **Indices hématologiques** : VGM, TCMH, CCMH (calculés automatiquement depuis GR, HGB, HCT)
- **Formule leucocytaire** : GRA, LYM, MID en valeurs absolues (depuis WBC et pourcentages)
- **Fonction rénale** : eGFR (CKD-EPI) calculé automatiquement depuis la Créatinine, l'âge et le sexe
- **Tests calculés configurables** : formules arithmétiques simples (ex: `CHOL / HDL`) ou mot-clé `AUTO` pour déléguer à un algorithme natif complexe
- Détection des résultats anormaux par plages de référence différenciées par sexe
- Delta check : affichage des résultats précédents du patient pendant la saisie

### Rapports et Impression

- Rapports médicaux A4 professionnels avec en-tête unifié (logo, cachet, signature)
- Mise en page multi-catégories et multi-pages avec pagination automatique
- Colonne "Résultat précédent" sur les rapports
- Page d'indices érythrocytaires avec interprétation
- Page d'histogramme d'automate (import compatible Diatron)
- Génération et mise en cache de rapports PDF
- Étiquettes patient, étiquettes analyse, enveloppes, **factures**, rapports QC et température — tous dans le même design Bento unifié
- Personnalisation complète : logo, cachet, signature, paramètres d'impression

### Contrôle Qualité

- Gestion des matériaux QC, lots et niveaux
- Valeurs cibles, SD, plages acceptables et modes de contrôle
- Saisie et suivi des résultats QC (style Levey-Jennings)
- Accumulation des résultats QC
- Vérification de la disponibilité QC avant la validation technique
- Vues d'impression et résumés tableau de bord QC

### Gestion des Stocks

- Catalogue des réactifs et consommables
- Suivi des lots et alertes d'expiration
- Mouvements : réception, consommation, mise au rebut, ajustement
- Règles de réapprovisionnement
- Analytiques d'inventaire
- Liaison entre tests et règles de consommation inventaire

### Patients et Documents

- Annuaire des patients et pages détaillées
- Historique complet des analyses
- Outils d'export et de purge des données patients
- Tableau de bord documentaire
- Fiche patient imprimable

### Opérations et Sécurité

- KPIs tableau de bord et vue du travail en cours
- Journaux d'audit, archives et outils de rétention
- Déclencheurs d'immuabilité pour l'audit
- Notifications internes
- Tableaux de bord statistiques et exports Excel
- Export compatible CNAM
- Système de licences avec mode lecture seule si expirée
- Protection CSRF et limitation de débit
- Supervision de santé de la base de données

### Sauvegarde et Récupération

- Sauvegardes planifiées et manuelles
- Bundles de récupération (base de données + uploads + fichiers de déploiement)
- Chiffrement optionnel AES-256-GCM des sauvegardes
- Vérification de l'intégrité de la base de données
- Aides à la migration et outils de rollback
- Synchronisation optionnelle vers un dossier externe (Google Drive, Dropbox Desktop...)

---

## Installation Rapide : Package Hors-Ligne

La méthode recommandée pour un poste de laboratoire est le dossier installeur hors-ligne `nexlab-install/`. Il contient l'archive image Docker, le fichier compose, les scripts et une base de données d'amorçage optionnelle.

### Prérequis

- Docker Desktop (Windows/macOS) ou Docker Engine (Linux)
- 4 à 6 Go d'espace disque disponible minimum
- Port 80 disponible sur la machine serveur

### Windows

Ouvrir PowerShell dans `nexlab-install/` :

```powershell
.\install.ps1
```

### Linux / macOS

Ouvrir un terminal dans `nexlab-install/` :

```bash
bash install.sh
```

L'installeur va :

- Charger `nexlab-image.tar`
- Créer les volumes Docker persistants
- Créer le fichier `.env` si absent
- Détecter l'IP du serveur pour `NEXTAUTH_URL`
- Restaurer `nexlab.db` si présent
- Démarrer NexLab sur `http://localhost`

Au premier lancement, ouvrez `/setup` pour initialiser l'application et créer le premier compte administrateur.

---

## Mise à Jour

Copiez le nouveau `nexlab-image.tar` dans `nexlab-install/`, puis exécutez :

```powershell
.\update.ps1
```

ou sur Linux/macOS :

```bash
bash update.sh
```

Si vous avez modifié `.env`, recréez le conteneur pour que Docker recharge les variables :

```powershell
docker compose down
docker compose up -d --force-recreate
```

### Accès LAN (autres postes / téléphones)

```env
NEXTAUTH_URL=http://VOTRE_IP_SERVEUR
AUTH_URL=http://VOTRE_IP_SERVEUR
USE_SECURE_COOKIES=false
AUTH_TRUST_HOST=true
```

---

## Variables d'Environnement

Valeurs minimales pour le développement local :

```env
DATABASE_URL="file:./dev.db"
AUTH_SECRET="generate-a-strong-base64-secret"
NEXTAUTH_URL="http://localhost:3000"
AUTH_TRUST_HOST="true"
USE_SECURE_COOKIES=false
```

Valeurs recommandées pour la production/hors-ligne :

```env
AUTH_SECRET="32-byte-base64-secret"
SEAL_SECRET="32-byte-base64-secret"
INTERNAL_PRINT_TOKEN="random-hex-token"
NEXTAUTH_URL="http://IP_OU_DOMAINE_SERVEUR"
AUTH_URL="http://IP_OU_DOMAINE_SERVEUR"
AUTH_TRUST_HOST="true"
USE_SECURE_COOKIES=false
DATABASE_ENCRYPTION_KEY="64-hex-character-key"
BACKUP_ENCRYPTION_KEY="64-hex-character-key"
```

Notes :

- Utilisez `USE_SECURE_COOKIES=false` pour les déploiements HTTP/LAN locaux.
- Conservez `DATABASE_ENCRYPTION_KEY` et `BACKUP_ENCRYPTION_KEY` en dehors de la machine du laboratoire.
- `INTERNAL_PRINT_TOKEN` protège les routes de génération PDF internes.

---

## Configuration Développeur

### Prérequis

- Node.js 20+
- npm
- Environnement local compatible SQLite

### Installation

Windows :

```powershell
copy .env.example .env
npm install
npx prisma generate
npm run dev
```

Linux / macOS :

```bash
cp .env.example .env
npm install
npx prisma generate
npm run dev
```

Ouvrir `http://localhost:3000`, puis visiter `/setup` pour créer le premier compte.

### Commandes Utiles

```bash
npm run dev
npm run build
npm run lint
npm test
npm run test:e2e
npx prisma migrate dev
npx prisma migrate deploy
npx prisma generate
```

### Construction du Package Hors-Ligne

```powershell
.\scripts\build-offline-installer.ps1
```

ou :

```bash
bash scripts/build-offline-installer.sh
```

---

## Structure du Projet

```text
app/
  (app)/                 Pages principales de l'application authentifiée
  (print)/               Pages d'impression et routes de rendu des rapports
  api/                   Routes API REST groupées par domaine
components/
  analyses/              Création, saisie des résultats, validation
  print/                 Modèles de rapports et d'impression (design Bento unifié)
  qc/                    Interface contrôle qualité
  inventory/             Interface gestion des stocks
  patients/              Interface patients
  tests/                 Catalogue de tests, commandes, import, helpers LOINC
  database-settings/     Sauvegarde, récupération et supervision
  ui/                    Primitives UI partagées
lib/
  analysis/              Cycle de vie des analyses, statut, historique
  clinical/              Calculs, validation, disponibilité QC, formules
  db/                    Prisma, sauvegardes, intégrité, bundles de récupération
  security/              Auth, audit, licence, CSRF, validation sceau
  inventory/             Logique métier inventaire
  documents/             Helpers PDF/rapport/document
prisma/
  schema.prisma
  migrations/
scripts/
  Installeur, sauvegarde, migration, démo, récupération, maintenance
tests/
  unit/
  e2e/
```

---

## Stack Technique

| Couche | Technologie |
|---|---|
| Framework | Next.js App Router |
| Runtime | React 19 |
| Langage | TypeScript 5 |
| Base de données | SQLite avec Prisma ORM |
| Stylisation | Tailwind CSS 4 |
| Auth | NextAuth.js v5 |
| Icônes UI | Lucide React |
| Graphiques | Recharts |
| PDF/Impression | Puppeteer Core, Chromium |
| Tests | Vitest et Playwright |
| Déploiement | Docker et Docker Compose |

---

## Dépannage Rapide

### Connexion OK sur le serveur, mais pas sur un téléphone

Mettre à jour `.env` avec l'IP du serveur :

```env
NEXTAUTH_URL=http://192.168.1.50
AUTH_URL=http://192.168.1.50
USE_SECURE_COOKIES=false
AUTH_TRUST_HOST=true
```

Puis : `docker compose down && docker compose up -d --force-recreate`. Vider les cookies du navigateur sur le téléphone.

### Avertissement Token d'impression interne

Ajouter dans `.env` :

```env
INTERNAL_PRINT_TOKEN="random-hex-token"
```

### Avertissement Chiffrement de base de données

Générer une clé :

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Utiliser comme `DATABASE_ENCRYPTION_KEY` et la conserver en dehors de la machine laboratoire.

---

## Changelog

### v1.0.0 — 2026-08-09 — Première Version Commerciale

**Nouvelles fonctionnalités**
- Système de licences machine-bound avec mode lecture seule à l'expiration
- Sauvegarde et récupération avec chiffrement AES-256-GCM optionnel
- Génération de rapports PDF et mise en cache
- Import d'histogrammes d'automate (compatible Diatron)
- Calcul natif eGFR (CKD-EPI) avec routage adulte/pédiatrique
- Mot-clé `AUTO` pour déléguer les formules natives complexes dans les tests calculés
- Delta check : affichage des résultats précédents pendant la saisie
- Design Bento unifié sur tous les documents imprimables via `PrintDocHeader`
- Supervision santé de la base de données
- Exports statistiques Excel et CNAM
- Synchronisation des sauvegardes vers dossier externe

**Corrections**
- Barre de progression de saisie corrigée (exclut les tests calculés, optionnels et en-têtes de section)
- Validation technique bloquée si résultats requis manquants
- Gestion des variations de codes Créatinine pour le calcul eGFR

---

## Licence

NexLab LIMS est un logiciel propriétaire.

Le code source de ce dépôt est rendu disponible à titre de transparence et d'évaluation uniquement. Vous ne pouvez pas copier, redistribuer, sous-licencier ou déployer NexLab commercialement sans clé de licence valide émise par l'auteur.

Le déploiement commercial requiert une licence par installation. Chaque licence est liée cryptographiquement à la machine cible.

| Type | Durée |
|---|---|
| Licence d'essai | Durée limitée, évaluation |
| Licence annuelle | Renouvelable chaque année |
| Licence perpétuelle | Validité illimitée |

Sans licence valide, l'application passe en mode lecture seule.

---

## Mentions Légales

NexLab implémente les standards médicaux internationaux ouverts suivants :
- **CKD-EPI 2021** (Chronic Kidney Disease Epidemiology Collaboration) — calcul du débit de filtration glomérulaire.
- **LOINC** (Logical Observation Identifiers Names and Codes) — catalogage des tests biologiques.

---

## Contact et Licences Commerciales

Pour toute demande de licence commerciale, d'assistance technique ou de partenariat, contactez directement l'auteur via le dépôt GitHub.

---

*NexLab — Précision et soin dans chaque résultat.*
