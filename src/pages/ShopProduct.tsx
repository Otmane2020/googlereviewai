import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  ChevronRight, Loader2, ShieldCheck, Truck, Smartphone, Sparkles, Check, Star,
  Zap, RefreshCw, Wifi, CreditCard, MapPin,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { SHOP_IMAGES } from "@/assets/shop";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

// Per-platform destination config — what we need to program the NFC chip
type PlatformField = {
  key: string;
  label: string;
  labelEn: string;
  placeholder: string;
  help: string;
  helpEn: string;
  type?: string;
  required?: boolean;
};

const PLATFORM_FIELDS: Record<string, PlatformField[]> = {
  google: [
    {
      key: "google_review_url",
      label: "Lien Google Avis (ou nom de votre établissement)",
      labelEn: "Google Review link (or your business name)",
      placeholder: "https://g.page/r/... ou « Café de la Gare, Paris »",
      help: "Collez votre lien d'avis Google ou indiquez le nom exact tel qu'il apparaît sur Google Maps. Nous trouvons le lien pour vous.",
      helpEn: "Paste your Google review link or your exact business name on Google Maps.",
      required: true,
    },
  ],
  instagram: [
    {
      key: "instagram_handle",
      label: "Pseudo Instagram",
      labelEn: "Instagram handle",
      placeholder: "@votrecompte",
      help: "Nous configurons la puce pour ouvrir directement votre profil Instagram.",
      helpEn: "We program the chip to open your Instagram profile.",
      required: true,
    },
  ],
  tiktok: [
    {
      key: "tiktok_handle",
      label: "Pseudo TikTok",
      labelEn: "TikTok handle",
      placeholder: "@votrecompte",
      help: "Pseudo TikTok complet, sans espace.",
      helpEn: "Your TikTok username.",
      required: true,
    },
  ],
  snapchat: [
    {
      key: "snapchat_username",
      label: "Nom d'utilisateur Snapchat",
      labelEn: "Snapchat username",
      placeholder: "votrecompte",
      help: "Pseudo Snapchat — ajout automatique au scan.",
      helpEn: "Your Snapchat username — auto-add on tap.",
      required: true,
    },
  ],
  linkedin: [
    {
      key: "linkedin_url",
      label: "URL de votre profil LinkedIn",
      labelEn: "LinkedIn profile URL",
      placeholder: "https://www.linkedin.com/in/...",
      help: "Lien complet vers votre profil LinkedIn.",
      helpEn: "Full URL to your LinkedIn profile.",
      required: true,
    },
    {
      key: "display_name",
      label: "Nom à imprimer sur la carte",
      labelEn: "Name printed on the card",
      placeholder: "Jean Dupont",
      help: "Apparaît en doré sur la face avant.",
      helpEn: "Printed in gold on the front.",
      required: true,
    },
    {
      key: "job_title",
      label: "Titre / poste (optionnel)",
      labelEn: "Job title (optional)",
      placeholder: "Directeur Commercial",
      help: "Sous votre nom, en petites capitales.",
      helpEn: "Under your name, in small caps.",
    },
  ],
  paypal: [
    {
      key: "paypal_link",
      label: "Votre lien PayPal.me",
      labelEn: "Your PayPal.me link",
      placeholder: "https://paypal.me/votrecompte",
      help: "Vos clients paient en un scan, sans saisir de RIB.",
      helpEn: "Customers pay in one tap — no card needed.",
      required: true,
    },
  ],
};

export default function ShopProduct() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const en = i18n.language?.startsWith("en");
  const [product, setProduct] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [email, setEmail] = useState("");
  const [config, setConfig] = useState<Record<string, string>>({});
  const [paying, setPaying] = useState(false);

  // Google Business connect state
  const [gmbList, setGmbList] = useState<Array<{ name: string; google_place_id: string; address: string | null }>>([]);
  const [gmbLoading, setGmbLoading] = useState(false);
  const [gmbConnecting, setGmbConnecting] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("shop_products").select("*").eq("slug", slug).eq("is_active", true).maybeSingle();
      setProduct(data);
      setLoading(false);
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session?.user?.email) setEmail(sessionData.session.user.email);

      // If user just came back from Google OAuth (we set a flag) and we have provider_token, fetch GMB list
      const pending = sessionStorage.getItem("ranki_gmb_pending_slug");
      if (pending === slug && sessionData?.session?.provider_token) {
        sessionStorage.removeItem("ranki_gmb_pending_slug");
        await loadGmbList();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const loadGmbList = async () => {
    try {
      setGmbLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.provider_token) {
        toast.error(en ? "Please reconnect Google." : "Veuillez vous reconnecter à Google.");
        return;
      }
      const res = await supabase.functions.invoke("sync-google-businesses", {
        body: { provider_token: session.provider_token },
      });
      const list = (res.data?.google_businesses || res.data?.businesses || []) as any[];
      setGmbList(list.map((b: any) => ({
        name: b.name,
        google_place_id: b.google_place_id || b.place_id,
        address: b.address || null,
      })));
      if (!list.length) toast.info(en ? "No Google Business found." : "Aucun établissement Google trouvé.");
    } catch (e: any) {
      toast.error(e?.message || "Error");
    } finally {
      setGmbLoading(false);
    }
  };

  const connectGoogle = async () => {
    setGmbConnecting(true);
    sessionStorage.setItem("ranki_gmb_pending_slug", slug || "");
    const redirectTo = `${window.location.origin}/shop/${slug}`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        scopes: "https://www.googleapis.com/auth/business.manage https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile",
        queryParams: { access_type: "offline", prompt: "consent" },
      },
    });
    if (error) {
      sessionStorage.removeItem("ranki_gmb_pending_slug");
      toast.error(error.message);
      setGmbConnecting(false);
    }
  };

  const pickGmb = (b: { name: string; google_place_id: string }) => {
    const reviewUrl = `https://search.google.com/local/writereview?placeid=${b.google_place_id}`;
    setConfig((c) => ({ ...c, google_review_url: reviewUrl, google_business_name: b.name, google_place_id: b.google_place_id }));
    toast.success(en ? `Linked to ${b.name}` : `Carte liée à ${b.name}`);
  };

  const fields = useMemo<PlatformField[]>(
    () => (product?.platform ? PLATFORM_FIELDS[product.platform] || [] : []),
    [product?.platform]
  );

  const handleCheckout = async () => {
    // Validate required platform fields
    for (const f of fields) {
      if (f.required && !(config[f.key] || "").trim()) {
        toast.error(en ? `Please fill: ${f.labelEn}` : `Merci de renseigner : ${f.label}`);
        return;
      }
    }
    setPaying(true);
    navigate("/shop/checkout", { state: { slug, quantity: qty, config } });
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

  const seoTitle = en
    ? `${name} — Buy NFC ${product.platform || ""} | Ranki.ai`.slice(0, 60)
    : `${name} — Acheter NFC ${product.platform || ""} | Ranki.ai`.slice(0, 60);
  const seoDesc = (description || "").slice(0, 158);
  const canonical = `https://ranki.ai/shop/${product.slug}`;

  const features = en ? [
    "Compatible iOS & Android (no app required)",
    "Unlimited taps, no battery, lifetime use",
    "Editable destination from your dashboard",
    "Premium PVC / aluminum, scratch resistant",
    "Programmed and shipped in 24-48h",
  ] : [
    "Compatible iOS & Android (sans application)",
    "Utilisations illimitées, sans batterie, à vie",
    "Destination modifiable depuis votre tableau de bord",
    "PVC / aluminium premium, résistant aux rayures",
    "Programmée et expédiée sous 24-48h",
  ];

  const steps = en ? [
    { icon: CreditCard, title: "Order", desc: "Pick your card and pay securely." },
    { icon: Wifi, title: "We program", desc: "We encode your link onto the NFC chip." },
    { icon: Truck, title: "We ship", desc: "Free shipping in France, tracking included." },
    { icon: Zap, title: "Tap & go", desc: "Customers tap their phone — instant action." },
  ] : [
    { icon: CreditCard, title: "Commandez", desc: "Choisissez votre carte et payez en sécurité." },
    { icon: Wifi, title: "On programme", desc: "Nous encodons votre lien sur la puce NFC." },
    { icon: Truck, title: "On expédie", desc: "Livraison France offerte, suivi inclus." },
    { icon: Zap, title: "Scan & action", desc: "Vos clients posent leur téléphone — action immédiate." },
  ];

  const faq = en ? [
    { q: "How does NFC work?", a: "Modern smartphones detect the chip when the phone is near the card — your link opens instantly. No app required." },
    { q: "Can I change the destination later?", a: "Yes. From your Ranki.ai dashboard, you can update the link at any time without re-ordering." },
    { q: "Shipping time?", a: "France: 3-5 business days, free. Europe: 4-7 days. Rest of the world: up to 21 days." },
    { q: "Is it waterproof?", a: "The card is splash resistant. Avoid prolonged immersion." },
  ] : [
    { q: "Comment fonctionne la NFC ?", a: "Les smartphones récents détectent la puce dès que le téléphone est proche — votre lien s'ouvre immédiatement. Aucune application à installer." },
    { q: "Puis-je changer la destination plus tard ?", a: "Oui. Depuis votre tableau de bord Ranki.ai, vous pouvez modifier le lien à tout moment, sans racheter de carte." },
    { q: "Délai de livraison ?", a: "France : 3-5 jours ouvrés, offerte. Europe : 4-7 jours. Reste du monde : jusqu'à 21 jours." },
    { q: "Est-elle étanche ?", a: "Résistante aux éclaboussures. Évitez une immersion prolongée." },
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
              <div className="grid grid-cols-3 gap-2 mt-3">
                <div className="aspect-square bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg overflow-hidden">
                  <img src={image} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="aspect-square rounded-lg bg-muted/50 flex items-center justify-center">
                  <Wifi className="w-6 h-6 text-emerald-600" />
                </div>
                <div className="aspect-square rounded-lg bg-muted/50 flex items-center justify-center">
                  <Smartphone className="w-6 h-6 text-emerald-600" />
                </div>
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
                <span className="text-sm text-muted-foreground">4.9/5 (127 {en ? "reviews" : "avis"})</span>
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

              {/* Platform-specific configuration */}
              {fields.length > 0 && (
                <Card className="p-4 rounded-2xl mb-4 border-emerald-200 bg-emerald-50/30">
                  <div className="flex items-center gap-2 mb-3">
                    <Wifi className="w-4 h-4 text-emerald-700" />
                    <p className="text-sm font-semibold text-emerald-900">
                      {en ? "Program your card" : "Personnalisez votre carte"}
                    </p>
                  </div>
                  <div className="space-y-3">
                    {fields.map((f) => (
                      <div key={f.key} className="space-y-1.5">
                        <Label htmlFor={f.key} className="text-xs">
                          {en ? f.labelEn : f.label}
                          {f.required && <span className="text-red-500 ml-0.5">*</span>}
                        </Label>
                        <Input
                          id={f.key}
                          type={f.type || "text"}
                          placeholder={f.placeholder}
                          value={config[f.key] || ""}
                          onChange={(e) => setConfig((c) => ({ ...c, [f.key]: e.target.value }))}
                          className="bg-background"
                        />
                        <p className="text-[11px] text-muted-foreground">{en ? f.helpEn : f.help}</p>
                      </div>
                    ))}

                    {product.platform === "google" && (
                      <div className="mt-2 pt-3 border-t border-emerald-200/60">
                        <p className="text-[11px] font-medium text-emerald-900 mb-2">
                          {en ? "Or connect your Google account (recommended)" : "Ou connectez votre compte Google (recommandé)"}
                        </p>
                        {gmbList.length === 0 ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={connectGoogle}
                            disabled={gmbConnecting || gmbLoading}
                            className="w-full bg-white"
                          >
                            {gmbConnecting || gmbLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : (
                              <svg className="w-4 h-4 mr-2" viewBox="0 0 48 48" aria-hidden>
                                <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35.5 24 35.5c-6.4 0-11.5-5.1-11.5-11.5S17.6 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.9 6.4 29.2 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5c10.7 0 19.5-7.7 19.5-19.5 0-1.2-.1-2.3-.3-3.5z"/>
                                <path fill="#FF3D00" d="M6.3 14.1l6.6 4.8C14.7 15.1 19 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.9 6.4 29.2 4.5 24 4.5 16.3 4.5 9.7 8.9 6.3 14.1z"/>
                                <path fill="#4CAF50" d="M24 43.5c5.1 0 9.7-1.9 13.2-5.1l-6.1-5c-2 1.4-4.4 2.2-7.1 2.2-5.3 0-9.7-3.1-11.3-7.5l-6.5 5C9.6 39.1 16.2 43.5 24 43.5z"/>
                                <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.4-2.3 4.4-4.2 5.9l6.1 5c-.4.4 6.8-4.9 6.8-14.9 0-1.2-.1-2.3-.3-3.5z"/>
                              </svg>
                            )}
                            {en ? "Sign in with Google" : "Se connecter avec Google"}
                          </Button>
                        ) : (
                          <div className="space-y-1.5 max-h-56 overflow-y-auto">
                            {gmbList.map((b) => (
                              <button
                                key={b.google_place_id}
                                type="button"
                                onClick={() => pickGmb(b)}
                                className={`w-full text-left p-2.5 rounded-lg border transition ${
                                  config.google_place_id === b.google_place_id
                                    ? "border-emerald-600 bg-emerald-50"
                                    : "border-emerald-200 bg-white hover:bg-emerald-50/60"
                                }`}
                              >
                                <p className="text-sm font-medium">{b.name}</p>
                                {b.address && <p className="text-[11px] text-muted-foreground truncate">{b.address}</p>}
                              </button>
                            ))}
                            <button type="button" onClick={loadGmbList} className="text-[11px] text-emerald-700 hover:underline mt-1">
                              {en ? "Refresh list" : "Actualiser la liste"}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              )}

              <Card className="p-4 rounded-2xl space-y-3">
                <div className="flex items-center gap-3">
                  <Label className="text-sm font-medium">{en ? "Qty" : "Qté"}</Label>
                  <div className="flex items-center border rounded-lg">
                    <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-3 py-1.5 hover:bg-muted">−</button>
                    <span className="px-4 font-semibold">{qty}</span>
                    <button onClick={() => setQty((q) => Math.min(20, q + 1))} className="px-3 py-1.5 hover:bg-muted">+</button>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <MapPin className="w-3 h-3" />
                  {en ? "Email, phone & shipping address at next step (secure)" : "Email, téléphone & adresse à l'étape suivante (sécurisé)"}
                </div>
                <Button
                  size="lg"
                  onClick={handleCheckout}
                  disabled={paying}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-base"
                >
                  {paying ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      {en ? "Order now" : "Commander maintenant"} — {(product.price_eur * qty).toFixed(2)} €
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
                  <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{en ? "Editable link" : "Lien modifiable"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* How it works */}
          <section className="mt-16">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-2">
              {en ? "How it works" : "Comment ça marche"}
            </h2>
            <p className="text-center text-muted-foreground mb-8">
              {en ? "From order to first tap, in 4 steps." : "De la commande au premier scan, en 4 étapes."}
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {steps.map((s, i) => {
                const Icon = s.icon;
                return (
                  <Card key={i} className="p-5 rounded-2xl text-center">
                    <div className="w-12 h-12 mx-auto rounded-xl bg-emerald-100 flex items-center justify-center mb-3">
                      <Icon className="w-6 h-6 text-emerald-700" />
                    </div>
                    <p className="font-semibold text-sm mb-1">{i + 1}. {s.title}</p>
                    <p className="text-xs text-muted-foreground">{s.desc}</p>
                  </Card>
                );
              })}
            </div>
          </section>

          {/* Trust strip */}
          <section className="mt-12 grid sm:grid-cols-3 gap-4">
            <Card className="p-5 rounded-2xl">
              <Star className="w-5 h-5 text-amber-500 fill-amber-500 mb-2" />
              <p className="font-semibold text-sm">4.9/5 — 127 {en ? "reviews" : "avis"}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {en ? "Trusted by 1,200+ pros across Europe." : "Plébiscité par 1 200+ pros en Europe."}
              </p>
            </Card>
            <Card className="p-5 rounded-2xl">
              <Truck className="w-5 h-5 text-emerald-600 mb-2" />
              <p className="font-semibold text-sm">{en ? "Shipped in 24-48h" : "Expédiée sous 24-48h"}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {en ? "Programmed before shipping, ready to use." : "Programmée avant expédition, prête à l'emploi."}
              </p>
            </Card>
            <Card className="p-5 rounded-2xl">
              <ShieldCheck className="w-5 h-5 text-emerald-600 mb-2" />
              <p className="font-semibold text-sm">{en ? "30-day guarantee" : "Garantie 30 jours"}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {en ? "Defective? We replace it for free." : "Défectueuse ? Nous la remplaçons gratuitement."}
              </p>
            </Card>
          </section>

          {/* Use cases */}
          <section className="mt-16">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-2">
              {en ? "Perfect for" : "Idéal pour"}
            </h2>
            <p className="text-center text-muted-foreground mb-8">
              {en ? "Boost your visibility wherever your customers are." : "Boostez votre visibilité partout où sont vos clients."}
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {(en
                ? [
                    { t: "Restaurants & cafés", d: "On the table — 3× more reviews per week." },
                    { t: "Hair & beauty salons", d: "At checkout — clients tap before leaving." },
                    { t: "Hotels & B&Bs", d: "On the reception desk — instant 5-star reviews." },
                    { t: "Retail & boutiques", d: "Next to the till — turn happy buyers into ambassadors." },
                  ]
                : [
                    { t: "Restaurants & cafés", d: "Sur la table — 3× plus d'avis par semaine." },
                    { t: "Salons coiffure / beauté", d: "À l'encaissement — clients scannent avant de partir." },
                    { t: "Hôtels & chambres d'hôtes", d: "Sur la réception — avis 5★ immédiats." },
                    { t: "Boutiques & retail", d: "Près de la caisse — transformez vos clients en ambassadeurs." },
                  ]
              ).map((u, i) => (
                <Card key={i} className="p-5 rounded-2xl">
                  <p className="font-semibold text-sm mb-1">{u.t}</p>
                  <p className="text-xs text-muted-foreground">{u.d}</p>
                </Card>
              ))}
            </div>
          </section>

          {/* Testimonials */}
          <section className="mt-16 max-w-5xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
              {en ? "What our customers say" : "Ils en parlent mieux que nous"}
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              {(en
                ? [
                    { n: "Sophie L.", r: "Café owner, Lyon", t: "We went from 2 reviews/month to 18. The tap effect really works." },
                    { n: "Marc D.", r: "Hair salon, Paris", t: "Setup in 2 minutes. Clients love the gold finish — it looks premium." },
                    { n: "Inès K.", r: "Hotel, Nice", t: "ROI in one week. Now we order one per room." },
                  ]
                : [
                    { n: "Sophie L.", r: "Gérante de café, Lyon", t: "On est passé de 2 avis/mois à 18. L'effet « scan » fonctionne vraiment." },
                    { n: "Marc D.", r: "Salon de coiffure, Paris", t: "Installé en 2 minutes. Les clients adorent la finition dorée — ça fait premium." },
                    { n: "Inès K.", r: "Hôtel, Nice", t: "ROI en une semaine. On en commande une par chambre maintenant." },
                  ]
              ).map((tm, i) => (
                <Card key={i} className="p-5 rounded-2xl">
                  <div className="flex mb-2">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm mb-3 italic">"{tm.t}"</p>
                  <p className="text-xs font-semibold">{tm.n}</p>
                  <p className="text-[11px] text-muted-foreground">{tm.r}</p>
                </Card>
              ))}
            </div>
          </section>

          {/* Final CTA */}
          <section className="mt-16 text-center bg-gradient-to-br from-emerald-50 via-amber-50 to-emerald-50 rounded-3xl p-8 md:p-12">
            <Sparkles className="w-8 h-8 mx-auto text-emerald-600 mb-3" />
            <h2 className="text-2xl md:text-3xl font-bold mb-2">
              {en ? "Ready to multiply your reviews?" : "Prêt à multiplier vos avis ?"}
            </h2>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
              {en
                ? "Join 1,200+ businesses turning every visit into a 5-star review."
                : "Rejoignez 1 200+ établissements qui transforment chaque visite en avis 5★."}
            </p>
            <Button
              size="lg"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {en ? `Order for ${Number(product.price_eur).toFixed(2)} €` : `Commander pour ${Number(product.price_eur).toFixed(2)} €`}
            </Button>
          </section>

          {/* FAQ */}
          <section className="mt-12 max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-6">FAQ</h2>
            <Accordion type="single" collapsible className="w-full">
              {faq.map((item, i) => (
                <AccordionItem key={i} value={`item-${i}`}>
                  <AccordionTrigger className="text-left">{item.q}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">{item.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
        </div>
      </main>

      <Footer />
    </>
  );
}
