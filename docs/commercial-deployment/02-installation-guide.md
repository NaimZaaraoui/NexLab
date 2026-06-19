# NexLab : Guide d'Installation (Pour l'Intégrateur)

> *Ce document explique comment installer NexLab chez votre client de manière professionnelle. Nous utiliserons le dossier `nexlab-install` qui contient l'image Docker de l'application.*

---

## 1. Choix du Matériel ("Le Serveur")

Le laboratoire n'a pas besoin d'un vrai "serveur" au format rack hors de prix. Un bon PC de bureau suffira largement pour héberger NexLab.

**Recommandations pour le PC Serveur :**
- **Processeur** : Intel Core i5 ou AMD Ryzen 5 (récent).
- **RAM** : 8 Go minimum (16 Go recommandé si c'est un gros labo).
- **Disque Dur** : SSD de 256 Go ou 512 Go (Crucial pour la vitesse de la base de données).
- **Système d'exploitation** : 
  - **Option 1 (Le plus stable/Pro)** : Linux Ubuntu 22.04 LTS. 
  - **Option 2 (Plus facile si le labo veut aussi l'utiliser comme PC)** : Windows 10/11 Pro.
- **Réseau** : Le PC doit être branché en **câble Ethernet** au routeur du laboratoire (pas de Wi-Fi pour le serveur principal, pour garantir la stabilité).

---

## 2. Préparation du Serveur

Que ce soit sur Windows ou Linux, vous devez d'abord installer le moteur qui fera tourner NexLab.

1. **Installer Docker** :
   - *Windows* : Téléchargez et installez **Docker Desktop**. Lancez-le et assurez-vous que l'icône de la baleine est verte en bas à droite.
   - *Linux* : Exécutez `sudo apt update && sudo apt install docker.io docker-compose -y`.

2. **Copier les fichiers** :
   - Prenez une grosse clé USB contenant le dossier `nexlab-install` (qui pèse environ 800 Mo à cause du fichier `nexlab-image.tar`).
   - Copiez ce dossier sur le bureau du Serveur.

---

## 3. L'Installation (Le pas-à-pas devant le client)

Montrez au client que l'installation est rapide, c'est très professionnel.

### Si le Serveur est sous Windows :
1. Faites un clic-droit sur le bouton Démarrer → **Windows PowerShell (Admin)**.
2. Déplacez-vous dans le dossier : `cd C:\Users\NomDuPC\Desktop\nexlab-install`
3. Exécutez le script d'installation : `.\install.ps1`
4. Le script va charger l'image automatiquement, générer le fichier `.env` avec la sécurité, et démarrer l'application.

### Si le Serveur est sous Linux :
1. Ouvrez le terminal.
2. Déplacez-vous dans le dossier : `cd ~/Bureau/nexlab-install`
3. Donnez les droits : `chmod +x *.sh`
4. Lancez le script : `sudo ./install.sh`

> ✅ **C'est fini !** L'application tourne maintenant en arrière-plan (même si vous fermez la fenêtre noire).

---

## 4. Configuration du Réseau (Permettre aux autres PC d'y accéder)

Maintenant que le serveur tourne, les secrétaires et les biologistes sur leurs propres PC doivent pouvoir y accéder.

1. **Trouver l'IP du Serveur** :
   - Sur le Serveur Windows : tapez `ipconfig` dans le PowerShell et notez l'"Adresse IPv4" (ex: `192.168.1.15`).
   - Sur Linux : tapez `hostname -I`.
   *Astuce Pro : Demandez à l'informaticien de la clinique de fixer cette IP dans le routeur pour qu'elle ne change jamais (IP Fixe LAN).*

2. **Configurer l'IP dans NexLab** :
   - Ouvrez le fichier `.env` dans le dossier `nexlab-install`.
   - Modifiez la ligne `NEXTAUTH_URL=http://nexlab.localhost` par `NEXTAUTH_URL=http://192.168.1.15:8080` (remplacez par la vraie IP).
   - Enregistrez.
   - Dans PowerShell/Terminal, tapez : `docker compose restart`.

3. **Vérifier sur un PC Client** :
   - Allez sur l'ordinateur de l'accueil.
   - Ouvrez Google Chrome.
   - Tapez `http://192.168.1.15:8080`.
   - L'écran de connexion NexLab devrait apparaître ! Créez un favori pour eux.

---

## 5. Configuration de la Sauvegarde Cloud (Le "Wow Effect")

C'est là que vous justifiez votre prix de vente : la sécurité des données.

1. Installez "Google Drive pour Bureau" sur le Serveur.
2. Connectez-vous avec une adresse Gmail dédiée (ex: `sauvegardes.labo.x@gmail.com`).
3. Google Drive va créer un lecteur `G:\` (sur Windows). Créez-y un dossier `NexLab-Backups`.
4. Ouvrez le `.env` de NexLab et ajoutez : `EXTERNAL_BACKUP_DIR="G:\Mon Drive\NexLab-Backups"`
5. Redémarrez NexLab (`docker compose restart`).

**Ce que vous dites au client :**
*"J'ai configuré votre serveur pour qu'à 2h du matin, il fasse une copie chiffrée de la base de données et l'envoie sur les serveurs de Google. Même si le labo prend feu ce soir, demain matin j'achète un nouveau PC, je télécharge le fichier depuis Gmail, et vous reprenez le travail sans avoir perdu une seule analyse."*
