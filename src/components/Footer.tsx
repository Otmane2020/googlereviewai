import { Link } from "react-router-dom";
import { RankiLogo } from "./StarlinkoLogo";

export const Footer = () => {
  const sections = [
    {
      title: "Product",
      links: [
        { label: "GEO Rank Tracker", href: "#geo-rank" },
        { label: "Reviews AI", href: "#reviews-ai" },
        { label: "Local SEO Autopilot", href: "#how-it-works" },
        { label: "Pricing", href: "#pricing" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "Blog", href: "/blog" },
        { label: "Privacy", href: "/privacy" },
        { label: "Terms", href: "/terms" },
      ],
    },
    {
      title: "Support",
      links: [
        { label: "support@ranki.ai", href: "mailto:support@ranki.ai" },
      ],
    },
  ];

  return (
    <footer className="bg-foreground text-card py-12 sm:py-14 md:py-16">
      <div className="container mx-auto px-5 sm:px-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 sm:gap-10 md:gap-12 mb-10 sm:mb-12">
          <div className="col-span-2 sm:col-span-1">
            <div className="mb-4 sm:mb-6">
              <RankiLogo className="text-card scale-90 sm:scale-100" />
            </div>
            <p className="text-card/60 text-xs sm:text-sm mb-4 sm:mb-6 max-w-xs">
              Rank locally in ChatGPT, Gemini and Perplexity. The GEO platform built for local businesses.
            </p>
            <div className="flex items-center gap-2 text-xs text-card/60">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
              <span>All systems operational</span>
            </div>
          </div>

          {sections.map((section) => (
            <div key={section.title}>
              <h4 className="font-semibold text-card mb-3 sm:mb-4 text-sm sm:text-base">{section.title}</h4>
              <ul className="space-y-2 sm:space-y-3">
                {section.links.map((link) => (
                  <li key={link.label}>
                    {link.href.startsWith("/") ? (
                      <Link to={link.href} className="text-xs sm:text-sm text-card/60 hover:text-card transition-colors">
                        {link.label}
                      </Link>
                    ) : (
                      <a href={link.href} className="text-xs sm:text-sm text-card/60 hover:text-card transition-colors">
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-6 sm:pt-8 border-t border-card/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs sm:text-sm text-card/60 text-center sm:text-left">
            © {new Date().getFullYear()} Ranki.ai – All rights reserved.
          </p>
          <div className="text-xs sm:text-sm text-card/60">
            GEO · Local SEO · Reviews AI
          </div>
        </div>
      </div>
    </footer>
  );
};
