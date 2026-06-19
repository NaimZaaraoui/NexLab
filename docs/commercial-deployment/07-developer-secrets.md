# NexLab LIMS — Les Secrets du Développeur

> *En tant que créateur et propriétaire du logiciel NexLab, vous possédez ce qu'on appelle la "Propriété Intellectuelle" (IP) et les "Clés Maîtresses". Ce document liste exactement ce que vous ne devez **jamais** donner à un client ou publier sur internet.*

---

## 1. Le Secret de la Licence (CRITIQUE)

**Fichiers concernés :**
- `lib/security/license.ts`
- `scripts/generate-license.js`

Dans ces deux fichiers se trouve une variable extrêmement sensible : `LICENSE_SECRET`. 
C'est la phrase secrète qui vous permet de fabriquer les clés de licence (ex: `'nexlab_super_secret_vendor_key_2026_!@#$'`).

**Pourquoi c'est dangereux ?**
Si quelqu'un découvre cette phrase exacte, il peut créer son propre script `generate-license.js` et générer des licences gratuites "À vie" pour lui-même et pour d'autres laboratoires. Il pourrait même revendre votre logiciel dans votre dos.
**Règle :** Ne montrez jamais cette ligne de code à personne.

---

## 2. Le Fichier `.env` (Environnement de Développement)

**Fichier concerné :** `.env` (à la racine de votre dossier de code source).

**Pourquoi c'est dangereux ?**
Votre fichier `.env` de développement contient potentiellement :
- Vos vrais identifiants de base de données.
- Vos propres clés secrètes `AUTH_SECRET` et `SEAL_SECRET`.
- Vos clés API externes (comme `RESEND_API_KEY` pour l'envoi d'emails). Si un pirate l'obtient, il peut envoyer des millions d'emails spam avec votre compte, et c'est vous qui paierez la facture.

**Règle :** Le fichier `.env` reste toujours sur votre PC personnel. (C'est pour cela qu'il y a un `.env.example` sans les vraies clés pour montrer l'exemple).

---

## 3. Le Code Source Brut (Propriété Intellectuelle)

**Dossiers concernés :** `app/`, `lib/`, `components/`, `prisma/`, `scripts/` (sauf ceux de `nexlab-install`).

Si vous souhaitez garder NexLab comme un logiciel "Propriétaire" (fermé et payant), vous ne devez pas donner votre code source brut.

**Comment le client obtient-il l'application alors ?**
Vous ne donnez au client **que le dossier `nexlab-install/`**.
Ce dossier contient `nexlab-image.tar`. Ce fichier `.tar` est la version "compilée" et fermée de votre application. Le code source à l'intérieur a été transformé par Next.js en code machine/binaire optimisé, illisible pour un humain. Le client peut exécuter l'application, mais il ne peut pas voler votre architecture ou lire vos algorithmes médicaux.

---

## 4. Le Script de Génération de Clés

**Fichier concerné :** `scripts/generate-keys.js` et `scripts/generate-license.js`

**Règle :** Ces scripts sont vos "outils de serrurier". Vous les gardez sur votre ordinateur. Vous ne les copiez pas sur le serveur du client. Vous exécutez ces scripts chez vous, vous notez le résultat sur un bout de papier ou une clé USB, et vous allez chez le client pour coller uniquement le *résultat* dans son fichier `.env`.

---

## Résumé : Ce qui va chez le client vs Ce qui reste chez vous

| Élément | Reste chez le Développeur (Vous) | Va chez le Client |
|---|:---:|:---:|
| Le code source (`app/`, `lib/`...) | 🔴 **OUI** | ❌ NON |
| `LICENSE_SECRET` (la phrase clé) | 🔴 **OUI** | ❌ NON |
| `scripts/generate-license.js` | 🔴 **OUI** | ❌ NON |
| Votre fichier `.env` de développement | 🔴 **OUI** | ❌ NON |
| Le dossier `nexlab-install/` | 🔴 OUI (pour préparer) | ✅ **OUI** (C'est ce que vous livrez) |
| Le fichier `nexlab-image.tar` | 🔴 OUI | ✅ **OUI** |
| Le JWT (la longue clé de licence finale) | 🔴 OUI (pour vos archives) | ✅ **OUI** (Il l'entre dans l'interface) |
