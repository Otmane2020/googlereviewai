import { useTranslation } from "react-i18next";
import { Button } from "./ui/button";
import { supabase } from "@/integrations/supabase/client";
import { normalizeLanguage, persistLanguage } from "@/i18n/config";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

// SVG flag components for reliable cross-platform rendering
const FrenchFlag = () => (
  <svg width="20" height="15" viewBox="0 0 3 2" className="rounded-sm">
    <rect width="1" height="2" x="0" fill="#002654" />
    <rect width="1" height="2" x="1" fill="#FFFFFF" />
    <rect width="1" height="2" x="2" fill="#CE1126" />
  </svg>
);

const USFlag = () => (
  <svg width="20" height="15" viewBox="0 0 38 20" className="rounded-sm" aria-label="United States flag">
    <rect width="38" height="20" fill="#fff" />
    {Array.from({ length: 7 }, (_, i) => <rect key={i} y={i * 3} width="38" height="1.55" fill="#B22234" />)}
    <rect width="16" height="10.8" fill="#3C3B6E" />
    {Array.from({ length: 4 }, (_, row) => Array.from({ length: 5 }, (_, col) =>
      <circle key={`${row}-${col}`} cx={1.9 + col * 3.0} cy={1.2 + row * 2.55} r="0.45" fill="#fff" />
    ))}
  </svg>
);

const languages = [
  { code: "fr", label: "Français", short: "FR", Flag: FrenchFlag },
  { code: "en", label: "English", short: "EN", Flag: USFlag },
];

interface LanguageSwitcherProps {
  variant?: "flags" | "dropdown";
  className?: string;
}

export const LanguageSwitcher = ({ variant = "flags", className = "" }: LanguageSwitcherProps) => {
  const { i18n } = useTranslation();
  const currentLang = normalizeLanguage(i18n.resolvedLanguage || i18n.language) || "en";

  const handleLanguageChange = async (langCode: string) => {
    const language = normalizeLanguage(langCode) || "en";
    // Persist the explicit choice before async work so auth/OAuth cannot overwrite it.
    persistLanguage(language, true);
    await i18n.changeLanguage(language);
    // Persist to profile so server-side emails/notifications use the right language
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("profiles").update({ preferred_language: language }).eq("id", user.id);
      }
    } catch {}
    // No reload — i18next triggers re-render of all components using useTranslation
  };

  if (variant === "dropdown") {
    const currentLanguage = languages.find(l => l.code === currentLang) || languages[1];
    const CurrentFlag = currentLanguage.Flag;
    
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className={`gap-2 ${className}`}>
            <CurrentFlag />
            <span className="text-sm font-semibold">{currentLanguage.short}</span>
            <ChevronDown className="h-4 w-4 opacity-60" aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {languages.map((lang) => {
            const LangFlag = lang.Flag;
            return (
              <DropdownMenuItem
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`gap-2 cursor-pointer ${currentLang === lang.code ? "bg-accent" : ""}`}
              >
                <LangFlag />
                <span><span className="font-semibold mr-1">{lang.short}</span>{lang.label}</span>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Flags variant - simple toggle
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {languages.map((lang) => {
        const LangFlag = lang.Flag;
        return (
          <button
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className={`p-1.5 rounded-md transition-all ${
              currentLang === lang.code
                ? "bg-primary/10 scale-110 ring-2 ring-primary/30"
                : "opacity-60 hover:opacity-100 hover:bg-muted"
            }`}
            title={lang.label}
            aria-label={`Switch to ${lang.label}`}
          >
            <span className="flex items-center gap-1">
              <LangFlag />
              <span className="text-xs font-semibold">{lang.short}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
};
