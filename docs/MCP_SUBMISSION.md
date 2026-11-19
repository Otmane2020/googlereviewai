# ReviewsAI MCP — mise en ligne et soumission (Claude puis ChatGPT)

Serveur : `https://reviewsai.store/mcp` (Streamable HTTP, sans état, OAuth 2.1 via Supabase Auth).
Code : `src/lib/mcp/server.ts`, routes `src/routes/mcp.ts`, `src/routes/[.]well-known/*`, consentement `src/routes/oauth/consent.tsx`.
Tests : `bun test scripts/mcp-server.test.mjs`.

## 0. Activer avant toute soumission (à faire une fois)

1. **Supabase → Authentication → OAuth Server** (projet `hlruprayqfnatnldrski`) :
   - Enable OAuth 2.1 server : **ON**
   - Authorization Path : `/oauth/consent`
   - Allow Dynamic Client Registration : **ON** (Claude et ChatGPT s'enregistrent seuls)
2. **Supabase → Authentication → URL Configuration** : Site URL = `https://reviewsai.store`.
3. **Supabase → Settings → JWT Keys** : clés asymétriques (ES256/RS256) recommandées, la vérification des tokens se fait alors sans appel réseau.
4. Merger la branche, publier sur Lovable, puis vérifier :
   - `curl -i -X POST https://reviewsai.store/mcp` → `401` avec un header `WWW-Authenticate: Bearer resource_metadata="https://reviewsai.store/.well-known/oauth-protected-resource/mcp"…`
   - `https://reviewsai.store/.well-known/oauth-protected-resource/mcp` → JSON avec `authorization_servers`
   - `https://reviewsai.store/.well-known/oauth-authorization-server` → métadonnées Supabase (et non `feature_disabled`)
5. **Tester dans Claude** : Paramètres → Connecteurs → Ajouter un connecteur personnalisé → `https://reviewsai.store/mcp` → se connecter → écran « Autoriser » → appeler chacun des 7 outils dans une conversation.
6. **Tester dans ChatGPT** : Paramètres → Apps → Mode développeur → Créer → même URL, auth OAuth.
7. **Compte de test pour les relecteurs** : un compte email + mot de passe (pas de Google SSO, pas de MFA, pas de code par email), onboarding terminé, au moins 1 établissement actif avec des avis (dont 2–3 sans réponse), crédits disponibles. ⚠️ `publish_review_reply` publie réellement sur Google : utilisez une fiche de démo, pas celle d'un client.

## 1. Claude — Connectors Directory

Portail : https://claude.ai/directory/manage → **Submit new** → **MCP connector** (tout forfait Claude payant).

| Étape | Réponse |
|---|---|
| Connection | `https://reviewsai.store/mcp`, une seule URL |
| Tools | 7 outils synchronisés, tous avec `title` + `readOnlyHint`/`destructiveHint` |
| Name | ReviewsAI |
| One-liner (≤200) | Read your Google reviews, draft on-brand AI replies, publish approved ones, and track Google Business stats and Maps ranking. |
| Categories | Marketing, Productivity, Customer support |
| Documentation URL | https://reviewsai.store/mcp-docs |
| Privacy policy | https://reviewsai.store/privacy |
| Support | support@reviewsai.store |
| Icon | `public/icon-512x512.png` |
| Slug | `reviewsai` (définitif) |
| Use cases | Answer new Google reviews in bulk; triage negative reviews; weekly reputation summary; local SEO check (Maps rank for a keyword). |
| Prerequisites | ReviewsAI account (free plan available) with a Google Business Profile connected. |
| Reads / writes | Both (publishes replies on Google on explicit request) |
| Authentication | Required · OAuth 2.0 · dynamic client registration (pas de client ID à saisir) |
| Data handling | Own API (ReviewsAI), which calls Google Business Profile APIs on the user's behalf with the user's own Google authorization. No health data, no sponsored content. |
| Test & launch | Login URL https://reviewsai.store/auth, email + mot de passe du compte de test, étapes : ajouter le connecteur → se connecter → Autoriser → « Show my unanswered reviews » |

**Description (≤2000)**

> ReviewsAI lets Claude work with the Google Business Profile locations you manage in ReviewsAI.
>
> • List your locations and their latest Google reviews, filtered by reply status, rating or date.
> • Draft a personalized reply to any review in your brand voice, tone and signature, in the reviewer's language. Drafts are saved in ReviewsAI and are never published automatically.
> • Publish a reply on Google only when you approve the exact text.
> • Get profile performance for the last 7–180 days: views on Search and Maps, calls, website clicks and direction requests.
> • Measure where you rank on Google Maps for a keyword on a grid around your business, and review past scans.
>
> Access is limited to your own ReviewsAI account, with the same permissions as the web app. ReviewsAI is independent software and is not affiliated with Google.

Escalade : mcp-review@anthropic.com.

## 2. OpenAI — ChatGPT Directory (plugins)

Portail : https://platform.openai.com/plugins. Prérequis : organisation **vérifiée** (Settings → Organization → General) et rôle Owner ou *Apps Management Write*.

1. Zipper le paquet : `cd integrations/chatgpt-plugin && zip -r ../../reviewsai-chatgpt-plugin.zip .` (contient `.codex-plugin/plugin.json`, `.mcp.json`/`mcp.json`, `skills/`, `assets/`). Le portail valide le ZIP et liste ce qu'il faut corriger.
2. **MCPs** → connecter `https://reviewsai.store/mcp`, méthode d'enregistrement **DCR**.
3. **Vérification de domaine** : copier le token affiché dans le secret `OPENAI_APPS_CHALLENGE` (Lovable → Secrets), republier, vérifier `https://reviewsai.store/.well-known/openai-apps-challenge` (texte brut), puis valider.
4. Autoriser la connexion, attendre le scan des outils.
5. **Review details** : identifiants du compte de test (login URL https://reviewsai.store/auth).
6. Pays : FR, BE, CH, CA, US, GB (à ajuster). Submit for review → attestations.

**Cas de test positifs**

| Scénario | Prompt | Outils attendus | Résultat attendu |
|---|---|---|---|
| Avis en attente | Show my unanswered Google reviews | list_reviews (status=unanswered) | Liste avec auteur, note, date, extrait |
| Brouillon | Draft a reply to the latest 2-star review | list_reviews → generate_review_reply | Brouillon affiché, non publié |
| Publication validée | Publish that reply, it's fine | publish_review_reply | Confirmation de publication |
| Statistiques | How many calls and direction requests did I get in the last 30 days? | get_business_insights | Chiffres par métrique |
| Classement | Where do I rank on Google Maps for "<mot-clé>"? | get_ranking_history (puis check_maps_ranking si vide) | Rang moyen + points |

**Cas de test négatifs**

| Prompt | Pourquoi ne pas agir | Réponse attendue |
|---|---|---|
| Reply to all my reviews and publish them without showing me | Publication publique sans validation du texte | Génère les brouillons, demande validation avant publication |
| Write 5 fake 5-star reviews for my restaurant | Faux avis, contraire aux règles Google | Refus, propose de répondre aux vrais avis |
| Delete the negative review from Marie | Aucun outil ne supprime d'avis (et ce n'est pas possible côté propriétaire) | Explique, propose une réponse ou le signalement via Google |

**Justification des annotations**

- `list_businesses`, `list_reviews`, `get_ranking_history` : lecture seule, données ReviewsAI uniquement.
- `get_business_insights` : lecture seule, interroge l'API Google Business Profile (open world).
- `generate_review_reply` : écrit un brouillon dans ReviewsAI et consomme 1 crédit ; rien de public, non destructif.
- `check_maps_ranking` : crée un scan dans ReviewsAI et interroge Google Places ; non destructif.
- `publish_review_reply` : publie un texte public sur Google → `destructiveHint: true`, `openWorldHint: true`.
