# Application Android (Google Play Store)

L'app Android est une **Trusted Web Activity (TWA)** : elle ouvre
`https://googlereviewai.com` en plein écran via Chrome, sans barre d'adresse.
Toute mise à jour du site est donc immédiatement visible dans l'app, sans
republier sur le Play Store. La connexion Google, Supabase et les
notifications push web continuent de fonctionner (contrairement à une WebView).

- Package : `com.googlereviewai.app`
- URL de lancement : `https://googlereviewai.com/?utm_source=android_app`
- Configuration : `app/build.gradle` (URL, package) et
  `app/src/main/res/values/strings.xml` (nom affiché)

## 1. Créer la clé d'envoi (une seule fois)

Sur votre ordinateur (Java installé) :

```sh
keytool -genkeypair -v -keystore upload.jks -alias upload \
  -keyalg RSA -keysize 2048 -validity 10000
base64 -w0 upload.jks > upload.jks.b64   # macOS : base64 -i upload.jks -o upload.jks.b64
```

Gardez `upload.jks` et ses mots de passe en lieu sûr — **ne le commitez jamais**.

## 2. Ajouter les secrets GitHub

Repo → Settings → Secrets and variables → Actions → *New repository secret* :

| Secret | Valeur |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | contenu de `upload.jks.b64` |
| `ANDROID_KEYSTORE_PASSWORD` | mot de passe du keystore |
| `ANDROID_KEY_ALIAS` | `upload` |
| `ANDROID_KEY_PASSWORD` | mot de passe de la clé |

## 3. Construire l'app

GitHub → Actions → **Build Android app (Play Store)** → *Run workflow*.
Téléchargez l'artefact `googlereviewai-play-store-aab` (fichier `.aab`).
L'artefact `googlereviewai-debug-apk` peut être installé directement sur un
téléphone Android pour tester.

À chaque nouvel envoi sur le Play Store, le `versionCode` doit augmenter
(par défaut c'est le numéro d'exécution du workflow, donc automatique).

## 4. Publier sur la Play Console

1. Créez un compte développeur : https://play.google.com/console (25 $ une fois).
2. *Créer une application* → nom, langue, « Application », « Gratuite ».
3. *Tester et publier → Production* (ou *Test interne* d'abord) → importez le `.aab`.
   Acceptez la **signature d'application par Google Play**.
4. Remplissez la fiche : icône 512×512 (`store-listing/play-icon-512.png`),
   image de présentation 1024×500, au moins 2 captures d'écran téléphone,
   descriptions, catégorie « Entreprise », politique de confidentialité
   (`https://googlereviewai.com/privacy`), questionnaire de contenu, sécurité des données.
   Les nouveaux comptes personnels doivent faire un test fermé
   (12 testeurs pendant 14 jours) avant la production.

## 5. Supprimer la barre d'adresse (Digital Asset Links) — important

Sans cette étape, l'app affiche une barre d'URL en haut.

1. Play Console → votre app → *Tester et publier → Configuration → Intégrité
   de l'application → Signature de l'application*.
2. Copiez l'**empreinte SHA-256** de la *clé de signature de l'application*.
3. Remplacez `REPLACE_WITH_PLAY_APP_SIGNING_SHA256` dans
   `public/.well-known/assetlinks.json` par cette valeur (format `AB:CD:...`).
   Vous pouvez aussi ajouter l'empreinte de votre clé d'envoi pour tester l'APK
   signé localement.
4. Publiez le site, puis vérifiez que
   `https://googlereviewai.com/.well-known/assetlinks.json` renvoie bien le JSON.

## Paiements : Google Play dans l'app, Stripe sur le site

- **Site web** (navigateur, ordinateur, iPhone) : rien ne change, tout passe par Stripe.
- **App Android** : abonnements et packs de crédits via **Google Play Billing**
  (obligatoire pour le Play Store). Le site détecte l'app
  (`src/lib/androidApp.ts`) et affiche les offres Google Play
  (`src/components/PlayBillingPlans.tsx`) au lieu de Stripe.
- Les produits physiques (cartes NFC, QR imprimés) restent payés par Stripe,
  même dans l'app (autorisé par Google).
- Les modules AEO/SEO en option (ajoutés à un abonnement Stripe) ne sont pas
  vendus dans l'app.

### Configuration Google Play (une seule fois)

1. **Produits** — Play Console → *Monétiser* :
   - *Abonnements* : créez 6 abonnements avec **exactement** ces ID, chacun
     avec **une seule** offre de base à renouvellement automatique :
     `ranki_starter_monthly`, `ranki_starter_yearly`, `ranki_pro_monthly`,
     `ranki_pro_yearly`, `ranki_business_monthly`, `ranki_business_yearly`.
   - *Produits intégrés* (packs de crédits, consommables) :
     `credits_10`, `credits_100`, `credits_330`, `credits_660`, `credits_1000`.
   Les prix se règlent dans la Play Console ; l'app affiche automatiquement
   ceux de Google. Un produit non créé est simplement masqué.
2. **Compte de service** (pour que le serveur vérifie les achats) :
   Google Cloud Console → *IAM → Comptes de service* → créez-en un et
   téléchargez sa clé JSON. Activez l'API « Google Play Android Developer ».
   Puis Play Console → *Utilisateurs et autorisations* → invitez l'e-mail du
   compte de service avec « Afficher les données financières » et
   « Gérer les commandes et les abonnements ».
3. **Secrets Supabase** (Edge Functions → Secrets) :
   - `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` : le contenu de la clé JSON
   - `PLAY_RTDN_SECRET` : une longue chaîne aléatoire de votre choix
4. **Déployez** la migration `play_purchases` et les fonctions
   `verify-play-purchase`, `play-rtdn-webhook` et `verify-subscription`.
5. **Notifications en temps réel** (renouvellements / résiliations) :
   Google Cloud → *Pub/Sub* → créez un topic, donnez le rôle « Éditeur Pub/Sub »
   à `google-play-developer-notifications@system.gserviceaccount.com`, puis un
   abonnement **push** vers
   `https://hlruprayqfnatnldrski.supabase.co/functions/v1/play-rtdn-webhook?token=<PLAY_RTDN_SECRET>`.
   Play Console → *Monétiser → Configuration de la monétisation* → indiquez
   le nom du topic.
6. **Tests** : ajoutez votre e-mail dans *Test des licences* ; publiez l'app
   en *Test interne* (Play Billing ne fonctionne que sur une app installée
   depuis le Play Store).

## Points d'attention pour la validation Google

- **Nom « Google »** : utiliser la marque « Google » dans le nom de l'app peut
  être refusé (politique sur l'usurpation / propriété intellectuelle).
  Un nom comme « Ranki – Réponses aux avis IA » est plus sûr.
- **Suppression de compte** : Google exige un moyen de supprimer son compte
  depuis l'app et via une URL web publique, à déclarer dans la section
  « Sécurité des données ».
