import { useTranslation } from "react-i18next";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

const languages = [
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "en", label: "English", flag: "🇬🇧" },
];

interface LanguageSwitcherProps {
  variant?: "flags" | "dropdown";
  className?: string;
}

export const LanguageSwitcher = ({ variant = "flags", className = "" }: LanguageSwitcherProps) => {
  const { i18n } = useTranslation();
  const currentLang = i18n.language?.substring(0, 2) || "en";

  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
    localStorage.setItem("i18nextLng", langCode);
  };

  if (variant === "dropdown") {
    const currentLanguage = languages.find(l => l.code === currentLang) || languages[1];
    
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className={`gap-2 ${className}`}>
            <span className="text-lg">{currentLanguage.flag}</span>
            <span className="hidden sm:inline text-sm">{currentLanguage.label}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {languages.map((lang) => (
            <DropdownMenuItem
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={`gap-2 cursor-pointer ${currentLang === lang.code ? "bg-accent" : ""}`}
            >
              <span className="text-lg">{lang.flag}</span>
              <span>{lang.label}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Flags variant - simple toggle
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => handleLanguageChange(lang.code)}
          className={`text-xl p-1 rounded-md transition-all ${
            currentLang === lang.code
              ? "bg-primary/10 scale-110 ring-2 ring-primary/30"
              : "opacity-60 hover:opacity-100 hover:bg-muted"
          }`}
          title={lang.label}
          aria-label={`Switch to ${lang.label}`}
        >
          {lang.flag}
        </button>
      ))}
    </div>
  );
};
