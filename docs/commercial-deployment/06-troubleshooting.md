# NexLab LIMS — Dépannage et Résolution des Problèmes

> *Ce guide liste les problèmes les plus courants que vous rencontrerez après installation et comment les résoudre rapidement, même à distance par téléphone.*

---

## Problème 1 : Les PC clients ne voient pas NexLab

**Symptôme :** Le serveur accède à `http://localhost` sans problème, mais les autres PC du labo affichent "Ce site est inaccessible" ou "ERR_CONNECTION_REFUSED".

### Diagnostic étape par étape :

**A) Vérifier que NexLab tourne :**
```bash
docker compose ps
```
La colonne "Status" doit afficher `running` ou `healthy`. Si c'est `exited`, relancez : `docker compose start`.

**B) Vérifier le pare-feu Windows (cause n°1) :**
Sur le serveur Windows :
1. Cherchez "Pare-feu Windows Defender avec fonctions avancées de sécurité".
2. Cliquez "Règles de trafic entrant" → "Nouvelle règle".
3. Type : Port → TCP → Port spécifique : **80** → Autoriser → Appliquer à tous les profils.

**C) Vérifier le pare-feu Linux (UFW) :**
```bash
sudo ufw allow 80
sudo ufw reload
```

**D) L'IP du serveur a changé :**
Le routeur a redémarré et donné une nouvelle IP.
1. Sur le serveur : `ipconfig` (Windows) ou `hostname -I` (Linux).
2. Mettez à jour `.env` : `NEXTAUTH_URL=http://[NOUVELLE_IP]`.
3. `docker compose restart`.
4. Informez les clients de la nouvelle URL.
*Solution définitive : demandez une IP fixe (DHCP statique) dans le routeur du labo.*

---

## Problème 2 : "Callback URL mismatch" / Impossible de se connecter depuis un autre PC

**Symptôme :** La page de login s'affiche bien, mais après avoir entré le mot de passe, une erreur "Callback URL mismatch" ou redirection vers `nexlab.localhost` apparaît.

**Cause :** `NEXTAUTH_URL` dans `.env` ne correspond pas à l'URL utilisée pour accéder au site.

**Solution :**
```env
# Dans .env, remplacez :
NEXTAUTH_URL=http://nexlab.localhost

# Par l'IP réelle du serveur :
NEXTAUTH_URL=http://192.168.1.15
```
```bash
docker compose restart
```

---

## Problème 3 : NexLab ne redémarre pas après une coupure de courant

**Symptôme :** Le serveur a redémarré (suite à une coupure), mais NexLab n'est pas accessible.

**Cause :** Docker Desktop (Windows) ne s'est pas lancé automatiquement au démarrage.

**Solution immédiate :**
1. Vérifiez que Docker Desktop est ouvert (icône de baleine dans la barre des tâches, en bas à droite). Si elle n'y est pas, lancez Docker Desktop manuellement.
2. Attendez que l'icône devienne verte (30-60 secondes).
3. Ouvrez PowerShell dans `nexlab-install` : `docker compose start`.

**Solution définitive (Windows) :**
1. Ouvrez Docker Desktop → Settings (Paramètres) → General.
2. Activez "Start Docker Desktop when you log in".
3. Le fichier `docker-compose.yml` contient déjà `restart: always`, donc NexLab redémarre tout seul une fois Docker lancé.

**Solution définitive (Linux) :**
```bash
# Docker et NexLab démarrent automatiquement avec le système
sudo systemctl enable docker
```

---

## Problème 4 : "Application won't start" / Erreur 500

**Symptôme :** L'application affiche une page d'erreur ou ne répond pas du tout.

**Diagnostic — Regarder les logs :**
```bash
# Dans le dossier nexlab-install
docker compose logs -f nexlab
```
Cherchez les lignes rouges (erreurs). Les messages courants et leurs solutions :

| Message d'erreur | Solution |
|---|---|
| `SEAL_SECRET is not set` | Ajoutez `SEAL_SECRET="..."` dans `.env` et redémarrez. |
| `INTERNAL_PRINT_TOKEN is not set` | Ajoutez `INTERNAL_PRINT_TOKEN="..."` dans `.env` et redémarrez. |
| `Cannot open database` | La base est peut-être corrompue. Restaurez la dernière sauvegarde. |
| `Port 80 already in use` | Un autre programme utilise le port 80 (IIS, Apache). Voir Problème 5. |
| `Prisma error` / migration | La base de données n'est pas compatible avec la version actuelle. Relancez `docker compose restart` pour déclencher les migrations. |

---

## Problème 5 : Port 80 déjà utilisé

**Symptôme :** Le script d'installation échoue avec "address already in use" ou "bind: address already in use".

**Cause :** Un autre logiciel (IIS de Windows, Apache, un autre service) utilise déjà le port 80.

**Solution :**
Éditez `docker-compose.yml` et changez le port :
```yaml
ports:
  - "0.0.0.0:8080:3000"  # NexLab sera sur le port 8080
```
Puis mettez à jour `.env` :
```env
NEXTAUTH_URL=http://192.168.1.15:8080
```
Redémarrez : `docker compose restart`.

Désormais l'URL sera `http://192.168.1.15:8080`.

---

## Problème 6 : La sauvegarde nocturne n'a pas fonctionné

**Symptôme :** Le dossier `./backups/database/` est vide ou les fichiers ont plus de 24h.

**Vérifications :**

**A) Le serveur était-il allumé à 2h00 du matin ?**
Le serveur **ne doit jamais être éteint**. Si l'établissement fait une coupure générale la nuit, la sauvegarde n'a pas pu tourner.

**B) Vérifier les logs de NexLab à 2h00 :**
```bash
docker compose logs nexlab | grep "Auto-Backup"
```
Cherchez les lignes `✅ Backup created` ou `❌ Backup failed`.

**C) Forcer une sauvegarde maintenant :**
```powershell
# Windows
.\backup-now.ps1

# Linux
./backup-now.sh
```

**D) Google Drive ne synchronise pas :**
L'icône de l'application Google Drive (nuage en bas à droite de l'écran) est-elle présente et verte ? Si elle est grise ou absente, reconnectez le compte Gmail.

---

## Procédure de Restauration d'Urgence (Nouveau PC)

**Situation :** Le disque dur du serveur est mort. Vous avez un nouveau PC et les sauvegardes dans Google Drive.

**Étapes :**
1. Copiez le dossier `nexlab-install` sur le nouveau PC (depuis clé USB ou téléchargement).
2. Téléchargez la dernière sauvegarde depuis le Gmail de sauvegarde du labo (fichier `.db` ou `.sqlite.enc`).
3. Si vous aviez un `BACKUP_ENCRYPTION_KEY` différent, ajoutez-le dans le `.env` du nouveau serveur **exactement comme dans l'ancien** (c'est pour ça qu'on garde le papier au coffre).
4. Lancez l'installation : `.\install.ps1` ou `./install.sh`.
5. Une fois installé, restaurez la sauvegarde :
   ```powershell
   .\restore-backup.ps1 .\chemin\vers\nexlab_backup_xxx.db
   ```
6. Reconfigurez le réseau (nouvelle IP, NEXTAUTH_URL, Google Drive).
7. Générez une nouvelle licence liée au **nouveau** Machine ID (il a changé avec le nouveau PC).

Le labo reprend son activité en moins d'une heure. 🎉
