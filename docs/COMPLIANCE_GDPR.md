# Conformité RGPD & Confidentialité des Données (NexLab CSSB)

Ce document décrit les mesures techniques et organisationnelles implémentées dans NexLab LIMS pour assurer la conformité aux directives du Règlement Général sur la Protection des Données (RGPD) et aux normes de confidentialité des données médicales.

## 1. Droits des Patients

### Droit à la portabilité (Art. 20)
L'application fournit un outil d'export complet des données (API `/api/patients/[id]/export`).
- Le téléchargement s'effectue au format JSON (lisible par machine)
- L'archive contient la démographie complète, l'historique des analyses, et l'intégralité des résultats (valeurs, seuils, notes).
- Une trace d'export (`EXPORT_PATIENT_DATA`) est laissée dans le log d'audit.

### Droit à l'effacement / Droit à l'oubli (Art. 17)
L'interface d'administration inclut un bouton de "Purge Patient" (`/api/patients/[id]/purge`).
- **Suppression en Cascade** : Élimine le dossier Patient, toutes les Analyses associées, tous les Résultats, et toute consommation associée.
- **Anonymisation de l'Audit** : Les journaux d'audit ne conservent plus le lien technique vers le patient supprimé. Une action de sévérité "CRITICAL" de type `GDPR_PURGE_PATIENT` est logguée pour tracer l'action de l'administrateur, sans stocker d'informations identifiantes post-purge.

## 2. Accès et Masquage (Privacy by Design)
- **Role-Based Access Control (RBAC)** : Par défaut, seuls les Rôles désignés (Admin, Médecin, Technicien) peuvent accéder aux dossiers médicaux. Les réceptionnistes disposent d'un accès limité à la validation technique.
- **Auto-Logout** : Le composant `SessionManager` intègre une déconnexion automatique inévitable (`useIdleTimeout`) après 30 minutes d'inactivité du poste de travail pour empêcher le vol de session dans les locaux.

## 3. Minimisation et Rétention (Art. 5)
- **Purge d'Audits** : L'historique d'audit (table `AuditLog`) est périodiquement transféré vers `AuditLogArchive` via les scripts de maintenance (`scripts/run-scheduled-backups.ts` extension).
- Le délai conseillé de conservation (Laboratoires d'analyses) est de 7 ans pour les dossiers primaires conformes (Arrêté de bonne exécution).

## 4. Politique de Traitement (Data Processing)
Les mots de passe sont hachés par `bcrypt`. Les communications sont sécurisées par SSL/TLS. Les entêtes HTTP bloquent le Clickjacking (`X-Frame-Options`) et le sniffing de type MIME (`X-Content-Type-Options`).
L'application réside dans une base relationnelle locale ou hébergée en Europe (`libsql` / Turso / Prisma), ne partageant en aucun cas les données à l'extérieur des endpoints d'export prescrits.
