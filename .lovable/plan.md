
# Plan: Bouton Google Play + Détection Android + Fix Notifications

## Résumé du problème

**3 demandes principales :**
1. **Ajouter un bouton "Installer depuis Google Play"** sur la landing page
2. **Détecter Android** pour proposer Google Play au lieu de la PWA
3. **Fix des notifications push** qui affichent "Non supporté par ce navigateur" dans l'app native

## Analyse technique

### Pourquoi les notifications ne fonctionnent pas dans l'app native ?

Le système actuel utilise **PushAlert** (Web Push API) qui fonctionne uniquement dans un navigateur web. Quand l'app est installée via le Play Store (Capacitor), elle s'exécute dans une **WebView native** où :
- L'objet `Notification` n'existe pas ou retourne "unsupported"
- Le SDK PushAlert ne peut pas s'initialiser correctement
- Le Service Worker PushAlert ne fonctionne pas

**Solution :** Pour les notifications dans l'app native, il faut utiliser **Firebase Cloud Messaging (FCM)** avec le plugin Capacitor. Mais comme l'app native est déjà publiée sur le Play Store, je vais d'abord **améliorer la détection et l'UX** côté web pour éviter la confusion.

---

## Plan d'implémentation

### 1. Créer un hook `useDeviceDetection`
Un hook réutilisable pour détecter le type d'appareil et le contexte d'exécution.

```text
src/hooks/useDeviceDetection.ts

Détecte :
├── isAndroid : true si Android
├── isIOS : true si iOS  
├── isNativeApp : true si WebView Capacitor
├── isMobile : true si mobile
└── canUsePushAlert : false si native app (WebView)
```

### 2. Ajouter le bouton Google Play sur la landing page

**Fichiers modifiés :**
- `src/components/HeroSection.tsx` : Ajout du badge Google Play
- `src/components/MobileStickyButton.tsx` : Logique conditionnelle Android
- `src/components/CTASection.tsx` : Bouton alternatif pour Android
- `src/components/Footer.tsx` : Lien vers le Play Store

**Logique :**
- Desktop → Bouton "Essai gratuit" (vers /auth)
- Android → Bouton "Installer l'app" (vers Google Play)
- iOS → Bouton "Essai gratuit" + Guide PWA

**URL Google Play :**
```
https://play.google.com/store/apps/details?id=com.world.fi.starlinko
```

### 3. Créer le composant `GooglePlayButton`

Un composant réutilisable avec le badge officiel "Get it on Google Play" :

```text
src/components/GooglePlayButton.tsx

Props :
├── variant : "badge" | "button" | "link"
├── className : styles additionnels
└── size : "sm" | "md" | "lg"
```

### 4. Fix UX des notifications dans Settings

**Problème :** L'app native affiche "Non supporté par ce navigateur" au lieu d'un message clair.

**Solution :**

```text
Contexte : App native (WebView)
┌─────────────────────────────────────────────────────┐
│ 🔔 Notifications Push                              │
│                                                     │
│ ✓ Notifications activées via Android               │
│                                                     │
│ Les notifications sont gérées par le système       │
│ Android. Vérifiez dans :                           │
│ Paramètres > Applications > Starlinko > Notifs     │
│                                                     │
│ [Ouvrir les paramètres Android]                    │
└─────────────────────────────────────────────────────┘
```

**Fichier modifié :** `src/pages/Settings.tsx`

### 5. Améliorer NotificationPrompt pour l'app native

Ne plus afficher le prompt de notification si on est dans une WebView native (car les permissions Android sont déjà gérées au niveau système).

**Fichier modifié :** `src/components/NotificationPrompt.tsx`

### 6. Ne plus montrer InstallPrompt dans l'app native

L'invite d'installation PWA ne doit pas apparaître si l'utilisateur est déjà dans l'app native.

**Fichier modifié :** `src/components/InstallPrompt.tsx`

---

## Résumé des fichiers

| Action | Fichier |
|--------|---------|
| Créer | `src/hooks/useDeviceDetection.ts` |
| Créer | `src/components/GooglePlayButton.tsx` |
| Modifier | `src/components/HeroSection.tsx` |
| Modifier | `src/components/MobileStickyButton.tsx` |
| Modifier | `src/components/CTASection.tsx` |
| Modifier | `src/components/Footer.tsx` |
| Modifier | `src/pages/Settings.tsx` |
| Modifier | `src/components/NotificationPrompt.tsx` |
| Modifier | `src/components/InstallPrompt.tsx` |

---

## Section technique détaillée

### Détection WebView Capacitor

```typescript
const isNativeApp = () => {
  // Capacitor injecte ce flag
  return !!(window as any).Capacitor?.isNativePlatform?.();
};

const isAndroid = () => {
  return /Android/i.test(navigator.userAgent);
};
```

### Logique UX pour les notifications

```text
┌─────────────────────────────────────────┐
│           Utilisateur ouvre l'app       │
└─────────────────────────────────────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │  Est-ce une app      │
        │  native (Capacitor)? │
        └───────────────────────┘
                    │
           ┌────────┴────────┐
           │                 │
           ▼                 ▼
    ┌──────────┐      ┌──────────────┐
    │   OUI    │      │     NON      │
    │ (Native) │      │   (Web/PWA)  │
    └──────────┘      └──────────────┘
           │                 │
           ▼                 ▼
    ┌──────────────┐  ┌──────────────────┐
    │ Masquer le   │  │ Afficher le      │
    │ prompt push  │  │ prompt PushAlert │
    │              │  │                  │
    │ Afficher:    │  │ Fonctionnement   │
    │ "Géré par    │  │ normal           │
    │  Android"    │  │                  │
    └──────────────┘  └──────────────────┘
```

---

## Résultat attendu

1. **Landing page :** Sur Android, le bouton principal devient "Installer l'app" avec le lien Play Store
2. **Settings (app native) :** Message clair "Notifications gérées par Android" avec bouton pour ouvrir les paramètres système
3. **Pas de prompts inutiles :** Plus de popup d'installation PWA ni de prompt notification dans l'app native
4. **Badge Google Play :** Visible dans le footer et la section CTA pour tous les utilisateurs
