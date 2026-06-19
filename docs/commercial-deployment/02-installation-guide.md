# NexLab LIMS — Guide d'Installation Complet (A à Z)

> *Ce guide vous accompagne de la préparation du matériel jusqu'au premier lancement de NexLab chez le client. Il est basé sur le dossier `nexlab-install/` que vous apportez sur une clé USB.*

---

## Partie 1 — Le Matériel Requis

### Le PC Serveur (L'ordinateur principal)

C'est le PC qui héberge NexLab. Il doit rester **allumé 24h/24 et 7j/7**.

| Composant | Minimum | Recommandé |
|---|---|---|
| **Processeur** | Intel Core i3 (8ème gen+) | Intel Core i5 / AMD Ryzen 5 |
| **RAM** | 4 Go | 8 Go ou plus |
| **Disque** | HDD 256 Go | **SSD 256 Go** (crucial pour la vitesse SQLite) |
| **Système** | Windows 10 Pro (64-bit) | Windows 11 Pro ou Ubuntu 22.04 LTS |
| **Réseau** | Câble Ethernet au routeur (pas de Wi-Fi) | — |

> [!IMPORTANT]
> Le serveur ne doit pas être utilisé comme PC de travail quotidien. Idéalement, c'est un PC dédié qu'on cache dans un bureau ou un placard, avec juste un câble réseau et le courant.

### Les PC Clients (Les postes de travail)

N'importe quel PC avec Google Chrome ou Firefox suffit. Même une vieille machine. NexLab est une application web : tout le calcul se fait côté serveur.

---

## Partie 2 — Contenu du Dossier `nexlab-install/`

Avant de vous rendre chez le client, assurez-vous d'avoir ces fichiers sur votre clé USB :

| Fichier / Dossier | Rôle |
|---|---|
| `nexlab-image.tar` | L'application complète NexLab (~800 Mo). C'est le "moteur". |
| `docker-compose.yml` | La "recette" pour lancer l'application. |
| `install.ps1` | Script d'installation automatique **pour Windows**. |
| `install.sh` | Script d'installation automatique **pour Linux**. |
| `backup-now.ps1` / `.sh` | Sauvegarde immédiate de la base de données. |
| `restore-backup.ps1` / `.sh` | Restauration d'une sauvegarde existante. |
| `update.ps1` / `.sh` | Mise à jour vers une nouvelle version de NexLab. |
| `cleanup-data.sh` | Efface les données de démonstration après l'installation. |
| `nexlab.db` | (Optionnel) Base de données pré-configurée avec vos tests et catégories. |

---

## Partie 3 — Installation Étape par Étape

### Étape 0 : Avant d'arriver chez le client — Générer les Clés de Sécurité

Chaque laboratoire doit avoir ses propres clés uniques. **Ne réutilisez jamais les clés d'un labo à l'autre.**

Depuis **votre propre ordinateur** (pas chez le client), ouvrez un terminal dans le dossier du projet NexLab :

```bash
node scripts/generate-keys.js
```

Le script affiche quelque chose comme ceci :

```
========================================================
🔐 NEXLAB - GÉNÉRATEUR DE CLÉS DE SÉCURITÉ (INSTALLATION)
========================================================

Copiez-collez les lignes suivantes dans le fichier .env du nouveau laboratoire :

AUTH_SECRET="hhrL6yOyDKVdGbY9XzQ0qwb/iIlH7VmyKO18mEnsDb8="
SEAL_SECRET="vPE+bTiyYqA+kAFJHLi/Xi7d48y36j230Ug3TnT/0KA="
INTERNAL_PRINT_TOKEN="f2e17981d8c6714cbc92c9264d3a9099ecdd23a64bb3efec"
DATABASE_ENCRYPTION_KEY="363bda199e46a28930dcb7164b98c5c7d01279b15ac2f5379a29fc4706bbd000"
BACKUP_ENCRYPTION_KEY="2773d82934d3f3a172b69cec006c63aeb55ca35c253d3015f5c8c7301c468f1e"
```

**Copiez ces 5 lignes dans un fichier texte** (ex: `labo-nom-client.txt`) sur votre bureau. Vous les utiliserez à l'Étape 3.

> [!WARNING]
> Chaque exécution génère des clés **différentes et non reproductibles**. Si vous les perdez après installation, vous ne pouvez pas les régénérer à l'identique. Conservez-en obligatoirement une copie imprimée à remettre au directeur du labo (voir Guide de Livraison).

---

### Étape 1 : Installer Docker (Le "Moteur")

NexLab tourne dans un conteneur Docker. **Le script d'installation le gère automatiquement**, mais voici ce qui se passe :

**Sous Windows :**
Le script `install.ps1` va :
1. Détecter si Docker Desktop est installé.
2. S'il ne l'est pas, il le téléchargera et l'installera automatiquement (nécessite internet lors de la première installation). Si la machine n'a pas internet, téléchargez Docker Desktop manuellement sur `https://www.docker.com/products/docker-desktop/` avant votre visite.
3. S'il doit activer WSL2 (requis par Docker sur Windows), il vous demandera de redémarrer le PC, puis de relancer le script.

**Sous Linux (Ubuntu) :**
Le script `install.sh` utilise le script officiel de Docker (`https://get.docker.com`) pour installer Docker automatiquement. Requiert `sudo`.

---

### Étape 2 : Lancer le Script d'Installation

Copiez le dossier `nexlab-install/` depuis la clé USB sur le bureau du serveur.

**Sous Windows :**
1. Clic-droit sur le bouton Démarrer → **"Terminal Windows (Admin)"** ou **"PowerShell (Administrateur)"**.
2. Naviguez vers le dossier :
   ```powershell
   cd C:\Users\NomDuPC\Desktop\nexlab-install
   ```
3. Autorisez l'exécution de scripts (une seule fois) :
   ```powershell
   Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
   ```
4. Lancez l'installation :
   ```powershell
   .\install.ps1
   ```

**Sous Linux :**
1. Ouvrez le terminal.
2. Naviguez vers le dossier :
   ```bash
   cd ~/Bureau/nexlab-install
   ```
3. Rendez les scripts exécutables :
   ```bash
   chmod +x *.sh
   ```
4. Lancez l'installation :
   ```bash
   sudo ./install.sh
   ```

**Ce que fait le script automatiquement :**
- ✅ Vérifie / installe Docker
- ✅ Crée un fichier `.env` de base avec un `AUTH_SECRET` généré aléatoirement
- ✅ Charge l'application depuis `nexlab-image.tar` (sans internet requis)
- ✅ Crée le volume Docker `nexlab-db` (stockage persistant de la base)
- ✅ Restaure `nexlab.db` dans le volume si le fichier est présent
- ✅ Lance NexLab et attend qu'il soit prêt
- ✅ Crée un raccourci sur le Bureau et dans le Menu Démarrer

---

### Étape 3 : Configurer les Clés de Sécurité dans `.env`

Le script crée un `.env` minimal. Vous devez maintenant y ajouter les clés générées à l'Étape 0.

Ouvrez le fichier `.env` :

```powershell
# Windows
notepad .env
```
```bash
# Linux
nano .env
```

**Ajoutez / complétez ces variables avec les valeurs issues de `generate-keys.js` :**

```env
# ─── Généré automatiquement par le script d'install ──────────────────────────
DATABASE_URL=file:/app/data/nexlab.db
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
AUTH_TRUST_HOST=true

# ─── OBLIGATOIRES — Copiées depuis generate-keys.js ─────────────────────────

AUTH_SECRET="[DEPUIS generate-keys.js]"
SEAL_SECRET="[DEPUIS generate-keys.js]"
INTERNAL_PRINT_TOKEN="[DEPUIS generate-keys.js]"

# ─── RECOMMANDÉES — Chiffrement des sauvegardes ──────────────────────────────

DATABASE_ENCRYPTION_KEY="[DEPUIS generate-keys.js]"
BACKUP_ENCRYPTION_KEY="[DEPUIS generate-keys.js]"

# ─── OPTIONNELLES ─────────────────────────────────────────────────────────────

# Notifications email (compte Resend gratuit sur https://resend.com)
RESEND_API_KEY=

# Sauvegarde vers Google Drive (voir Étape 6)
# Windows : EXTERNAL_BACKUP_DIR="G:\Mon Drive\NexLab-Sauvegardes"
# Linux   : EXTERNAL_BACKUP_DIR="/home/user/Google Drive/NexLab-Sauvegardes"
EXTERNAL_BACKUP_DIR=

# URL du serveur — NE modifier QUE pour l'accès réseau (voir Étape 5)
NEXTAUTH_URL=http://nexlab.localhost
```

Après chaque modification du `.env`, redémarrez NexLab :
```bash
docker compose restart
```

---

### Étape 4 : Nettoyer les Données de Démonstration (Si Applicable)

Si le fichier `nexlab.db` fourni contient des données de démonstration, nettoyez-les avant de livrer :

```bash
# Linux uniquement (nécessite sqlite3 installé)
./cleanup-data.sh
```

Ce script supprime tous les patients, analyses et résultats, mais **conserve** vos configurations de tests, catégories, utilisateurs et paramètres du labo.

---

### Étape 5 : Configurer le Réseau Local (LAN)

Par défaut, NexLab n'est accessible que depuis le serveur lui-même (`http://localhost`). Pour que les autres PC du labo y accèdent :

**1. Trouver l'adresse IP du serveur :**
```powershell
# Windows
ipconfig
# Notez l'"Adresse IPv4", ex: 192.168.1.15
```
```bash
# Linux
hostname -I
```

**2. Demander une IP fixe :** Contactez le technicien réseau du labo pour fixer cette IP dans le routeur. Sinon, l'IP peut changer après un redémarrage du routeur et les clients perdent l'accès.

**3. Pourquoi modifier `NEXTAUTH_URL` ?**
NexLab utilise cette URL pour générer les liens de sessions d'authentification. Si le navigateur accède via `http://192.168.1.15` mais que `NEXTAUTH_URL` dit `http://nexlab.localhost`, la connexion échouera avec "Callback URL mismatch". **C'est la cause n°1 des problèmes après installation en réseau.**

Modifiez dans `.env` :
```env
NEXTAUTH_URL=http://192.168.1.15
```
Puis :
```bash
docker compose restart
```

**4. Ouvrir le pare-feu Windows :**
Sur le serveur → "Pare-feu Windows Defender avec fonctions avancées" → "Règles de trafic entrant" → "Nouvelle règle" → Port → TCP → **80** → Autoriser.

**5. Vérifier depuis un PC client :**
Ouvrez Chrome, tapez `http://192.168.1.15`. La page de connexion NexLab doit apparaître. Créez un favori pour les techniciens.

---

### Étape 6 : Configurer la Sauvegarde Cloud Gratuite (Google Drive)

1. Sur le PC serveur, installez [Google Drive pour ordinateur](https://www.google.com/drive/download/).
2. Connectez-le avec une adresse Gmail dédiée au labo (ex: `sauvegardes.labo.nom@gmail.com`). Les 15 Go gratuits suffisent pour des années de sauvegardes.
3. Google Drive crée un dossier local. Créez-y un sous-dossier `NexLab-Sauvegardes`.
4. Ajoutez dans `.env` :
   ```env
   # Windows (exemple)
   EXTERNAL_BACKUP_DIR="C:\Users\Serveur\Google Drive\NexLab-Sauvegardes"
   # Linux (exemple)
   EXTERNAL_BACKUP_DIR="/home/serveur/Google Drive/NexLab-Sauvegardes"
   ```
5. Redémarrez : `docker compose restart`.

Désormais, chaque nuit à 2h00, NexLab crée une sauvegarde chiffrée localement **ET** en envoie une copie dans Google Drive.
