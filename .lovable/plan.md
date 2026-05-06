## Objectif

Traduire en français les 6 templates email d'authentification utilisés par Starlinko (signup, recovery, magic-link, email-change, invite, reauthentication), puis redéployer la fonction `auth-email-hook` pour que les changements prennent effet.

Les toasts et notifications de l'interface (142 chaînes dans 23 fichiers) ont déjà été traduits dans cette session. Ce plan ne couvre que les emails, qui nécessitent le mode build.

## Ce qui sera modifié

Tous les fichiers dans `supabase/functions/_shared/email-templates/` :

| Template | Sujet (Preview) FR | Titre FR | Bouton FR |
|---|---|---|---|
| `signup.tsx` | « Confirmez votre e-mail pour commencer à être visible sur l'IA » | Confirmez votre e-mail | Vérifier l'e-mail |
| `recovery.tsx` | « Réinitialisez votre mot de passe Starlinko » | Réinitialiser votre mot de passe | Réinitialiser le mot de passe |
| `magic-link.tsx` | « Votre lien de connexion Starlinko » | Connectez-vous à Starlinko | Se connecter |
| `email-change.tsx` | « Confirmez le changement d'e-mail Starlinko » | Confirmez le changement d'e-mail | Confirmer le changement |
| `invite.tsx` | « Vous avez été invité sur Starlinko » | Vous avez été invité | Accepter l'invitation |
| `reauthentication.tsx` | « Votre code de vérification Starlinko » | Confirmez que c'est bien vous | (code OTP) |

Pour chaque template :
- `<Html lang="en">` → `<Html lang="fr">`
- Marque « Ranki.ai » → « Starlinko » dans les textes visibles
- Tous les textes (Preview, Heading, paragraphes, bouton, footer) traduits en français
- Aucun changement de structure, props, ou styles

## Étapes techniques

1. Réécrire chacun des 6 fichiers `.tsx` ci-dessus avec les traductions FR.
2. Redéployer la fonction edge `auth-email-hook` (obligatoire pour que les nouveaux templates soient servis).
3. Confirmer à l'utilisateur que les emails partent désormais en français.

## Hors périmètre

- Aucune modification d'infrastructure email, de domaine, ou de DNS.
- Aucun changement aux toasts UI (déjà traduits).
- Pas de nouveaux templates ni de nouveaux types d'email.
