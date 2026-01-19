import { Star, Quote } from "lucide-react";

const GoogleIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const ChatGPTIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z"/>
  </svg>
);

// Fictional company logos as SVG components
const CompanyLogo1 = () => (
  <div className="flex items-center gap-2">
    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
      <span className="text-white font-bold text-sm">B</span>
    </div>
    <span className="font-semibold text-foreground text-sm">BellaVista</span>
  </div>
);

const CompanyLogo2 = () => (
  <div className="flex items-center gap-2">
    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
      <span className="text-white font-bold text-sm">G</span>
    </div>
    <span className="font-semibold text-foreground text-sm">GreenLeaf</span>
  </div>
);

const CompanyLogo3 = () => (
  <div className="flex items-center gap-2">
    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
      <span className="text-white font-bold text-sm">S</span>
    </div>
    <span className="font-semibold text-foreground text-sm">SavorBistro</span>
  </div>
);

const testimonials = [
  {
    name: "Marie Dupont",
    role: "Gérante",
    company: CompanyLogo1,
    avatar: "MD",
    rating: 5,
    text: "Starlinko a révolutionné notre gestion des avis. On répond à 50 avis par semaine en 5 minutes au lieu de 2 heures !",
    highlight: "+85% de réponses",
  },
  {
    name: "Thomas Bernard",
    role: "Directeur Marketing",
    company: CompanyLogo2,
    avatar: "TB",
    rating: 5,
    text: "Grâce à l'AEO, nous apparaissons maintenant dans les réponses de ChatGPT. Nos demandes de devis ont explosé.",
    highlight: "+120% de leads",
  },
  {
    name: "Sophie Martin",
    role: "Propriétaire",
    company: CompanyLogo3,
    avatar: "SM",
    rating: 5,
    text: "Les articles SEO générés automatiquement nous ont fait passer en première page Google sur 12 mots-clés locaux.",
    highlight: "#1 sur Google",
  },
];

const trustedBy = [
  { name: "Google", icon: GoogleIcon },
  { name: "ChatGPT", icon: ChatGPTIcon },
];

export const TestimonialsSection = () => {
  return (
    <section className="py-14 sm:py-20 md:py-24 bg-muted/30">
      <div className="container mx-auto px-5 sm:px-6">
        {/* Section header */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary/10 rounded-full mb-5">
            <Quote className="w-4 h-4 text-secondary" />
            <span className="text-secondary text-xs sm:text-sm font-semibold">Témoignages clients</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4">
            Ils nous font confiance
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            +500 entreprises utilisent Starlinko pour dominer leur marché local
          </p>
        </div>

        {/* Trusted platforms */}
        <div className="flex items-center justify-center gap-8 mb-10">
          <div className="flex items-center gap-2 px-4 py-2 bg-card rounded-xl border border-border shadow-sm">
            <GoogleIcon className="w-5 h-5" />
            <span className="text-sm font-medium text-foreground">Google</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-card rounded-xl border border-border shadow-sm">
            <ChatGPTIcon className="w-5 h-5 text-[#10a37f]" />
            <span className="text-sm font-medium text-foreground">ChatGPT</span>
          </div>
        </div>

        {/* Testimonials grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.name}
              className="bg-card p-5 sm:p-6 rounded-2xl border border-border shadow-sm hover:shadow-lg transition-all duration-300"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-semibold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">{testimonial.name}</p>
                    <p className="text-muted-foreground text-xs">{testimonial.role}</p>
                  </div>
                </div>
                <div className="flex">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 text-accent fill-accent" />
                  ))}
                </div>
              </div>

              {/* Quote */}
              <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                "{testimonial.text}"
              </p>

              {/* Company & highlight */}
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <testimonial.company />
                <span className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                  {testimonial.highlight}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Stats bar */}
        <div className="mt-10 sm:mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { value: "+500", label: "Entreprises" },
            { value: "50K+", label: "Avis traités" },
            { value: "4.9/5", label: "Satisfaction" },
            { value: "2min", label: "Temps setup" },
          ].map((stat) => (
            <div key={stat.label} className="text-center p-4 bg-card rounded-xl border border-border">
              <p className="text-xl sm:text-2xl font-bold text-primary">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
