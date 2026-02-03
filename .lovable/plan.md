

# Diagnostic : Écran blanc sur anciens appareils mobiles

## Problèmes identifiés

### 1. Conflit entre deux Service Workers (CRITIQUE)
Le projet a **deux systèmes de Service Worker** qui entrent en conflit :

- **`public/sw.js`** : Service Worker personnalisé avec PushAlert (que nous venons de modifier)
- **`vite-plugin-pwa`** dans `vite.config.ts` : Génère automatiquement un autre Service Worker via Workbox

Sur les anciens appareils, ce conflit peut provoquer :
- Cache corrompu
- Boucles de mise à jour infinies
- Écran blanc car le SW sert un ancien fichier HTML vide

### 2. JavaScript moderne non supporté
Certaines syntaxes JavaScript peuvent ne pas être supportées sur d'anciens navigateurs :
- Optional chaining (`?.`)
- Nullish coalescing (`??`)
- `navigator.languages` (peut être undefined)

### 3. Condition d'initialisation bloquante dans App.tsx
```typescript
// Ligne 123-125 : Si hasRunInit reste false, rien ne s'affiche
if (!hasRunInit) {
  return null;
}
```
Si le timer de 50ms échoue (ce qui peut arriver sur un appareil lent), l'app reste blanche.

---

## Plan de correction

### Étape 1 : Désactiver le Service Worker de vite-plugin-pwa
Modifier `vite.config.ts` pour utiliser uniquement le SW personnalisé :
- Mettre `registerType: "prompt"` au lieu de `"autoUpdate"`
- Désactiver `injectRegister`

### Étape 2 : Améliorer la robustesse du sw.js
Ajouter :
- Un listener pour le message `SKIP_WAITING`
- Meilleure gestion des erreurs
- Version de cache mise à jour (v3)

### Étape 3 : Sécuriser l'initialisation de l'app
Modifier `App.tsx` pour :
- Afficher un fallback (loader) au lieu de `null` pendant l'initialisation
- Ajouter un timeout de sécurité plus long
- Gérer les erreurs silencieuses

### Étape 4 : Polyfill pour anciens navigateurs
Ajouter une protection dans `i18n/config.ts` :
```typescript
const languages = navigator.languages || [navigator.language] || ['en'];
```

---

## Section technique

### Fichiers à modifier

| Fichier | Modification |
|---------|-------------|
| `vite.config.ts` | Désactiver l'auto-registration du SW PWA |
| `public/sw.js` | Ajouter listener SKIP_WAITING, version v3 |
| `src/App.tsx` | Afficher loader au lieu de null, timeout sécurisé |
| `src/i18n/config.ts` | Fallback pour navigateur.languages undefined |

### Architecture corrigée du Service Worker

```text
┌─────────────────────────────────────────────────┐
│                   Navigateur                     │
├─────────────────────────────────────────────────┤
│                                                  │
│  ┌──────────────────────────────────────────┐   │
│  │          public/sw.js (unique)           │   │
│  │  - Gère le cache manuellement            │   │
│  │  - Import PushAlert SDK                  │   │
│  │  - skipWaiting() + clients.claim()       │   │
│  └──────────────────────────────────────────┘   │
│                                                  │
│  ┌──────────────────────────────────────────┐   │
│  │         vite-plugin-pwa (manifest seul)  │   │
│  │  - Génère manifest.webmanifest           │   │
│  │  - PAS de Service Worker                 │   │
│  └──────────────────────────────────────────┘   │
│                                                  │
└─────────────────────────────────────────────────┘
```

### Tests recommandés après correction
1. Publier le site pour activer le nouveau SW
2. Sur l'ancien appareil : effacer les données du site (ou utiliser navigation privée)
3. Vérifier que la page se charge correctement

