import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { RankiLogo } from "./StarlinkoLogo";

export const Footer = () => {
  const { t } = useTranslation();
  const sections = [
    { title: t("landingUI.footer.product"), links: [
      { label: t("landingUI.footer.geoRankTracker"), href: "#geo-rank" },
      { label: t("landingUI.footer.reviewsAI"), href: "#reviews-ai" },
      { label: t("landingUI.footer.localSeoAuto"), href: "#how-it-works" },
      { label: t("landingUI.footer.pricing"), href: "#pricing" },
    ]},
    { title: t("landingUI.footer.company"), links: [
      { label: t("landingUI.footer.blog"), href: "/blog" },
      { label: "Sitemap", href: "/sitemap" },
      { label: t("landingUI.footer.privacy"), href: "/privacy" },
      { label: t("landingUI.footer.terms"), href: "/terms" },
    ]},
    { title: t("landingUI.footer.support"), links: [
      { label: "support@googlereviewai.com", href: "mailto:support@googlereviewai.com" },
    ]},
  ];

  return (
    <footer className="relative overflow-hidden bg-[#111827] text-white py-12 sm:py-14 md:py-16">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#4285F4] via-[#EA4335] to-[#FBBC05]" />
      <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-[#4285F4]/10 blur-3xl" />
      <div className="absolute left-1/3 bottom-0 h-40 w-40 rounded-full bg-[#34A853]/10 blur-3xl" />
      <div className="container relative mx-auto px-5 sm:px-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 sm:gap-10 md:gap-12 mb-10 sm:mb-12">
          <div className="col-span-2 sm:col-span-1">
            <div className="mb-4 sm:mb-6"><RankiLogo className="text-white scale-90 sm:scale-100 origin-left" /></div>
            <p className="text-white/60 text-xs sm:text-sm mb-4 sm:mb-6 max-w-xs">{t("landingUI.footer.tagline")}</p>
            <div className="flex items-center gap-2 text-xs text-white/60"><span className="w-2 h-2 rounded-full bg-[#34A853] animate-pulse" /><span>{t("landingUI.footer.operational")}</span></div>
          </div>
          {sections.map((section) => <div key={section.title}>
            <h4 className="font-semibold text-white mb-3 sm:mb-4 text-sm sm:text-base">{section.title}</h4>
            <ul className="space-y-2 sm:space-y-3">{section.links.map((link) => <li key={link.label}>
              {link.href.startsWith("/") ? <Link to={link.href} className="text-xs sm:text-sm text-white/60 hover:text-white transition-colors">{link.label}</Link> : <a href={link.href} className="text-xs sm:text-sm text-white/60 hover:text-white transition-colors">{link.label}</a>}
            </li>)}</ul>
          </div>)}
        </div>
        <div className="pt-6 sm:pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs sm:text-sm text-white/60 text-center sm:text-left">© {new Date().getFullYear()} GoogleReviewAI – {t("landingUI.footer.rights")}.</p>
          <div className="flex items-center gap-1.5 text-xs sm:text-sm text-white/60"><span className="h-1.5 w-1.5 rounded-full bg-[#4285F4]"/><span className="h-1.5 w-1.5 rounded-full bg-[#EA4335]"/><span className="h-1.5 w-1.5 rounded-full bg-[#FBBC05]"/><span className="h-1.5 w-1.5 rounded-full bg-[#34A853] mr-1"/>{t("landingUI.footer.tagShort")}</div>
        </div>
      </div>
    </footer>
  );
};
