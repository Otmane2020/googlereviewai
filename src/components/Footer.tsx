import { StarlinkoLogo } from "./StarlinkoLogo";

const footerLinks = {
  product: {
    title: "Produit",
    links: [
      { label: "Fonctionnalités", href: "#features" },
      { label: "Tarifs", href: "#pricing" },
      { label: "Intégrations", href: "#" },
      { label: "Changelog", href: "#" },
    ],
  },
  company: {
    title: "Entreprise",
    links: [
      { label: "À propos", href: "#" },
      { label: "Blog", href: "#" },
      { label: "Carrières", href: "#" },
      { label: "Contact", href: "#" },
    ],
  },
  legal: {
    title: "Légal",
    links: [
      { label: "Confidentialité", href: "#" },
      { label: "Conditions d'utilisation", href: "#" },
      { label: "Politique cookies", href: "#" },
      { label: "Conformité API", href: "#" },
    ],
  },
  support: {
    title: "Support",
    links: [
      { label: "Centre d'aide", href: "#" },
      { label: "Documentation API", href: "#" },
      { label: "Status", href: "#" },
      { label: "Communauté", href: "#" },
    ],
  },
};

export const Footer = () => {
  return (
    <footer className="bg-foreground text-card py-16">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 lg:grid-cols-6 gap-12 mb-12">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <StarlinkoLogo showBadge={false} className="text-card" />
            </div>
            <p className="text-card/60 text-sm mb-6 max-w-xs">
              Plateforme de gestion automatisée des avis Google My Business avec accès API vérifié par Google.
            </p>
            <div className="flex items-center gap-2 text-xs text-card/60">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
              <span>Statut API : Opérationnel</span>
            </div>
          </div>

          {/* Links columns */}
          {Object.values(footerLinks).map((section) => (
            <div key={section.title}>
              <h4 className="font-semibold text-card mb-4">{section.title}</h4>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-card/60 hover:text-card transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-card/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-card/60">
            © {new Date().getFullYear()} Starlinko. Tous droits réservés.
          </p>
          <div className="flex items-center gap-6 text-sm text-card/60">
            <span>🔒 Application vérifiée Google</span>
            <span>✅ Conforme aux politiques API</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
