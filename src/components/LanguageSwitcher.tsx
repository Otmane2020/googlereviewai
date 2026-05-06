import { useTranslation } from "react-i18next";
import { Button } from "./ui/button";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

// SVG flag components for reliable cross-platform rendering
const FrenchFlag = () => (
  <svg width="20" height="15" viewBox="0 0 3 2" className="rounded-sm">
    <rect width="1" height="2" x="0" fill="#002654" />
    <rect width="1" height="2" x="1" fill="#FFFFFF" />
    <rect width="1" height="2" x="2" fill="#CE1126" />
  </svg>
);

const BritishFlag = () => (
  <svg width="20" height="15" viewBox="0 0 60 30" className="rounded-sm">
    <clipPath id="s"><path d="M0,0 v30 h60 v-30 z"/></clipPath>
    <clipPath id="t"><path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z"/></clipPath>
    <g clipPath="url(#s)">
      <path d="M0,0 v30 h60 v-30 z" fill="#012169"/>
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6"/>
      <path d="M0,0 L60,30 M60,0 L0,30" clipPath="url(#t)" stroke="#C8102E" strokeWidth="4"/>
      <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10"/>
      <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6"/>
    </g>
  </svg>
);

const languages = [
  { code: "fr", label: "Français", short: "FR", Flag: FrenchFlag },
  { code: "en", label: "English", short: "EN", Flag: BritishFlag },
];

interface LanguageSwitcherProps {
  variant?: "flags" | "dropdown";
  className?: string;
}

export const LanguageSwitcher = ({ variant = "flags", className = "" }: LanguageSwitcherProps) => {
  const { i18n } = useTranslation();
  const currentLang = i18n.language?.substring(0, 2) || "en";

  const handleLanguageChange = async (langCode: string) => {
    await i18n.changeLanguage(langCode);
    try { localStorage.setItem("i18nextLng", langCode); } catch {}
    try { document.documentElement.lang = langCode; } catch {}
    // Persist to profile so server-side emails/notifications use the right language
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("profiles").update({ preferred_language: langCode }).eq("id", user.id);
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
