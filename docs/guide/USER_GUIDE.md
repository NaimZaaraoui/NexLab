# Guide Utilisateur NexLab LIMS

## Rôles et permissions

| Rôle | Accès |
|------|-------|
| **Administrateur** | Configuration complète, gestion utilisateurs |
| **Biologiste** | Validation biologique, consultation tous modules |
| **Technicien** | Saisie résultats, validation technique |
| **Réceptionniste** | Gestion patients, création analyses, facturation |

---

## Flux de travail quotidien

### 1. Enregistrer un patient

`Dashboard → Patients → Nouveau Patient`

Saisir : Nom, Prénom, Date de naissance, Sexe, Contact.

### 2. Créer une analyse

`Dashboard → Analyses → Nouvelle Analyse`

- Sélectionner le patient
- Choisir les examens demandés
- Renseigner le médecin prescripteur (optionnel)

### 3. Saisir les résultats

Dans la fiche analyse, cliquer sur **Saisir les résultats**.

> **Navigation rapide** : La touche `Entrée` passe au champ suivant.
> Les indices hématologiques (VGM, TGMH, CCMH) se calculent automatiquement.

### 4. Valider

| Étape | Responsable | Actions |
|-------|-------------|---------|
| Validation Technique | Technicien | Vérifie la cohérence des résultats |
| Validation Biologique | Biologiste | Signature finale du rapport |

> Les boutons de validation sont volontairement placés **en bas de page** pour forcer la lecture complète des résultats.

### 5. Imprimer le rapport

Après validation biologique → bouton **Imprimer** → aperçu A4 → lancer l'impression.

### 6. Facturation

`Finances → Paiements` ou directement depuis la fiche analyse.

---

## Contrôle Qualité (QC)

Un résultat QC hors-normes **bloque automatiquement** la validation des analyses du jour.

`QC → Nouveau Contrôle → Saisir les valeurs → Valider`

---

## Impressions disponibles

| Document | Accès |
|---------|-------|
| Rapport d'analyse A4 | Fiche analyse → Imprimer |
| Fiche patient A4 | Fiche patient → Fiche Patient |
| Facture | Paiement → Imprimer facture |
| Étiquettes tubes | Fiche analyse → Étiquettes |

---
*Voir aussi : [Guide Administrateur](ADMIN_GUIDE.md)*
