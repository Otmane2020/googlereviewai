import { Link } from "react-router-dom";
import { StarlinkoLogo } from "./StarlinkoLogo";

const footerLinks = {
  product: {
    title: "Produit",
    links: [
      { label: "Fonctionnalités", href: "#features" },
      { label: "Tarifs", href: "#pricing" },
    ],
  },
  legal: {
    title: "Légal",
    links: [
      { label: "Confidentialité", href: "/privacy" },
      { label: "Conditions", href: "/terms" },
    ],
  },
  support: {
    title: "Support",
    links: [
      { label: "Centre d'aide", href: "#" },
      { label: "Contact", href: "#" },
    ],
  },
};

export const Footer = () => {
  return (
    <footer className="bg-foreground text-card py-12 sm:py-14 md:py-16">
      <div className="container mx-auto px-5 sm:px-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 sm:gap-10 md:gap-12 mb-10 sm:mb-12">
          {/* Brand column */}
          <div className="col-span-2 sm:col-span-1">
            <div className="mb-4 sm:mb-6">
              <StarlinkoLogo showBadge={false} className="text-card scale-90 sm:scale-100" />
            </div>
            <p className="text-card/60 text-xs sm:text-sm mb-4 sm:mb-6 max-w-xs">
              Plateforme de gestion automatisée des avis Google My Business.
            </p>
            <div className="flex items-center gap-2 text-xs text-card/60">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
              <span>API : Opérationnel</span>
            </div>
          </div>

          {/* Links columns */}
          {Object.values(footerLinks).map((section) => (
            <div key={section.title}>
              <h4 className="font-semibold text-card mb-3 sm:mb-4 text-sm sm:text-base">{section.title}</h4>
              <ul className="space-y-2 sm:space-y-3">
                {section.links.map((link) => (
                  <li key={link.label}>
                    {link.href.startsWith("/") ? (
                      <Link
                        to={link.href}
                        className="text-xs sm:text-sm text-card/60 hover:text-card transition-colors"
                      >
                        {link.label}
                      </Link>
                    ) : (
                      <a
                        href={link.href}
                        className="text-xs sm:text-sm text-card/60 hover:text-card transition-colors"
                      >
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="pt-6 sm:pt-8 border-t border-card/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs sm:text-sm text-card/60 text-center sm:text-left">
            © {new Date().getFullYear()} Starlinko. Tous droits réservés.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs sm:text-sm text-card/60">
            <span>🤖 IA + SEO + AEO</span>
            <span>🚀 Devancez vos concurrents</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
