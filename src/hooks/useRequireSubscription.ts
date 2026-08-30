import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

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
    if (!user) {
      navigate("/auth");
      return;
    }

    // App is now free - all authenticated users have access
    setState({
      loading: false,
      valid: true,
      plan: "free",
      status: "active",
    });
  }, [user, navigate]);

  return state;
};
