import { Target, Zap, Repeat, BarChart3 } from "lucide-react";

const steps = [
  {
    icon: Target,
    title: "1. Connectez & ciblez",
    desc: "Reliez votre fiche Google Business et choisissez les requêtes locales sur lesquelles vous voulez gagner sur ChatGPT, Gemini et Perplexity.",
  },
  {
    icon: BarChart3,
    title: "2. Mesurez votre positionnement",
    desc: "Nous lançons chaque jour de vraies requêtes et analysons votre place, votre part de voix et la présence de vos concurrents sur toutes les IA.",
  },
  {
    icon: Zap,
    title: "3. Publication GEO automatique",
    desc: "Ranki.ai génère et publie des Q&R, posts et réponses aux avis optimisés IA sur votre fiche Google — les signaux exacts indexés par les LLM.",
  },
  {
    icon: Repeat,
    title: "4. Augmentez vos ventes",
    desc: "Votre visibilité grimpe semaine après semaine. Plus de clics, plus d'appels, plus de clients qui passent la porte.",
  },
];

export const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="py-20 sm:py-28 bg-background">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="max-w-2xl mx-auto text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-card border border-border text-foreground text-xs font-semibold mb-4">
            Comment ça marche
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground tracking-tight">
            D'invisible à <span className="text-primary">#1 dans les IA</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Une boucle GEO complète — suivi, optimisation, publication, mesure — en pilotage automatique pour booster votre référencement naturel.
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
