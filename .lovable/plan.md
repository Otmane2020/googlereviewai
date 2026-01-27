
# Ajout de copie email support vers boîte personnelle

## Objectif
Envoyer une copie (CC) de chaque demande support à `oben.rockman@gmail.com` en plus de `support@starlinko.app`.

## Modification requise

### Fichier : `supabase/functions/send-support-email/index.ts`

**Changement :** Ajouter le champ `cc` dans l'appel API Resend pour envoyer une copie à ta boîte personnelle.

```typescript
// Avant (ligne 127-133)
body: JSON.stringify({
  from: "Starlinko Support <support@starlinko.app>",
  to: [SUPPORT_EMAIL],
  reply_to: email || undefined,
  subject: `[Support] ${issueLabels[issueType] || issueType}: ${title}`,
  html: emailHtml,
}),

// Après
body: JSON.stringify({
  from: "Starlinko Support <support@starlinko.app>",
  to: [SUPPORT_EMAIL],
  cc: ["oben.rockman@gmail.com"],  // ← Ajout CC
  reply_to: email || undefined,
  subject: `[Support] ${issueLabels[issueType] || issueType}: ${title}`,
  html: emailHtml,
}),
```

## Résultat
- **To:** `support@starlinko.app` (email principal support)
- **CC:** `oben.rockman@gmail.com` (ta boîte personnelle pour notification)
- **Reply-To:** Email du client (pour répondre directement)

## Détails techniques
L'API Resend supporte nativement le champ `cc` qui accepte un tableau d'emails. Aucune configuration supplémentaire n'est nécessaire.
