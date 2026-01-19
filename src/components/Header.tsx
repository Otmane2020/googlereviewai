import { StarlinkoLogo } from "./StarlinkoLogo";
import { Button } from "./ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

const navLinks = [
  { label: "Fonctionnalités", href: "#features" },
  { label: "Conformité", href: "#compliance" },
  { label: "Tarifs", href: "#pricing" },
];

export const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header 
      className="fixed top-0 left-0 right-0 z-50 bg-card border-b border-border shadow-sm"
    >
      <div className="container mx-auto px-4 sm:px-6">
        <nav className="flex items-center justify-between h-14">
          <Link to="/" className="flex-shrink-0">
            <StarlinkoLogo className="text-foreground scale-90 sm:scale-100" />
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6 lg:gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="font-medium transition-colors text-sm text-muted-foreground hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
          </div>
          
          <div className="hidden md:flex items-center gap-2">
            <Link to="/auth">
              <Button variant="outline" size="sm">
                Se connecter
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="sm">
                Créer un compte
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg text-foreground hover:bg-muted"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </nav>

        {/* Mobile Menu - Improved */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-card/98 backdrop-blur-xl rounded-2xl p-5 mt-2 shadow-2xl animate-fade-in border border-border mx-2">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-foreground hover:text-primary transition-colors font-medium py-3 px-4 rounded-xl hover:bg-muted/50 active:bg-muted"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <hr className="border-border my-3" />
              <div className="flex flex-col gap-2">
                <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full h-12 text-base">
                    Se connecter
                  </Button>
                </Link>
                <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="default" className="w-full h-12 text-base">
                    Créer un compte
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
