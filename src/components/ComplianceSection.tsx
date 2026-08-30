import { FileCheck, KeyRound, Eye, Check, X, Shield, Zap } from "lucide-react";
import { useTranslation } from "react-i18next";

export const ComplianceSection = () => {
  const { t } = useTranslation();

  const complianceFeatures = [
    {
      icon: Shield,
      title: t("compliance.secureData"),
      description: t("compliance.secureDataDesc"),
    },
    {
      icon: KeyRound,
      title: t("compliance.secureConnection"),
      description: t("compliance.secureConnectionDesc"),
    },
    {
      icon: Eye,
      title: t("compliance.transparency"),
      description: t("compliance.transparencyDesc"),
    },
  ];

  const doList = [
    t("compliance.encryption"),
    t("compliance.privacyRespect"),
    t("compliance.autoBackups"),
    t("compliance.reactiveSupport"),
  ];

  const dontList = [
    t("compliance.noSharing"),
    t("compliance.noSpam"),
    t("compliance.noHiddenFees"),
    t("compliance.noForcedCommitment"),
  ];

  return (
    <section id="compliance" className="py-16 sm:py-20 md:py-24 bg-muted/30">
      <div className="container mx-auto px-5 sm:px-6">
        {/* Section header */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12 md:mb-16">
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-secondary/10 rounded-full mb-4 sm:mb-6">
            <Zap className="w-4 h-4 text-secondary" />
            <span className="text-secondary text-xs sm:text-sm font-medium">{t("compliance.badge")}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3 sm:mb-4">
            {t("compliance.title")}
          </h2>
        </div>

        {/* Compliance cards - Mobile optimized */}
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8 mb-10 sm:mb-12 md:mb-16">
          {complianceFeatures.map((feature) => (
            <div
              key={feature.title}
              className="p-5 sm:p-6 md:p-8 bg-card rounded-xl sm:rounded-2xl border border-border shadow-md sm:shadow-lg"
            >
              <div className="w-11 h-11 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-lg sm:rounded-xl bg-secondary/10 flex items-center justify-center mb-4 sm:mb-5 md:mb-6">
                <feature.icon className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-secondary" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2 sm:mb-3">{feature.title}</h3>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Do's and Don'ts - Mobile optimized */}
        <div className="bg-card rounded-2xl sm:rounded-3xl border border-border shadow-lg sm:shadow-xl p-5 sm:p-8 md:p-12">
          <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground mb-6 sm:mb-8 text-center">
            {t("compliance.commitment")}
          </h3>
          <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
            {/* What we do */}
            <div className="bg-secondary/5 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6">
              <h4 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4 flex items-center gap-2">
                <Check className="w-4 h-4 sm:w-5 sm:h-5 text-secondary" />
                {t("compliance.whatWeDo")}
              </h4>
              <ul className="space-y-2 sm:space-y-3">
                {doList.map((item) => (
                  <li key={item} className="flex items-center gap-2 sm:gap-3 text-sm sm:text-base text-muted-foreground">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0">
                      <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-secondary" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* What we don't do */}
            <div className="bg-destructive/5 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6">
              <h4 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4 flex items-center gap-2">
                <X className="w-4 h-4 sm:w-5 sm:h-5 text-destructive" />
                {t("compliance.whatWeDont")}
              </h4>
              <ul className="space-y-2 sm:space-y-3">
                {dontList.map((item) => (
                  <li key={item} className="flex items-center gap-2 sm:gap-3 text-sm sm:text-base text-muted-foreground">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-destructive/20 flex items-center justify-center flex-shrink-0">
                      <X className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-destructive" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
