import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const groups = [
  {
    title: "Google Review AI",
    links: [
      { label: "Home", href: "/" },
      { label: "Google Business Profile Autoposting", href: "/gmb-autoposting" },
      { label: "AI Review Reply Guide", href: "/avis-ai-guide" },
      { label: "AI Reviews for Restaurants", href: "/avis-ai-restaurant" },
      { label: "AI Reviews for Hotels", href: "/avis-ai-hotel" },
      { label: "Restaurants", href: "/restaurants" },
      { label: "Hotels", href: "/hotels" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Blog", href: "/blog" },
      { label: "Local SEO Checklist", href: "/checklist" },
      { label: "Free QR Code", href: "/qr-gratuit" },
      { label: "Shop", href: "/shop" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "XML Sitemap", href: "/sitemap.xml", external: true },
      { label: "LLMs.txt", href: "/llms.txt", external: true },
    ],
  },
];

const Sitemap = () => (
  <div className="min-h-screen bg-background text-foreground">
    <Helmet>
      <title>Sitemap | Google Review AI</title>
      <meta name="description" content="Browse the public pages, guides and resources available on Google Review AI." />
      <link rel="canonical" href="https://googlereviewai.com/sitemap" />
      <meta name="robots" content="index, follow" />
      <meta property="og:title" content="Sitemap | Google Review AI" />
      <meta property="og:description" content="Browse Google Review AI pages, guides and resources." />
      <meta property="og:url" content="https://googlereviewai.com/sitemap" />
      <meta property="og:type" content="website" />
    </Helmet>

    <Header />
    <main className="pt-24 pb-20">
      <div className="container mx-auto max-w-5xl px-5 sm:px-6">
        <div className="max-w-2xl mb-12">
          <p className="text-sm font-semibold text-[#4285F4] mb-3">Google Review AI</p>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">Sitemap</h1>
          <p className="text-lg text-muted-foreground">
            Find the main public pages, guides and resources available on Google Review AI.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {groups.map((group) => (
            <section key={group.title} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-4">{group.title}</h2>
              <ul className="space-y-3">
                {group.links.map((item) => (
                  <li key={item.href}>
                    {item.external ? (
                      <a href={item.href} className="text-sm text-muted-foreground hover:text-[#4285F4] transition-colors">
                        {item.label}
                      </a>
                    ) : (
                      <Link to={item.href} className="text-sm text-muted-foreground hover:text-[#4285F4] transition-colors">
                        {item.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </main>
    <Footer />
  </div>
);

export default Sitemap;
