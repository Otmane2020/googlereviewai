import { Star, MessageSquare, TrendingUp, Eye, MousePointerClick, Phone, Navigation, Sparkles, CheckCircle2, Clock, Send } from "lucide-react";

export const DashboardPreviewSection = () => {
  return (
    <section className="py-20 sm:py-28 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center mb-12 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            Aperçu produit
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold mb-4 tracking-tight">
            Tout votre Google Business, <span className="text-primary">piloté par l'IA</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Avis, posts, Q&R, classement GEO et performances — un seul tableau de bord, des résultats mesurables chaque jour.
          </p>
        </div>

        {/* Mock dashboard frame */}
        <div className="max-w-6xl mx-auto rounded-3xl border border-border/60 bg-card shadow-2xl shadow-primary/10 overflow-hidden">
          {/* Window bar */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border/60 bg-muted/40">
            <div className="flex gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-400" />
              <span className="w-3 h-3 rounded-full bg-yellow-400" />
              <span className="w-3 h-3 rounded-full bg-green-400" />
            </div>
            <div className="flex-1 text-center text-xs text-muted-foreground font-medium">
              starlinko.app — Tableau de bord
            </div>
          </div>

          <div className="p-5 sm:p-8 space-y-6">
            {/* Welcome */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="text-sm text-muted-foreground">Bon retour,</p>
                <h3 className="text-2xl font-bold">Decora Home</h3>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold">
                <Sparkles className="w-4 h-4" /> 200 crédits IA
              </div>
            </div>

            {/* KPI grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Avis sans réponse", value: "3", icon: MessageSquare, color: "text-orange-500" },
                { label: "Taux de réponse", value: "95%", icon: TrendingUp, color: "text-emerald-500" },
                { label: "Note moyenne", value: "4.9", icon: Star, color: "text-yellow-500" },
                { label: "Total des avis", value: "63", icon: CheckCircle2, color: "text-primary" },
              ].map((kpi) => (
                <div key={kpi.label} className="rounded-2xl border border-border/60 bg-background p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground">{kpi.label}</span>
                    <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                  </div>
                  <div className="text-2xl font-bold">{kpi.value}</div>
                </div>
              ))}
            </div>

            {/* Performances Google */}
            <div className="rounded-2xl border border-border/60 bg-background p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-semibold">Performances Google</h4>
                  <p className="text-xs text-muted-foreground">30 derniers jours</p>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-600 font-medium">+24%</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Vues du profil", value: "1.5k", icon: Eye },
                  { label: "Clics site", value: "31", icon: MousePointerClick },
                  { label: "Appels", value: "36", icon: Phone },
                  { label: "Itinéraires", value: "30", icon: Navigation },
                ].map((s) => (
                  <div key={s.label} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                      <s.icon className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <div className="text-lg font-bold leading-none">{s.value}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Auto post */}
            <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-primary/5 to-transparent p-5">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Publication automatique GEO·AI</h4>
                    <p className="text-xs text-muted-foreground">Q&R auto sur Google · Prêt pour ChatGPT</p>
                  </div>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-600 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Actif
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Planifié", value: "60", icon: Clock },
                  { label: "Prêt", value: "30", icon: CheckCircle2 },
                  { label: "Publié", value: "0", icon: Send },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl bg-background border border-border/40 p-3 text-center">
                    <s.icon className="w-4 h-4 mx-auto text-muted-foreground mb-1" />
                    <div className="text-xl font-bold">{s.value}</div>
                    <div className="text-xs text-muted-foreground">{s.label}</div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-3">Prochain post : 6 mai</p>
            </div>

            {/* Review queue */}
            <div className="rounded-2xl border border-border/60 bg-background p-5">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold">File prioritaire — Avis à répondre</h4>
                <span className="text-xs text-primary font-medium">Tout voir</span>
              </div>
              <div className="space-y-3">
                {[
                  { name: "Romain", initial: "R", text: "Je suis venu chez Decora Home avec ma femme, très bien reçus. Meubles magnifiques, rapport qualité-prix top.", stars: 5 },
                  { name: "Priya Decosta", initial: "P", text: "Très professionnel, super à l'écoute. Livré super vite et la qualité au top.", stars: 5 },
                ].map((r) => (
                  <div key={r.name} className="flex gap-3 p-3 rounded-xl border border-border/40 hover:bg-muted/40 transition">
                    <div className="w-9 h-9 rounded-full bg-primary/15 text-primary font-semibold flex items-center justify-center flex-shrink-0">
                      {r.initial}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{r.name}</span>
                        <div className="flex">
                          {Array.from({ length: r.stars }).map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{r.text}</p>
                      <button className="mt-2 text-xs text-primary font-medium inline-flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Répondre avec l'IA
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
