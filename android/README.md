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

## Points d'attention pour la validation Google

- **Paiements** : Google Play impose sa propre facturation pour les
  abonnements numériques achetés *dans l'app*. Vendre les plans via Stripe
  dans l'app peut entraîner un refus. Solution courante : masquer les
  pages de prix / checkout quand l'app est ouverte depuis Android
  (`utm_source=android_app` ou `document.referrer` commençant par
  `android-app://com.googlereviewai.app`) et laisser l'abonnement se faire sur le site.
- **Nom « Google »** : utiliser la marque « Google » dans le nom de l'app peut
  être refusé (politique sur l'usurpation / propriété intellectuelle).
  Un nom comme « Ranki – Réponses aux avis IA » est plus sûr.
- **Suppression de compte** : Google exige un moyen de supprimer son compte
  depuis l'app et via une URL web publique, à déclarer dans la section
  « Sécurité des données ».
