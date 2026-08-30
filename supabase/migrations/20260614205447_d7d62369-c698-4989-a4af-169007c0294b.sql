
ALTER TABLE public.shop_products ADD COLUMN IF NOT EXISTS name_en TEXT;

UPDATE public.shop_products SET name_en = CASE slug
  WHEN 'plaque-nfc-google-avis' THEN 'NFC Google Reviews Plaque'
  WHEN 'plaque-nfc-instagram'   THEN 'NFC Instagram Plaque'
  WHEN 'plaque-nfc-tiktok'      THEN 'NFC TikTok Plaque'
  WHEN 'plaque-nfc-snapchat'    THEN 'NFC Snapchat Plaque'
  WHEN 'carte-nfc-google'       THEN 'NFC Google Reviews Card'
  WHEN 'carte-nfc-instagram'    THEN 'NFC Instagram Card'
  WHEN 'carte-nfc-linkedin'     THEN 'NFC LinkedIn Card'
  WHEN 'carte-nfc-paypal'       THEN 'NFC PayPal Card'
  ELSE name_en
END
WHERE slug IN (
 'plaque-nfc-google-avis','plaque-nfc-instagram','plaque-nfc-tiktok','plaque-nfc-snapchat',
 'carte-nfc-google','carte-nfc-instagram','carte-nfc-linkedin','carte-nfc-paypal'
);
