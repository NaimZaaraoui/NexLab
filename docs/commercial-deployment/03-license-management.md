# NexLab LIMS — Gestion des Licences (Guide Complet)

> *NexLab intègre un système de licence qui lie chaque installation à une machine précise. Ce document explique comment activer la licence d'un nouveau client de A à Z.*

---

## 1. Comment Fonctionne la Licence NexLab

Chaque installation de NexLab génère automatiquement un **Machine ID** unique (ex: `NXL-A1B2-C3D4`). Ce code est généré lors du premier démarrage et enregistré en base de données.

Le système de licence fonctionne comme ceci :

1. **Le client vous communique son Machine ID** (visible dans Paramètres → Licence).
2. **Vous générez une clé de licence** (un JWT signé) sur votre ordinateur, liée à ce Machine ID et valable X jours.
3. **Le client saisit cette clé** dans l'interface.
4. **NexLab vérifie** que la clé correspond bien à son Machine ID et qu'elle n'est pas expirée.

> [!IMPORTANT]
> Une clé de licence générée pour le labo A **ne fonctionnera pas** sur le labo B. C'est la protection anti-copie du logiciel.

---

## 2. Générer une Clé de Licence (Votre côté)

Depuis votre ordinateur (pas chez le client), dans le dossier NexLab :

```bash
node scripts/generate-license.js <MACHINE_ID> <JOURS_DE_VALIDITE>
```

**Exemples :**

```bash
# Licence d'1 an pour la machine NXL-A1B2-C3D4
node scripts/generate-license.js NXL-A1B2-C3D4 365

# Licence à vie (utiliser un grand nombre de jours)
node scripts/generate-license.js NXL-A1B2-C3D4 36500

# Période d'essai de 30 jours
node scripts/generate-license.js NXL-A1B2-C3D4 30
```

Le script affichera un long bloc de texte (un JWT), ressemblant à :
```
eyJhbGciOiJIUzI1NiJ9.eyJtYWNoaW5lSWQiOiJOWEwtQTFCMi1DM0Q0IiwidHlwZSI...
```

**Copiez ce bloc en entier** — c'est la clé de licence à fournir au client.

---

## 3. Activer la Licence (Côté Client)

Le directeur ou l'administrateur du labo doit :

1. Se connecter à NexLab avec un compte **Administrateur**.
2. Aller dans **Paramètres → Gestion de Licence**.
3. Copier le bloc de licence que vous lui avez fourni (par email ou en main propre).
4. Le coller dans la zone de texte.
5. Cliquer sur **"Appliquer la Licence"**.

Si la clé est valide, le statut passe à **"Licence Active"** avec la date d'expiration.

---

## 4. Récupérer le Machine ID d'un Client

Pour générer une licence, vous avez besoin du Machine ID. Il y a 3 façons de l'obtenir :

**Option A (Via l'interface NexLab) :**
Le client va dans Paramètres → Licence → il voit et peut copier son Machine ID.

**Option B (Lors de votre installation) :**
Quand vous installez NexLab et qu'il démarre pour la première fois, le Machine ID est créé. Vous pouvez l'obtenir en regardant dans la base de données **avant de partir** :

```bash
# Dans le dossier nexlab-install
docker exec nexlab-app sqlite3 /app/data/nexlab.db \
  "SELECT value FROM Setting WHERE key='machine_id';"
```

**Option C (Par téléphone après installation) :**
Le client vous l'envoie en photo ou par message depuis l'interface Paramètres → Licence.

---

## 5. Renouvellement de Licence

Quand une licence expire, NexLab passe en **mode lecture seule** : les techniciens peuvent consulter les analyses existantes, mais ne peuvent plus en créer de nouvelles.

Pour renouveler :
1. Le client vous appelle et vous donne son Machine ID (il n'a pas changé).
2. Vous générez une nouvelle clé avec `generate-license.js`.
3. Le client la saisit dans Paramètres → Licence.

---

## 6. Tarification Suggérée

| Type | Validité | Usage |
|---|---|---|
| **Essai** | 30 jours | Période de démonstration |
| **Annuelle** | 365 jours | Contrat standard avec maintenance |
| **Pluriannuelle** | 730 / 1095 jours | Remise pour engagement long terme |
| **À vie** | 36500 jours (~100 ans) | Vente unique sans abonnement |

> [!NOTE]
> Si vous perdez la trace de quand expire une licence, le client peut toujours le voir dans Paramètres → Licence (la date d'expiration est affichée).
