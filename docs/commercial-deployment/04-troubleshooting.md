# NexLab : Dépannage et Résolution des Problèmes (Troubleshooting)

> *En tant qu'intégrateur, vous allez inévitablement recevoir des appels au secours. 95% des problèmes peuvent être résolus en 2 minutes si vous savez où regarder. Ce guide liste les problèmes courants.*

---

## 1. Problèmes de Connexion (Les clients ne voient pas le site)

### Symptôme : Le PC Serveur accède à NexLab, mais les autres PC affichent "Ce site est inaccessible".
- **Cause 1 (Le Pare-feu)** : Le pare-feu Windows du Serveur bloque le port 8080 ou 80.
  - **Solution** : Sur le Serveur, cherchez "Pare-feu Windows Defender avec fonctions avancées". Créez une nouvelle "Règle de trafic entrant" -> Port -> TCP -> 8080 (ou 80) -> Autoriser la connexion.
- **Cause 2 (Changement d'IP)** : Le routeur du labo a redémarré et a donné une nouvelle IP au Serveur.
  - **Solution** : Refaites un `ipconfig` sur le serveur pour trouver la nouvelle IP. Mettez à jour le `.env` (`NEXTAUTH_URL=...`) et redémarrez NexLab avec `docker compose restart`. (Rappel : demandez une IP Fixe au FAI ou routeur !).

---

## 2. Problèmes de l'Application

### Symptôme : Le serveur a eu une coupure de courant. Quand on le rallume, NexLab ne marche pas.
- **Cause** : Docker ne s'est pas lancé tout seul, ou le conteneur n'a pas redémarré.
- **Solution** : 
  1. Vérifiez que Docker Desktop (Windows) est ouvert et tourne (l'icône de la baleine).
  2. Ouvrez PowerShell dans le dossier `nexlab-install`.
  3. Tapez : `docker compose start`.
  *(Note : Dans `docker-compose.yml`, j'ai mis `restart: unless-stopped`, donc normalement il devrait se rallumer tout seul si Docker démarre avec Windows).*

### Symptôme : L'application affiche "500 Internal Server Error" sur une page.
- **Cause** : Un bug logiciel ou un problème de base de données.
- **Solution** : Regardez les logs !
  1. Ouvrez PowerShell dans `nexlab-install`.
  2. Tapez : `docker compose logs -f nexlab`
  3. Les lignes rouges vous diront exactement où ça plante (ex: "Table 'Analyses' not found" ou "Prisma Client Error"). Prenez une photo de cette erreur pour la corriger dans votre code source chez vous.

---

## 3. Problèmes de Sauvegarde (Très Important)

### Symptôme : Le client vous dit "Le dossier Google Drive est vide, il n'y a pas eu de sauvegarde hier".
- **Cause 1** : L'ordinateur serveur était éteint à 2h00 du matin.
  - **Solution** : Expliquez au client que le serveur principal doit rester allumé 24h/24 et 7j/7. Un serveur ne s'éteint jamais.
- **Cause 2** : L'application Google Drive (le petit nuage en bas à droite) s'est déconnectée.
  - **Solution** : Reconnectez le compte Gmail sur l'application Google Drive du bureau.
- **Solution d'Urgence** : Si vous voulez forcer une sauvegarde maintenant, exécutez le script `.\backup-now.ps1` (Windows) ou `./backup-now.sh` (Linux) situé dans le dossier `nexlab-install`. Il générera un `nexlab-backup-X.sqlite.enc` dans la seconde.

---

## 4. Restauration en Cas de Catastrophe Totale (Crash du disque dur)

C'est votre moment de gloire. Le labo a perdu son serveur. Voici comment vous les sauvez :

1. Achetez un nouveau PC.
2. Mettez le dossier `nexlab-install` dessus.
3. Téléchargez la dernière sauvegarde depuis leur Gmail (le fichier `.sqlite.enc`).
4. **ATTENTION :** Dans le fichier `.env` du nouveau PC, vous DEVEZ utiliser exactement la même `BACKUP_ENCRYPTION_KEY` et le même `SEAL_SECRET` qu'avant (c'est le papier que vous leur avez mis au coffre).
5. Utilisez le script de restauration : `.\restore-backup.ps1 "chemin/vers/fichier.sqlite.enc"` (ou `.sh` sous Linux).
6. Le script va utiliser la clé du `.env` pour déchiffrer la sauvegarde, la mettre à la bonne place, et redémarrer NexLab.
7. Vos clients vous considéreront comme un héros.
