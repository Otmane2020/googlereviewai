import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Sparkles, MapPin, ArrowRight, Check } from "lucide-react";
import heroImg from "@/assets/ranki-hero.jpg";

const aiEngines = [
  { name: "ChatGPT", color: "from-emerald-500 to-teal-500" },
  { name: "Gemini", color: "from-blue-500 to-indigo-500" },
  { name: "Perplexity", color: "from-violet-500 to-fuchsia-500" },
  { name: "Claude", color: "from-orange-500 to-amber-500" },
];

export const RankiHero = () => {
  return (
    <section className="relative pt-24 pb-16 sm:pt-32 sm:pb-24 overflow-hidden bg-gradient-to-b from-background via-background to-primary/5">
      {/* Decorative grid + glow */}
      <div className="absolute inset-0 -z-10 [background-image:linear-gradient(hsl(var(--primary)/0.04)_1px,transparent_1px),linear-gradient(90deg,hsl(var(--primary)/0.04)_1px,transparent_1px)] [background-size:48px_48px]" />
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-primary/20 blur-[140px] rounded-full -z-10" />

      <div className="container mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Copy */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              GEO · Generative Engine Optimization
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.05]">
              Rank locally inside{" "}
              <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                ChatGPT, Gemini & Perplexity
              </span>
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0">
              Ranki.ai tracks where your business shows up in AI search answers — and auto-publishes the content that makes you the #1 recommended local pick.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Link to="/auth">
                <Button size="lg" className="h-12 px-7 text-base font-semibold gap-2 group">
                  Start tracking — Free
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <a href="#geo-rank">
                <Button size="lg" variant="outline" className="h-12 px-7 text-base font-semibold">
                  See how it works
                </Button>
              </a>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center lg:justify-start gap-x-5 gap-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-secondary" /> No credit card</div>
              <div className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-secondary" /> 25 free credits</div>
              <div className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-secondary" /> Setup in 2 min</div>
            </div>

            {/* AI engines pills */}
            <div className="mt-10">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Tracking your rank across</p>
              <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
                {aiEngines.map((e) => (
                  <span
                    key={e.name}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold text-white bg-gradient-to-r ${e.color} shadow-sm`}
                  >
                    {e.name}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Visual */}
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-tr from-primary/30 to-secondary/30 rounded-3xl blur-2xl opacity-60" />
            <div className="relative rounded-2xl overflow-hidden border border-border shadow-2xl bg-card">
              <img
                src={heroImg}
                alt="Ranki.ai dashboard preview – local rank tracker for ChatGPT, Gemini and Perplexity"
                className="w-full h-auto"
                loading="eager"
              />
            </div>

            {/* Floating cards */}
            <div className="hidden sm:flex absolute -left-4 top-10 bg-card border border-border rounded-xl shadow-xl px-3 py-2 items-center gap-2 animate-float">
              <div className="w-8 h-8 rounded-lg bg-secondary/15 flex items-center justify-center">
                <MapPin className="w-4 h-4 text-secondary" />
              </div>
              <div className="text-left">
                <div className="text-[10px] uppercase font-semibold text-muted-foreground">Rank #1</div>
                <div className="text-xs font-bold text-foreground">in ChatGPT</div>
              </div>
            </div>

            <div className="hidden sm:flex absolute -right-4 bottom-10 bg-card border border-border rounded-xl shadow-xl px-3 py-2 items-center gap-2 animate-float" style={{ animationDelay: "1s" }}>
              <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <div className="text-left">
                <div className="text-[10px] uppercase font-semibold text-muted-foreground">+247%</div>
                <div className="text-xs font-bold text-foreground">AI mentions</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
