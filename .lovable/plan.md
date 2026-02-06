
# Correction des traductions FR et EN

## Probleme identifie

Le composant **DemoSection.tsx** (la section demo avec les 3 avis qui defilent sur la page d'accueil) contient **tout le texte directement en francais dans le code**, sans utiliser le systeme de traduction i18n. Resultat : quand un visiteur anglophone consulte le site, cette section reste en francais.

Le composant **SectorDemoSection.tsx** (demo par secteurs) est deja correctement traduit dans les deux langues -- aucun changement necessaire.

## Modifications prevues

### 1. Ajouter les cles de traduction dans `fr.json`

Ajout d'un nouveau bloc `"demo"` avec toutes les traductions francaises :
- Titre, sous-titre, badge "Demo en direct"
- 3 avis avec auteur, texte et reponse IA
- Labels des onglets ("Avis 1", "Avis 2", "Avis 3")
- Labels IA ("Reponse IA Starlinko", "Redaction...", "Publiee")
- Stats ("-95% Temps de reponse", "+40% Visibilite SEO", "Top 3 Google Maps")
- CTA ("Essayer gratuitement pendant 2 mois", "Sans carte bancaire", etc.)

### 2. Ajouter les cles de traduction dans `en.json`

Meme bloc `"demo"` avec les traductions anglaises :
- "Live Demo", "See Starlinko in action"
- 3 reviews with English names, text and AI responses
- Tab labels ("Review 1", "Review 2", "Review 3")
- AI labels ("Starlinko AI Response", "Writing...", "Published")
- Stats ("-95% Response time", "+40% SEO Visibility", "Top 3 Google Maps")
- CTA ("Try free for 2 months", "No credit card", etc.)

### 3. Mettre a jour `DemoSection.tsx`

- Importer `useTranslation` de react-i18next
- Remplacer toutes les chaines codees en dur par des appels `t("demo.xxx")`
- Les 3 avis de demonstration seront recuperes dynamiquement via les cles i18n au lieu d'etre dans un tableau statique

## Details techniques

Fichiers modifies :
- `src/i18n/locales/fr.json` -- ajout du bloc `demo`
- `src/i18n/locales/en.json` -- ajout du bloc `demo`
- `src/components/DemoSection.tsx` -- integration i18n avec `useTranslation()`

Aucun nouveau fichier cree. Aucune modification de structure ou de style visuel.
