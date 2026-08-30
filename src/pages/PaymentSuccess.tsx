import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const { user } = useAuth();
  const [status, setStatus] = useState<"processing" | "success">("processing");
  const [planName, setPlanName] = useState<string | null>(null);

  useEffect(() => {
    clearCart();
    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 12; // ~24s total

    const poll = async () => {
      if (cancelled || !user) return;
      attempts++;
      try {
        // Trigger verify-subscription (best effort) to sync from Stripe immediately
        await supabase.functions.invoke("verify-subscription").catch(() => null);
      } catch (_) { /* ignore */ }

      const { data: profile } = await supabase
        .from("profiles")
        .select("plan_name, subscription_status, credits")
        .eq("id", user.id)
        .maybeSingle();

      const activeStatuses = ["active", "trial", "trialing"];
      if (profile?.plan_name && activeStatuses.includes(profile.subscription_status || "")) {
        if (!cancelled) {
          setPlanName(profile.plan_name);
          setStatus("success");
        }
        return;
      }

      if (attempts >= maxAttempts) {
        if (!cancelled) setStatus("success"); // fail-open, webhook will catch up
        return;
      }
      setTimeout(poll, 2000);
    };

    // Kick off polling immediately
    poll();

    return () => {
      cancelled = true;
    };
  }, [clearCart, user]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center bg-card rounded-3xl p-8 shadow-lg border">
        {status === "processing" ? (
          <>
            <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto mb-6" />
            <h1 className="text-2xl font-bold mb-2">Activation en cours…</h1>
            <p className="text-muted-foreground">
              Nous activons votre abonnement, cela ne prend que quelques secondes.
            </p>
          </>
        ) : (
          <>
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-12 h-12 text-emerald-500" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Paiement confirmé !</h1>
            <p className="text-muted-foreground mb-6">
              {planName
                ? `Votre plan ${planName} est actif. Vos crédits ont été ajoutés.`
                : "Votre abonnement sera activé d'ici quelques instants."}
            </p>
            <Button onClick={() => navigate("/dashboard")} className="w-full h-12">
              Aller au tableau de bord
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccess;
