import { FileCheck, KeyRound, Eye, Check, X } from "lucide-react";

const GoogleIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const complianceFeatures = [
  {
    icon: FileCheck,
    title: "Politiques Google",
    description: "Respect strict des politiques d'utilisation de l'API Google My Business.",
  },
  {
    icon: KeyRound,
    title: "Vérification OAuth",
    description: "Application vérifiée avec authentification OAuth 2.0 sécurisée.",
  },
  {
    icon: Eye,
    title: "Transparence",
    description: "Accès clair et limité aux données. Vous contrôlez les autorisations.",
  },
];

const doList = [
  "Application vérifiée par Google",
  "Respect des quotas API",
  "Sécurité des données OAuth 2.0",
  "Conformité des politiques",
];

const dontList = [
  "Stockage inutile de données",
  "Partage avec des tiers",
  "Utilisation abusive de l'API",
  "Contournement des limites",
];

export const ComplianceSection = () => {
  return (
    <section id="compliance" className="py-16 sm:py-20 md:py-24 bg-muted/30">
      <div className="container mx-auto px-5 sm:px-6">
        {/* Section header */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12 md:mb-16">
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-secondary/10 rounded-full mb-4 sm:mb-6">
            <GoogleIcon className="w-4 h-4" />
            <span className="text-secondary text-xs sm:text-sm font-medium">API Google vérifiée</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3 sm:mb-4">
            Conformité et Sécurité
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
            Notre engagement de conformité
          </h3>
          <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
            {/* What we do */}
            <div className="bg-secondary/5 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6">
              <h4 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4 flex items-center gap-2">
                <Check className="w-4 h-4 sm:w-5 sm:h-5 text-secondary" />
                Ce que nous faisons
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
                Ce que nous ne faisons pas
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
