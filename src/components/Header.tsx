import { StarlinkoLogo } from "./StarlinkoLogo";
import { Button } from "./ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { TrustAvisMiniRating } from "./TrustAvisBadge";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useTranslation } from "react-i18next";

export const Header = () => {
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: t("header.features"), href: "#features" },
    { label: t("header.compliance"), href: "#compliance" },
    { label: t("header.pricing"), href: "#pricing" },
  ];

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
            <TrustAvisMiniRating />
          </div>
          
          <div className="hidden md:flex items-center gap-2">
            <LanguageSwitcher />
            <Link to="/auth">
              <Button variant="outline" size="sm">
                {t("header.signIn")}
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="sm">
                {t("header.createAccount")}
              </Button>
            </Link>
          </div>

          {/* Mobile: Language + Menu */}
          <div className="flex md:hidden items-center gap-2">
            <LanguageSwitcher />
            <button
              className="p-2 rounded-lg text-foreground hover:bg-muted"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
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
                    {t("header.signIn")}
                  </Button>
                </Link>
                <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="default" className="w-full h-12 text-base">
                    {t("header.createAccount")}
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
