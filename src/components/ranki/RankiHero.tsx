import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { MapPin, ArrowRight, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { BrandSparkle } from "@/components/BrandSparkle";
import { TabletFrame } from "@/components/ranki/TabletFrame";
import { DashboardMockup } from "@/components/ranki/DashboardMockup";

const aiEngines = [
  { name: "ChatGPT", dot: "#34A853" },
  { name: "Gemini", dot: "#4285F4" },
  { name: "Perplexity", dot: "#EA4335" },
  { name: "Claude", dot: "#FBBC05" },
];

export const RankiHero = () => {
  const { t } = useTranslation();
  return (
    <section className="relative pt-24 pb-16 sm:pt-32 sm:pb-24 overflow-hidden bg-background">
      <div className="absolute inset-0 -z-10 [background-image:linear-gradient(hsl(var(--foreground)/0.03)_1px,transparent_1px),linear-gradient(90deg,hsl(var(--foreground)/0.03)_1px,transparent_1px)] [background-size:48px_48px]" />
      <div className="absolute -z-10 -top-28 -right-20 h-80 w-80 rounded-full bg-[#4285F4]/[0.07] blur-3xl" />
      <div className="absolute -z-10 top-1/3 -left-24 h-64 w-64 rounded-full bg-[#34A853]/[0.06] blur-3xl" />

      <div className="container mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[#4285F4]/20 shadow-sm text-foreground text-xs font-semibold mb-6">
              <span className="flex gap-1"><i className="w-1.5 h-1.5 rounded-full bg-[#4285F4]"/><i className="w-1.5 h-1.5 rounded-full bg-[#EA4335]"/><i className="w-1.5 h-1.5 rounded-full bg-[#FBBC05]"/><i className="w-1.5 h-1.5 rounded-full bg-[#34A853]"/></span>
              {t("landingUI.hero.badge")}
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.05]">
              {t("landingUI.hero.title1")} {" "}
              <span className="bg-gradient-to-r from-[#4285F4] via-[#34A853] to-[#4285F4] bg-clip-text text-transparent">{t("landingUI.hero.title2")}</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0">{t("landingUI.hero.subtitle")}</p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Link to="/auth"><Button size="lg" className="h-12 px-7 text-base font-semibold gap-2 group bg-[#4285F4] hover:bg-[#3367D6] text-white shadow-lg shadow-[#4285F4]/20">{t("landingUI.hero.ctaPrimary")}<ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></Button></Link>
              <a href="#geo-rank"><Button size="lg" variant="outline" className="h-12 px-7 text-base font-semibold border-[#4285F4]/25 hover:bg-[#4285F4]/5">{t("landingUI.hero.ctaSecondary")}</Button></a>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center lg:justify-start gap-x-5 gap-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-[#34A853]" /> {t("landingUI.hero.noCard")}</div>
              <div className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-[#34A853]" /> {t("landingUI.hero.freeCredits")}</div>
              <div className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-[#34A853]" /> {t("landingUI.hero.setup")}</div>
            </div>

            <div className="mt-10">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">{t("landingUI.hero.trackedOn")}</p>
              <div className="flex flex-wrap gap-2 justify-center lg:justify-start">{aiEngines.map(({name,dot}) => <span key={name} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold text-foreground bg-card border border-border shadow-sm"><span className="w-1.5 h-1.5 rounded-full" style={{backgroundColor:dot}} />{name}</span>)}</div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-8 -z-10 rounded-full bg-gradient-to-br from-[#4285F4]/10 via-transparent to-[#34A853]/10 blur-2xl" />
            <TabletFrame><DashboardMockup /></TabletFrame>
            <div className="hidden sm:flex absolute -left-6 -top-6 bg-card border border-[#4285F4]/20 rounded-xl shadow-xl px-3 py-2 items-center gap-2 animate-float">
              <div className="w-8 h-8 rounded-lg bg-[#4285F4]/10 flex items-center justify-center"><MapPin className="w-4 h-4 text-[#4285F4]" /></div>
              <div className="text-left"><div className="text-[10px] uppercase font-semibold text-muted-foreground">{t("landingUI.hero.rank")}</div><div className="text-xs font-bold text-foreground">{t("landingUI.hero.inChatGPT")}</div></div>
            </div>
            <div className="hidden sm:flex absolute -right-6 -bottom-6 bg-card border border-[#34A853]/20 rounded-xl shadow-xl px-3 py-2 items-center gap-2 animate-float" style={{ animationDelay: "1s" }}>
              <div className="w-8 h-8 rounded-lg bg-[#34A853]/10 flex items-center justify-center"><BrandSparkle className="w-4 h-4 text-[#34A853]" /></div>
              <div className="text-left"><div className="text-[10px] uppercase font-semibold text-[#34A853]">+247%</div><div className="text-xs font-bold text-foreground">{t("landingUI.hero.aiMentions")}</div></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
