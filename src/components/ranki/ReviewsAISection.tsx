import { Star, MessageSquareReply } from "lucide-react";
import { useTranslation } from "react-i18next";

const examples = [
  {
    industry: "Restaurant",
    location: "Paris 11e",
    rating: 5,
    review: "Sans hésiter la meilleure carbonara du quartier. Service chaleureux et la terrasse est magique.",
    reply: "Merci infiniment, Maria ! Ravis que la carbonara vous ait régalée — Chef Marco va sourire toute la semaine. À très vite sur notre terrasse.",
  },
  {
    industry: "Hôtel boutique",
    location: "Lyon",
    rating: 5,
    review: "Deux nuits pour un mariage. Chambre magnifique et conciergerie incroyable.",
    reply: "Merci de nous avoir choisis pour ce moment si spécial, Daniel. Nous transmettons vos mots à toute l'équipe — ils seront aux anges. Revenez quand vous voulez.",
  },
  {
    industry: "Garage auto",
    location: "Marseille",
    rating: 4,
    review: "Intervention rapide, prix juste. Salle d'attente à améliorer.",
    reply: "Merci pour ce retour honnête, Jen. Heureux de vous avoir remis sur la route rapidement. Bonne nouvelle : notre salle d'attente est entièrement rénovée le mois prochain.",
  },
];

export const ReviewsAISection = () => {
  return (
    <section id="reviews-ai" className="py-20 sm:py-28 bg-card">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="max-w-2xl mx-auto text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-background border border-border text-foreground text-xs font-semibold mb-4">
            <MessageSquareReply className="w-3.5 h-3.5" /> Avis IA
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground tracking-tight">
            Tous vos avis reçus. <span className="text-primary">Répondus automatiquement.</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Des réponses IA fidèles à votre marque, publiées sur Google en quelques minutes — pour booster votre réputation et votre référencement IA.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {examples.map((e) => (
            <div
              key={e.industry}
              className="bg-background border border-border rounded-2xl p-5 hover:shadow-xl transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-xs uppercase font-semibold text-muted-foreground tracking-wider">{e.industry}</div>
                  <div className="text-sm font-bold text-foreground">{e.location}</div>
                </div>
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${i < e.rating ? "fill-foreground text-foreground" : "text-muted"}`}
                    />
                  ))}
                </div>
              </div>

              <div className="bg-muted/50 rounded-xl p-3 mb-3">
                <div className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Avis client</div>
                <p className="text-sm text-foreground leading-snug">"{e.review}"</p>
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-[8px] font-bold text-primary-foreground">AI</span>
                  </div>
                  <div className="text-[10px] uppercase font-bold text-primary">Réponse IA Ranki.ai</div>
                </div>
                <p className="text-sm text-foreground leading-snug">{e.reply}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
