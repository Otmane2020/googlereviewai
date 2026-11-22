# ReviewsAI pour Android

L'application Android ouvre la boîte d'avis de ReviewsAI à l'adresse https://reviewsai.store/reviews dans une Trusted Web Activity. Elle utilise le navigateur Android pour la connexion Google et le parcours existant de réponse aux avis.

- Application Android : `store.reviewsai.app`
- Version : 1.0.1, code 2
- Cible : Android 16 (API 36)
- Appareils compatibles : Android 7.0 ou ultérieur

## Compiler

Avec Java 21 et le SDK Android 36 installés, exécuter depuis ce dossier :

```sh
./gradlew assembleDebug bundleRelease
```

L'APK de test se trouve dans `app/build/outputs/apk/debug/`. Le bundle de production non signé se trouve dans `app/build/outputs/bundle/release/`. Pour régénérer le projet à partir de la configuration Bubblewrap, utiliser `npx --package=@bubblewrap/cli@1.27.0 bubblewrap update --skipVersionUpgrade` depuis ce dossier.

## Préparer la sortie Play Console

1. Pour créer une nouvelle fiche ReviewsAI, utiliser l'identifiant ci-dessus. Pour mettre à jour la fiche Starlinko « Avis Google » existante, conserver son identifiant `com.world.fi.starlinko`, augmenter son code de version et signer le bundle avec sa clé d'importation.
2. Signer le bundle avec la clé d’importation de cette fiche. Si aucune clé n’a encore été enregistrée pour la fiche, créer une clé d’importation et la conserver hors du dépôt. Avec le JDK installé, signer et vérifier le bundle depuis `android/` :

   ```sh
   jarsigner -keystore /chemin/vers/cle-importation.jks \
     -signedjar ReviewsAI-1.0.1-signed.aab \
     app/build/outputs/bundle/release/app-release.aab ALIAS_DE_LA_CLE
   jarsigner -verify ReviewsAI-1.0.1-signed.aab
   ```
3. Récupérer le SHA-256 du **certificat de signature de l'application** dans Play Console. Servir le JSON ci-dessous sur `https://reviewsai.store/.well-known/assetlinks.json` avec une réponse directe HTTP 200 et le type `application/json`. Pour tester le plein écran avec un APK local, autoriser aussi le certificat de cet APK sur un environnement de test. Le navigateur garde sa barre d'adresse tant que l'association n'est pas vérifiée.

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "store.reviewsai.app",
      "sha256_cert_fingerprints": ["REMPLACER_PAR_LE_SHA256_DE_SIGNATURE_PLAY"]
    }
  }
]
```

4. Dans **Tests internes**, ouvrir le brouillon et ajouter le `.aab` signé à la section **App bundles**. Si le bundle a déjà été traité par Play Console, choisir **Ajouter à partir de la bibliothèque**. Vérifier que le bundle apparaît dans la liste des nouveaux app bundles avant de poursuivre. Pour une mise à jour, utiliser un `versionCode` supérieur à celui de la version déjà distribuée sur la piste et synchroniser les valeurs dans `app/build.gradle` et `twa-manifest.json`.
5. Sur la piste de test interne, vérifier la connexion Google Business Profile et le parcours notification → avis → brouillon → publication avec un établissement de test. Fournir à l'équipe de validation de Google Play un accès à l'espace connecté.
6. Avant la soumission, traiter les abonnements numériques. Le site actuel propose Stripe. Une option est de proposer une app de consultation et d'usage pour les comptes existants, en retirant du parcours Android les achats et les redirections vers un paiement numérique externe. L'autre option est d'intégrer Google Play Billing ou un programme autorisé applicable aux marchés concernés.
