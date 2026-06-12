# 💰 Guide Avancé : Facturation & Export CNAM

Le module Finance gère la tarification des examens (Nomenclatures B), les paiements patients, la facturation des entreprises partenaires et les télétransmissions aux caisses d'assurance maladie (CNAM).

## 1. Tarification et Cotation (B)

Dans de nombreux pays, les analyses sont facturées selon une nomenclature de lettres-clés (ex: `B` en Tunisie/France, `Z` pour certains actes).

### 1.1 Configuration des tarifs
1. Allez dans **Paramètres → Finances → Nomenclatures**.
2. Définissez la valeur actuelle de la lettre-clé (ex: `B = 0.500 DT` ou `B = 0.27 €`).
3. Dans la fiche de chaque test (ex: Glucose), assignez sa valeur nomenclaturée (ex: `B 10`). Le système calculera automatiquement le prix (ex: 5.000 DT).
4. Vous pouvez définir des tarifs "Hors Nomenclature (HN)" avec un prix fixe.

---

## 2. Paiements Patients

Lors de la création d'un dossier patient à l'accueil :

1. Cliquez sur l'onglet **"Facturation"** de l'analyse.
2. Le système affiche le Total à Payer.
3. Enregistrez un encaissement :
   - Sélectionnez le mode de paiement (Espèces, CB, Chèque).
   - Saisissez le montant versé.
   - Si le montant versé est inférieur au total, le dossier passe en statut **"Paiement Incomplet"**.
4. Imprimez le reçu de paiement ou la note d'honoraires globale.

---

## 3. Gestion des Prises en Charge (CNAM)

Lorsqu'un patient est couvert par l'assurance maladie :

### 3.1 Déclaration de la couverture
1. Dans la fiche patient, cochez **"Assuré CNAM"**.
2. Saisissez :
   - Le Numéro d'Assuré Social.
   - Le Code Qualité (Assuré, Conjoint, Enfant).
   - Le taux de prise en charge (ex: 100% APCI, ou Ticket Modérateur).
3. Lors de la facturation, NexLab séparera automatiquement la "Part Patient" et la "Part CNAM".

### 3.2 Génération du Bordereau Mensuel
À la fin du mois, vous devez générer le fichier de télétransmission :
1. Allez dans **Finances → Export CNAM**.
2. Sélectionnez la période (Ex: *Mai 2026*).
3. Le système vérifiera s'il manque des numéros d'assurés ou des codes médecins sur les dossiers concernés (Validation de conformité).
4. Cliquez sur **"Générer le Bordereau"**.
5. Imprimez le Bordereau papier (PDF) et téléchargez le fichier structuré (XML/TXT selon norme locale) pour l'envoyer sur le portail de la CNAM.

---

## 4. Statistiques Financières

Le Dashboard Financier permet au Directeur de piloter l'activité :
- **Chiffre d'Affaires du Jour** (Réel encaissé vs Théorique facturé).
- **Restes à recouvrer** (Liste des patients ayant des impayés).
- **Répartition par prescipteur** (Chiffre d'affaires généré par médecin envoyeur).
- Accès via **Tableau de Bord → Statistiques → Financier**.
