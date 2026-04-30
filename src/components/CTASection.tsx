import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Sparkles, Check, ArrowRight, Target } from "lucide-react";

export const CTASection = () => {
  const navigate = useNavigate();

  return (
    <section className="py-14 sm:py-20 md:py-24 bg-card relative overflow-hidden">
      <div className="relative container mx-auto px-5 sm:px-6">
        <div className="bg-background rounded-2xl border border-border shadow-xl p-6 sm:p-10 max-w-3xl mx-auto text-center">
          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <Target className="w-7 h-7 text-foreground" />
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4">
            Start ranking in AI search today
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base mb-7 max-w-xl mx-auto">
            Join hundreds of local businesses using Ranki.ai to dominate ChatGPT, Gemini and Perplexity. Free forever — no credit card required.
          </p>

          <Button
            size="xl"
            className="gap-2 w-full sm:w-auto min-w-[260px]"
            onClick={() => navigate("/auth")}
          >
            <Sparkles className="w-5 h-5" />
            Start free with Ranki.ai
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>

          <div className="flex flex-wrap items-center justify-center gap-4 mt-5 text-muted-foreground text-xs">
            <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-secondary" /> 100% free plan</span>
            <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-secondary" /> No credit card</span>
            <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-secondary" /> Cancel anytime</span>
          </div>
        </div>
      </div>
    </section>
  );
};
