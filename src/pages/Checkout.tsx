import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { StarlinkoLogo } from "@/components/StarlinkoLogo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
  ChevronRight,
} from "lucide-react";

// Available modules for upsell
const AVAILABLE_MODULES = [
  {
    priceKeyMonthly: "aeo_monthly",
    priceKeyYearly: "aeo_yearly",
    name: "ChatGPT Rank (AEO)",
    description: "Soyez cité par ChatGPT & Perplexity",
    priceMonthly: 49,
    priceYearly: 39.2,
    icon: Zap,
    badge: "83% des pros",
    preChecked: true,
  },
  {
    priceKeyMonthly: "seo_monthly",
    priceKeyYearly: "seo_yearly",
    name: "SEO AutoPost",
    description: "1 article SEO/jour auto-publié",
    priceMonthly: 49,
    priceYearly: 39.2,
    icon: FileText,
    badge: null,
    preChecked: false,
  },
];

// Credit packs for upsell
const CREDIT_PACKS = [
  { priceKey: "credits_100", name: "100 crédits", price: 29, credits: 100 },
  { priceKey: "credits_330", name: "330 crédits", price: 89, credits: 330, badge: "Populaire" },
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

  useEffect(() => {
    if (!loading && items.length === 0) {
      navigate("/choose-plan");
    }
  }, [items, loading, navigate]);

  const planItem = items.find((item) => item.type === "plan");

  const handleToggleBilling = (checked: boolean) => {
    const newCycle = checked ? "yearly" : "monthly";
    setBillingCycle(newCycle);
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
      const item = items.find((i) => i.priceKey === pack.priceKey);
      if (item) removeItem(item.id);
    } else {
      addItem({
        type: "credits",
        priceKey: pack.priceKey,
        name: pack.name,
        description: `${pack.credits} crédits IA`,
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
      // Check if user already has an active subscription
      const { data: profile } = await supabase
        .from("profiles")
        .select("plan_name, subscription_status")
        .eq("id", user.id)
        .maybeSingle();

      const hasActiveSubscription = profile?.subscription_status === "active" || profile?.subscription_status === "trialing";
      
      // Separate plan items from module items
      const planItems = items.filter((item) => item.type === "plan");
      const moduleItems = items.filter((item) => item.type === "module");
      const creditItems = items.filter((item) => item.type === "credits");

      // If user has active subscription and only adding modules (no new plan), use add-subscription-item
      if (hasActiveSubscription && planItems.length === 0 && moduleItems.length > 0) {
        console.log("[Checkout] User has active subscription, adding modules to existing subscription");
        
        // Add each module to existing subscription
        for (const moduleItem of moduleItems) {
          const { data, error } = await supabase.functions.invoke("add-subscription-item", {
            body: {
              priceKey: moduleItem.priceKey,
              quantity: moduleItem.quantity,
            },
          });

          if (error) throw error;
          if (!data?.success) throw new Error(data?.error || "Failed to add module");
        }

        // Handle credit packs separately if any (one-time purchase)
        if (creditItems.length > 0) {
          const { data, error } = await supabase.functions.invoke("create-checkout", {
            body: {
              items: creditItems.map((item) => ({
                priceKey: item.priceKey,
                quantity: item.quantity,
              })),
              successUrl: `${window.location.origin}/dashboard?success=true`,
              cancelUrl: `${window.location.origin}/checkout?canceled=true`,
            },
          });

          if (error) throw error;
          if (data?.url) {
            clearCart();
            window.location.href = data.url;
            return;
          }
        }

        // Track LinkedIn conversion
        if (typeof window !== 'undefined' && (window as any).lintrk) {
          (window as any).lintrk('track', { conversion_id: 21122002 });
        }

        toast.success("Modules ajoutés à votre abonnement !");
        clearCart();
        navigate("/dashboard?success=true");
        return;
      }

      // Standard checkout flow for new subscriptions or plans
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
        // Track LinkedIn conversion for purchase
        if (typeof window !== 'undefined' && (window as any).lintrk) {
          (window as any).lintrk('track', { conversion_id: 21122002 });
        }
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
    <div className="min-h-screen bg-muted/30 safe-area-insets pb-32">
      {/* Mobile Header - iOS style */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center justify-between px-4 py-3">
          <button 
            onClick={() => navigate("/choose-plan")}
            className="flex items-center gap-1 text-primary font-medium"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="hidden sm:inline">Retour</span>
          </button>
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            <span className="font-semibold">Panier</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Lock className="h-4 w-4" />
          </div>
        </div>
      </header>

      <main className="px-4 py-4 space-y-4 max-w-lg mx-auto">
        {/* Billing Toggle - iOS Segmented Control Style */}
        <div className="bg-card rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm">Facturation</p>
              <p className="text-xs text-muted-foreground">
                -20% en annuel
              </p>
            </div>
            <div className="flex items-center gap-2 bg-muted rounded-full p-1">
              <button
                onClick={() => handleToggleBilling(false)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  billingCycle === "monthly" 
                    ? "bg-card text-foreground shadow-sm" 
                    : "text-muted-foreground"
                }`}
              >
                Mensuel
              </button>
              <button
                onClick={() => handleToggleBilling(true)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${
                  billingCycle === "yearly" 
                    ? "bg-card text-foreground shadow-sm" 
                    : "text-muted-foreground"
                }`}
              >
                Annuel
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-secondary/20 text-secondary">
                  -20%
                </Badge>
              </button>
            </div>
          </div>
        </div>

        {/* Plan Card - iOS Style */}
        {planItem && (
          <div className="bg-card rounded-2xl overflow-hidden shadow-sm">
            <div className="px-4 py-2 bg-secondary/10 border-b border-border/50">
              <div className="flex items-center gap-2 text-xs text-secondary font-medium">
                <Check className="h-3.5 w-3.5" />
                Plan sélectionné
              </div>
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{planItem.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{planItem.description}</p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-primary">{planItem.price}€</span>
                  <span className="text-xs text-muted-foreground">/{billingCycle === "yearly" ? "an" : "mois"}</span>
                </div>
              </div>
              {hasTrialPlan && (
                <div className="mt-3 flex items-center gap-2 bg-secondary/10 text-secondary text-xs font-medium rounded-lg px-3 py-2">
                  <Gift className="h-4 w-4" />
                  3 jours d'essai gratuit
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modules Upsell - iOS Style Cards */}
        <div className="bg-card rounded-2xl overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-border/50">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-accent" />
              <span className="font-semibold text-sm">Options recommandées</span>
            </div>
          </div>
          <div className="divide-y divide-border/50">
            {AVAILABLE_MODULES.map((module) => {
              const priceKey = billingCycle === "yearly" ? module.priceKeyYearly : module.priceKeyMonthly;
              const isSelected = hasItem(priceKey);
              const price = billingCycle === "yearly" ? module.priceYearly : module.priceMonthly;
              const Icon = module.icon;
              const currentItem = items.find((i) => i.priceKey === priceKey);

              return (
                <div key={module.priceKeyMonthly} className="p-4">
                  <div 
                    className="flex items-start gap-3"
                    onClick={() => handleToggleModule(module)}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isSelected ? "bg-secondary text-white" : "bg-muted"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{module.name}</span>
                        {module.badge && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-accent/10 text-accent border-accent/30">
                            💡 {module.badge}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{module.description}</p>
                      
                      {/* Quantity selector */}
                      {isSelected && (
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Établissements:</span>
                          <div className="flex items-center gap-1 bg-muted rounded-lg">
                            <button
                              className="p-1.5 hover:bg-muted-foreground/10 rounded-l-lg transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (currentItem && currentItem.quantity > 1) {
                                  updateQuantity(currentItem.id, currentItem.quantity - 1);
                                }
                              }}
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="w-6 text-center text-sm font-medium">
                              {currentItem?.quantity || 1}
                            </span>
                            <button
                              className="p-1.5 hover:bg-muted-foreground/10 rounded-r-lg transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (currentItem) {
                                  updateQuantity(currentItem.id, currentItem.quantity + 1);
                                }
                              }}
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <span className="font-semibold text-sm">+{price}€</span>
                        <span className="text-[10px] text-muted-foreground block">/{billingCycle === "yearly" ? "an" : "mois"}</span>
                      </div>
                      <Switch 
                        checked={isSelected} 
                        onCheckedChange={() => handleToggleModule(module)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Credit Packs - iOS Style */}
        <div className="bg-card rounded-2xl overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-border/50">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" />
              <span className="font-semibold text-sm">Crédits bonus</span>
              <Badge variant="outline" className="text-[10px] ml-auto">Unique</Badge>
            </div>
          </div>
          <div className="p-3 grid grid-cols-2 gap-2">
            {CREDIT_PACKS.map((pack) => {
              const isSelected = hasItem(pack.priceKey);
              return (
                <button
                  key={pack.priceKey}
                  onClick={() => handleAddCredits(pack)}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-sm">{pack.name}</span>
                    {pack.badge && (
                      <Badge variant="secondary" className="text-[9px] px-1 py-0">{pack.badge}</Badge>
                    )}
                  </div>
                  <span className="font-bold text-primary">{pack.price}€</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Cart Summary - Mobile */}
        <div className="bg-card rounded-2xl p-4 shadow-sm">
          <h3 className="font-semibold text-sm mb-3">Récapitulatif</h3>
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="truncate">{item.name}</span>
                  {item.quantity > 1 && (
                    <span className="text-muted-foreground">×{item.quantity}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-medium">{(item.price * item.quantity).toFixed(2)}€</span>
                  {item.type !== "plan" && (
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-destructive p-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Fixed Bottom CTA - iOS Style */}
      <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-xl border-t border-border/50 p-4 safe-area-bottom">
        <div className="max-w-lg mx-auto">
          {/* Trial Badge */}
          {hasTrialPlan && (
            <div className="flex items-center justify-center gap-2 text-secondary text-xs font-medium mb-3">
              <Gift className="h-4 w-4" />
              <span>🎁 Essai gratuit 3 jours inclus</span>
            </div>
          )}
          
          {/* Pricing Summary */}
          <div className="flex items-end justify-between mb-3">
            <div>
              <p className="text-xs text-muted-foreground">Total aujourd'hui</p>
              <p className="text-2xl font-bold">
                {hasTrialPlan ? "0" : totalToday.toFixed(2)}€
              </p>
            </div>
            {totalRecurring > 0 && (
              <p className="text-sm text-muted-foreground">
                Puis {totalRecurring.toFixed(2)}€/{billingCycle === "yearly" ? "an" : "mois"}
              </p>
            )}
          </div>
          
          {/* CTA Button */}
          <Button
            className="w-full h-14 text-base font-semibold rounded-xl shadow-lg"
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
                <ChevronRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
          
          <p className="text-[10px] text-center text-muted-foreground mt-2">
            🔒 Paiement sécurisé Stripe · Annulation en 1 clic
          </p>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
