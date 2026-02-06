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
      author: "Caroline Vidal",
      rating: 5,
      date: "il y a 3 jours",
      text: "Un vrai coup de cœur ! Le tartare de saumon était d'une fraîcheur incroyable et l'ambiance chaleureuse. On s'est sentis comme chez nous.",
      response:
        "Merci beaucoup Caroline pour ce magnifique retour ! Nous sommes ravis que notre tartare et l'atmosphère vous aient conquise. Toute l'équipe a hâte de vous retrouver pour un prochain moment gourmand !",
    },
    negative: {
      author: "Frédéric Lemoine",
      rating: 2,
      date: "il y a 4 jours",
      text: "Réservation pour 20h, installés à 20h35. Les plats étaient tièdes et le serveur peu disponible. Très décevant pour le prix.",
      response:
        "Merci Frédéric pour votre retour sincère. Nous sommes navrés de cette expérience qui ne correspond pas à nos exigences. Nous avons revu l'organisation du service aux heures de pointe. Nous aimerions vous inviter à revenir pour rectifier cette impression.",
    },
  },
  hotel: {
    positive: {
      author: "Isabelle Marchand",
      rating: 5,
      date: "il y a 2 jours",
      text: "Week-end mémorable ! Chambre spacieuse avec terrasse, spa sublime et personnel d'une gentillesse rare. Un vrai havre de paix.",
      response:
        "Merci Isabelle pour ces mots qui nous vont droit au cœur ! Savoir que votre week-end a été si agréable est notre plus belle récompense. Nous serons ravis de vous accueillir de nouveau !",
    },
    negative: {
      author: "Rémi Blanchard",
      rating: 2,
      date: "il y a 1 semaine",
      text: "Wifi quasi inexistant, serviettes non changées en 3 jours et petit-déjeuner peu varié. Rapport qualité-prix décevant.",
      response:
        "Merci Rémi pour ces remarques pertinentes. Nous prenons très au sérieux chacun de ces points. Le réseau wifi a été mis à jour et les consignes de ménage renforcées. Nous espérons vous prouver notre amélioration lors d'un prochain séjour.",
    },
  },
  beauty: {
    positive: {
      author: "Leïla Benkacem",
      rating: 5,
      date: "il y a 1 jour",
      text: "Massage relaxant absolument divin ! J'en suis ressortie transformée. Le cadre est zen et l'accueil chaleureux. Je recommande à 100 %.",
      response:
        "Merci Leïla pour ce superbe avis ! Votre bien-être est notre priorité et nous sommes ravies que ce moment de détente ait été à la hauteur. Hâte de vous retrouver pour une nouvelle parenthèse zen !",
    },
    negative: {
      author: "Émilie Garnier",
      rating: 2,
      date: "il y a 3 jours",
      text: "Coloration ratée, le résultat ne correspondait pas du tout à ce que j'avais demandé. Obligée d'aller rectifier ailleurs.",
      response:
        "Merci Émilie pour votre retour. Nous sommes sincèrement désolés de cette situation inacceptable. Nous souhaitons vous proposer une correction gratuite avec notre coloriste senior. Votre confiance compte énormément pour nous.",
    },
  },
  auto: {
    positive: {
      author: "Stéphane Perrin",
      rating: 5,
      date: "il y a 2 jours",
      text: "Contrôle technique + vidange effectués rapidement. Facture détaillée, prix honnête et véhicule de courtoisie proposé. Garage au top !",
      response:
        "Merci Stéphane pour votre confiance ! Nous mettons un point d'honneur à offrir un service rapide et transparent. Ravi que le véhicule de courtoisie ait facilité votre journée. À bientôt !",
    },
    negative: {
      author: "Christophe Renaud",
      rating: 2,
      date: "il y a 5 jours",
      text: "Pièce commandée soi-disant en stock, finalement 2 semaines d'attente. Aucune communication entre-temps. Frustrant.",
      response:
        "Merci Christophe pour ce signalement. Ce manque de communication est inexcusable et ne reflète pas nos valeurs. Nous avons mis en place un système de suivi SMS pour tenir nos clients informés. Nous vous devons mieux et souhaitons regagner votre confiance.",
    },
  },
  retail: {
    positive: {
      author: "Sandrine Collet",
      rating: 5,
      date: "il y a 1 jour",
      text: "Livraison ultra rapide et produit conforme à la description. Le service client m'a même appelée pour confirmer ma taille. Bravo !",
      response:
        "Merci Sandrine pour ce retour enthousiaste ! Nous croyons que l'attention aux détails fait toute la différence. Ravie que notre équipe ait su vous accompagner. Au plaisir de vous servir à nouveau !",
    },
    negative: {
      author: "Julien Carpentier",
      rating: 2,
      date: "il y a 6 jours",
      text: "Colis arrivé abîmé, emballage insuffisant. Le retour a été compliqué et le remboursement a pris 3 semaines.",
      response:
        "Merci Julien pour votre retour. Nous sommes sincèrement désolés pour ces désagréments. Nous avons revu notre processus d'emballage et accéléré les délais de remboursement à 5 jours ouvrés. Nous espérons vous satisfaire pleinement la prochaine fois.",
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
