import { FileCheck, KeyRound, Eye, Check, X } from "lucide-react";

const complianceFeatures = [
  {
    icon: FileCheck,
    title: "Politiques Google",
    description: "Respect strict des politiques d'utilisation de l'API Google My Business et des directives de la plateforme.",
  },
  {
    icon: KeyRound,
    title: "Vérification OAuth",
    description: "Application vérifiée avec processus d'authentification OAuth 2.0 sécurisé et scopes appropriés.",
  },
  {
    icon: Eye,
    title: "Transparence",
    description: "Accès clair et limité aux données. Vous contrôlez entièrement les autorisations accordées.",
  },
];

const doList = [
  "Application vérifiée par Google",
  "Respect des quotas API",
  "Sécurité des données OAuth 2.0",
  "Conformité aux politiques de contenu",
  "Transparence des données",
];

const dontList = [
  "Stockage inutile de données",
  "Partage avec des tiers",
  "Utilisation abusive de l'API",
  "Contournement des limites",
  "Non-respect des politiques",
];

export const ComplianceSection = () => {
  return (
    <section id="compliance" className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Conformité et Sécurité
          </h2>
        </div>

        {/* Compliance cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {complianceFeatures.map((feature) => (
            <div
              key={feature.title}
              className="p-8 bg-card rounded-2xl border border-border shadow-lg"
            >
              <div className="w-14 h-14 rounded-xl bg-secondary/10 flex items-center justify-center mb-6">
                <feature.icon className="w-7 h-7 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Do's and Don'ts */}
        <div className="bg-card rounded-3xl border border-border shadow-xl p-8 md:p-12">
          <h3 className="text-2xl font-bold text-foreground mb-8 text-center">
            Notre engagement de conformité
          </h3>
          <div className="grid md:grid-cols-2 gap-8">
            {/* What we do */}
            <div className="bg-secondary/5 rounded-2xl p-6">
              <h4 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Check className="w-5 h-5 text-secondary" />
                Ce que nous faisons
              </h4>
              <ul className="space-y-3">
                {doList.map((item) => (
                  <li key={item} className="flex items-center gap-3 text-muted-foreground">
                    <div className="w-5 h-5 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-secondary" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* What we don't do */}
            <div className="bg-destructive/5 rounded-2xl p-6">
              <h4 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <X className="w-5 h-5 text-destructive" />
                Ce que nous ne faisons pas
              </h4>
              <ul className="space-y-3">
                {dontList.map((item) => (
                  <li key={item} className="flex items-center gap-3 text-muted-foreground">
                    <div className="w-5 h-5 rounded-full bg-destructive/20 flex items-center justify-center flex-shrink-0">
                      <X className="w-3 h-3 text-destructive" />
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
