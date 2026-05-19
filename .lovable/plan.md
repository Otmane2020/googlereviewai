## 1. Boutique publique e-commerce

**Nouvelle table `shop_products`** (publique en lecture) avec les 7 produits inspirés de Trustavis :

| Produit | Prix | Slug |
|---|---|---|
| Plaque NFC Google Avis | 39,90 € | plaque-nfc-google-avis |
| Plaque NFC Instagram | 29,90 € | plaque-nfc-instagram |
| Plaque NFC TikTok | 39,90 € | plaque-nfc-tiktok |
| Plaque NFC Snapchat | 31,90 € (~~39,90~~) | plaque-nfc-snapchat |
| Trust'Card Google NFC | 19,90 € | carte-nfc-google |
| Trust'Card Instagram NFC | 19,90 € | carte-nfc-instagram |
| Trust'Card LinkedIn NFC | 19,90 € | carte-nfc-linkedin |
| Trust'Card PayPal NFC | 15,90 € (~~19,90~~) | carte-nfc-paypal |

Colonnes : `id, slug, name, description, price_eur, compare_at_price, image_url, category (plaque|carte), platform (google|instagram|tiktok|snapchat|linkedin|paypal), is_active, sort_order`.

Les images seront générées (pas de hotlink Trustavis) — 8 images de produits via imagegen (plaques NFC carrées + cartes NFC) en style premium minimal.

**Nouvelles routes publiques** (pas d'auth requise) :
- `/shop` — grille des produits + bandeau livraison gratuite / paiement sécurisé
- `/shop/:slug` — fiche produit avec galerie, prix, CTA "Ajouter au panier" (ou checkout direct)
- Footer + nav header public léger réutilisant `Header.tsx`
- SEO Helmet : title `<Nom produit> — NFC Google Avis | Ranki.ai`, meta description optimisée par produit

**Checkout** : réutiliser le flux Stripe existant (`create-nfc-checkout` généralisé en `create-shop-checkout` qui prend `product_slug` + `shipping_address`). Création d'`orders` avec `order_type = 'shop_product'` et `order_items` lié.

## 2. Fix admin commandes (`/admin/orders`)

**Bug racine** : la table `orders` a une RLS `user_id = auth.uid()` → l'admin ne voit que SES commandes. Il faut ajouter une policy admin.

Solution :
- Créer enum `app_role` + table `user_roles` + fonction `has_role()` (pattern sécurisé)
- Insérer rôle `admin` pour `benyahya.otmane@gmail.com`
- Policy supplémentaire `Admins can view all orders` + `Admins can view all order_items`
- Page `AdminOrders.tsx` : ajouter type `shop_product` au filtre, afficher infos client/livraison/PDF (le PDF existe déjà pour `printed_qr_free`)

## 3. SEO produit

- Helmet par fiche produit : title < 60 car, description < 160 car (FR/EN selon langue)
- JSON-LD `Product` (name, image, price, availability, sku)
- BreadcrumbList JSON-LD
- canonical sur `https://ranki.ai/shop/:slug`
- alt text sur images

## Détails techniques

```text
nouveaux fichiers
  src/pages/Shop.tsx
  src/pages/ShopProduct.tsx
  src/assets/shop/*.jpg  (8 images générées)
  supabase/functions/create-shop-checkout/index.ts

migrations
  CREATE TABLE shop_products + RLS public read
  CREATE TYPE app_role + TABLE user_roles + FUNCTION has_role
  ADD POLICY admin SELECT sur orders, order_items
  SEED 8 produits + role admin

App.tsx
  routes publiques /shop et /shop/:slug

AdminOrders.tsx
  inclure 'shop_product' dans .in(...)
  utiliser has_role côté front pour gating

stripe-webhook
  gérer order_type = 'shop_product'
```

## Hors scope (à confirmer si voulu)

- Vrai panier multi-produits (pour l'instant : 1 produit / checkout)
- Variants (couleur, design) — peuvent être ajoutés via `metadata`
- Avis clients sur la fiche produit
- Pagination / filtre par catégorie