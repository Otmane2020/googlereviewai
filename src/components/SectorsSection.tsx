import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ChefHat, 
  Hotel, 
  Scissors, 
  Car, 
  Stethoscope, 
  Store,
  Wrench,
  GraduationCap,
  ArrowRight
} from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export const SectorsSection = () => {
  const { t } = useTranslation();

  const sectors = [
    {
      icon: ChefHat,
      name: t("sectors.restaurants"),
      description: t("sectors.restaurantsDesc"),
      link: "/avis-ai-restaurant",
      color: "text-orange-500",
      bgColor: "bg-orange-100 dark:bg-orange-900/30"
    },
    {
      icon: Hotel,
      name: t("sectors.hotels"),
      description: t("sectors.hotelsDesc"),
      link: "/avis-ai-hotel",
      color: "text-blue-500",
      bgColor: "bg-blue-100 dark:bg-blue-900/30"
    },
    {
      icon: Scissors,
      name: t("sectors.beauty"),
      description: t("sectors.beautyDesc"),
      link: "/auth",
      color: "text-pink-500",
      bgColor: "bg-pink-100 dark:bg-pink-900/30"
    },
    {
      icon: Car,
      name: t("sectors.automotive"),
      description: t("sectors.automotiveDesc"),
      link: "/auth",
      color: "text-slate-500",
      bgColor: "bg-slate-100 dark:bg-slate-900/30"
    },
    {
      icon: Stethoscope,
      name: t("sectors.healthcare"),
      description: t("sectors.healthcareDesc"),
      link: "/auth",
      color: "text-emerald-500",
      bgColor: "bg-emerald-100 dark:bg-emerald-900/30"
    },
    {
      icon: Store,
      name: t("sectors.retail"),
      description: t("sectors.retailDesc"),
      link: "/auth",
      color: "text-amber-500",
      bgColor: "bg-amber-100 dark:bg-amber-900/30"
    },
    {
      icon: Wrench,
      name: t("sectors.construction"),
      description: t("sectors.constructionDesc"),
      link: "/auth",
      color: "text-yellow-600",
      bgColor: "bg-yellow-100 dark:bg-yellow-900/30"
    },
    {
      icon: GraduationCap,
      name: t("sectors.education"),
      description: t("sectors.educationDesc"),
      link: "/auth",
      color: "text-violet-500",
      bgColor: "bg-violet-100 dark:bg-violet-900/30"
    }
  ];

  return (
    <section className="py-16 sm:py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Badge className="mb-4">{t("sectors.badge")}</Badge>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            {t("sectors.title")}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t("sectors.subtitle")}
          </p>
        </div>
        
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {sectors.map((sector, index) => (
            <Link key={index} to={sector.link}>
              <Card className="h-full hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer group">
                <CardContent className="pt-6">
                  <div className={`w-12 h-12 rounded-xl ${sector.bgColor} flex items-center justify-center mb-4`}>
                    <sector.icon className={`w-6 h-6 ${sector.color}`} />
                  </div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    {sector.name}
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </h3>
                  <p className="text-sm text-muted-foreground">{sector.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};
