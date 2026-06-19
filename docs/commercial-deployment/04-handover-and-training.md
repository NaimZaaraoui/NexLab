# NexLab LIMS — La Livraison et la Formation (Le "Handover")

> *L'installation est terminée, la licence est activée. Voici comment clôturer l'intervention de manière professionnelle et établir une relation de confiance durable avec le client.*

---

## 1. Ce qu'il Faut Remettre au Directeur

Préparez une **pochette cartonnée** (imprimez le logo NexLab dessus si possible) remise en main propre au Directeur ou au Biologiste en chef. Elle doit contenir :

### 1.1 La Fiche "Identifiants Administrateur"

Imprimez et remplissez à la main :
```
URL d'accès NexLab : http://[IP_DU_SERVEUR]
Email Administrateur : [ex: admin@labo.tn]
Mot de passe initial : [à changer à la première connexion]
```

### 1.2 Le "Document des Secrets de Sécurité" (CRITIQUE !)

Imprimez le contenu du fichier `.env` **de leur installation**. Entourez en rouge les lignes suivantes et annotez-les :

- **`SEAL_SECRET`** → *"Sceau des bilans validés. Si perdu, les anciens bilans sont considérés comme non authentiques. À mettre au coffre-fort."*
- **`BACKUP_ENCRYPTION_KEY`** → *"Clé du coffre des sauvegardes. Sans elle, les sauvegardes sont illisibles. À conserver hors du laboratoire (bureau du directeur, domicile)."*

**Dites-leur verbalement :**
> *"Ce papier est l'équivalent du code d'accès à votre coffre-fort bancaire. Si vous le perdez et que votre serveur tombe en panne, personne — y compris moi — ne pourra récupérer les données. Traitez-le comme vos clés de labo."*

### 1.3 Le Machine ID

Notez le Machine ID de leur installation (visible dans Paramètres → Licence). Gardez-en une copie de votre côté aussi pour les renouvellements futurs.

---

## 2. La Formation du Personnel (2-3 heures)

### Session 1 : Les Techniciens (Saisie et résultats)

Faites-les saisir un dossier complet en temps réel. Montrez :

- **La navigation au clavier** : Pavé numérique + Touche Entrée. Chronométrez la saisie d'un NFS complet sans souris — ils seront bluffés.
- **Les calculs automatiques** : Saisissez Ht et GR, le VGM/TGMH/CCMH se calculent tout seuls.
- **Le Delta Check** : Créez un second dossier pour un patient déjà dans le système, montrez que l'ancien résultat apparaît automatiquement à côté du nouveau.
- **La validation technique** vs **la validation biologique** : Expliquez la chaîne de responsabilité.

### Session 2 : Le Biologiste (Validation)

- Montrez l'écran de validation.
- Expliquez le **sceau cryptographique** : *"Quand vous cliquez Valider, votre signature est scellée mathématiquement. Toute modification ultérieure déclencherait une alerte de falsification."*
- Montrez comment imprimer un bilan depuis NexLab.

### Session 3 : L'Administrateur (Paramètres)

- Création / désactivation de comptes utilisateurs.
- Impression du bilan avec logo et signature.
- La page **Paramètres → Base de données → Sauvegardes** : montrez la liste des sauvegardes, et comment en télécharger une manuellement.
- La page **Paramètres → Licence** : montrez où se trouve le Machine ID pour les futurs renouvellements.

---

## 3. Ce que Vous Gardez de Votre Côté

Dans votre propre fichier de suivi client, notez :
- Le nom du laboratoire et l'adresse
- Le Machine ID de l'installation
- La date d'installation et la date d'expiration de la licence
- Les coordonnées du directeur (pour le renouvellement)
- L'adresse IP du serveur (pour les interventions à distance)

---

## 4. Le Contrat Commercial (Ce que vous signez)

Proposez un document simple contenant :

1. **Objet :** Installation et configuration du LIMS NexLab version X.
2. **Propriété des données :** Les données cliniques (base de données SQLite) appartiennent au client. NexLab ne collecte aucune donnée sur ses serveurs.
3. **Maintenance annuelle :** Comprend X interventions téléphoniques, vérification annuelle de l'état des sauvegardes, mise à jour logicielle vers les nouvelles versions.
4. **Licence :** Valide jusqu'au [DATE]. Renouvellement obligatoire pour continuer à créer de nouvelles analyses.
5. **Responsabilités client :** Conserver les secrets cryptographiques dans un lieu sécurisé, maintenir le serveur allumé pour les sauvegardes nocturnes.
