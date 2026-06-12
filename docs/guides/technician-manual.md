# 📚 NexLab LIMS — Manuel du Technicien de Laboratoire

> **Version**: 1.0  
> **Date**: Juin 2026  
> **Langue**: Français  
> **Audience**: Techniciens, Préleveurs, Secrétaires Médicales

---

## 📖 Table des Matières

1. [Démarrage Rapide](#démarrage-rapide)
2. [L'Interface Principale](#linterface-principale)
3. [Enregistrer un Patient](#enregistrer-un-patient)
4. [Saisir les Résultats](#saisir-les-résultats)
5. [Valider une Analyse](#valider-une-analyse)
6. [Imprimer les Rapports](#imprimer-les-rapports)
7. [Raccourcis Clavier](#raccourcis-clavier)
8. [Gestion des Erreurs](#gestion-des-erreurs)
9. [Questions Fréquentes](#questions-fréquentes)
10. [Support & Contacts](#support--contacts)

---

## 🚀 Démarrage Rapide

### Première Connexion

**Étapes** :
1. Ouvrez votre navigateur : `http://localhost:3000` (ou l'adresse donnée par l'IT)
2. Entrez vos identifiants :
   - **Email** : prenom.nom@nexlab.local
   - **Mot de passe** : celui fourni par l'IT
3. Cliquez sur **"Connexion"**

**Écran d'accueil** :
- Dashboard avec les analyses du jour
- Vue d'ensemble des activités
- Alertes importantes (si problème)

---

### Changement de Mot de Passe (Première Fois)

**Étapes** :
1. Cliquez sur votre **nom** (en haut à droite)
2. Sélectionnez **"Changer le mot de passe"**
3. Entrez :
   - Ancien mot de passe
   - Nouveau mot de passe (au moins 8 caractères)
   - Confirmation du nouveau mot de passe
4. Cliquez **"Enregistrer"**

**Conseils Sécurité** :
- Utilisez un mot de passe fort (chiffres + lettres + symboles)
- Ne partagez votre mot de passe avec personne
- Changez-le tous les 3 mois

---

## 🎨 L'Interface Principale

### Vue d'ensemble

```
┌─────────────────────────────────────────────────────┐
│  Logo NexLab    [Accueil] [Analyses] [Patients]... │
│                                    [Votre nom] ⚙️  │
├─────────────────────────────────────────────────────┤
│  Tableau de Bord                                    │
│                                                     │
│  📊 Analyses du jour         🔔 Alertes             │
│  ├─ En cours: 5              ├─ Pas d'erreurs      │
│  ├─ En attente: 12           └─ Tous les QC OK     │
│  └─ Validées: 28                                   │
│                                                     │
│  🌡️ Température Frigo        📦 Inventaire         │
│  ├─ 4°C ✅                    ├─ Stock OK           │
│  └─ Dernière vérification:    └─ Réactifs: 95%     │
│     14:30                                          │
└─────────────────────────────────────────────────────┘
```

### Les Menus Principaux

| Menu | Fonction | Utilisez Si |
|------|----------|-------------|
| **Analyses** | Gérer les analyses | Vous devez entrer/valider des résultats |
| **Patients** | Liste des patients | Vous cherchez un patient existant |
| **Bilans** | Voir les résultats finaux | Vous devez imprimer un rapport |
| **QC** | Contrôle qualité | Vous faites le QC du jour |
| **Inventaire** | Stock des réactifs | Stock bas, besoin de commander |
| **Paramètres** | Configurations | Vous êtes Admin (pas pour vous normalement) |

---

## 👤 Enregistrer un Patient

### Cas 1 : Patient Nouveau (Jamais Vu)

**Étapes** :
1. Allez à **Analyses** → **Nouvelle Analyse**
2. Cliquez **"Nouveau Patient"** (ou cherchez d'abord)
3. Remplissez les champs :
   - ✅ **Nom** : (obligatoire)
   - ✅ **Prénom** : (obligatoire)
   - ✅ **Date de naissance** : (obligatoire pour calculs eGFR enfants/ados)
   - ✅ **Genre** : M / F / Autre
   - ⏳ **Téléphone** : (optionnel)
   - ⏳ **Adresse** : (optionnel)
   - ⏳ **Email** : (optionnel)

4. Cliquez **"Créer et Continuer"**
5. Système crée automatiquement l'ID patient

**Exemple** :
```
Nom : AHMED
Prénom : Mohamed
Date de naissance : 15/03/1985
Genre : M
ID créé automatiquement : PAT-2026-0001234
```

---

### Cas 2 : Patient Existant

**Étapes** :
1. Allez à **Analyses** → **Nouvelle Analyse**
2. Dans **"Chercher le patient"**, tapez :
   - Nom du patient : `AHMED`
   - Ou prénom : `Mohamed`
   - Ou son ID : `PAT-2026-0001234`
3. Système affiche les correspondances
4. Cliquez sur le patient correct
5. Ses infos s'affichent (vérifiez !)

**Important** :
- ⚠️ Vérifiez TOUJOURS la date de naissance
- ⚠️ Si doute → demandez au patient
- ❌ Ne pas créer de doublon

---

## 📊 Saisir les Résultats

### Sélectionner les Tests à Faire

**Étapes** :
1. Patient trouvé/créé
2. Cliquez **"Ajouter des Tests"**
3. Choisissez les analyses :
   - ☑️ Hématologie Complète (NFS)
   - ☑️ Biochimie (urée, créatinine, glucose, etc.)
   - ☑️ Sérologie (HIV, Hep B, etc.)
   - Etc.

4. Cliquez **"Ajouter"**

### Saisir Les Valeurs

**Écran de saisie** :
```
NFS Complète - Patient: AHMED Mohamed (PAT-2026-0001234)

┌──────────────────────────────────┐
│ Résultats Hématologie            │
├──────────────────────────────────┤
│ Hémoglobine (g/dL)      [13.5 ] │ ← Entrez la valeur
│ Hématocrite (%)         [40.2 ] │    (signe ↑↓ si anormal)
│ Globules Rouges (M/µL)  [4.8  ] │
│ Globules Blancs (K/µL)  [7.2  ] │
│ Plaquettes (K/µL)       [245  ] │
│                                  │
│  ← Résultat précédent            │ Delta check
│  [Hémoglobine: 13.2 → maintenant 13.5] │
│                                  │
│ [Enregistrer] [Annuler]         │
└──────────────────────────────────┘
```

**Comment Remplir** :

1. **Cliquez dans le champ** → curseur apparaît
2. **Tapez la valeur** : ex: `13.5`
3. **Appuyez sur Entrée** → passe au test suivant
4. **Système calcule automatiquement** :
   - VGM (Volume Globulaire Moyen)
   - TGMH (Teneur Globulaire Moyenne Hémoglobine)
   - CCMH (Concentration Corpusculaire Moyenne Hémoglobine)

**Drapeau de Valeurs Anormales** :
- 🔴 **↑ HAUT** = valeur au-dessus de la limite normale
- 🔵 **↓ BAS** = valeur en-dessous de la limite normale
- ⚪ **Normal** = dans les limites

**Exemple** :
```
Hémoglobine: 13.5 g/dL → 🟢 Normal (normal: 12-16 pour femmes)
Globules Blancs: 12.5 K/µL → 🔴 ↑ Élevé (normal: 4.5-11)
```

### Delta Check (Résultat Précédent)

**C'est quoi** ?
- Le système affiche l'**analyse précédente du patient**
- Permet de détecter les **variations anormales**

**Exemple** :
```
Hémoglobine précédente (15/05/2026) : 13.2 g/dL
Hémoglobine actuelle                 : 13.5 g/dL
Variation                             : +0.3 (normal) ✅

VS

Hémoglobine précédente (15/05/2026) : 13.2 g/dL
Hémoglobine actuelle                 : 6.8 g/dL
Variation                             : -6.4 (ANORMAL ⚠️) 
→ Refaire le test ou demander au médecin
```

---

## ✅ Valider une Analyse

### Étape 1 : Vérifier Les Résultats

**Avant validation** :
1. ✅ Tous les tests sont remplis ?
2. ✅ Les valeurs anormales ont-elles du sens ?
3. ✅ Les flags (↑↓) sont-ils justes ?
4. ✅ Pas de delta check alarmant ?

### Étape 2 : Valider Techniquement

**Étapes** :
1. Allez à **Analyses** → **Analyses à Valider (Tech)**
2. Cherchez votre patient/analyse
3. Cliquez sur l'analyse
4. **VÉRIFIEZ** tous les résultats à l'écran
5. Si tout OK → Cliquez **"Valider (Tech)"**
6. Saisissez votre **nom** (confirmation)
7. Cliquez **"Confirmer"**

**Résultat** :
- ✅ État change à **"Attente Validation Bio"**
- ⏰ Attendez le biologiste/médecin

### Étape 3 : Validation Biologiste (Pas Vous)

- Le **Biologiste (Médecin)** reçoit l'analyse
- Il vérifie l'interprétation clinique
- Il **valide ou rejette** l'analyse
- Si rejeté → vous le verrez dans **"À Corriger"**

---

## 🖨️ Imprimer les Rapports

### Quand Imprimer ?

**L'analyse doit être** :
- ✅ Entièrement validée (tech + bio)
- ✅ État : **"Validée"**
- ✅ Rapport disponible

### Comment Imprimer

**Étapes** :
1. Allez à **Bilans** → **Analyses Validées**
2. Cherchez le patient : `AHMED Mohamed`
3. Cliquez sur l'analyse
4. Cliquez **"Imprimer le Rapport"**
5. **Aperçu PDF** s'affiche
6. Cliquez **"Imprimer"** (Ctrl+P)

### Options d'Impression

```
┌──────────────────────────┐
│ Imprimer le Rapport      │
├──────────────────────────┤
│ Destination              │
│ ○ Imprimante labo        │
│ ○ PDF (enregistrer)      │
│ ○ Email au patient       │
│                          │
│ [Imprimer] [Annuler]    │
└──────────────────────────┘
```

**Conseil** :
- Imprimez 1 copie pour le dossier patient
- Imprimez 1 copie pour le médecin/patient
- Gardez un PDF en archivage

---

## ⌨️ Raccourcis Clavier

### Navigation Rapide

| Raccourci | Fonction |
|-----------|----------|
| `Ctrl+N` | Nouvelle analyse |
| `Ctrl+S` | Enregistrer |
| `Ctrl+P` | Imprimer |
| `Ctrl+F` | Chercher patient |
| `Ctrl+Q` | Quitter/Logout |

### Saisie des Résultats

| Raccourci | Fonction |
|-----------|----------|
| `Entrée` | Aller au test suivant |
| `Maj+Entrée` | Aller au test précédent |
| `Tab` | Passer au test suivant |
| `Maj+Tab` | Passer au test précédent |
| `Esc` | Annuler la saisie |

### Validation

| Raccourci | Fonction |
|-----------|----------|
| `Ctrl+V` | Valider l'analyse |
| `Ctrl+R` | Rejeter/Corriger |

**Astuce Rapide** :
- Saisissez 30+ résultats SANS SOURIS
- Utilisez surtout **Entrée** pour passer d'un test à l'autre
- Beaucoup plus rapide ! ⚡

---

## ⚠️ Gestion des Erreurs

### Erreur 1 : "Patient Non Trouvé"

**Cause** : Patient n'existe pas dans le système

**Solution** :
1. Vérifiez l'**orthographe** du nom
2. Essayez le **prénom** seul
3. Cherchez par **date de naissance**
4. Si toujours pas trouvé → **créer le patient**

---

### Erreur 2 : "Résultat Invalide"

**Cause** : Valeur en dehors des limites acceptées (ex: Hémoglobine = 999)

**Solution** :
1. **Vérifiez la valeur saisie** :
   - Avez-vous mis un point au lieu d'une virgule ?
   - Avez-vous oublié un chiffre ?
2. **Corrigez** : Cliquez sur le champ, effacez, retapez
3. **Validez de nouveau**

---

### Erreur 3 : "Analyse Déjà Validée"

**Cause** : Vous essayez de modifier une analyse validée

**Solution** :
- ❌ Vous **ne pouvez pas** modifier une analyse validée
- ✅ **Créez une nouvelle analyse** pour le même patient
- 📞 Ou contactez le **biologiste** pour un rejet

---

### Erreur 4 : "Session Expirée"

**Cause** : Vous vous êtes déconnecté ou l'app a besoin de se reconnecter

**Solution** :
1. Cliquez **"Se Reconnecter"**
2. Entrez vos identifiants
3. Les données sont sauvegardées → aucune perte

---

### Erreur 5 : "Impossible d'Imprimer"

**Cause** : Imprimante non connectée ou PDF bloqué

**Solution** :
1. **Vérifiez** que l'imprimante est allumée et connectée
2. Essayez d'**enregistrer en PDF** d'abord
3. Puis imprimez à partir du fichier PDF
4. Si toujours bloqué → contactez l'IT

---

## ❓ Questions Fréquentes

### Q1 : À quelle fréquence dois-je me reconnecter ?

**R** : 
- Normalement : pas besoin, session dure plusieurs heures
- Si inactif > 30 min → déconnexion auto (sécurité)
- Cliquez "Se Reconnecter"

---

### Q2 : Puis-je utiliser mon téléphone/tablette ?

**R** :
- Oui, NexLab fonctionne sur **tous les appareils**
- Desktop : **meilleur expérience**
- Tablette : **bon pour consulter**
- Téléphone : **possible mais petit écran**

---

### Q3 : Que faire si le patient refuse de donner son adresse ?

**R** :
- Adresse/Téléphone/Email sont **optionnels**
- Remplissez seulement : Nom, Prénom, Date de naissance
- Vous pouvez ajouter l'adresse plus tard

---

### Q4 : Comment savoir si un résultat est anormal ?

**R** :
- 🔴 **Drapeau ↑** = valeur **trop haute**
- 🔵 **Drapeau ↓** = valeur **trop basse**
- ⚪ **Pas de drapeau** = normal
- **NexLab compare** avec les limites de référence du labo

---

### Q5 : Puis-je imprimer plusieurs rapports à la fois ?

**R** :
- Non, un à la fois
- **Astuce** : Impression rapide
  1. Validez l'analyse
  2. Cliquez "Imprimer"
  3. Passez au patient suivant

---

### Q6 : Que faire si je fais une erreur en saisissant ?

**R** :
- **Avant validation** → Corrigez simplement
- **Après validation tech** → Contactez le **biologiste** pour rejet
- **Après validation bio** → ❌ Impossibilité de modifier (par sécurité légale)

---

### Q7 : Comment accéder à l'historique d'un patient ?

**R** :
1. Allez à **Patients**
2. Cherchez le patient
3. Cliquez sur son nom
4. Onglet **"Historique des Analyses"**
5. Vous voyez toutes ses analyses précédentes

---

### Q8 : Est-ce que mes données sont sauvegardées ?

**R** :
- ✅ **OUI**, automatiquement
- Chaque saisie est sauvegardée immédiatement
- Si crash app → pas de perte de données
- Sauvegarde quotidienne automatique

---

### Q9 : Puis-je voir le rapport avant d'imprimer ?

**R** :
- ✅ Oui, cliquez **"Aperçu du Rapport"**
- Vous voyez exact comment ça va s'imprimer
- Vous pouvez corriger avant d'imprimer

---

### Q10 : Que signifie "État : En Cours" ?

**R** :
```
États possibles :
├─ Pending (En attente)    = Créée mais pas complète
├─ In Progress (En cours)  = Vous saisissez les résultats
├─ Validated (Tech)        = Tech a validé, attente médecin
├─ Validated (Bio)         = Complètement validée ✅
├─ Reject (Rejet)          = Erreur trouvée, à refaire
└─ Archive                 = Ancienne (archivée)
```

---

## 📞 Support & Contacts

### Problème Urgent (Pendant Horaires Labo)

**📞 Contactez l'IT** :
- Nom : [À remplir]
- Email : [À remplir]
- Téléphone : [À remplir]

**En personne** :
- Bureau IT : [À remplir]
- Heures : 08:00 - 17:00

---

### Problème Non-Urgent

**📧 Email** :
- support@nexlab.io
- Décrivez le problème
- Attachez une capture d'écran si possible
- Réponse : 24h

---

### Formation / Aide

**📚 Ressources** :
- Ce manuel : imprimez-le
- Vidéos tutoriels : [À ajouter URL]
- Chat support : [À ajouter]

---

### Signaler un Problème

**Quoi signaler** :
- ✅ Message d'erreur
- ✅ Ce que vous faisiez quand ça s'est produit
- ✅ Capture d'écran de l'erreur
- ✅ Heure du problème

**Comment** :
- Chat dans l'app (bouton **?** en bas à droite)
- Email : support@nexlab.io
- Appelez l'IT

---

## 🎓 Conseils Pratiques

### Pour Augmenter Votre Productivité

1. **Utilisez les raccourcis clavier** ⚡
   - Entrée pour naviguer entre les tests
   - Beaucoup plus rapide qu'à la souris
   
2. **Regroupez les patients similaires** 📋
   - Tous les NFS ensemble
   - Tous les bio ensemble
   - Moins de changements de contexte

3. **Vérifiez les deltas** 🔍
   - Les résultats précédents sont affichés
   - Détectez les variations bizarres immédiatement

4. **Validez régulièrement** ✅
   - Ne laissez pas s'accumuler
   - Validez le jour-même

5. **Imprimez à la fin du jour** 🖨️
   - Toutes les analyses validées ensemble
   - Moins de trajet à l'imprimante

---

## 📋 Checklist Journalière

**Matin (8:00)** :
- [ ] Connectez-vous
- [ ] Vérifiez les QC du jour
- [ ] Consultez les analyses en attente

**Pendant la journée** :
- [ ] Saisissez les résultats quand ils arrivent
- [ ] Validez régulièrement (tech)
- [ ] Attendez le biologiste (validation bio)

**Fin de journée (17:00)** :
- [ ] Validez les dernières analyses
- [ ] Imprimez les rapports finaux
- [ ] Archivez les dossiers
- [ ] Déconnectez-vous

---

## 📞 Numéros Utiles

| Service | Téléphone | Email |
|---------|-----------|-------|
| IT Support | [À ajouter] | support@nexlab.io |
| Labo (standard) | [À ajouter] | - |
| Directeur | [À ajouter] | - |
| Sécurité | [À ajouter] | - |

---

## 🔒 Sécurité & Confidentialité

**Important** :
- ❌ Ne laissez jamais votre ordinateur déverrouillé
- ❌ Ne partagez pas votre mot de passe
- ❌ Ne prenez pas de photos des écrans patients
- ✅ Logout quand vous terminez votre journée
- ✅ Signalez tout accès suspect

---

## 📝 Notes & Retours

**Avez-vous des suggestions** ?
- Écrivez un email à : feedback@nexlab.io
- Ou parlez à l'IT directement
- **Vos retours nous aident à améliorer!**

---

**Version 1.0 - Juin 2026**  
**Prochaine mise à jour : Décembre 2026**  
**Questions ?** support@nexlab.io


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
