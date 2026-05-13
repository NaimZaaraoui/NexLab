# Sauvegardes et reprise

Ce document explique, côté utilisateur, comment fonctionne la sauvegarde dans NexLab et comment l’utiliser sans entrer dans les détails techniques internes.

## 1. À quoi sert cette fonction

La fonction de sauvegarde sert à protéger le laboratoire contre :

1. une erreur humaine
2. une base corrompue
3. une panne du poste principal
4. une restauration après incident

## 2. Les 3 types de fichiers

### 1. Sauvegarde SQLite

C’est une copie de la base de données.

Elle sert à :

1. restaurer rapidement les données du LIMS
2. revenir à un état précédent

### 2. Bundle de reprise

C’est une archive plus complète.

Elle contient :

1. la base
2. les uploads utiles
3. des fichiers d’aide à la reprise

Elle sert à :

1. reprendre NexLab sur une autre machine
2. restaurer plus complètement qu’une simple sauvegarde SQLite

### 3. Export complet

C’est un export métier en JSON.

Il sert surtout à :

1. audit
2. extraction
3. archivage métier

Il ne remplace pas une vraie restauration technique.

## 3. Où aller dans l’application

Dans NexLab :

1. `Paramètres`
2. `Base de données`
3. puis :
   - `Sauvegardes`
   - ou `Supervision`

## 4. Page Sauvegardes

La page `Sauvegardes` sert à agir directement.

On peut :

1. créer une sauvegarde
2. créer un bundle de reprise
3. tester un fichier sans restaurer
4. télécharger un fichier
5. restaurer un fichier
6. importer une sauvegarde `.sqlite`
7. importer un bundle `.tar.gz`

## 5. Créer une sauvegarde

Utilisez :

- `Créer une sauvegarde`

À faire :

1. avant une maintenance importante
2. avant une mise à jour
3. avant une restauration
4. avant un import massif

## 6. Créer un bundle de reprise

Utilisez :

- `Créer un bundle de reprise`

À faire :

1. régulièrement
2. avant migration de machine
3. avant intervention technique importante

Le bundle est particulièrement utile si le poste principal tombe en panne.

## 7. Tester un backup ou un bundle

Utilisez :

- `Tester`

Cette action :

1. ne restaure rien
2. ne modifie pas la base active
3. vérifie seulement que le fichier est valide

C’est une très bonne habitude avant de compter sur un fichier de secours.

## 8. Restaurer un backup

Utilisez :

- `Restaurer`

Quand vous restaurez :

1. la base active est remplacée
2. NexLab crée d’abord un fichier de sécurité
3. NexLab exécute ensuite une validation automatique

Après restauration, l’application affiche un résumé de l’opération.

## 9. Restaurer un bundle de reprise

Utilisez :

- `Restaurer`

sur la ligne d’un bundle.

Quand vous restaurez un bundle :

1. la base active est remplacée
2. les uploads peuvent aussi être restaurés
3. un bundle de sécurité est créé avant écrasement
4. une validation est exécutée après restauration

## 10. Importer des fichiers externes

### Sauvegarde SQLite

Formats acceptés :

- `.sqlite`

### Bundle de reprise

Formats acceptés :

- `.tar.gz`

Les fichiers importés sont testés avant d’être acceptés.

## 11. Page Supervision

La page `Supervision` sert à surveiller et configurer.

On y trouve :

1. l’état de santé du système
2. la politique de rétention
3. la cible externe
4. le mode maintenance
5. l’historique des actions
6. la checklist opérateur

## 12. Bonnes pratiques

Pour un petit labo, je recommande :

1. créer une sauvegarde avant toute opération sensible
2. créer aussi des bundles de reprise
3. tester régulièrement un backup ou un bundle
4. garder une copie externe
5. vérifier la page `Supervision`

## 13. Ce qu’il faut retenir

La logique simple est :

1. `backup SQLite` = restauration rapide de la base
2. `bundle de reprise` = reprise plus complète
3. `test` = vérifier sans restaurer
4. `supervision` = surveiller la protection du labo
