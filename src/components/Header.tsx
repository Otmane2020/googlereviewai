import { RankiLogo } from "./StarlinkoLogo";
import { Button } from "./ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "./LanguageSwitcher";

export const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { t } = useTranslation();

  const navLinks = [
    { label: t("header.geoRank"), href: "#geo-rank" },
    { label: t("header.reviewsAI"), href: "#reviews-ai" },
    { label: t("header.howItWorks"), href: "#how-it-works" },
    { label: t("header.pricing"), href: "#pricing" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-b border-border shadow-sm">
      <div className="container mx-auto px-4 sm:px-6">
        <nav className="flex items-center justify-between h-14">
          <Link to="/" className="flex-shrink-0" aria-label="GoogleReviewAI home">
            <RankiLogo className="text-foreground scale-90 sm:scale-100" />
          </Link>

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
            <LanguageSwitcher variant="flags" />
            <Link to="/auth">
              <Button variant="outline" size="sm">{t("header.signIn")}</Button>
            </Link>
            <Link to="/auth">
              <Button size="sm">{t("header.startFree")}</Button>
            </Link>
          </div>

          <div className="flex md:hidden items-center">
            <button
              type="button"
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-foreground shadow-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={t("header.menu")}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </nav>

        {mobileMenuOpen && (
          <div
            id="mobile-navigation"
            className="absolute left-4 right-4 top-[calc(100%+0.5rem)] max-h-[calc(100dvh-5rem)] overflow-y-auto rounded-2xl border border-border bg-card p-5 shadow-2xl animate-fade-in md:hidden"
          >
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-foreground hover:text-primary transition-colors font-medium py-3 px-4 rounded-xl hover:bg-muted/50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <hr className="border-border my-3" />
              <div className="flex items-center justify-between gap-4 rounded-xl bg-muted/50 px-4 py-2">
                <span className="text-sm font-medium">{t("settings.language", "Language")}</span>
                <LanguageSwitcher variant="dropdown" className="min-w-[92px] justify-between bg-background" />
              </div>
              <div className="flex flex-col gap-2">
                <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full h-12 text-base">{t("header.signIn")}</Button>
                </Link>
                <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="default" className="w-full h-12 text-base">{t("header.startFree")}</Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
