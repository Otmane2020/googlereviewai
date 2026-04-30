import { Check, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Starter",
    price: "Free",
    desc: "Track your AI rank and respond to reviews — forever free.",
    features: [
      "1 business location",
      "Weekly GEO rank reports (3 keywords)",
      "AI replies to Google reviews",
      "25 free credits / month",
    ],
    cta: "Start free",
    highlight: false,
  },
  {
    name: "Daily",
    price: "$9.99",
    period: "/month",
    desc: "Win the AI search war on autopilot. Built for serious local brands.",
    features: [
      "Up to 3 business locations",
      "Daily GEO rank tracking (unlimited keywords)",
      "Daily AI Q&A + SEO posts on Google",
      "Competitor share-of-voice analytics",
      "Priority support",
    ],
    cta: "Start 7-day free trial",
    highlight: true,
  },
  {
    name: "Agency",
    price: "Custom",
    desc: "For multi-location brands and agencies managing 10+ locations.",
    features: [
      "Unlimited locations",
      "White-label reports",
      "API access",
      "Dedicated success manager",
    ],
    cta: "Talk to sales",
    highlight: false,
  },
];

export const RankiPricingSection = () => {
  return (
    <section id="pricing" className="py-20 sm:py-28 bg-background">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="max-w-2xl mx-auto text-center mb-14">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground tracking-tight">
            Simple pricing. <span className="text-primary">Massive AI visibility.</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Start free. Upgrade when you're ready to dominate AI search.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`relative rounded-2xl p-6 border transition-all ${
                p.highlight
                  ? "bg-foreground text-background border-foreground shadow-2xl scale-[1.02] md:scale-105"
                  : "bg-card border-border hover:shadow-xl"
              }`}
            >
              {p.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-background text-foreground border border-border text-xs font-bold shadow-md">
                  <Sparkles className="w-3 h-3" /> Most popular
                </div>
              )}

              <h3 className={`text-lg font-bold ${p.highlight ? "text-background" : "text-foreground"}`}>
                {p.name}
              </h3>
              <div className="mt-3 flex items-baseline gap-1">
                <span className={`text-4xl font-extrabold ${p.highlight ? "text-background" : "text-foreground"}`}>
                  {p.price}
                </span>
                {p.period && (
                  <span className={`text-sm ${p.highlight ? "text-background/70" : "text-muted-foreground"}`}>
                    {p.period}
                  </span>
                )}
              </div>
              <p className={`mt-2 text-sm ${p.highlight ? "text-background/80" : "text-muted-foreground"}`}>
                {p.desc}
              </p>

              <ul className="mt-6 space-y-2.5">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${p.highlight ? "text-background" : "text-primary"}`} />
                    <span className={p.highlight ? "text-background/95" : "text-foreground"}>{f}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-7">
                <Link to="/auth" className="block">
                  <Button
                    size="lg"
                    variant={p.highlight ? "secondary" : "outline"}
                    className="w-full font-semibold"
                  >
                    {p.cta}
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
