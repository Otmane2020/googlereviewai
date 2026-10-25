import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { MessageSquareReply, Sparkles, MapPin, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "À propos de ReviewsAI — Réponses IA aux avis Google" },
      { name: "description", content: "ReviewsAI aide restaurants, hôtels et commerces locaux à répondre à leurs avis Google avec l'IA et à gagner en visibilité." },
      { property: "og:title", content: "À propos de ReviewsAI" },
      { property: "og:description", content: "L'IA qui répond à vos avis Google et booste votre visibilité locale." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AboutPage,
});

const copy = {
  fr: {
    title: "À propos de ReviewsAI",
    intro: "ReviewsAI aide les restaurants, hôtels et commerces locaux à répondre à chaque avis Google, rapidement et avec le ton de leur établissement.",
    mission: "Notre mission",
    missionText: "Les gérants n'ont pas le temps de répondre aux avis après le service. Nous automatisons cette tâche avec des réponses personnalisées, jamais robotiques, pour que chaque client se sente écouté.",
    features: [
      ["Réponses IA personnalisées", "Des réponses adaptées à votre voix de marque et à votre signature."],
      ["Visibilité locale", "Publications Google et contenus optimisés pour Google et les moteurs IA."],
      ["Suivi Google Maps", "Mesurez votre position locale face à vos concurrents."],
      ["Avis négatifs gérés", "Des réponses calmes et professionnelles, même dans les cas difficiles."],
    ],
    cta: "Commencer",
    contact: "Une question ? Écrivez-nous à support@ranki.ai",
  },
  en: {
    title: "About ReviewsAI",
    intro: "ReviewsAI helps restaurants, hotels and local businesses reply to every Google review, fast and in their own voice.",
    mission: "Our mission",
    missionText: "Owners don't have time to answer reviews after a busy shift. We automate it with personal, never robotic replies, so every customer feels heard.",
    features: [
      ["Personal AI replies", "Replies matched to your brand voice and signature."],
      ["Local visibility", "Google posts and content optimized for Google and AI engines."],
      ["Google Maps tracking", "See your local ranking against competitors."],
      ["Negative reviews handled", "Calm, professional replies, even in tough cases."],
    ],
    cta: "Get started",
    contact: "Questions? Email us at support@ranki.ai",
  },
};

const icons = [MessageSquareReply, Sparkles, MapPin, ShieldCheck];

function AboutPage() {
  const { i18n } = useTranslation();
  const t = i18n.language?.startsWith("en") ? copy.en : copy.fr;
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-4xl px-6 py-16">
        <h1 className="text-4xl font-bold tracking-tight">{t.title}</h1>
        <p className="mt-4 text-lg text-muted-foreground">{t.intro}</p>
        <section className="mt-12 rounded-3xl border bg-card p-8">
          <h2 className="text-2xl font-semibold">{t.mission}</h2>
          <p className="mt-3 text-muted-foreground">{t.missionText}</p>
        </section>
        <section className="mt-8 grid gap-4 sm:grid-cols-2">
          {t.features.map(([title, desc], i) => {
            const Icon = icons[i];
            return (
              <div key={title} className="rounded-3xl border bg-card p-6">
                <Icon className="h-6 w-6 text-primary" />
                <h3 className="mt-3 font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
              </div>
            );
          })}
        </section>
        <div className="mt-10 flex flex-col items-start gap-3">
          <Button asChild size="lg"><Link to="/auth">{t.cta}</Link></Button>
          <p className="text-sm text-muted-foreground">{t.contact}</p>
        </div>
      </div>
    </main>
  );
}
