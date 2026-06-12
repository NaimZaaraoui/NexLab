# 📦 Guide Avancé : Module d'Inventaire et Stocks

Le module d'Inventaire assure la traçabilité complète des réactifs et consommables du laboratoire, de leur réception jusqu'à leur épuisement ou péremption.

## 1. Organisation du Catalogue

### 1.1 Catégories
Les articles sont classés en catégories pour faciliter les statistiques financières :
- Réactifs de Biochimie
- Réactifs d'Hématologie
- Consommables (Tubes, Aiguilles, Gants)
- Solutions de Lavage / Calibrateurs

### 1.2 Création d'un Article
1. Allez dans **Inventaire → Catalogue → Nouvel Article**.
2. Définissez :
   - Le **Code Article** (SKU, ex: `ROCHE-GLUC-500`).
   - Le conditionnement (ex: *Boîte de 500 tests* ou *Flacon de 50ml*).
   - Le **Seuil d'Alerte** (ex: alerter s'il reste moins de 2 boîtes).

---

## 2. Gestion des Entrées (Réception)

À la livraison d'une commande par le fournisseur :

1. Allez dans **Inventaire → Réceptions**.
2. Sélectionnez l'article.
3. **Informations Obligatoires** :
   - **Numéro de Lot du Fabricant** (Crucial pour la traçabilité).
   - **Date d'Expiration** exacte.
   - **Quantité** reçue.
4. Le système génère automatiquement des codes-barres internes (si activé) pour étiqueter chaque boîte.

> [!TIP]
> **Règle FEFO (First-Expired, First-Out)** : NexLab suggérera toujours d'utiliser en priorité le lot dont la date de péremption est la plus proche pour éviter le gaspillage.

---

## 3. Consommation et Sorties

Il existe deux méthodes pour déduire les stocks : Manuelle ou Automatique.

### 3.1 Consommation Manuelle (Consommables)
Utilisée pour les articles non liés directement à un test (Gants, Tubes).
1. Allez dans la fiche de l'article.
2. Cliquez sur **"Sortie Manuelle"**.
3. Saisissez la quantité prélevée de la réserve.

### 3.2 Consommation Automatique (Réactifs)
NexLab peut déduire automatiquement le stock à chaque validation d'analyse.
1. Allez dans la fiche du réactif → Onglet **"Règles de Consommation"**.
2. Créez une règle : *1 Test de Glucose = -1 Unité du Réactif ROCHE-GLUC-500*.
3. Chaque soir, le système mettra à jour les stocks en fonction du nombre de tests validés dans la journée (incluant le volume mort et les calibrations si configuré).

---

## 4. Pertes et Péremptions

Pour garantir des statistiques financières justes, toute perte doit être déclarée.

1. Allez sur le lot concerné.
2. Cliquez sur **"Déclarer une Perte (Waste)"**.
3. Sélectionnez le motif :
   - Péremption (Date dépassée).
   - Casse / Dommage.
   - Problème de chaîne du froid.
4. L'ajustement est enregistré dans l'Audit Trail.

---

## 5. Alertes et Commandes

- **Alertes de Seuil** : Dès qu'un article passe sous son seuil de sécurité, une notification ⚠️ rouge apparaît sur le Dashboard.
- **Alertes de Péremption** : 30 jours avant l'expiration d'un lot, une notification avertit le responsable des stocks.
- **Rapport de Réapprovisionnement** : Utilisez l'onglet **"Statistiques"** pour imprimer la liste exacte des articles à commander, basée sur votre consommation moyenne des 30 derniers jours.
