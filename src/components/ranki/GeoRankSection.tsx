import { TrendingUp, Search, Bot, MapPin } from "lucide-react";

const queries = [
  {
    engine: "ChatGPT",
    query: "Best Italian restaurant in Brooklyn with outdoor seating?",
    your: { name: "Trattoria Romana", rank: 1, change: "+4" },
    competitors: ["Lucia's Kitchen", "Forno Vecchio", "Pasta Bar 11"],
    color: "from-emerald-500 to-teal-500",
  },
  {
    engine: "Perplexity",
    query: "Top boutique hotels in Austin for a weekend?",
    your: { name: "The Driskill House", rank: 2, change: "+1" },
    competitors: ["Hotel Saint Cecilia", "South Congress Hotel"],
    color: "from-violet-500 to-fuchsia-500",
  },
  {
    engine: "Gemini",
    query: "Affordable car repair shop near Santa Monica?",
    your: { name: "Westside Auto Care", rank: 1, change: "+6" },
    competitors: ["Ocean Auto", "SM Mechanics", "Pier Garage"],
    color: "from-blue-500 to-indigo-500",
  },
];

export const GeoRankSection = () => {
  return (
    <section id="geo-rank" className="py-20 sm:py-28 bg-card">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="max-w-2xl mx-auto text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4">
            <Bot className="w-3.5 h-3.5" /> The GEO Rank Tracker
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground tracking-tight">
            See exactly where you rank in <span className="text-primary">AI answers</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            We run real queries on ChatGPT, Gemini and Perplexity for your local keywords — every day — and show you who's winning the AI recommendation game.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {queries.map((q) => (
            <div
              key={q.engine}
              className="group relative bg-background rounded-2xl border border-border p-5 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
            >
              {/* Engine badge */}
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold text-white bg-gradient-to-r ${q.color} mb-3`}>
                <Search className="w-3 h-3" /> {q.engine}
              </div>

              {/* Query */}
              <p className="text-sm font-medium text-foreground leading-snug mb-4 min-h-[2.5rem]">
                "{q.query}"
              </p>

              {/* Your business — winner */}
              <div className="bg-gradient-to-r from-secondary/10 to-primary/10 border border-secondary/30 rounded-xl p-3 mb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-accent to-amber-500 text-white font-extrabold text-sm flex items-center justify-center shadow-md">
                      #{q.your.rank}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-secondary" /> {q.your.name}
                      </div>
                      <div className="text-[10px] uppercase font-semibold text-secondary">Your business</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-secondary text-xs font-bold">
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
