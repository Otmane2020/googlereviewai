import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2, Lock, ShieldCheck, Truck } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { SHOP_IMAGES } from "@/assets/shop";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import StripePaymentForm from "@/components/StripePaymentForm";

const COUNTRIES = [
  { code: "FR", name: "France" },
  { code: "BE", name: "Belgique" },
  { code: "LU", name: "Luxembourg" },
  { code: "CH", name: "Suisse" },
  { code: "DE", name: "Allemagne" },
  { code: "ES", name: "Espagne" },
  { code: "IT", name: "Italie" },
  { code: "PT", name: "Portugal" },
  { code: "NL", name: "Pays-Bas" },
  { code: "GB", name: "Royaume-Uni" },
  { code: "IE", name: "Irlande" },
  { code: "AT", name: "Autriche" },
  { code: "SE", name: "Suède" },
  { code: "NO", name: "Norvège" },
  { code: "DK", name: "Danemark" },
  { code: "FI", name: "Finlande" },
  { code: "PL", name: "Pologne" },
  { code: "US", name: "États-Unis" },
  { code: "CA", name: "Canada" },
  { code: "MA", name: "Maroc" },
  { code: "TN", name: "Tunisie" },
  { code: "DZ", name: "Algérie" },
  { code: "SN", name: "Sénégal" },
  { code: "CI", name: "Côte d'Ivoire" },
];

type CheckoutState = {
  slug: string;
  quantity: number;
  config: Record<string, string>;
};

export default function ShopCheckout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { i18n } = useTranslation();
  const en = i18n.language?.startsWith("en");

  const state = (location.state || {}) as Partial<CheckoutState>;
  const slug = state.slug;
  const quantity = Math.max(1, Math.min(20, Number(state.quantity || 1)));
  const config = state.config || {};

  const [product, setProduct] = useState<any | null>(null);
  const [loadingProduct, setLoadingProduct] = useState(true);

  // Customer + shipping
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("");
  const [postal, setPostal] = useState("");
  const [country, setCountry] = useState("FR");

  // Payment state
  const [submitting, setSubmitting] = useState(false);
  const [paymentData, setPaymentData] = useState<{
    clientSecret: string;
    publishableKey: string;
    amount: number;
    subtotal: number;
    shipping_cost: number;
    shipping_label: string;
  } | null>(null);

  useEffect(() => {
    if (!slug) {
      navigate("/shop");
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("shop_products").select("*").eq("slug", slug).eq("is_active", true).maybeSingle();
      setProduct(data);
      setLoadingProduct(false);
      const { data: u } = await supabase.auth.getUser();
      if (u?.user?.email) setEmail(u.user.email);
    })();
  }, [slug, navigate]);

  const subtotal = useMemo(
    () => (product ? Number(product.price_eur) * quantity : 0),
    [product, quantity]
  );

  // Indicative shipping (server is source of truth)
  const indicativeShipping = useMemo(() => {
    const tiers: Record<string, number> = {
      FR: 0, BE: 6.99, LU: 6.99, DE: 6.99, NL: 6.99,
      CH: 9.99, ES: 9.99, IT: 9.99, GB: 9.99, PT: 9.99, IE: 9.99, AT: 9.99, SE: 9.99, NO: 9.99, DK: 9.99, FI: 9.99, PL: 9.99, CZ: 9.99,
      US: 14.99, CA: 14.99,
    };
    return tiers[country] ?? 19.99;
  }, [country]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) return toast.error(en ? "Invalid email" : "Email invalide");
    if (!name.trim()) return toast.error(en ? "Name required" : "Nom requis");
    if (!phone.trim()) return toast.error(en ? "Phone required" : "Téléphone requis");
    if (!line1.trim() || !city.trim() || !postal.trim()) return toast.error(en ? "Address required" : "Adresse incomplète");

    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-shop-checkout", {
        body: {
          slug,
          quantity,
          email,
          config,
          shipping: { name, phone, line1, line2, city, postal_code: postal, country },
        },
      });
      if (error) throw error;
      if (!data?.clientSecret) throw new Error("Réponse invalide");
      setPaymentData(data);
      setTimeout(() => {
        document.getElementById("payment-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (err: any) {
      toast.error(err.message || "Erreur");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingProduct) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">{en ? "Product not found" : "Produit introuvable"}</p>
          <Button onClick={() => navigate("/shop")}>← {en ? "Back to shop" : "Retour boutique"}</Button>
        </div>
      </div>
    );
  }

  const image = SHOP_IMAGES[product.slug];
  const total = subtotal + (paymentData?.shipping_cost ?? indicativeShipping);

  return (
    <>
      <Helmet>
        <title>{en ? "Checkout — Ranki.ai" : "Commande — Ranki.ai"}</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <Header />

      <main className="min-h-screen bg-muted/20">
        <div className="container max-w-6xl mx-auto px-4 py-6">
          <Link to={`/shop/${slug}`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="w-4 h-4" />
            {en ? "Back to product" : "Retour au produit"}
          </Link>

          <h1 className="text-2xl md:text-3xl font-bold mb-6">
            {en ? "Checkout" : "Finaliser la commande"}
          </h1>

          <div className="grid lg:grid-cols-[1fr_380px] gap-6">
            {/* LEFT — form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Contact */}
              <Card className="p-5 rounded-2xl">
                <h2 className="font-semibold mb-4">{en ? "Contact" : "Contact"}</h2>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email *</Label>
                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={!!paymentData} placeholder="vous@email.com" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="phone">{en ? "Phone" : "Téléphone"} *</Label>
                    <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required disabled={!!paymentData} placeholder="+33 6 12 34 56 78" />
                  </div>
                </div>
              </Card>

              {/* Shipping */}
              <Card className="p-5 rounded-2xl">
                <h2 className="font-semibold mb-4 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-emerald-600" />
                  {en ? "Shipping address" : "Adresse de livraison"}
                </h2>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="name">{en ? "Full name" : "Nom complet"} *</Label>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required disabled={!!paymentData} placeholder="Jean Dupont" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="line1">{en ? "Address" : "Adresse"} *</Label>
                    <Input id="line1" value={line1} onChange={(e) => setLine1(e.target.value)} required disabled={!!paymentData} placeholder="12 rue de la Paix" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="line2">{en ? "Apt, suite, etc. (optional)" : "Complément (optionnel)"}</Label>
                    <Input id="line2" value={line2} onChange={(e) => setLine2(e.target.value)} disabled={!!paymentData} placeholder="Appt 3B" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="postal">{en ? "Postal code" : "Code postal"} *</Label>
                      <Input id="postal" value={postal} onChange={(e) => setPostal(e.target.value)} required disabled={!!paymentData} placeholder="75001" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="city">{en ? "City" : "Ville"} *</Label>
                      <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} required disabled={!!paymentData} placeholder="Paris" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>{en ? "Country" : "Pays"} *</Label>
                    <Select value={country} onValueChange={setCountry} disabled={!!paymentData}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {COUNTRIES.map((c) => (
                          <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </Card>

              {!paymentData && (
                <Button
                  type="submit"
                  size="lg"
                  disabled={submitting}
                  className="w-full h-14 text-base bg-emerald-600 hover:bg-emerald-700"
                >
                  {submitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Lock className="w-4 h-4 mr-2" />
                      {en ? "Continue to payment" : "Continuer vers le paiement"}
                    </>
                  )}
                </Button>
              )}
            </form>

            {/* RIGHT — order summary */}
            <aside className="space-y-4">
              <Card className="p-5 rounded-2xl sticky top-4">
                <h2 className="font-semibold mb-4">{en ? "Order summary" : "Récapitulatif"}</h2>
                <div className="flex gap-3 mb-4">
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-muted shrink-0">
                    {image && <img src={image} alt={product.name} className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm leading-tight">{product.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Qté : {quantity}</p>
                    {Object.keys(config).length > 0 && (
                      <p className="text-[11px] text-muted-foreground mt-1 truncate">
                        {Object.values(config)[0]}
                      </p>
                    )}
                  </div>
                  <p className="font-semibold text-sm">{subtotal.toFixed(2)} €</p>
                </div>

                <div className="border-t pt-3 space-y-2 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>{en ? "Subtotal" : "Sous-total"}</span>
                    <span>{subtotal.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>{en ? "Shipping" : "Livraison"}</span>
                    <span>
                      {(paymentData?.shipping_cost ?? indicativeShipping) === 0
                        ? (en ? "Free" : "Offerte")
                        : `${(paymentData?.shipping_cost ?? indicativeShipping).toFixed(2)} €`}
                    </span>
                  </div>
                  {paymentData?.shipping_label && (
                    <p className="text-[11px] text-muted-foreground">{paymentData.shipping_label}</p>
                  )}
                  <div className="border-t pt-2 flex justify-between font-bold text-base">
                    <span>Total</span>
                    <span>{total.toFixed(2)} €</span>
                  </div>
                </div>

                <div className="mt-4 space-y-1.5 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    {en ? "Secure payment via Stripe" : "Paiement sécurisé via Stripe"}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-emerald-600" />
                    {en ? "Programmed & shipped in 24-48h" : "Programmée & expédiée sous 24-48h"}
                  </div>
                </div>
              </Card>
            </aside>
          </div>

          {/* Payment section */}
          {paymentData && (
            <div id="payment-section" className="mt-8 max-w-2xl mx-auto">
              <Card className="p-5 md:p-6 rounded-2xl">
                <h2 className="font-semibold mb-4 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-600" />
                  {en ? "Payment" : "Paiement"}
                </h2>
                <StripePaymentForm
                  clientSecret={paymentData.clientSecret}
                  publishableKey={paymentData.publishableKey}
                  amount={paymentData.amount}
                  email={email}
                  returnUrl={`${window.location.origin}/payment-success?order_id=${encodeURIComponent(slug || "")}`}
                />
              </Card>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
