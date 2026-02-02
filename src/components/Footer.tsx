import { Link } from "react-router-dom";
import { Star, Phone } from "lucide-react";
import { StarlinkoLogo } from "./StarlinkoLogo";
import { TrustAvisBadge } from "./TrustAvisBadge";
import { GOOGLE_PLAY_URL } from "@/hooks/useDeviceDetection";

const SUPPORT_PHONE = "01 85 09 91 15";

const footerLinks = {
  product: {
    title: "Produit",
    links: [
      { label: "Fonctionnalités", href: "#features" },
      { label: "Tarifs", href: "#pricing" },
      { label: "Blog", href: "/blog" },
      { label: "Google Play", href: GOOGLE_PLAY_URL, icon: "play" },
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
      { label: SUPPORT_PHONE, href: `tel:${SUPPORT_PHONE.replace(/\s/g, '')}`, icon: "phone" },
      { label: "Contact", href: "mailto:support@starlinko.app" },
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
            <div className="flex items-center gap-2 text-xs text-card/60 mb-4">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
              <span>API : Opérationnel</span>
            </div>
            <TrustAvisBadge />
          </div>

          {/* Links columns */}
          {Object.values(footerLinks).map((section) => (
            <div key={section.title}>
              <h4 className="font-semibold text-card mb-3 sm:mb-4 text-sm sm:text-base">{section.title}</h4>
              <ul className="space-y-2 sm:space-y-3">
                {section.links.map((link: { label: string; href: string; icon?: string }) => (
                  <li key={link.label}>
                    {link.href.startsWith("/") ? (
                      <Link
                        to={link.href}
                        className="text-xs sm:text-sm text-card/60 hover:text-card transition-colors flex items-center gap-1.5"
                      >
                        {link.icon === "phone" && <Phone className="w-3 h-3" />}
                        {link.label}
                      </Link>
                    ) : (
                      <a
                        href={link.href}
                        target={link.href.startsWith("http") ? "_blank" : undefined}
                        rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
                        className="text-xs sm:text-sm text-card/60 hover:text-card transition-colors flex items-center gap-1.5"
                      >
                        {link.icon === "phone" && <Phone className="w-3 h-3" />}
                        {link.icon === "play" && (
                          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M3 20.5V3.5C3 2.91 3.34 2.39 3.84 2.15L13.69 12L3.84 21.85C3.34 21.61 3 21.09 3 20.5Z"/>
                          </svg>
                        )}
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
            {/* TrustAvis Rating */}
            <a
              href="https://trust-avis.com/entreprise/starlinko"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-card/60 hover:text-card transition-colors"
            >
              <div className="w-4 h-4 bg-[#3B82F6] rounded flex items-center justify-center">
                <Star className="w-2.5 h-2.5 text-white fill-white" />
              </div>
              <span className="font-medium">
                <span className="text-card">Trust</span>
                <span className="text-[#3B82F6]">Avis</span>
              </span>
              <span>4.8</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
