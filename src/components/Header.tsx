import { StarlinkoLogo } from "./StarlinkoLogo";
import { Button } from "./ui/button";
import { Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const navLinks = [
  { label: "Fonctionnalités", href: "#features" },
  { label: "Conformité", href: "#compliance" },
  { label: "Tarifs", href: "#pricing" },
];

export const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? "bg-background/95 backdrop-blur-lg border-b border-border shadow-sm" 
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6">
        <nav className="flex items-center justify-between h-16 sm:h-20">
          <Link to="/" className="flex-shrink-0">
            <StarlinkoLogo className={`${scrolled ? "text-foreground" : "text-card"} scale-90 sm:scale-100`} />
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6 lg:gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={`font-medium transition-colors text-sm lg:text-base ${
                  scrolled 
                    ? "text-muted-foreground hover:text-foreground" 
                    : "text-card/80 hover:text-card"
                }`}
              >
                {link.label}
              </a>
            ))}
          </div>
          
          <div className="hidden md:flex items-center gap-2 lg:gap-3">
            <Link to="/auth">
              <Button 
                variant={scrolled ? "outline" : "heroOutline"} 
                size="default"
                className="text-sm px-4"
              >
                Se connecter
              </Button>
            </Link>
            <Link to="/auth">
              <Button 
                variant={scrolled ? "default" : "hero"} 
                size="default"
                className="text-sm px-4"
              >
                Créer un compte
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className={`md:hidden p-2 rounded-lg transition-colors ${
              scrolled ? "text-foreground hover:bg-muted" : "text-card hover:bg-card/10"
            }`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
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
