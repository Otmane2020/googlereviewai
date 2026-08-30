import { Star, MessageSquare, TrendingUp, Clock, Sparkles } from "lucide-react";
import { BrandSparkle } from "@/components/BrandSparkle";
import { useTranslation } from "react-i18next";

const Stars = ({ count }: { count: number }) => (
  <div className="flex gap-0.5">
    {Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`w-3 h-3 ${i < count ? "fill-amber-400 text-amber-400" : "fill-muted text-muted"}`}
      />
    ))}
  </div>
);

export const DashboardMockup = () => {
  const { i18n } = useTranslation();
  const isFrench = i18n.language?.startsWith("fr");
  const stats = [
    { label: isFrench ? "Note moyenne" : "Average rating", value: "4.8", icon: Star },
    { label: isFrench ? "Avis répondus" : "Reviews answered", value: "312", icon: MessageSquare },
    { label: isFrench ? "Taux de réponse" : "Response rate", value: "98%", icon: TrendingUp },
    { label: isFrench ? "Temps moyen" : "Average time", value: "2 min", icon: Clock },
  ];
  const reviews = [
    {
      author: "Camille R.", rating: 5,
      date: isFrench ? "il y a 2h" : "2 hours ago",
      comment: isFrench ? "Service impeccable, l'équipe est adorable et le cadre est top !" : "Excellent service, lovely team and a wonderful atmosphere!",
      reply: isFrench ? "Merci beaucoup Camille, ravis que vous ayez passé un excellent moment avec nous ! À très vite 😊" : "Thank you so much, Camille! We’re delighted you had a great time with us. See you again soon 😊",
    },
    {
      author: "Yanis B.", rating: 4,
      date: isFrench ? "il y a 5h" : "5 hours ago",
      comment: isFrench ? "Très bon accueil, un peu d'attente le week-end mais ça vaut le coup." : "A very warm welcome. There was a short wait at the weekend, but it was worth it.",
      reply: isFrench ? "Merci Yanis pour votre retour, on travaille justement à réduire l'attente le week-end. À bientôt !" : "Thank you for your feedback, Yanis. We’re working to reduce weekend waiting times. See you soon!",
    },
  ];

  return (
    <div className="h-full w-full bg-[#0b0d12] text-white flex flex-col text-left overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center">
            <BrandSparkle className="w-4 h-4 text-primary" />
          </div>
          <div>
            <div className="text-sm font-bold leading-none">Le Petit Bistrot</div>
            <div className="text-[10px] text-white/50 mt-0.5">Google Business Profile</div>
          </div>
        </div>
        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> {isFrench ? "Connecté" : "Connected"}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-2 px-5 py-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg bg-white/5 border border-white/10 p-2.5">
            <s.icon className="w-3.5 h-3.5 text-primary mb-1.5" />
            <div className="text-base font-extrabold leading-none">{s.value}</div>
            <div className="text-[9px] text-white/50 mt-1 leading-tight">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Reviews list */}
      <div className="relative flex-1 px-5 pb-5 space-y-2.5 overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#0b0d12] to-transparent" />
        <div className="flex items-center justify-between">
          <div className="text-[11px] font-bold uppercase tracking-wide text-white/60">{isFrench ? "Avis récents" : "Recent reviews"}</div>
          <div className="flex items-center gap-1 text-[10px] font-semibold text-primary">
            <Sparkles className="w-3 h-3" /> {isFrench ? "Réponses IA" : "AI replies"}
          </div>
        </div>

        {reviews.map((r) => (
          <div key={r.author} className="rounded-lg bg-white/5 border border-white/10 p-3">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-blue-400 flex items-center justify-center text-[10px] font-bold">
                  {r.author[0]}
                </div>
                <div className="text-xs font-semibold">{r.author}</div>
                <Stars count={r.rating} />
              </div>
              <div className="text-[9px] text-white/40">{r.date}</div>
            </div>
            <p className="text-[11px] text-white/70 leading-snug mb-2">{r.comment}</p>
            <div className="rounded-md bg-primary/10 border border-primary/20 px-2.5 py-1.5">
              <div className="flex items-center gap-1 text-[9px] font-semibold text-primary mb-0.5">
                <BrandSparkle className="w-2.5 h-2.5" /> {isFrench ? "Répondu automatiquement" : "Replied automatically"}
              </div>
              <p className="text-[10px] text-white/60 leading-snug line-clamp-2">{r.reply}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
