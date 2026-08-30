import { Star, MessageSquare, TrendingUp, Eye, MousePointerClick, Phone, Navigation, CheckCircle2, Clock, Send } from "lucide-react";
import { BrandSparkle } from "@/components/BrandSparkle";
import { useTranslation } from "react-i18next";

export const DashboardPreviewSection = () => {
  const { i18n } = useTranslation();
  const isFrench = i18n.language?.startsWith("fr");

  return (
    <section className="py-20 sm:py-28 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center mb-12 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <BrandSparkle className="w-4 h-4" />
            {isFrench ? "Aperçu produit" : "Product preview"}
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold mb-4 tracking-tight">
            {isFrench ? "Tout votre Google Business," : "Your entire Google Business Profile,"} <span className="text-primary">{isFrench ? "piloté par l’IA" : "powered by AI"}</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            {isFrench ? "Avis, posts, Q&R, classement GEO et performances — un seul tableau de bord, des résultats mesurables chaque jour." : "Reviews, posts, Q&As, GEO rankings and performance — one dashboard with measurable results every day."}
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
              googlereviewai.com — {isFrench ? "Tableau de bord" : "Dashboard"}
            </div>
          </div>

          <div className="p-5 sm:p-8 space-y-6">
            {/* Welcome */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="text-sm text-muted-foreground">{isFrench ? "Bon retour," : "Welcome back,"}</p>
                <h3 className="text-2xl font-bold">Decora Home</h3>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold">
                <BrandSparkle className="w-4 h-4" /> {isFrench ? "200 crédits IA" : "200 AI credits"}
              </div>
            </div>

            {/* KPI grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: isFrench ? "Avis sans réponse" : "Unanswered reviews", value: "3", icon: MessageSquare, color: "text-orange-500" },
                { label: isFrench ? "Taux de réponse" : "Response rate", value: "95%", icon: TrendingUp, color: "text-emerald-500" },
                { label: isFrench ? "Note moyenne" : "Average rating", value: "4.9", icon: Star, color: "text-yellow-500" },
                { label: isFrench ? "Total des avis" : "Total reviews", value: "63", icon: CheckCircle2, color: "text-primary" },
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
                  <h4 className="font-semibold">{isFrench ? "Performances Google" : "Google performance"}</h4>
                  <p className="text-xs text-muted-foreground">{isFrench ? "30 derniers jours" : "Last 30 days"}</p>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-600 font-medium">+24%</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: isFrench ? "Vues du profil" : "Profile views", value: "1.5k", icon: Eye },
                  { label: isFrench ? "Clics site" : "Website clicks", value: "31", icon: MousePointerClick },
                  { label: isFrench ? "Appels" : "Calls", value: "36", icon: Phone },
                  { label: isFrench ? "Itinéraires" : "Directions", value: "30", icon: Navigation },
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
                    <BrandSparkle className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold">{isFrench ? "Publication automatique GEO·AI" : "Automatic GEO·AI publishing"}</h4>
                    <p className="text-xs text-muted-foreground">{isFrench ? "Q&R auto sur Google · Prêt pour ChatGPT" : "Automatic Google Q&As · Ready for ChatGPT"}</p>
                  </div>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-600 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {isFrench ? "Actif" : "Active"}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: isFrench ? "Planifié" : "Scheduled", value: "60", icon: Clock },
                  { label: isFrench ? "Prêt" : "Ready", value: "30", icon: CheckCircle2 },
                  { label: isFrench ? "Publié" : "Published", value: "0", icon: Send },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl bg-background border border-border/40 p-3 text-center">
                    <s.icon className="w-4 h-4 mx-auto text-muted-foreground mb-1" />
                    <div className="text-xl font-bold">{s.value}</div>
                    <div className="text-xs text-muted-foreground">{s.label}</div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-3">{isFrench ? "Prochain post : 6 mai" : "Next post: May 6"}</p>
            </div>

            {/* Review queue */}
            <div className="rounded-2xl border border-border/60 bg-background p-5">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold">{isFrench ? "File prioritaire — Avis à répondre" : "Priority queue — Reviews to answer"}</h4>
                <span className="text-xs text-primary font-medium">{isFrench ? "Tout voir" : "View all"}</span>
              </div>
              <div className="space-y-3">
                {[
                  { name: "Romain", initial: "R", text: isFrench ? "Je suis venu chez Decora Home avec ma femme, très bien reçus. Meubles magnifiques, rapport qualité-prix top." : "I visited Decora Home with my wife and received a very warm welcome. Beautiful furniture and excellent value.", stars: 5 },
                  { name: "Priya Decosta", initial: "P", text: isFrench ? "Très professionnel, super à l’écoute. Livré super vite et la qualité au top." : "Very professional and attentive. Fast delivery and excellent quality.", stars: 5 },
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
                        <BrandSparkle className="w-3 h-3" /> {isFrench ? "Répondre avec l’IA" : "Reply with AI"}
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
