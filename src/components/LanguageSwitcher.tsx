import { useTranslation } from "react-i18next";
import { Button } from "./ui/button";
import { supabase } from "@/integrations/supabase/client";
import { normalizeLanguage, persistLanguage } from "@/i18n/config";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { ChevronDown, Check } from "lucide-react";

// Flags rendered as SVGs for predictable appearance on all browsers/devices.
const FrenchFlag = () => (
  <svg width="22" height="16" viewBox="0 0 3 2" className="shrink-0 rounded-sm" role="img" aria-label="France">
    <rect width="1" height="2" x="0" fill="#002654" />
    <rect width="1" height="2" x="1" fill="#fff" />
    <rect width="1" height="2" x="2" fill="#CE1126" />
  </svg>
);
const USFlag = () => (
  <svg width="22" height="16" viewBox="0 0 38 20" className="shrink-0 rounded-sm" role="img" aria-label="United States">
    <rect width="38" height="20" fill="#fff" />
    {Array.from({ length: 7 }, (_, i) => <rect key={i} y={i * 3} width="38" height="1.55" fill="#B22234" />)}
    <rect width="16" height="10.8" fill="#3C3B6E" />
    {Array.from({ length: 4 }, (_, row) => Array.from({ length: 5 }, (_, col) =>
      <circle key={`${row}-${col}`} cx={1.9 + col * 3} cy={1.2 + row * 2.55} r=".45" fill="#fff" />
    ))}
  </svg>
);

const languages = [
  { code: "en" as const, name: "English", short: "EN", Flag: USFlag },
  { code: "fr" as const, name: "Français", short: "FR", Flag: FrenchFlag },
];
interface LanguageSwitcherProps {
  variant?: "flags" | "dropdown"; // Older call sites stay compatible.
  className?: string;
}

export const LanguageSwitcher = ({ className = "" }: LanguageSwitcherProps) => {
  const { i18n } = useTranslation();
  const currentLang = normalizeLanguage(i18n.resolvedLanguage || i18n.language) || "en";
  const active = languages.find(language => language.code === currentLang) || languages[0];
  const CurrentFlag = active.Flag;

  const selectLanguage = async (language: "fr" | "en") => {
    // Persist BEFORE the async account update: an OAuth redirect must not
    // override a deliberate selection with the visitor country default.
    persistLanguage(language, true);
    await i18n.changeLanguage(language);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("profiles").update({ preferred_language: language }).eq("id", user.id);
      }
    } catch {
      // A profile update failure must never revert the language in the UI.
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" size="sm"
          aria-label={currentLang === "fr" ? "Choisir la langue" : "Choose language"}
          className={`h-9 gap-2 rounded-xl border-border/70 bg-card text-foreground hover:bg-muted/60 ${className}`}>
          <CurrentFlag />
          <span className="text-xs font-semibold">{active.short}</span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-65" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="z-[110] min-w-[178px] rounded-xl">
        {languages.map(({ code, name, short, Flag }) => (
          <DropdownMenuItem
            key={code}
            className="flex cursor-pointer items-center gap-2.5 rounded-lg py-2.5"
            onSelect={() => void selectLanguage(code)}>
            <Flag />
            <span className="min-w-0 flex-1 text-sm"><strong className="mr-1">{short}</strong> {name}</span>
            {currentLang === code && <Check className="h-4 w-4 text-primary" aria-hidden="true" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
