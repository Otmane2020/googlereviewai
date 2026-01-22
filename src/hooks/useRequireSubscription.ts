import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface SubscriptionState {
  loading: boolean;
  valid: boolean;
  plan: string | null;
  status: string | null;
}

export const useRequireSubscription = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [state, setState] = useState<SubscriptionState>({
    loading: true,
    valid: false,
    plan: null,
    status: null,
  });

  useEffect(() => {
    const verifySubscription = async () => {
      if (!user) {
        navigate("/auth");
        return;
      }

      try {
        // First check local profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("plan_name, subscription_status, trial_end, current_period_end")
          .eq("id", user.id)
          .maybeSingle();

        // Quick check - if no plan at all, redirect immediately
        if (!profile?.plan_name || profile.plan_name === "free") {
          navigate("/choose-plan");
          return;
        }

        // Check subscription status
        const validStatuses = ["active", "trial", "trialing"];
        if (!validStatuses.includes(profile.subscription_status || "")) {
          navigate("/choose-plan");
          return;
        }

        // Check trial expiration
        if (profile.subscription_status === "trial" || profile.subscription_status === "trialing") {
          if (profile.trial_end) {
            const trialEnd = new Date(profile.trial_end);
            if (trialEnd < new Date()) {
              navigate("/choose-plan");
              return;
            }
          }
        }

        // Check period expiration for active subscriptions
        if (profile.subscription_status === "active") {
          if (profile.current_period_end) {
            const periodEnd = new Date(profile.current_period_end);
            // Allow a small grace period (1 day) for Stripe webhook delays
            const gracePeriod = new Date(periodEnd);
            gracePeriod.setDate(gracePeriod.getDate() + 1);
            
            if (gracePeriod < new Date()) {
              // Period expired - verify with Stripe
              const { data: verification } = await supabase.functions.invoke("verify-subscription");
              
              if (!verification?.valid) {
                navigate("/choose-plan");
                return;
              }
            }
          }
        }

        // Subscription is valid
        setState({
          loading: false,
          valid: true,
          plan: profile.plan_name,
          status: profile.subscription_status,
        });

      } catch (error) {
        console.error("Error verifying subscription:", error);
        // SECURITY: On error, block access and redirect to choose-plan
        navigate("/choose-plan");
        return;
      }
    };

    verifySubscription();
  }, [user, navigate]);

  return state;
};
