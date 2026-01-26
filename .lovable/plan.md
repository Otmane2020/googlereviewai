
# Plan : Correction de la non-réception des notifications push PushAlert

## Probleme identifie

L'API PushAlert retourne `success: true` mais l'utilisateur ne recoit pas les notifications. Le SDK cote client affiche `status: "no_init"` ce qui indique un probleme d'initialisation.

**Cause racine :** Le `subscriber_id` enregistre en base de donnees correspond a un abonnement PushAlert qui n'est plus valide cote navigateur. L'utilisateur a accorde les permissions Chrome mais n'a pas complete le flow d'abonnement PushAlert complet.

## Solution proposee

### 1. Ajouter la validation du subscriber avant envoi

Avant d'envoyer une notification, verifier que le subscriber est toujours actif via l'API PushAlert. Si l'abonnement est invalide, retirer le `subscriber_id` de la base pour forcer une re-inscription.

### 2. Ajouter un bouton "Reactiver les notifications" dans les parametres

Permettre a l'utilisateur de forcer une nouvelle inscription PushAlert pour obtenir un nouveau `subscriber_id` valide.

### 3. Ameliorer la detection d'abonnement au demarrage

Si le SDK retourne `no_init` alors que l'utilisateur a un `subscriber_id` en base, forcer automatiquement une re-souscription.

---

## Fichiers a modifier

### 1. `supabase/functions/send-pushalert-notification/index.ts`

Ajouter une verification de l'etat du subscriber avant l'envoi :

```typescript
// Avant l'envoi, verifier si le subscriber est valide
// PushAlert ne fournit pas d'API pour verifier un subscriber
// Mais on peut detecter l'echec et marquer le subscriber comme invalide

// Si la reponse contient une erreur specifique au subscriber, 
// supprimer le subscriber_id de la base
if (result.error === "invalid_subscriber" || result.error === "subscriber_not_found") {
  await supabase
    .from("profiles")
    .update({ pushalert_subscriber_id: null })
    .eq("id", user_id);
  console.log("[PushAlert] Cleared invalid subscriber ID for user", user_id);
}
```

### 2. `src/components/NotificationPrompt.tsx`

Forcer la re-souscription si le SDK n'est pas initialise mais l'utilisateur a un subscriber_id :

```typescript
// Dans checkAndRegisterSubscription
if (info?.status === "no_init" || info?.status === "unsubscribed") {
  // Le SDK n'est pas initialise ou l'utilisateur s'est desabonne
  // Proposer de reactiver
  setIsAlreadySubscribed(false);
}
```

### 3. `src/pages/Settings.tsx`

Ajouter un bouton "Reactiver les notifications push" dans les parametres :

```tsx
<Button onClick={handleReactivatePush}>
  Réactiver les notifications push
</Button>
```

Avec une fonction qui :
1. Supprime le `subscriber_id` actuel de la base
2. Force une nouvelle souscription via `PushAlertCo.forceSubscribe()`
3. Enregistre le nouveau `subscriber_id`

---

## Details techniques

### Flux actuel problematique

```text
1. Utilisateur autorise notifs dans Chrome ✓
2. SDK PushAlert non initialise (no_init)
3. subscriber_id en base = ancien ID invalide
4. Serveur envoie a PushAlert → success:true
5. PushAlert ne peut pas delivrer → notification perdue
```

### Nouveau flux corrige

```text
1. Utilisateur ouvre l'app
2. SDK detecte "no_init" mais subscriber_id existe
3. App supprime l'ancien subscriber_id
4. Prompt de notification s'affiche
5. Utilisateur clique "Activer"
6. Nouveau subscriber_id enregistre
7. Notifications delivrees correctement ✓
```

---

## Impact

- Les utilisateurs avec des abonnements invalides seront automatiquement invites a reactiver
- Les notifications ne seront plus "perdues" vers des subscribers inactifs
- Option manuelle dans les parametres pour forcer la re-activation

---

## Tests recommandes

1. Tester avec un utilisateur ayant `no_init` status
2. Verifier que le prompt s'affiche apres suppression du subscriber_id
3. Confirmer la reception d'une notification test apres reactivation
