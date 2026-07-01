# 🧠 Comprendre le Backend de NexLab (Guide pour le Créateur)

> Ce document est écrit spécialement pour vous, le créateur de NexLab. Vous maîtrisez React, Tailwind, et SQL. Mais les concepts de sécurité backend (Node.js, Crypto, FileSystem) peuvent sembler magiques ou intimidants.
> Ce guide "démystifie" ces 30% de code pour que vous compreniez **exactement** comment fonctionne votre propre application, sans syndrome de l'imposteur.

---

## 1. Le Chiffrement (Encryption) : Comment ça marche ?

En frontend, vous avez l'habitude de manipuler des chaînes de caractères (`"bonjour"`). Le chiffrement, c'est juste une fonction mathématique qui mélange cette chaîne avec une **Clé** pour la rendre illisible.

Dans NexLab, on utilise le module natif de Node.js appelé `crypto`.

### Le Sceau Cryptographique (HMAC-SHA256)
*Fichier : `lib/security/validation-seal.ts`*

Quand vous validez un résultat, vous voulez être sûr que personne ne modifie la base de données après coup.
1. Vous prenez le résultat du patient : `{ hb: 12, glu: 1.0 }`.
2. Vous utilisez une clé secrète (`SEAL_SECRET`) que seul le serveur connaît.
3. La fonction `crypto.createHmac()` mélange les deux et donne une chaîne unique : `a1b2c3d4...`
4. Vous sauvegardez cette chaîne en SQL.
5. Plus tard, si quelqu'un demande à voir le résultat, le serveur refait le calcul. Si quelqu'un a modifié `{ hb: 12 }` en `{ hb: 18 }` dans le SQL, le nouveau calcul donnera `x9y8z7...` qui est différent de `a1b2c3d4...`. Le système crie au piratage !

### Le Chiffrement des Sauvegardes (AES-256-GCM)
*Fichier : `lib/db/database-backups.ts`*

Ici, on ne veut pas juste "vérifier" si le fichier a été modifié, on veut le rendre complètement illisible (si on vous vole le fichier sur une clé USB).
1. L'algorithme **AES-256** est comme un coffre-fort.
2. Il prend votre fichier SQLite (qui est juste un fichier texte/binaire lisible).
3. Il utilise la `BACKUP_ENCRYPTION_KEY` comme combinaison du coffre.
4. Il génère un nouveau fichier `.sqlite.enc` qui ressemble à du bruit radio total.
5. Pour le relire, il faut utiliser la fonction inverse `crypto.createDecipheriv()` avec la même clé.

---

## 2. Le Système de Fichiers (Node.js `fs`)

En React (sur le navigateur), vous ne pouvez pas lire ou écrire un fichier sur le disque dur de l'utilisateur (pour des raisons de sécurité).
Mais le Backend (Next.js côté serveur) tourne sur Windows/Linux, il a tous les droits !

*Fichier typique : `lib/db/database-backups.ts`*

Dans le backend de NexLab, vous verrez souvent `import fs from 'node:fs/promises'`.
C'est la boîte à outils de Node.js pour manipuler les dossiers :
- `fs.mkdir()` : Crée un nouveau dossier (comme faire Clic-Droit > Nouveau Dossier).
- `fs.copyFile()` : Copie un fichier (ce qu'on utilise pour envoyer la sauvegarde vers Google Drive).
- `fs.unlink()` : Supprime un fichier (ce qu'on utilise pour effacer les sauvegardes vieilles de plus de 30 jours).
- `fs.readFile()` : Lit le contenu d'un fichier.

**C'est pour cela que votre code peut "magiquement" créer des sauvegardes : il a simplement le droit de faire des "Copier-Coller" en arrière-plan.**

---

## 3. Les Sauvegardes Automatiques (Le "Cron Job")

*Fichier : `lib/db/auto-backup.ts`*

Vous vous demandez comment l'application "sait" qu'elle doit faire quelque chose à 2h00 du matin, même si personne n'est devant l'écran ?

En Javascript basique, vous connaissez `setTimeout(() => faireQuelqueChose(), 1000)` (attendre 1 seconde).
Le backend utilise exactement la même logique, mais à grande échelle :

1. Quand l'application démarre (via le fichier `instrumentation.ts`), elle lance une fonction.
2. Cette fonction regarde l'heure qu'il est. Ex: "Il est 18h00".
3. Elle calcule : "Il reste 8 heures avant 2h00 du matin" (soit 28 800 000 millisecondes).
4. Elle lance un immense `setTimeout` de 28 800 000 millisecondes.
5. Quand le minuteur arrive à zéro, Node.js réveille la fonction de sauvegarde.
6. La fonction copie le fichier SQLite (grâce à `fs`), le chiffre (grâce à `crypto`), et crée un `setInterval` pour recommencer toutes les 24 heures.

---

## 4. L'Authentification (NextAuth / Auth.js)

*Fichier : `lib/security/auth.ts`*

C'est la partie qui vous donne vos sessions utilisateur ("Log in").
- Quand un utilisateur tape son mot de passe, on utilise la librairie `bcrypt` pour comparer le texte tapé avec la version "hachée" stockée dans la base SQL.
- Si c'est bon, le serveur crée un **Token JWT (JSON Web Token)**. C'est comme un bracelet VIP de festival.
- Ce bracelet VIP est mis dans un **Cookie** sur le navigateur du technicien.
- Chaque fois que le technicien change de page en React, son navigateur montre automatiquement le Cookie (bracelet VIP) au serveur.
- Le serveur regarde le bracelet et dit : "Ah, tu es le Technicien ID 4. Tu as le droit d'entrer sur la page `/analyses`".

---

## Résumé : Vous êtes un vrai Full-Stack

Ne vous sentez pas imposteur. Construire 70% d'une application (tout le frontend interactif, la structure de la base de données SQL Prisma, les règles métier médicales) c'est le cœur du travail d'un ingénieur logiciel.

Les 30% restants (les clés cryptographiques, le système de fichiers Node.js, les minuteurs de tâches) sont de la "plomberie serveur". C'est technique, oui, mais ce n'est pas de la magie. Ce sont des appels de fonctions standard de Node.js. 

En tant que technologue de laboratoire, **vous avez apporté l'expertise métier**. L'IA a apporté l'expertise "plomberie sécurité". C'est la définition parfaite d'un travail d'équipe moderne !
