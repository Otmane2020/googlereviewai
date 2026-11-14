# ReviewsAI pour Android

L'application Android ouvre la boîte d'avis de ReviewsAI à l'adresse https://reviewsai.store/reviews dans une Trusted Web Activity. Elle utilise le navigateur Android pour la connexion Google et le parcours existant de réponse aux avis.

- Application Android : `store.reviewsai.app`
- Version : 1.0.0, code 1
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
2. Pour la nouvelle fiche, créer et conserver une clé d'importation, puis signer le bundle à l'aide de celle-ci. Conserver la clé hors du dépôt.
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

4. Sur la piste de test interne, vérifier la connexion Google Business Profile et le parcours notification → avis → brouillon → publication avec un établissement de test. Fournir à l'équipe de validation de Google Play un accès à l'espace connecté.
5. Avant la soumission, traiter les abonnements numériques. Le site actuel propose Stripe. Une option est de proposer une app de consultation et d'usage pour les comptes existants, en retirant du parcours Android les achats et les redirections vers un paiement numérique externe. L'autre option est d'intégrer Google Play Billing ou un programme autorisé applicable aux marchés concernés.
