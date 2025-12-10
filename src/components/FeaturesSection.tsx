import { Shield, Lock, Zap, BookOpen, MessageSquare, BarChart3, Building2, TrendingUp } from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Application vérifiée",
    description: "Notre application a été examinée et approuvée par Google pour l'accès à l'API Google My Business, garantissant sécurité et conformité.",
  },
  {
    icon: Lock,
    title: "Données sécurisées",
    description: "Conformité OAuth 2.0 avec des scopes d'accès limités. Vos données sont chiffrées et protégées selon les standards de l'industrie.",
  },
  {
    icon: Zap,
    title: "Intégration native",
    description: "Accès direct à l'API Business Profile de Google pour une synchronisation en temps réel et des fonctionnalités complètes.",
  },
];

const apiScopes = [
  { icon: BookOpen, title: "Lecture des avis", description: "Accès en lecture seule à vos avis Google" },
  { icon: MessageSquare, title: "Réponse aux avis", description: "Publication de réponses aux avis clients" },
  { icon: Building2, title: "Gestion du profil", description: "Accès aux informations de votre établissement" },
  { icon: TrendingUp, title: "Métriques business", description: "Accès aux statistiques de performance" },
];

export const FeaturesSection = () => {
  return (
    <section id="features" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Accès API Google My Business vérifié
          </h2>
          <p className="text-lg text-muted-foreground">
            Starlinko dispose d'un accès vérifié à l'API Google My Business, garantissant une intégration sécurisée et conforme aux politiques de Google.
          </p>
        </div>

        {/* Main features */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group p-8 bg-card rounded-2xl border border-border shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* API Scopes */}
        <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-3xl p-8 md:p-12">
          <h3 className="text-2xl font-bold text-foreground mb-8 text-center">Scopes d'accès API</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {apiScopes.map((scope, index) => (
              <div
                key={scope.title}
                className="bg-card p-6 rounded-xl border border-border shadow-sm hover:shadow-md transition-all"
              >
                <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center mb-4">
                  <scope.icon className="w-6 h-6 text-secondary" />
                </div>
                <h4 className="font-semibold text-foreground mb-2">{scope.title}</h4>
                <p className="text-sm text-muted-foreground">{scope.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
