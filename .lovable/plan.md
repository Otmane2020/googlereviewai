
# Correction urgente : Écran blanc sur Opera Mobile

## Problème identifié

Les composants `InstallPrompt` et `NotificationPrompt` violent les **règles des hooks React** : ils font un `return null` AVANT d'appeler les hooks `useEffect`. 

Sur certains navigateurs (notamment Opera), cela provoque l'erreur fatale :
> **"Rendered fewer hooks than expected"**

Cette erreur casse complètement le rendu de l'application → écran blanc.

## Fichiers à modifier

| Fichier | Problème |
|---------|----------|
| `src/components/InstallPrompt.tsx` | `return null` aux lignes 14-21 AVANT le `useEffect` ligne 24 |
| `src/components/NotificationPrompt.tsx` | `return null` aux lignes 34-36 AVANT les `useEffect` lignes 39+ |

## Solution

Déplacer TOUS les `return null` conditionnels **APRÈS** tous les hooks. Les hooks doivent être appelés en premier, peu importe les conditions.

---

## Détails techniques

### InstallPrompt.tsx - Avant
```tsx
export const InstallPrompt = () => {
  const { ... } = usePWA();
  const { isNativeApp, isAndroid } = useDeviceDetection();
  const [dismissed, setDismissed] = useState(false);
  
  // ❌ ERREUR : return avant useEffect
  if (isNativeApp) return null;
  if (isAndroid) return null;

  useEffect(() => { ... }, []); // Hook après return = crash
```

### InstallPrompt.tsx - Après
```tsx
export const InstallPrompt = () => {
  const { ... } = usePWA();
  const { isNativeApp, isAndroid } = useDeviceDetection();
  const [dismissed, setDismissed] = useState(false);
  
  // ✅ useEffect EN PREMIER
  useEffect(() => { ... }, []);

  // ✅ Conditions APRÈS les hooks
  if (isNativeApp) return null;
  if (isAndroid) return null;
```

### NotificationPrompt.tsx - Avant
```tsx
export const NotificationPrompt = () => {
  const { user, loading } = useAuth();
  // ... autres hooks
  
  // ❌ ERREUR : return avant useEffect
  if (isNativeApp) return null;

  useEffect(() => { ... }, [user]); // Crash
```

### NotificationPrompt.tsx - Après
```tsx
export const NotificationPrompt = () => {
  const { user, loading } = useAuth();
  // ... autres hooks
  
  // ✅ TOUS les useEffect d'abord
  useEffect(() => { ... }, [user]);
  useEffect(() => { ... }, []);
  useEffect(() => { ... }, [isInstalled, ...]);

  // ✅ Ensuite les conditions de rendu
  if (isNativeApp) return null;
```

## Impact

- Corrige l'écran blanc sur Opera Mobile
- Corrige l'erreur "Rendered fewer hooks than expected"
- Compatible avec tous les navigateurs (Chrome, Safari, Opera, Firefox, etc.)

## Règle React fondamentale

> **Les hooks doivent toujours être appelés dans le même ordre**, peu importe les conditions. Aucun `return` ne doit précéder un hook.

