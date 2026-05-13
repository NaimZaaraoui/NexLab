# Guide Administrateur NexLab LIMS

## Configuration initiale

Accessible via `Paramètres` dans le menu principal.

### Identité du laboratoire

| Champ | Description |
|-------|-------------|
| Nom du laboratoire | Affiché sur tous les rapports |
| Sous-titre | Ex : "Centre de Santé de Services de Base" |
| Adresse | Apparaît dans les rapports et factures |
| Téléphone / Email | Coordonnées de contact |
| Logo | Format PNG/JPG, fond transparent recommandé |

### Signature & Cachet

| Champ | Description |
|-------|-------------|
| Signature biologiste | Image PNG/JPG (fond blanc ou transparent) |
| Cachet du laboratoire | Image PNG ronde recommandée |
| Nom / Titre biologiste | Affiché sous la signature |
| N° ONMPT | Numéro d'ordre professionnel |

Ces éléments apparaissent sur **tous les rapports et fiches patients**.

### Paramètres d'impression

| Option | Description |
|--------|-------------|
| Code-barres | Afficher/masquer le QR code sur les rapports |
| Résultat précédent | Afficher la colonne "Préc." dans les rapports |

---

## Gestion des utilisateurs

`Paramètres → Utilisateurs → Ajouter`

- Assigner un rôle (Admin / Biologiste / Technicien / Réceptionniste)
- Définir un mot de passe temporaire
- L'utilisateur le change à la première connexion

---

## Sauvegarde & Restauration

### Sauvegarde manuelle

`Paramètres → Sauvegarde → Télécharger`

Génère un fichier `.sql` contenant toutes les données.

### Restauration

`Paramètres → Sauvegarde → Restaurer → Sélectionner le fichier`

> ⚠️ La restauration écrase les données actuelles. Faites une sauvegarde avant.

### Fréquence recommandée

- **Quotidienne** : export automatique sur clé USB ou réseau partagé
- **Hebdomadaire** : copie hors-site (cloud personnel ou disque externe)

---

## Gestion des examens (catalogue tests)

`Paramètres → Catalogue → Tests`

- Créer des catégories (Biochimie, Hématologie, Microbiologie…)
- Ajouter des tests avec unités, valeurs de référence par sexe/âge
- Créer des groupes (ex : NFS = GB + GR + Hb + Ht + Plaquettes…)

---

## Gestion des stocks (Inventaire)

`Inventaire → Réactifs`

- Suivre les niveaux de stock
- Configurer les seuils d'alerte
- Enregistrer les consommations par analyse

---

## Audit et traçabilité

`Audit → Journal`

Toutes les actions critiques sont journalisées :
- Connexions/déconnexions
- Validations et modifications de résultats
- Modifications de paramètres

---
*Voir aussi : [Guide Utilisateur](USER_GUIDE.md) | [Guide Installation](INSTALLATION.md)*
