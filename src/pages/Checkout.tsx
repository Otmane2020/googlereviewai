import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { StarlinkoLogo } from "@/components/StarlinkoLogo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  ArrowLeft,
  Lock,
  Gift,
  Sparkles,
  Check,
  Zap,
  FileText,
  CreditCard,
} from "lucide-react";

// Available modules for upsell
const AVAILABLE_MODULES = [
  {
    priceKeyMonthly: "aeo_monthly",
    priceKeyYearly: "aeo_yearly",
    name: "ChatGPT Rank (AEO)",
    description: "Soyez cité par ChatGPT, Perplexity & Google AI",
    priceMonthly: 49,
    priceYearly: 39.2,
    icon: Zap,
    badge: "83% des pros l'utilisent",
    preChecked: true,
  },
  {
    priceKeyMonthly: "seo_monthly",
    priceKeyYearly: "seo_yearly",
    name: "SEO AutoPost",
    description: "1 article SEO optimisé publié automatiquement/jour",
    priceMonthly: 49,
    priceYearly: 39.2,
    icon: FileText,
    badge: null,
    preChecked: false,
  },
];

// Credit packs for upsell
const CREDIT_PACKS = [
  { priceKey: "credits_100", name: "100 crédits bonus", price: 29, credits: 100 },
  { priceKey: "credits_330", name: "330 crédits bonus", price: 89, credits: 330, badge: "Populaire" },
];

const Checkout = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const {
    items,
    billingCycle,
    setBillingCycle,
    addItem,
    removeItem,
    updateQuantity,
    toggleItem,
    hasItem,
    totalToday,
    totalRecurring,
    hasTrialPlan,
    clearCart,
  } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  // If cart is empty, redirect to choose plan
  useEffect(() => {
    if (!loading && items.length === 0) {
      navigate("/choose-plan");
    }
  }, [items, loading, navigate]);

  const hasPlan = items.some((item) => item.type === "plan");
  const planItem = items.find((item) => item.type === "plan");

  const handleToggleBilling = (checked: boolean) => {
    const newCycle = checked ? "yearly" : "monthly";
    setBillingCycle(newCycle);
    
    // Update all items with the new billing cycle prices
    items.forEach((item) => {
      if (item.isRecurring) {
        const priceKey = item.priceKey.replace("_monthly", "").replace("_yearly", "");
        const newPriceKey = `${priceKey}_${newCycle === "yearly" ? "yearly" : "monthly"}`;
        
        // Get new price based on product
        let newPrice = item.price;
        if (item.type === "plan") {
          if (priceKey === "starter") newPrice = newCycle === "yearly" ? 28.7 : 2.99;
          if (priceKey === "pro") newPrice = newCycle === "yearly" ? 287.9 : 29.99;
          if (priceKey === "business") newPrice = newCycle === "yearly" ? 950.4 : 99;
        } else if (item.type === "module") {
          newPrice = newCycle === "yearly" ? 39.2 : 49;
        }
        
        updateQuantity(item.id, item.quantity); // Trigger re-render
      }
    });
  };

  const handleToggleModule = (module: (typeof AVAILABLE_MODULES)[0]) => {
    const priceKey = billingCycle === "yearly" ? module.priceKeyYearly : module.priceKeyMonthly;
    const price = billingCycle === "yearly" ? module.priceYearly : module.priceMonthly;

    toggleItem({
      type: "module",
      priceKey,
      name: module.name,
      description: module.description,
      price,
      quantity: 1,
      isRecurring: true,
      interval: billingCycle === "yearly" ? "year" : "month",
    });
  };

  const handleAddCredits = (pack: (typeof CREDIT_PACKS)[0]) => {
    if (hasItem(pack.priceKey)) {
      // Remove if already in cart
      const item = items.find((i) => i.priceKey === pack.priceKey);
      if (item) removeItem(item.id);
    } else {
      addItem({
        type: "credits",
        priceKey: pack.priceKey,
        name: pack.name,
        description: `${pack.credits} crédits IA supplémentaires`,
        price: pack.price,
        quantity: 1,
        isRecurring: false,
      });
    }
  };

  const handleProceedToPayment = async () => {
    if (!user || items.length === 0) return;

    setIsProcessing(true);
    try {
      // Build the cart items for checkout
      const cartItems = items.map((item) => ({
        priceKey: item.priceKey,
        quantity: item.quantity,
      }));

      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          items: cartItems,
          successUrl: `${window.location.origin}/dashboard?success=true`,
          cancelUrl: `${window.location.origin}/checkout?canceled=true`,
        },
      });

      if (error) throw error;
      if (data?.url) {
        clearCart();
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Erreur lors du paiement. Veuillez réessayer.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 safe-area-insets">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/choose-plan")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
            <StarlinkoLogo showBadge={false} />
          </div>
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground hidden sm:inline">
              Paiement 100% sécurisé
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <ShoppingCart className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Votre panier Starlinko</h1>
            <p className="text-muted-foreground text-sm">
              Personnalisez votre solution avant de payer
            </p>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column - Cart Items */}
          <div className="lg:col-span-2 space-y-6">
            {/* Billing Toggle */}
            <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
              <CardContent className="py-4 flex items-center justify-between">
                <div>
                  <span className="font-medium">Facturation</span>
                  <p className="text-sm text-muted-foreground">
                    Économisez 20% avec l'abonnement annuel
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={billingCycle === "monthly" ? "font-semibold" : "text-muted-foreground"}>
                    Mensuel
                  </span>
                  <Switch
                    checked={billingCycle === "yearly"}
                    onCheckedChange={handleToggleBilling}
                  />
                  <span className={billingCycle === "yearly" ? "font-semibold" : "text-muted-foreground"}>
                    Annuel
                    <Badge variant="secondary" className="ml-2 bg-secondary/20 text-secondary">
                      -20%
                    </Badge>
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Plan Item */}
            {planItem && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-secondary" />
                    Plan choisi
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">{planItem.name}</h3>
                      <p className="text-sm text-muted-foreground">{planItem.description}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-bold text-primary">
                        {planItem.price}€
                      </span>
                      <span className="text-muted-foreground">/{billingCycle === "yearly" ? "an" : "mois"}</span>
                    </div>
                  </div>
                  {hasTrialPlan && (
                    <div className="mt-3 flex items-center gap-2 text-sm text-secondary">
                      <Gift className="h-4 w-4" />
                      Essai gratuit 3 jours inclus
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Upsell Modules */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="h-5 w-5 text-accent" />
                  Options recommandées
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {AVAILABLE_MODULES.map((module) => {
                  const priceKey = billingCycle === "yearly" ? module.priceKeyYearly : module.priceKeyMonthly;
                  const isSelected = hasItem(priceKey);
                  const price = billingCycle === "yearly" ? module.priceYearly : module.priceMonthly;
                  const Icon = module.icon;

                  return (
                    <div
                      key={module.priceKeyMonthly}
                      className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                        isSelected
                          ? "border-secondary bg-secondary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                      onClick={() => handleToggleModule(module)}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            isSelected ? "bg-secondary text-secondary-foreground" : "bg-muted"
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{module.name}</h4>
                            {module.badge && (
                              <Badge variant="outline" className="text-xs bg-accent/10 text-accent border-accent/30">
                                💡 {module.badge}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{module.description}</p>
                          
                          {/* Quantity selector for per-establishment modules */}
                          {isSelected && (
                            <div className="mt-3 flex items-center gap-3">
                              <span className="text-sm text-muted-foreground">📍 Établissements:</span>
                              <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const item = items.find((i) => i.priceKey === priceKey);
                                    if (item && item.quantity > 1) {
                                      updateQuantity(item.id, item.quantity - 1);
                                    }
                                  }}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="w-8 text-center font-medium">
                                  {items.find((i) => i.priceKey === priceKey)?.quantity || 1}
                                </span>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const item = items.find((i) => i.priceKey === priceKey);
                                    if (item) {
                                      updateQuantity(item.id, item.quantity + 1);
                                    }
                                  }}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-lg">+{price}€</span>
                          <span className="text-muted-foreground text-sm">/{billingCycle === "yearly" ? "an" : "mois"}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Credit Packs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Crédits supplémentaires
                  <Badge variant="outline" className="ml-2">One-time</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                {CREDIT_PACKS.map((pack) => {
                  const isSelected = hasItem(pack.priceKey);
                  return (
                    <div
                      key={pack.priceKey}
                      className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                      onClick={() => handleAddCredits(pack)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{pack.name}</span>
                            {pack.badge && (
                              <Badge variant="secondary" className="text-xs">{pack.badge}</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">Achat unique</p>
                        </div>
                        <span className="font-bold text-lg">{pack.price}€</span>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24 bg-gradient-to-br from-card to-muted/30">
              <CardHeader>
                <CardTitle className="text-lg">Récapitulatif</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Items list */}
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-start justify-between text-sm">
                      <div className="flex-1">
                        <span className="font-medium">{item.name}</span>
                        {item.quantity > 1 && (
                          <span className="text-muted-foreground ml-1">×{item.quantity}</span>
                        )}
                        {item.isRecurring && (
                          <span className="text-muted-foreground block text-xs">
                            /{item.interval === "year" ? "an" : "mois"}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span>{(item.price * item.quantity).toFixed(2)}€</span>
                        {item.type !== "plan" && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 text-destructive hover:text-destructive"
                            onClick={() => removeItem(item.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Totals */}
                {hasTrialPlan && (
                  <div className="bg-secondary/10 rounded-lg p-3 text-center">
                    <Gift className="h-5 w-5 mx-auto text-secondary mb-1" />
                    <span className="text-sm font-medium text-secondary">
                      🎁 Essai gratuit 3 jours
                    </span>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total aujourd'hui</span>
                    <span className="text-2xl font-bold">
                      {hasTrialPlan ? "0" : totalToday.toFixed(2)}€
                    </span>
                  </div>
                  {totalRecurring > 0 && (
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Puis</span>
                      <span>{totalRecurring.toFixed(2)}€/{billingCycle === "yearly" ? "an" : "mois"}</span>
                    </div>
                  )}
                </div>

                <Button
                  className="w-full h-12 text-base font-semibold"
                  size="lg"
                  onClick={handleProceedToPayment}
                  disabled={isProcessing || items.length === 0}
                >
                  {isProcessing ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  ) : (
                    <>
                      <Lock className="mr-2 h-4 w-4" />
                      Continuer vers le paiement
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  🔒 Paiement sécurisé par Stripe
                  <br />
                  ❌ Annulation en 1 clic à tout moment
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Checkout;
