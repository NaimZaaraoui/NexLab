# 🧪 Guide Avancé : Module de Contrôle Qualité (QC)

Le module de Contrôle Qualité Interne (CQI) de NexLab LIMS garantit la fiabilité des résultats cliniques. Il repose sur les règles internationales de Westgard et la représentation graphique de Levey-Jennings.

## 1. Concepts Clés

- **Matériel de Contrôle** : La solution commerciale utilisée pour tester l'automate (ex: *Randox Assayed Multisera*).
- **Lot** : Le numéro de lot spécifique du matériel (ex: *Lot #12345*), associé à une date d'expiration.
- **Cible (Target) & Écart-Type (SD)** : Les valeurs attendues fournies par le fabricant pour ce lot spécifique.
- **Levey-Jennings** : Le graphique permettant de visualiser la dérive de l'automate au fil du temps.

---

## 2. Configuration Initiale (Biologiste / Admin)

### 2.1 Ajouter un Matériel de Contrôle
1. Allez dans **Tableau de Bord → QC → Configuration → Matériels**.
2. Cliquez sur **"Nouveau Matériel"**.
3. Renseignez le nom, le fabricant et le niveau (Normal, Pathologique Bas, Pathologique Haut).

### 2.2 Configurer un Nouveau Lot
1. Allez dans **Configuration → Lots**.
2. Cliquez sur **"Nouveau Lot"** et sélectionnez le matériel parent.
3. Renseignez le numéro de lot et la **date d'expiration** exacte.
   > ⚠️ **Alerte** : Le système bloquera l'utilisation d'un lot périmé.

### 2.3 Définir les Cibles (Targets)
Pour chaque Lot, vous devez configurer les valeurs cibles des analyses :
1. Cliquez sur le Lot créé.
2. Allez dans l'onglet **"Cibles (Targets)"**.
3. Pour chaque analyse (ex: Glucose), saisissez :
   - La **Valeur Cible** (Moyenne attendue).
   - L'**Écart-Type (SD)** fourni par la notice.
   - Le système calculera automatiquement les limites (±1SD, ±2SD, ±3SD).

---

## 3. Flux de Travail Quotidien (Technicien)

La saisie du QC doit être effectuée **avant** le passage des échantillons patients.

### 3.1 Saisir un Résultat QC
1. Allez dans **Tableau de Bord → QC**.
2. Cliquez sur **"Saisir QC du Jour"**.
3. Sélectionnez l'Automate et le Lot utilisé.
4. Entrez les valeurs lues par l'automate.
5. Cliquez sur **"Valider"**.

### 3.2 Interprétation Automatique
NexLab évalue instantanément le résultat :
- 🟢 **Accepté** : Valeur entre -2SD et +2SD.
- 🟡 **Alerte (Warning)** : Valeur entre 2SD et 3SD (Règle 1-2s).
- 🔴 **Rejeté** : Valeur au-delà de 3SD (Règle 1-3s) ou violations multiples (2-2s, R4s).

> [!WARNING]  
> **Blocage Automatique** : Si un QC est *Rejeté*, NexLab affichera une alerte rouge critique sur le Dashboard clinique et bloquera la validation des résultats patients pour l'automate concerné jusqu'à résolution.

---

## 4. Analyse et Revue (Biologiste)

### 4.1 Graphiques de Levey-Jennings
1. Allez dans la fiche détaillée d'un Lot.
2. Le système trace automatiquement la courbe pour le mois en cours.
3. **À observer** :
   - *Tendances* : 6 valeurs consécutives montantes ou descendantes.
   - *Biais* : Plusieurs valeurs consécutives du même côté de la moyenne.

### 4.2 Invalider un Résultat QC
Si une erreur humaine est détectée (ex: mauvaise reconstitution du réactif) :
1. Cliquez sur le point rouge dans le graphique.
2. Sélectionnez **"Invalider ce résultat"**.
3. **Obligatoire** : Saisissez la raison (ex: "Bulle d'air dans la pipette", "Matériel mal décongelé").
4. Le point sera grisé sur le graphique et ignoré dans les calculs statistiques (CV%).

### 4.3 Clôture d'un Lot
À la date de péremption, ou lorsque le flacon est vide, changez le statut du lot en **"Archivé"**. Un rapport statistique complet (Moyenne réelle, SD réel, CV%) sera généré pour l'archivage qualité.
