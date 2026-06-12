# 🌡️ Guide Avancé : Suivi des Températures

La traçabilité de la chaîne du froid est une exigence légale et normative absolue (ISO 15189) pour un laboratoire d'analyses médicales. NexLab remplace les feuilles papier scotchées sur les frigos.

## 1. Configuration des Équipements

Avant de commencer les relevés, vous devez enregistrer vos équipements.

1. Allez dans **Tableau de Bord → Températures → Équipements**.
2. Cliquez sur **"Nouvel Équipement"**.
3. Renseignez :
   - **Nom** (ex: *Réfrigérateur Biochimie R1*).
   - **Plage Acceptable** : 
     - Frigo : Min `2.0°C`, Max `8.0°C`
     - Congélateur : Min `-25.0°C`, Max `-18.0°C`
     - Étuve / Ambiante : Min `15.0°C`, Max `25.0°C`
   - **Fréquence requise** : ex: *2 fois par jour (Matin, Soir)*.

---

## 2. Saisir les Relevés (Quotidien)

La tâche apparaît sur le Dashboard d'accueil s'il manque un relevé.

1. Allez dans **Tableau de Bord → Températures → Saisie**.
2. L'interface affiche la liste de tous les frigos.
3. Tapez la température lue sur le thermomètre pour chaque frigo.
4. Appuyez sur **Entrée** pour passer au suivant.
5. Cliquez sur **"Enregistrer tout"**.

> [!TIP]
> **Signature numérique** : Le relevé est automatiquement horodaté et signé au nom de l'utilisateur connecté (Traçabilité parfaite pour l'audit).

---

## 3. Alertes et Actions Correctives

Si vous saisissez une valeur hors des limites définies (ex: `10.5°C` pour un frigo 2-8°C) :

1. Le champ devient **Rouge**.
2. Le système vous **oblige** à remplir la case "Action Corrective".
3. **Exemples d'actions** :
   - *Examen visuel (porte mal fermée)* → Ajustée, attente 30 min.
   - *Panne confirmée* → Déplacement des réactifs vers Frigo R2, appel technicien froid.
   - *Dégivrage en cours*.
4. Une notification d'alarme est envoyée aux Biologistes / Responsables Qualité.

---

## 4. Rapports et Inspections

Lors de la visite d'un auditeur ou d'un inspecteur de la santé, vous pouvez générer le rapport réglementaire en 3 clics :

1. Allez dans **Températures → Rapports**.
2. Sélectionnez l'équipement (ex: *Frigo R1*) et le mois (ex: *Mars 2026*).
3. Cliquez sur **"Imprimer Courbe"**.
4. Le document PDF contiendra :
   - La courbe graphique sur le mois (avec les lignes rouges Min/Max visibles).
   - Le tableau détaillé des signatures (Qui a relevé, quand).
   - Le tableau des incidents et actions correctives prises.
