import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, Coins, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { InAppSubscriptionNotice } from "@/components/InAppSubscriptionNotice";
import {
  PLAY_CREDIT_SKUS,
  PLAY_SUBSCRIPTION_SKUS,
  formatPlayPrice,
  getPlayBillingService,
  purchaseWithPlay,
  type PlayItemDetails,
} from "@/lib/playBilling";

type Billing = "monthly" | "yearly";

const PLAN_FEATURES: Record<string, { fr: string[]; en: string[] }> = {
  starter: {
    fr: ["1 établissement", "Réponses IA 24/7 aux avis Google", "50 crédits / mois"],
    en: ["1 location", "24/7 AI replies to Google reviews", "50 credits / month"],
  },
  pro: {
    fr: ["Jusqu'à 3 établissements", "GEO Rank quotidien", "Posts SEO + Q&R AEO automatiques"],
    en: ["Up to 3 locations", "Daily GEO ranking", "Automatic SEO posts + AEO Q&A"],
  },
  business: {
    fr: ["Établissements illimités", "GEO + SEO/AEO illimités", "Support dédié"],
    en: ["Unlimited locations", "Unlimited GEO + SEO/AEO", "Dedicated support"],
  },
};

// Plans and credit packs sold through Google Play Billing (Android app only).
export const PlayBillingPlans = ({ currentPlan }: { currentPlan?: string }) => {
  const { i18n } = useTranslation();
  const isEN = i18n.language?.toLowerCase().startsWith("en");
  const locale = isEN ? "en-US" : "fr-FR";
  const [items, setItems] = useState<PlayItemDetails[] | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const [billing, setBilling] = useState<Billing>("monthly");
  const [loadingSku, setLoadingSku] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const service = await getPlayBillingService();
      if (!service) {
        if (!cancelled) setUnavailable(true);
        return;
      }
      try {
        const details = await service.getDetails([...PLAY_SUBSCRIPTION_SKUS, ...PLAY_CREDIT_SKUS]);
        if (!cancelled) setItems(details);
      } catch (e) {
        console.error("[PlayBillingPlans] getDetails failed:", e);
        if (!cancelled) setUnavailable(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const buy = async (sku: string) => {
    setLoadingSku(sku);
    try {
      const purchased = await purchaseWithPlay(sku);
      if (purchased) {
        toast({ title: isEN ? "Purchase confirmed" : "Achat confirmé" });
        window.location.href = sku.startsWith("credits_") ? "/dashboard?credits_success=true" : "/dashboard?success=true";
      }
    } catch (e) {
      console.error("[PlayBillingPlans] purchase failed:", e);
      toast({
        title: isEN ? "Error" : "Erreur",
        description: isEN ? "The purchase could not be completed." : "L'achat n'a pas pu être finalisé.",
        variant: "destructive",
      });
    } finally {
      setLoadingSku(null);
    }
  };

  if (unavailable) return <InAppSubscriptionNotice />;
  if (!items) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const byId = new Map(items.map((i) => [i.itemId, i]));
  const suffix = billing === "yearly" ? "_yearly" : "_monthly";
  const plans = (["starter", "pro", "business"] as const)
    .map((id) => ({ id, item: byId.get(`ranki_${id}${suffix}`) }))
    .filter((p): p is { id: "starter" | "pro" | "business"; item: PlayItemDetails } => !!p.item);
  const packs = PLAY_CREDIT_SKUS.map((sku) => byId.get(sku)).filter((i): i is PlayItemDetails => !!i);
  const current = currentPlan?.toLowerCase() ?? "";

  return (
    <div className="space-y-5">
      <div className="flex justify-center">
        <div className="inline-flex items-center p-1 rounded-full bg-muted border border-border">
          {(["monthly", "yearly"] as const).map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => setBilling(b)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                billing === b ? "bg-foreground text-background" : "text-muted-foreground"
              }`}
            >
              {b === "monthly" ? (isEN ? "Monthly" : "Mensuel") : isEN ? "Yearly" : "Annuel"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        {plans.map(({ id, item }) => {
          const isCurrent = current.startsWith(id);
          return (
            <div
              key={item.itemId}
              className={`rounded-2xl border p-4 flex flex-col ${id === "pro" ? "border-2 border-primary bg-primary/5" : "border-border bg-card"}`}
            >
              <h3 className="font-bold text-foreground capitalize">{id}</h3>
              <div className="mt-1 text-2xl font-extrabold text-foreground">
                {formatPlayPrice(item.price, locale)}
                <span className="text-xs font-normal text-muted-foreground">
                  {billing === "yearly" ? (isEN ? "/year" : "/an") : isEN ? "/month" : "/mois"}
                </span>
              </div>
              <ul className="mt-3 space-y-1.5 flex-1">
                {(isEN ? PLAN_FEATURES[id].en : PLAN_FEATURES[id].fr).map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs">
                    <Check className="w-3.5 h-3.5 mt-0.5 text-primary flex-shrink-0" />
                    <span className="text-foreground">{f}</span>
                  </li>
                ))}
              </ul>
              <Button
                className="w-full mt-4 rounded-xl"
                variant={id === "pro" ? "default" : "outline"}
                disabled={loadingSku !== null || isCurrent}
                onClick={() => buy(item.itemId)}
              >
                {loadingSku === item.itemId ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isCurrent ? (
                  isEN ? "✓ Current plan" : "✓ Plan actuel"
                ) : (
                  isEN ? "Subscribe" : "S'abonner"
                )}
              </Button>
            </div>
          );
        })}
      </div>

      {packs.length > 0 && (
        <div className="border-t border-border/50 pt-4 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Coins className="w-4 h-4 text-primary" />
            {isEN ? "Top up credits" : "Recharger des crédits"}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {packs.map((pack) => (
              <Button
                key={pack.itemId}
                variant="outline"
                className="justify-between rounded-xl"
                disabled={loadingSku !== null}
                onClick={() => buy(pack.itemId)}
              >
                <span>
                  {pack.itemId.replace("credits_", "")} {isEN ? "credits" : "crédits"}
                </span>
                {loadingSku === pack.itemId ? <Loader2 className="w-4 h-4 animate-spin" /> : formatPlayPrice(pack.price, locale)}
              </Button>
            ))}
          </div>
        </div>
      )}

      <p className="text-center text-xs text-muted-foreground">
        {isEN ? "Billed by Google Play. Cancel anytime in Google Play." : "Facturé par Google Play. Résiliable à tout moment dans Google Play."}
      </p>
    </div>
  );
};
