import { useEffect } from "react";
import { useNavigate } from "@/lib/router-compat";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import ProductHuntLanding from "@/components/launch/ProductHuntLanding";

/**
 * Do not use React Helmet for homepage SEO. It can duplicate route-head tags
 * and does not reliably send canonical and structured data in SSR HTML.
 * src/routes/index.tsx owns the metadata; this component owns the UI.
 */
const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate("/dashboard", { replace: true });
  }, [user, loading, navigate]);

  if (user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background" aria-label="Opening your dashboard">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <ProductHuntLanding />;
};

export default Index;
