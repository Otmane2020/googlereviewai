import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RankiLogo } from "@/components/StarlinkoLogo";
import { useTranslation } from "react-i18next";

const NotFound = () => {
  const { t } = useTranslation();
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30">
      <div className="text-center px-4">
        <Link to="/" className="inline-block mb-8">
          <RankiLogo showBadge={false} />
        </Link>
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-5xl font-bold text-primary">404</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">{t("notFound.title")}</h1>
        <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
          {t("notFound.description")}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild variant="outline">
            <Link to="/" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              {t("notFound.backHome")}
            </Link>
          </Button>
          <Button asChild>
            <Link to="/dashboard" className="gap-2">
              <Home className="w-4 h-4" />
              {t("notFound.dashboard")}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
