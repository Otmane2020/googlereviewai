import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Truck, ShieldCheck, Smartphone, Star, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { SHOP_IMAGES } from "@/assets/shop";
import { Header } from "@/components/Header";
import Footer from "@/components/Footer";

type Product = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  description_en: string | null;
  price_eur: number;
  compare_at_price: number | null;
  category: string;
  platform: string | null;
  sort_order: number;
};

export default function Shop() {
  const { i18n } = useTranslation();
  const en = i18n.language?.startsWith("en");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("shop_products").select("*").eq("is_active", true).order("sort_order");
      setProducts((data || []) as Product[]);
      setLoading(false);
    })();
  }, []);

  const T = en ? {
    title: "Shop — Premium NFC plaques & cards | Ranki.ai",
    desc: "NFC plaques and cards to collect Google reviews, grow Instagram, TikTok, LinkedIn and more. Tap or scan, no app needed. Free shipping in France.",
    h1: "NFC Shop", subtitle: "Premium plaques & cards to collect reviews and grow your community.",
    plaques: "NFC Plaques", cards: "NFC Cards",
    promo: "Promo", from: "from",
    f1: "Free France shipping", f2: "Secure Stripe payment", f3: "iOS & Android compatible",
    cta: "View product",
  } : {
    title: "Boutique — Plaques & Cartes NFC premium | Ranki.ai",
    desc: "Plaques et cartes NFC pour collecter des avis Google, booster Instagram, TikTok, LinkedIn et plus. Tap ou scan, sans application. Livraison France offerte.",
    h1: "Boutique NFC", subtitle: "Plaques et cartes premium pour collecter des avis et développer votre communauté.",
    plaques: "Plaques NFC", cards: "Cartes NFC",
    promo: "Promo", from: "dès",
    f1: "Livraison France offerte", f2: "Paiement sécurisé Stripe", f3: "Compatible iOS & Android",
    cta: "Voir le produit",
  };

  const plaques = products.filter((p) => p.category === "plaque");
  const cards = products.filter((p) => p.category === "carte");

  const renderProduct = (p: Product) => (
    <Link
      key={p.id}
      to={`/shop/${p.slug}`}
      className="group block"
    >
      <Card className="overflow-hidden rounded-2xl border-2 hover:border-emerald-400 hover:shadow-xl transition-all">
        <div className="aspect-square bg-gradient-to-br from-slate-50 to-slate-100 relative overflow-hidden">
          {p.compare_at_price && (
            <Badge className="absolute top-3 left-3 z-10 bg-red-500 hover:bg-red-500">{T.promo}</Badge>
          )}
          <img
            src={SHOP_IMAGES[p.slug] || SHOP_IMAGES["plaque-nfc-google-avis"]}
            alt={p.name}
            loading="lazy"
            width={1024}
            height={1024}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-base mb-1">{p.name}</h3>
          <div className="flex items-center gap-1 mb-2">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
            ))}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold">{Number(p.price_eur).toFixed(2)} €</span>
            {p.compare_at_price && (
              <span className="text-sm text-muted-foreground line-through">
                {Number(p.compare_at_price).toFixed(2)} €
              </span>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );

  return (
    <>
      <Helmet>
        <title>{T.title}</title>
        <meta name="description" content={T.desc} />
        <link rel="canonical" href="https://ranki.ai/shop" />
        <meta property="og:title" content={T.title} />
        <meta property="og:description" content={T.desc} />
        <meta property="og:url" content="https://ranki.ai/shop" />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: T.h1,
          description: T.desc,
          url: "https://ranki.ai/shop",
        })}</script>
      </Helmet>

      <Header />

      <main className="min-h-screen bg-background">
        {/* Hero */}
        <section className="bg-gradient-to-b from-emerald-50/60 to-background pt-10 pb-12 px-4">
          <div className="container max-w-6xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold mb-4">
              <ShoppingBag className="w-3.5 h-3.5" /> {T.h1}
            </div>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-3">{T.h1}</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">{T.subtitle}</p>

            <div className="flex flex-wrap items-center justify-center gap-3 mt-6 text-xs">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card border">
                <Truck className="w-3.5 h-3.5 text-emerald-600" /> {T.f1}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card border">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> {T.f2}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card border">
                <Smartphone className="w-3.5 h-3.5 text-emerald-600" /> {T.f3}
              </span>
            </div>
          </div>
        </section>

        {/* Products */}
        <section className="container max-w-6xl mx-auto px-4 pb-16 space-y-10">
          {loading ? (
            <div className="text-center text-muted-foreground py-12">…</div>
          ) : (
            <>
              {plaques.length > 0 && (
                <div>
                  <div className="flex items-end justify-between mb-4">
                    <h2 className="text-2xl font-bold">{T.plaques}</h2>
                    <span className="text-sm text-muted-foreground">
                      {T.from} {Math.min(...plaques.map((p) => Number(p.price_eur))).toFixed(2)} €
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {plaques.map(renderProduct)}
                  </div>
                </div>
              )}

              {cards.length > 0 && (
                <div>
                  <div className="flex items-end justify-between mb-4">
                    <h2 className="text-2xl font-bold">{T.cards}</h2>
                    <span className="text-sm text-muted-foreground">
                      {T.from} {Math.min(...cards.map((p) => Number(p.price_eur))).toFixed(2)} €
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {cards.map(renderProduct)}
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </main>

      <Footer />
    </>
  );
}
