import { Target, Zap, Repeat, BarChart3 } from "lucide-react";
import { useTranslation } from "react-i18next";

export const HowItWorksSection = () => {
  const { t } = useTranslation();

  const steps = [
    { icon: Target, title: t("landingUI.howItWorks.step1Title"), desc: t("landingUI.howItWorks.step1Desc") },
    { icon: BarChart3, title: t("landingUI.howItWorks.step2Title"), desc: t("landingUI.howItWorks.step2Desc") },
    { icon: Zap, title: t("landingUI.howItWorks.step3Title"), desc: t("landingUI.howItWorks.step3Desc") },
    { icon: Repeat, title: t("landingUI.howItWorks.step4Title"), desc: t("landingUI.howItWorks.step4Desc") },
  ];

  return (
    <section id="how-it-works" className="py-20 sm:py-28 bg-background">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="max-w-2xl mx-auto text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-card border border-border text-foreground text-xs font-semibold mb-4">
            {t("landingUI.howItWorks.badge")}
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground tracking-tight">
            {t("landingUI.howItWorks.title1")} <span className="text-primary">{t("landingUI.howItWorks.title2")}</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            {t("landingUI.howItWorks.subtitle")}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {steps.map((s, i) => (
            <div
              key={s.title}
              className="relative bg-card border border-border rounded-2xl p-6 hover:shadow-xl hover:border-primary/30 transition-all"
            >
              <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-foreground text-background font-extrabold text-sm flex items-center justify-center shadow-lg">
                {i + 1}
              </div>
              <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-4">
                <s.icon className="w-6 h-6 text-foreground" />
              </div>
              <h3 className="text-base font-bold text-foreground mb-2">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
