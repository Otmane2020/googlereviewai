import { Target, Zap, Repeat, BarChart3 } from "lucide-react";

const steps = [
  {
    icon: Target,
    title: "1. Connect & track",
    desc: "Link your Google Business Profile and pick the local queries you want to win on ChatGPT, Gemini and Perplexity.",
  },
  {
    icon: BarChart3,
    title: "2. Measure your AI rank",
    desc: "We run real prompts daily and report your position, share-of-voice and competitor mentions across every major AI engine.",
  },
  {
    icon: Zap,
    title: "3. Auto-publish GEO content",
    desc: "Ranki generates and publishes AI-optimized Q&A, posts and review replies on your Google Business Profile — the exact signals LLMs index.",
  },
  {
    icon: Repeat,
    title: "4. Climb the rankings",
    desc: "Watch your visibility grow week after week. Track wins, lost positions and which content is moving the needle.",
  },
];

export const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="py-20 sm:py-28 bg-background">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="max-w-2xl mx-auto text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-card border border-border text-foreground text-xs font-semibold mb-4">
            How it works
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground tracking-tight">
            From invisible to <span className="text-primary">#1 in AI search</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            A complete GEO loop — track, optimize, publish, measure — running on autopilot.
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
