

## Diagnostic : Pourquoi les push notifications VAPID ne sont jamais reçues

### Problèmes identifiés

**1. Aucun abonnement en base de données**
La table `push_subscriptions` est **vide** (0 lignes). Aucun utilisateur n'a jamais réussi à s'abonner aux notifications push. Sans abonnement enregistré, aucune notification ne peut être envoyée.

**2. Implémentation crypto incorrecte dans `send-push-notification`**
Le code d'envoi Web Push a plusieurs bugs critiques :

- **JWK mal construit (ligne 52-53)** : Le code fait `vapidPublicKey.slice(0, 43)` et `.slice(43)` pour extraire x/y du public key. Mais la clé publique VAPID en base64url fait 87 caractères (65 bytes non compressés avec préfixe 0x04). Il faut d'abord décoder, retirer le byte 0x04, puis séparer en x (32 bytes) et y (32 bytes).

- **Payload non chiffré (ligne 202)** : Le commentaire dit "send without encryption first" et envoie le JSON en clair. **Les push services (FCM, Mozilla) rejettent les payloads non chiffrés** — ils exigent `Content-Encoding: aes128gcm`. C'est la raison principale pour laquelle les notifications échouent silencieusement.

- **Content-Type incorrect** : Le header `Content-Type: application/json` devrait être `application/octet-stream` pour un payload chiffré.

**3. Aucun log d'exécution**
Les fonctions `send-push-notification` et `test-push-notification` n'ont **aucun log**, ce qui confirme qu'elles n'ont jamais été appelées (ou que l'appel échoue avant d'atteindre ces fonctions).

### Plan de correction

#### Etape 1 — Utiliser la librairie `web-push` au lieu d'une crypto maison
Remplacer toute l'implémentation crypto manuelle dans `send-push-notification` par la librairie NPM `web-push` disponible via esm.sh. Cette librairie gère correctement :
- La signature VAPID JWT (ECDSA P-256)
- Le chiffrement aes128gcm du payload
- Les headers corrects (Content-Encoding, Crypto-Key, TTL, etc.)

#### Etape 2 — Vérifier le format des clés VAPID stockées
S'assurer que `VAPID_PUBLIC_KEY` et `VAPID_PRIVATE_KEY` sont au bon format (base64url, 65 bytes pour public, 32 bytes pour private). Si les clés sont mal formatées, les régénérer.

#### Etape 3 — Débugger le flux d'abonnement
Vérifier pourquoi `useWebPush.subscribe()` ne sauvegarde pas d'abonnement :
- Tester si l'appel à `register-push-subscription` avec `action: "get-vapid-key"` retourne bien la clé
- Vérifier que `pushManager.subscribe()` réussit
- Ajouter des logs console dans le hook pour tracer chaque étape

#### Etape 4 — Tester le flux complet
- S'abonner via la page Settings
- Vérifier qu'une ligne apparaît dans `push_subscriptions`
- Envoyer une notification test et vérifier les logs de la edge function

### Détails techniques

```text
Flux actuel (cassé) :
  Settings → useWebPush.subscribe()
    → get-vapid-key ✅ (retourne la clé)
    → pushManager.subscribe() ❓ (peut échouer si clé mal formatée)
    → register-push-subscription (subscribe) ❓ (jamais appelé vu table vide)

  Test notification → test-push-notification
    → send-push-notification
      → fetch(endpoint) ❌ (payload non chiffré = rejeté par push service)
```

La correction principale est de **remplacer l'envoi Web Push fait main par une librairie éprouvée** et de **vérifier que le flux d'abonnement fonctionne**.

