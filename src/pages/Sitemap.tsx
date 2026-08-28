import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { seoArticles } from "@/data/seoArticles";

const groups = [
  {
    title: "Google Review AI",
    links: [
      { label: "Home", href: "/" },
      { label: "Local AEO & AI Search Visibility", href: "/local-aeo" },
      { label: "Google Business Profile Autoposting", href: "/gmb-autoposting" },
      { label: "AI Review Reply Guide", href: "/avis-ai-guide" },
      { label: "AI Reviews for Restaurants", href: "/avis-ai-restaurant" },
      { label: "AI Reviews for Hotels", href: "/avis-ai-hotel" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Blog", href: "/blog" },
      { label: "Local SEO Checklist", href: "/checklist" },
      { label: "Restaurants", href: "/restaurants" },
      { label: "Hotels", href: "/hotels" },
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
      <html lang="en" />
      <title>Sitemap | Google Review AI</title>
      <meta name="description" content="Browse the public pages, local SEO guides and Google review resources available on Google Review AI." />
      <link rel="canonical" href="https://googlereviewai.com/sitemap" />
      <meta name="robots" content="index, follow" />
      <meta property="og:title" content="Sitemap | Google Review AI" />
      <meta property="og:description" content="Browse Google Review AI pages, guides and resources." />
      <meta property="og:url" content="https://googlereviewai.com/sitemap" />
      <meta property="og:type" content="website" />
    </Helmet>

    <Header />
    <main className="pt-24 pb-20">
      <div className="container mx-auto max-w-6xl px-5 sm:px-6">
        <div className="max-w-2xl mb-12">
          <p className="text-sm font-semibold text-[#4285F4] mb-3">Google Review AI</p>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">Sitemap</h1>
          <p className="text-lg text-muted-foreground">Find the public product pages, guides and educational resources available on Google Review AI.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-12">
          {groups.map((group) => (
            <section key={group.title} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-4">{group.title}</h2>
              <ul className="space-y-3">
                {group.links.map((item) => (
                  <li key={item.href}>
                    {item.external ? (
                      <a href={item.href} className="text-sm text-muted-foreground hover:text-[#4285F4] transition-colors">{item.label}</a>
                    ) : (
                      <Link to={item.href} className="text-sm text-muted-foreground hover:text-[#4285F4] transition-colors">{item.label}</Link>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <section className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm">
          <h2 className="text-2xl font-semibold mb-2">Google Reviews & Local SEO Guides</h2>
          <p className="text-muted-foreground mb-6">Our latest in-depth resources on review management, Google Business Profile, Maps rankings and local AI search.</p>
          <div className="grid gap-4 md:grid-cols-2">
            {seoArticles.map((article) => (
              <Link key={article.slug} to={`/blog/${article.slug}`} className="rounded-xl border border-border p-4 hover:bg-muted/30 transition-colors">
                <p className="text-xs font-medium text-primary mb-1">{article.category}</p>
                <h3 className="font-medium leading-snug">{article.title}</h3>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
    <Footer />
  </div>
);

export default Sitemap;
