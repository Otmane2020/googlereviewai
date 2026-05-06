import { TrendingUp, Search, Bot, MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";

const queries = [
  {
    engine: "ChatGPT",
    query: "Meilleur restaurant italien à Paris avec terrasse ?",
    your: { name: "Trattoria Romana", rank: 1, change: "+4" },
    competitors: ["Cucina Lucia", "Forno Vecchio", "Pasta Bar 11"],
  },
  {
    engine: "Perplexity",
    query: "Meilleurs hôtels boutique à Lyon pour un week-end ?",
    your: { name: "Maison Driskill", rank: 2, change: "+1" },
    competitors: ["Hôtel Sainte-Cécile", "South Hôtel"],
  },
  {
    engine: "Gemini",
    query: "Garage automobile pas cher à Marseille ?",
    your: { name: "Westside Auto", rank: 1, change: "+6" },
    competitors: ["Océan Auto", "SM Mécanique", "Garage du Port"],
  },
];

export const GeoRankSection = () => {
  const { t } = useTranslation();
  return (
    <section id="geo-rank" className="py-20 sm:py-28 bg-card">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="max-w-2xl mx-auto text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-background border border-border text-foreground text-xs font-semibold mb-4">
            <Bot className="w-3.5 h-3.5" /> {t("landingUI.geoRank.badge")}
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground tracking-tight">
            {t("landingUI.geoRank.title1")} <span className="text-primary">{t("landingUI.geoRank.title2")}</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            {t("landingUI.geoRank.subtitle")}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {queries.map((q) => (
            <div
              key={q.engine}
              className="group relative bg-background rounded-2xl border border-border p-5 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
            >
              {/* Engine badge */}
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold text-foreground bg-muted border border-border mb-3">
                <Search className="w-3 h-3" /> {q.engine}
              </div>

              {/* Query */}
              <p className="text-sm font-medium text-foreground leading-snug mb-4 min-h-[2.5rem]">
                "{q.query}"
              </p>

              {/* Your business — winner */}
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 mb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-lg bg-primary text-primary-foreground font-extrabold text-sm flex items-center justify-center">
                      #{q.your.rank}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-primary" /> {q.your.name}
                      </div>
                      <div className="text-[10px] uppercase font-semibold text-muted-foreground">Votre établissement</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-primary text-xs font-bold">
                    <TrendingUp className="w-3.5 h-3.5" />
                    {q.your.change}
                  </div>
                </div>
              </div>

              {/* Competitors */}
              <div className="space-y-1.5">
                {q.competitors.map((c, i) => (
                  <div key={c} className="flex items-center gap-2 text-xs text-muted-foreground py-1">
                    <span className="w-5 h-5 rounded bg-muted text-muted-foreground font-semibold flex items-center justify-center text-[10px]">
                      {q.your.rank + i + 1}
                    </span>
                    <span>{c}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
