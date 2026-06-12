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


# Comprendre le RGPD (Guide Simplifié pour NexLab)

## Qu'est-ce que le RGPD ?

Le **RGPD** (Règlement Général sur la Protection des Données) est une loi européenne créée pour protéger la vie privée des citoyens. Même si elle est européenne, elle est devenue la "norme d'or" mondiale (la référence) pour tous les logiciels de santé. 

En termes simples, le RGPD dit : **"Les données récoltées sur une personne appartiennent à cette personne, pas à l'entreprise qui les stocke."**

Dans notre cas avec NexLab, les données d'un patient (son nom, son âge, son numéro de téléphone, et les résultats de ses prises de sang) sont considérées comme des **données de santé extrêmement sensibles**.

---

## Pourquoi est-ce si important pour NexLab ?

Si NexLab veut être vendu officiellement à des laboratoires, des cliniques ou des hôpitaux, les directeurs ou le gouvernement (ministère de la santé) vont exiger que le logiciel soit "Conforme aux normes". S'il ne l'est pas, un laboratoire risque une grosse amende s'il l'achète. 

En intégrant le RGPD, **vous prouvez que NexLab est un logiciel de grade professionnel ("Enterprise-grade").**

---

## Les 2 grands concepts que nous avons implémentés

Pour que NexLab respecte le RGPD, vous deviez donner aux patients un total contrôle sur leurs données. C'est ce que nous avons fait avec deux fonctionnalités clés :

### 1. Le Droit à la portabilité (L'Export)
**L'idée :** Si je suis un patient chez le laboratoire X et que je veux changer pour aller au laboratoire Y, le laboratoire X ne peut pas me prendre en otage. Je dois pouvoir repartir avec la copie exacte et informatisée de tout mon dossier médical.
**Dans NexLab :** C'est le bouton "Droit à la portabilité". Il génère un fichier informatique (JSON) contenant le profil complet du patient et tout son historique médical depuis le jour 1.

### 2. Le Droit à l'oubli (La Purge)
**L'idée :** Si je ne veux plus avoir affaire à une clinique et que je veux que tout le monde m'oublie, je peux exiger qu'ils suppriment toutes mes traces de leurs serveurs (à condition que la loi médicale ne les oblige pas à les garder dans certains cas).
**Dans NexLab :** C'est le bouton rouge "Droit à l'oubli". Quand on clique dessus, NexLab fonctionne comme une déchiqueteuse à papier : il détruit de la base de données le patient, les dossiers de ce patient, les analyses de ce patient, et les résultats de ce patient, de manière propre et intégrale, pour éviter de laisser des "données orphelines".

---

## En résumé
Le RGPD n'est pas un code compliqué, c'est **une loi informatique de bonnes manières et de respect**. En incluant le panel RGPD dans le profil du patient, vous avez assuré que NexLab est respectueux de la législation.

*Note : Nous pourrons utiliser le dossier `docs/concepts/` pour ajouter d'autres tutoriels comme celui-ci sur d'autres sujets compliqués de la feuille de route (comme le "CI/CD", les "E2E Tests", ou "l'Architecture MVC").*
