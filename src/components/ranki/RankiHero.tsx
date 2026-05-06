import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Sparkles, MapPin, ArrowRight, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import heroImg from "@/assets/ranki-hero.jpg";

const aiEngines = ["ChatGPT", "Gemini", "Perplexity", "Claude"];

export const RankiHero = () => {
  const { t } = useTranslation();
  return (
    <section className="relative pt-24 pb-16 sm:pt-32 sm:pb-24 overflow-hidden bg-background">
      {/* Subtle grid only */}
      <div className="absolute inset-0 -z-10 [background-image:linear-gradient(hsl(var(--foreground)/0.03)_1px,transparent_1px),linear-gradient(90deg,hsl(var(--foreground)/0.03)_1px,transparent_1px)] [background-size:48px_48px]" />

      <div className="container mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Copy */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted border border-border text-foreground text-xs font-semibold mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              {t("landingUI.hero.badge")}
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.05]">
              {t("landingUI.hero.title1")}{" "}
              <span className="text-primary">
                {t("landingUI.hero.title2")}
              </span>
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0">
              {t("landingUI.hero.subtitle")}
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Link to="/auth">
                <Button size="lg" className="h-12 px-7 text-base font-semibold gap-2 group">
                  {t("landingUI.hero.ctaPrimary")}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <a href="#geo-rank">
                <Button size="lg" variant="outline" className="h-12 px-7 text-base font-semibold">
                  {t("landingUI.hero.ctaSecondary")}
                </Button>
              </a>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center lg:justify-start gap-x-5 gap-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-primary" /> {t("landingUI.hero.noCard")}</div>
              <div className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-primary" /> {t("landingUI.hero.freeCredits")}</div>
              <div className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-primary" /> {t("landingUI.hero.setup")}</div>
            </div>

            {/* AI engines pills */}
            <div className="mt-10">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">{t("landingUI.hero.trackedOn")}</p>
              <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
                {aiEngines.map((name) => (
                  <span
                    key={name}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold text-foreground bg-card border border-border"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Visual */}
          <div className="relative">
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
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                <MapPin className="w-4 h-4 text-foreground" />
              </div>
              <div className="text-left">
                <div className="text-[10px] uppercase font-semibold text-muted-foreground">{t("landingUI.hero.rank")}</div>
                <div className="text-xs font-bold text-foreground">{t("landingUI.hero.inChatGPT")}</div>
              </div>
            </div>

            <div className="hidden sm:flex absolute -right-4 bottom-10 bg-card border border-border rounded-xl shadow-xl px-3 py-2 items-center gap-2 animate-float" style={{ animationDelay: "1s" }}>
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-foreground" />
              </div>
              <div className="text-left">
                <div className="text-[10px] uppercase font-semibold text-muted-foreground">+247%</div>
                <div className="text-xs font-bold text-foreground">{t("landingUI.hero.aiMentions")}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
