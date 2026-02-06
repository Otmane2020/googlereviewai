import { useState } from "react";
import { Sparkles, Star, ThumbsUp, ThumbsDown } from "lucide-react";
import { useEffect } from "react";

const SECTORS = [
  { key: "restaurant", label: "Restauration" },
  { key: "hotel", label: "Hôtellerie" },
  { key: "beauty", label: "Santé et Beauté" },
  { key: "auto", label: "Automobile" },
  { key: "retail", label: "Commerce" },
];

type ReviewType = "positive" | "negative";

interface DemoReview {
  author: string;
  rating: number;
  date: string;
  text: string;
  response: string;
}

const DEMO_DATA: Record<string, Record<ReviewType, DemoReview>> = {
  restaurant: {
    positive: {
      author: "Sophie Martin",
      rating: 5,
      date: "il y a 2 jours",
      text: "Superbe découverte ! Le risotto aux champignons était délicieux et le serveur très attentionné. Nous reviendrons sans hésiter.",
      response:
        "Merci beaucoup Sophie pour votre chaleureux commentaire ! Nous sommes ravis que notre risotto ait su vous séduire et que notre équipe ait contribué à rendre votre repas agréable. À très bientôt pour une nouvelle dégustation !",
    },
    negative: {
      author: "Marc Dupont",
      rating: 2,
      date: "il y a 5 jours",
      text: "Service très lent, nous avons attendu plus de 40 minutes pour nos plats. Dommage car la nourriture était correcte.",
      response:
        "Merci Marc pour votre retour honnête. Nous sommes sincèrement désolés pour cette attente inhabituelle. Nous prenons des mesures pour améliorer notre rapidité de service. Nous espérons avoir l'occasion de vous offrir une meilleure expérience.",
    },
  },
  hotel: {
    positive: {
      author: "Claire Lefèvre",
      rating: 5,
      date: "il y a 3 jours",
      text: "Séjour parfait ! La chambre était immaculée, le petit-déjeuner copieux et la vue sur mer magnifique. Personnel aux petits soins.",
      response:
        "Merci infiniment Claire pour ce merveilleux avis ! Nous sommes enchantés que votre séjour ait été à la hauteur de vos attentes. Notre équipe sera ravie de vous accueillir à nouveau !",
    },
    negative: {
      author: "Thomas Bernard",
      rating: 2,
      date: "il y a 1 semaine",
      text: "Chambre bruyante donnant sur la rue, climatisation en panne. Le check-in a pris 25 minutes.",
      response:
        "Merci Thomas pour votre retour. Nous regrettons sincèrement ces désagréments qui ne reflètent pas nos standards. La climatisation a été réparée et nous avons revu notre procédure d'accueil. Nous serions honorés de vous offrir un meilleur séjour.",
    },
  },
  beauty: {
    positive: {
      author: "Amina Khelifi",
      rating: 5,
      date: "il y a 1 jour",
      text: "Soin du visage exceptionnel ! Ma peau n'a jamais été aussi lumineuse. L'esthéticienne était douce et professionnelle.",
      response:
        "Merci Amina, votre retour nous touche énormément ! Nous sommes ravis que notre soin ait répondu à vos attentes. Au plaisir de prendre soin de vous à nouveau !",
    },
    negative: {
      author: "Julie Morel",
      rating: 2,
      date: "il y a 4 jours",
      text: "Rendez-vous décalé de 30 minutes sans prévenir. La manucure s'est écaillée au bout de 2 jours.",
      response:
        "Merci Julie pour ce retour. Nous sommes désolés pour le retard et la tenue de votre manucure. Nous vous proposons une retouche gratuite et veillerons à respecter les horaires. Votre satisfaction est notre priorité.",
    },
  },
  auto: {
    positive: {
      author: "Philippe Roux",
      rating: 5,
      date: "il y a 3 jours",
      text: "Révision complète faite en une demi-journée, tarif transparent et explications claires du mécanicien. Je recommande vivement !",
      response:
        "Merci Philippe ! Nous sommes fiers de la confiance que vous nous accordez. La transparence et la qualité de service sont au cœur de notre engagement. Au plaisir de vous revoir !",
    },
    negative: {
      author: "Laurent Petit",
      rating: 2,
      date: "il y a 6 jours",
      text: "Devis initial largement dépassé sans m'avoir consulté. La voiture a dû revenir 3 jours après pour le même problème.",
      response:
        "Merci Laurent pour votre retour. Nous comprenons votre frustration et nous en excusons sincèrement. Nous avons renforcé notre protocole de validation des devis. Contactez-nous pour que nous trouvions une solution satisfaisante.",
    },
  },
  retail: {
    positive: {
      author: "Nathalie Girard",
      rating: 5,
      date: "il y a 2 jours",
      text: "Boutique magnifique avec un choix incroyable. La vendeuse m'a aidée à trouver exactement ce que je cherchais. Merci !",
      response:
        "Merci Nathalie pour ce bel avis ! Nous sommes ravis que notre équipe ait su vous accompagner. Votre satisfaction est notre plus belle récompense. À bientôt en boutique !",
    },
    negative: {
      author: "David Faure",
      rating: 2,
      date: "il y a 5 jours",
      text: "Article reçu avec un défaut, et le SAV a mis 10 jours pour répondre. Expérience décevante.",
      response:
        "Merci David pour votre retour. Nous sommes navrés pour ce produit défectueux et ce délai de réponse inacceptable. Nous avons renforcé notre SAV et vous envoyons un remplacement immédiat avec un geste commercial.",
    },
  },
};

export const SectorDemoSection = () => {
  const [activeSector, setActiveSector] = useState("restaurant");
  const [reviewType, setReviewType] = useState<ReviewType>("positive");
  const [displayedResponse, setDisplayedResponse] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const review = DEMO_DATA[activeSector][reviewType];

  // Typewriter effect
  useEffect(() => {
    setDisplayedResponse("");
    setIsTyping(true);

    const startTimer = setTimeout(() => {
      let i = 0;
      const text = review.response;
      const interval = setInterval(() => {
        if (i < text.length) {
          setDisplayedResponse(text.substring(0, i + 1));
          i++;
        } else {
          setIsTyping(false);
          clearInterval(interval);
        }
      }, 15);
      return () => clearInterval(interval);
    }, 400);

    return () => clearTimeout(startTimer);
  }, [activeSector, reviewType, review.response]);

  return (
    <section className="py-14 sm:py-20 bg-background">
      <div className="container mx-auto px-5">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base">
              Les réponses ci-dessous à des avis positifs ou négatifs ont été générées par{" "}
              <span className="font-semibold text-primary">Starlinko IA</span>.
              <br />
              Sélectionnez une industrie et un type d'avis.
            </p>
          </div>

          {/* Demo Card */}
          <div className="bg-gradient-to-br from-muted/40 to-muted/20 rounded-2xl p-5 sm:p-8 border border-border/50 shadow-lg">
            {/* Sector chips */}
            <div className="flex flex-wrap items-center justify-center gap-2 mb-5">
              {SECTORS.map((s) => (
                <button
                  key={s.key}
                  onClick={() => setActiveSector(s.key)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    activeSector === s.key
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "bg-card text-muted-foreground border border-border hover:border-primary/40 hover:text-foreground"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Review type toggle */}
            <div className="flex items-center justify-center gap-3 mb-6">
              <button
                onClick={() => setReviewType("positive")}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  reviewType === "positive"
                    ? "bg-foreground text-background shadow-md"
                    : "bg-card text-muted-foreground border border-border hover:text-foreground"
                }`}
              >
                <ThumbsUp className="w-4 h-4" />
                Avis positif
              </button>
              <button
                onClick={() => setReviewType("negative")}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  reviewType === "negative"
                    ? "bg-foreground text-background shadow-md"
                    : "bg-card text-muted-foreground border border-border hover:text-foreground"
                }`}
              >
                <ThumbsDown className="w-4 h-4" />
                Avis négatif
              </button>
            </div>

            {/* Review bubble */}
            <div className="flex items-start gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0 text-sm font-bold text-muted-foreground">
                {review.author.charAt(0)}
              </div>
              <div className="flex-1 bg-card rounded-2xl rounded-tl-sm p-4 border border-border shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                  <span className="font-semibold text-foreground text-sm">{review.author}</span>
                  <span className="text-xs text-muted-foreground">{review.date}</span>
                </div>
                <div className="flex mb-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${i < review.rating ? "text-amber-400 fill-amber-400" : "text-muted"}`}
                    />
                  ))}
                </div>
                <p className="text-foreground text-sm leading-relaxed">{review.text}</p>
              </div>
            </div>

            {/* AI Response bubble */}
            <div className="flex items-start gap-3 justify-end">
              <div className="flex-1 bg-gradient-to-br from-primary/5 to-secondary/10 rounded-2xl rounded-tr-sm p-4 border border-primary/20 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-xs font-semibold text-primary">Réponse Starlinko</span>
                  {isTyping && (
                    <span className="text-[10px] px-2 py-0.5 bg-primary/10 text-primary rounded-full font-medium animate-pulse">
                      Rédaction...
                    </span>
                  )}
                </div>
                <p className="text-foreground text-sm leading-relaxed">
                  {displayedResponse}
                  {isTyping && <span className="inline-block w-0.5 h-4 bg-primary ml-0.5 animate-pulse" />}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-xs font-bold text-primary">
                IA
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
