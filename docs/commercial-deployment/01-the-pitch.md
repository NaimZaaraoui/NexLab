# NexLab LIMS — Le Discours Commercial (Votre "Pitch")

> *Ce document vous prépare à votre première réunion avec un directeur de laboratoire ou un biologiste chef. Votre avantage principal : vous êtes un professionnel du laboratoire, pas juste un informaticien.*

---

## 1. La définition de NexLab (Ce qu'il faut dire)

**Ne dites jamais :** *"C'est une application React/Node.js..."* — Le client s'en moque.

**Dites :**
> *"NexLab est un LIMS — Logiciel de Gestion d'Informations de Laboratoire — nouvelle génération, conçu spécifiquement pour les CSSB tunisiens. Il numérise et sécurise l'intégralité du flux de travail : de l'accueil du patient jusqu'à l'impression du bilan, en passant par la saisie technique, la validation biologique, la gestion du stock de réactifs, le contrôle qualité, et la traçabilité des températures. Il fonctionne en réseau local — sans besoin d'internet — et inclut un système de sauvegarde automatique chiffré."*

---

## 2. Votre Plus Grand Avantage Concurrentiel

Les éditeurs classiques font vendre leur logiciel par des commerciaux qui n'ont jamais mis les pieds dans un labo. **Vous, oui.** Utilisez cela.

**Discours à tenir :**
> *"J'ai travaillé comme technologue de laboratoire. J'ai vécu les feuilles volantes, les re-saisies, le chrono qui tourne entre l'accueil et la remise du bilan. J'ai conçu NexLab en pensant à chaque geste du technicien : la touche Entrée passe au champ suivant, les calculs d'hématologie se font tout seuls, les Delta Checks apparaissent sans manipulation. Ce n'est pas un logiciel fait par des informaticiens pour des informaticiens — c'est un outil fait par un technicien, pour des techniciens."*

---

## 3. Réponses aux 5 Objections Courantes

### ❓ "On a peur de perdre nos données si l'ordinateur tombe en panne."
> *"NexLab fait une sauvegarde chiffrée chaque nuit à 2h du matin, et peut la synchroniser automatiquement avec Google Drive. Si l'ordinateur brûle ou est volé, on installe une nouvelle machine, on télécharge le fichier depuis votre Gmail, et le labo reprend en 10 minutes — sans perdre une seule analyse."*

### ❓ "Un logiciel local, ça veut dire qu'on est coincé avec votre version pour toujours ?"
> *"Non. Les mises à jour se font via un simple script : je vous fournis un nouveau fichier sur clé USB, vous lancez une commande, et NexLab se met à jour en gardant toutes vos données. Prisma s'occupe automatiquement des migrations de base de données."*

### ❓ "Comment on sait qu'un résultat n'a pas été falsifié après sa validation ?"
> *"NexLab applique un sceau cryptographique (HMAC-SHA256) à chaque bilan au moment de la validation biologique. Si quiconque modifie une valeur dans la base de données après la signature, le système affiche une alerte de falsification. C'est la garantie médico-légale."*

### ❓ "Et si internet coupe ?"
> *"Le logiciel tourne entièrement en réseau local. Coupure internet = zéro impact sur le travail du labo. Internet n'est utilisé que pour la sauvegarde nocturne vers Google Drive."*

### ❓ "Quel est votre support en cas de problème ?"
> *"Je suis le créateur du logiciel, pas un centre d'appel. Vous m'appelez directement. Et comme je connais chaque ligne du code, je peux résoudre 95% des problèmes à distance en quelques minutes."*

---

## 4. Ce Que Vous Proposez

- **Installation initiale :** Configuration complète sur le PC serveur du labo, formation du personnel, remise des identifiants.
- **Contrat de maintenance annuelle :** Assistance téléphonique, vérification mensuelle des sauvegardes, mises à jour logicielles livrées sur clé USB.
- **Données appartenant au client :** La base de données (fichier SQLite standard) leur appartient. Ils peuvent récupérer leurs données à tout moment, sans être "otages" de votre abonnement.
- **Confidentialité absolue :** Aucune donnée patient ne quitte l'enceinte du laboratoire sauf pour les sauvegardes Google Drive, qui sont illisibles sans la clé de chiffrement que seul le directeur possède.
