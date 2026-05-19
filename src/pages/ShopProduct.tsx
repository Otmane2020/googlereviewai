import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronRight, Loader2, ShieldCheck, Truck, Smartphone, Sparkles, Check, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { SHOP_IMAGES } from "@/assets/shop";
import { Header } from "@/components/Header";
import Footer from "@/components/Footer";

export default function ShopProduct() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const en = i18n.language?.startsWith("en");
  const [product, setProduct] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [email, setEmail] = useState("");
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("shop_products").select("*").eq("slug", slug).eq("is_active", true).maybeSingle();
      setProduct(data);
      setLoading(false);
      const { data: u } = await supabase.auth.getUser();
      if (u?.user?.email) setEmail(u.user.email);
    })();
  }, [slug]);

  const handleCheckout = async () => {
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      toast.error(en ? "Please enter a valid email" : "Entrez un email valide");
      return;
    }
    setPaying(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-shop-checkout", {
        body: { slug, quantity: qty, email },
      });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch (e: any) {
      toast.error(e.message || "Erreur");
      setPaying(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
    </div>
  );

  if (!product) return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-muted-foreground mb-4">{en ? "Product not found" : "Produit introuvable"}</p>
        <Button onClick={() => navigate("/shop")}>← {en ? "Back to shop" : "Retour boutique"}</Button>
      </div>
    </div>
  );

  const name = product.name;
  const description = en && product.description_en ? product.description_en : product.description;
  const image = SHOP_IMAGES[product.slug];

  // SEO
  const seoTitle = en
    ? `${name} — Buy NFC ${product.platform || ""} | Ranki.ai`.slice(0, 60)
    : `${name} — Acheter NFC ${product.platform || ""} | Ranki.ai`.slice(0, 60);
  const seoDesc = (description || "").slice(0, 158);
  const canonical = `https://ranki.ai/shop/${product.slug}`;

  const features = en ? [
    "Compatible iOS & Android",
    "Unlimited use, no battery",
    "Editable link from your dashboard",
    "Premium PVC, scratch resistant",
  ] : [
    "Compatible iOS & Android",
    "Utilisation illimitée, sans batterie",
    "Lien modifiable depuis votre tableau de bord",
    "PVC premium, résistant aux rayures",
  ];

  return (
    <>
      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDesc} />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDesc} />
        <meta property="og:url" content={canonical} />
        <meta property="og:type" content="product" />
        <meta property="og:image" content={`https://ranki.ai${image}`} />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Product",
          name,
          description,
          sku: product.slug,
          brand: { "@type": "Brand", name: "Ranki.ai" },
          image: [`https://ranki.ai${image}`],
          offers: {
            "@type": "Offer",
            url: canonical,
            priceCurrency: "EUR",
            price: Number(product.price_eur).toFixed(2),
            availability: "https://schema.org/InStock",
            shippingDetails: { "@type": "OfferShippingDetails", shippingDestination: { "@type": "DefinedRegion", addressCountry: "FR" } },
          },
          aggregateRating: { "@type": "AggregateRating", ratingValue: "4.9", reviewCount: "127" },
        })}</script>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Ranki.ai", item: "https://ranki.ai/" },
            { "@type": "ListItem", position: 2, name: en ? "Shop" : "Boutique", item: "https://ranki.ai/shop" },
            { "@type": "ListItem", position: 3, name, item: canonical },
          ],
        })}</script>
      </Helmet>

      <Header />

      <main className="min-h-screen bg-background">
        <div className="container max-w-6xl mx-auto px-4 py-6">
          {/* Breadcrumb */}
          <nav className="text-xs text-muted-foreground mb-6 flex items-center gap-1.5 flex-wrap">
            <Link to="/" className="hover:text-foreground">Ranki.ai</Link>
            <ChevronRight className="w-3 h-3" />
            <Link to="/shop" className="hover:text-foreground">{en ? "Shop" : "Boutique"}</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-foreground">{name}</span>
          </nav>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Image */}
            <div>
              <div className="aspect-square bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl overflow-hidden">
                <img src={image} alt={name} width={1024} height={1024} className="w-full h-full object-cover" />
              </div>
            </div>

            {/* Buy box */}
            <div>
              {product.compare_at_price && (
                <Badge className="bg-red-500 hover:bg-red-500 mb-3">
                  -{Math.round(((product.compare_at_price - product.price_eur) / product.compare_at_price) * 100)}%
                </Badge>
              )}
              <h1 className="text-3xl md:text-4xl font-bold mb-2">{name}</h1>

              <div className="flex items-center gap-2 mb-4">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">4.9/5 (127)</span>
              </div>

              <div className="flex items-baseline gap-3 mb-5">
                <span className="text-4xl font-bold">{Number(product.price_eur).toFixed(2)} €</span>
                {product.compare_at_price && (
                  <span className="text-lg text-muted-foreground line-through">
                    {Number(product.compare_at_price).toFixed(2)} €
                  </span>
                )}
              </div>

              <p className="text-muted-foreground mb-6">{description}</p>

              <ul className="space-y-2 mb-6">
                {features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" /> {f}
                  </li>
                ))}
              </ul>

              <Card className="p-4 rounded-2xl space-y-3">
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium">{en ? "Qty" : "Qté"}</label>
                  <div className="flex items-center border rounded-lg">
                    <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-3 py-1.5 hover:bg-muted">−</button>
                    <span className="px-4 font-semibold">{qty}</span>
                    <button onClick={() => setQty((q) => Math.min(20, q + 1))} className="px-3 py-1.5 hover:bg-muted">+</button>
                  </div>
                </div>
                <Input
                  type="email"
                  placeholder={en ? "Email for order" : "Email pour la commande"}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Button
                  size="lg"
                  onClick={handleCheckout}
                  disabled={paying}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-base"
                >
                  {paying ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      {en ? "Buy now" : "Acheter maintenant"} — {(product.price_eur * qty).toFixed(2)} €
                    </>
                  )}
                </Button>
              </Card>

              <div className="grid grid-cols-3 gap-2 mt-5 text-xs">
                <div className="flex items-center gap-1.5 p-2 rounded-lg bg-muted/50">
                  <Truck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{en ? "Free FR ship" : "Livraison FR offerte"}</span>
                </div>
                <div className="flex items-center gap-1.5 p-2 rounded-lg bg-muted/50">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{en ? "Secure pay" : "Paiement sécurisé"}</span>
                </div>
                <div className="flex items-center gap-1.5 p-2 rounded-lg bg-muted/50">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>iOS & Android</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
