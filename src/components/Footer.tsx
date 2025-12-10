import { StarlinkoLogo } from "./StarlinkoLogo";

export const Footer = () => {
  return (
    <footer className="bg-foreground/90 backdrop-blur-md py-8">
      <div className="max-w-6xl mx-auto px-4 text-center">
        <div className="flex items-center justify-center mb-6">
          <StarlinkoLogo showBadge={false} className="text-card" />
          <div className="ml-4 bg-card/20 rounded-full px-3 py-1">
            <span className="text-card text-sm font-medium">API Google vérifiée</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 justify-center mb-6">
          <a href="/privacy" className="text-card/80 hover:text-card transition-colors text-sm">
            Confidentialité
          </a>
          <a href="/terms" className="text-card/80 hover:text-card transition-colors text-sm">
            Conditions d'utilisation
          </a>
          <a href="/api-terms" className="text-card/80 hover:text-card transition-colors text-sm">
            Conditions API
          </a>
          <a href="/gdpr" className="text-card/80 hover:text-card transition-colors text-sm">
            RGPD
          </a>
        </div>

        <div className="border-t border-card/20 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-card/60 text-sm mb-4 md:mb-0">
              © {new Date().getFullYear()} Starlinko. Application vérifiée avec accès API Google My Business.
              Tous droits réservés.
            </p>

            <div className="flex space-x-4">
              <a href="https://twitter.com/starlinko" className="text-card/60 hover:text-card transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a href="https://linkedin.com/company/starlinko" className="text-card/60 hover:text-card transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
