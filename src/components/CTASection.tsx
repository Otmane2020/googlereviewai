import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "./ui/button";
import { Check, ArrowRight, Target } from "lucide-react";
import { BrandSparkle } from "@/components/BrandSparkle";

export const CTASection = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <section className="py-14 sm:py-20 md:py-24 bg-card relative overflow-hidden">
      <div className="relative container mx-auto px-5 sm:px-6">
        <div className="bg-background rounded-2xl border border-border shadow-xl p-6 sm:p-10 max-w-3xl mx-auto text-center">
          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <Target className="w-7 h-7 text-foreground" />
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t("landingUI.cta.title")}
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base mb-7 max-w-xl mx-auto">
            {t("landingUI.cta.subtitle")}
          </p>

          <Button
            size="xl"
            className="gap-2 w-full sm:w-auto min-w-[260px]"
            onClick={() => navigate("/auth")}
          >
            <BrandSparkle className="w-5 h-5" />
            {t("landingUI.cta.button")}
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>

          <div className="flex flex-wrap items-center justify-center gap-4 mt-5 text-muted-foreground text-xs">
            <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-primary" /> {t("landingUI.cta.free")}</span>
            <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-primary" /> {t("landingUI.cta.noCard")}</span>
            <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-primary" /> {t("landingUI.cta.cancelAnytime")}</span>
          </div>
        </div>
      </div>
    </section>
  );
};
