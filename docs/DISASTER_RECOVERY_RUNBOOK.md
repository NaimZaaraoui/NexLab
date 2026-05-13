# Runbook — Plan de Reprise d'Activité (PRA / DRP)

Ce document opérationnel (Disaster Recovery Plan) guide l'équipe face à une panne cataclysmique (corruption de base de données, perte de serveur) pour restaurer NexLab.

## Objectifs (SLA Internes)
- **RTO (Recovery Time Objective)** : **< 1 heure**. Temps maximum acceptable pour remettre le laboratoire en état de marche.
- **RPO (Recovery Point Objective)** : **< 24 heures**. (ou < 1 heure via backups fréquents). Perte de données acceptable maximale.

## Stratégie de Backup
Les données résident sur une base SQLite / LibSQL gérée via Prisma.
Le script automatisé `scripts/run-scheduled-backups.ts` prend en charge la sauvegarde.
- **Quotidien** : Création d'un bundle d'archive complet via `scripts/create-recovery-bundle.ts`. Archive chiffrée stockée en externe ou sur un disque distant.
- **Continuité** : Utilisation du mode WAL (Write-Ahead Logging) pour récupérer les coupures de courant locales sans corruption de DB.

---

## Procédure Catastrophe (Severity 1)

### Scénario A : Le disque local ou la VM a crashé (Données locales perdues)
1. **Provisionner l'App Server** :
   ```bash
   git clone https://github.com/naim/labcare-cssb
   cd labcare-cssb
   npm ci
   ```
2. **Récupérer l'archive de Backup**
   Télécharger le dernier fichier ZIP généré par `create-recovery-bundle.ts` depuis le stockage froid (S3/Drive distant).
3. **Restaurer la Base**
   - Remplacer le fichier `sqlite.db` par celui contenu dans l'archive.
   - Pousser le changement aux schémas : `npx prisma db push` (Si modifications de volume).
   - Rétablir le fichier `.env` contenant le `AUTH_SECRET`.
4. **Relancer le système**
   ```bash
   npm run build
   npm run start
   ```

### Scénario B : Corruption ou Mise à jour (Migration) désastreuse
*Symptôme : Les données sont physiquement là mais l'application refuse d'écrire/crash "Database Error".*
1. Couper le service (`pm2 stop nexlab` ou container stop).
2. Lancer le script de **migration safety** (Priority 1.4) :
   ```bash
   npm run prisma:rollback
   ```
3. Si la base est corrompue (SQLite Header Error) :
   * Ne **PAS** utiliser un utilitaire de réparation qui ne connait pas l'ORM. Écrasez `sqlite.db` par la copie `sqlite.db.backup` prise automatiquement "pre-migration" par notre script existant.

### Scénario C : Falsification / Intrusion détectée
1. Isoler le serveur d'internet.
2. Analyser les archives d'audit de la table `audit_logs`.
3. Invalider tous les accès applicatifs :
   Changer impérativement le `AUTH_SECRET` dans `.env` et redémarrer, forçant ainsi tout le monde à se reconnecter instantanément. (Session Cookie Invalidation).
