import { Info } from "lucide-react";
import { useTranslation } from "react-i18next";
import { inAppSubscriptionMessage } from "@/lib/androidApp";

export const InAppSubscriptionNotice = ({ className = "" }: { className?: string }) => {
  const { i18n } = useTranslation();
  const isFrench = !i18n.language?.startsWith("en");
  return (
    <div className={`flex items-start gap-3 rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground ${className}`}>
      <Info className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary" />
      <p>{inAppSubscriptionMessage(isFrench)}</p>
    </div>
  );
};
