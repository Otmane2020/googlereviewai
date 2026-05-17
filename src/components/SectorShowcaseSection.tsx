import { Star, MessageSquare, Bot } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import sectorRestaurant from "@/assets/sector-restaurant.jpg";
import sectorHotel from "@/assets/sector-hotel.jpg";
import sectorGarage from "@/assets/sector-garage.jpg";
import sectorSalon from "@/assets/sector-salon.jpg";
import { BrandSparkle } from "@/components/BrandSparkle";

interface SectorShowcase {
  image: string;
  name: string;
  type: string;
  rating: number;
  reviewCount: number;
  reviewAuthor: string;
  reviewText: string;
  aiResponse: string;
  stars: number;
}

const sectors: SectorShowcase[] = [
  {
    image: sectorRestaurant,
    name: "Le Petit Bistrot",
    type: "Restaurant",
    rating: 4.8,
    reviewCount: 324,
    reviewAuthor: "Sophie M.",
    reviewText: "Cuisine raffinée et service impeccable ! Les plats sont savoureux et la présentation est magnifique.",
    aiResponse: "Merci infiniment Sophie ! Votre retour nous touche beaucoup. Notre chef met tout son cœur dans chaque assiette. Au plaisir de vous revoir !",
    stars: 5,
  },
  {
    image: sectorHotel,
    name: "Hôtel Le Majestic",
    type: "Hôtel",
    rating: 4.7,
    reviewCount: 512,
    reviewAuthor: "Pierre L.",
    reviewText: "Chambre spacieuse avec une vue magnifique. Le personnel est aux petits soins. Petit-déjeuner excellent.",
    aiResponse: "Merci Pierre pour ce merveilleux avis ! Nous sommes ravis que votre séjour ait été à la hauteur. Notre équipe se réjouit de vous accueillir à nouveau !",
    stars: 5,
  },
  {
    image: sectorGarage,
    name: "Auto Service Express",
    type: "Garage",
    rating: 4.6,
    reviewCount: 187,
    reviewAuthor: "Thomas R.",
    reviewText: "Réparation rapide et prix très honnête. Le mécanicien a pris le temps d'expliquer le problème.",
    aiResponse: "Merci Thomas ! La transparence est au cœur de notre métier. Nous sommes heureux d'avoir pu résoudre votre problème rapidement. À bientôt !",
    stars: 5,
  },
  {
    image: sectorSalon,
    name: "Salon Élégance",
    type: "Coiffure",
    rating: 4.9,
    reviewCount: 256,
    reviewAuthor: "Léa B.",
    reviewText: "Ma coiffeuse a parfaitement compris ce que je voulais. Résultat au top, je suis ravie !",
    aiResponse: "Merci Léa ! Votre satisfaction est notre plus belle récompense. Nous adorons voir nos clientes repartir avec le sourire. À très vite !",
    stars: 5,
  },
];

export const SectorShowcaseSection = () => {
  return (
    <section className="py-16 sm:py-24 bg-background" id="secteurs-showcase">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Badge className="mb-4" variant="outline">Tous secteurs</Badge>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            L'IA qui répond à vos avis,<br />
            <span className="text-primary">quel que soit votre métier</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-base sm:text-lg">
            Restaurants, hôtels, garages, salons de coiffure… Ranki.ai génère des réponses personnalisées et booste votre visibilité sur Google et ChatGPT.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {sectors.map((sector, index) => (
            <div
              key={index}
              className="group relative bg-card rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              {/* Image with overlay */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={sector.image}
                  alt={`${sector.type} - ${sector.name}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                  width={640}
                  height={512}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                
                {/* Business info overlay */}
                <div className="absolute bottom-3 left-4 right-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-medium text-white/70 uppercase tracking-wider">{sector.type}</span>
                      <h3 className="text-white font-bold text-lg leading-tight">{sector.name}</h3>
                    </div>
                    <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      <span className="text-white font-bold text-sm">{sector.rating}</span>
                      <span className="text-white/70 text-xs">({sector.reviewCount})</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Review + AI Response */}
              <div className="p-4 space-y-3">
                {/* Customer review */}
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0 text-xs font-bold text-muted-foreground">
                    {sector.reviewAuthor.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-foreground text-sm">{sector.reviewAuthor}</span>
                      <div className="flex">
                        {Array.from({ length: sector.stars }).map((_, i) => (
                          <Star key={i} className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                        ))}
                      </div>
                    </div>
                    <p className="text-muted-foreground text-xs leading-relaxed line-clamp-2">
                      "{sector.reviewText}"
                    </p>
                  </div>
                </div>

                {/* AI Response */}
                <div className="p-3 bg-primary/5 rounded-xl border-l-3 border-primary">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <BrandSparkle className="w-3.5 h-3.5 text-primary" />
                    <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Réponse IA</span>
                    <span className="text-[9px] px-1.5 py-0.5 bg-emerald-500/20 text-emerald-600 rounded-full font-semibold">Auto</span>
                  </div>
                  <p className="text-foreground text-xs leading-relaxed line-clamp-2">
                    "{sector.aiResponse}"
                  </p>
                </div>
              </div>

              {/* Bottom bar with features */}
              <div className="px-4 pb-4">
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" />
                    <span>Réponse auto</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Bot className="w-3 h-3" />
                    <span>Visible sur ChatGPT</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    <span>SEO boosté</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
