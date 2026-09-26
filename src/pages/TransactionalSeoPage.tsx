import { Link } from "react-router-dom";
import { ArrowRight, Check, MessageSquareText, Sparkles, Workflow, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import type { TransactionalSeoPageConfig } from "@/data/transactionalSeoPages";
import { transactionalSeoPages } from "@/data/transactionalSeoPages";

export default function TransactionalSeoPage({ config }: { config: TransactionalSeoPageConfig }) {
  const related = Object.values(transactionalSeoPages)
    .filter((page) => page.slug !== config.slug)
    .slice(0, 4);

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        name: "Google Review AI",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        url: `https://googlereviewai.com/${config.slug}`,
        description: config.metaDescription,
        publisher: {
          "@type": "Organization",
          name: "Google Review AI",
          url: "https://googlereviewai.com/",
        },
      },
      {
        "@type": "FAQPage",
        mainEntity: config.faq.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer },
        })),
      },
    ],
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <Header />
      <main>
        <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-primary/10 via-background to-background pt-14">
          <div className="container mx-auto max-w-6xl px-5 py-16 sm:py-20 lg:py-24">
            <div className="max-w-4xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-sm font-semibold text-primary">
                <Sparkles className="h-4 w-4" /> {config.eyebrow}
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">{config.heroTitle}</h1>
              <p className="mt-6 max-w-3xl text-lg leading-8 text-muted-foreground sm:text-xl">{config.heroDescription}</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="gap-2">
                  <Link to="/auth">{config.primaryCta}<ArrowRight className="h-4 w-4" /></Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <a href="#how-it-works">{config.secondaryCta}</a>
                </Button>
              </div>
              <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" />AI-assisted drafts</span>
                <span className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" />Human review before publishing</span>
                <span className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" />Built for Google Business Profile workflows</span>
              </div>
            </div>
          </div>
        </section>

        <section className="container mx-auto max-w-6xl px-5 py-16 sm:py-20">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Why it matters</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{config.problemTitle}</h2>
              <p className="mt-5 text-lg leading-8 text-muted-foreground">{config.problemText}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {config.benefits.map((benefit, index) => {
                const icons = [MessageSquareText, Sparkles, Workflow];
                const Icon = icons[index] ?? Sparkles;
                return (
                  <article key={benefit.title} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                    <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-semibold">{benefit.title}</h3>
                    <p className="mt-2 leading-7 text-muted-foreground">{benefit.text}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="bg-muted/30">
          <div className="container mx-auto max-w-6xl px-5 py-16 sm:py-20">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Workflow</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{config.howTitle}</h2>
            </div>
            <ol className="mt-10 grid gap-5 md:grid-cols-3">
              {config.steps.map((step, index) => (
                <li key={step.title} className="rounded-2xl border border-border bg-background p-6">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">{index + 1}</span>
                  <h3 className="mt-5 text-xl font-semibold">{step.title}</h3>
                  <p className="mt-2 leading-7 text-muted-foreground">{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="container mx-auto max-w-6xl px-5 py-16 sm:py-20">
          <div className="rounded-3xl border border-border bg-card p-7 sm:p-10">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Building2 className="h-5 w-5" /></div>
              <h2 className="text-2xl font-bold sm:text-3xl">{config.audienceTitle}</h2>
            </div>
            <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {config.audiences.map((audience) => (
                <div key={audience} className="flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium">
                  <Check className="h-4 w-4 text-primary" /> {audience}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-muted/30">
          <div className="container mx-auto max-w-4xl px-5 py-16 sm:py-20">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Frequently asked questions</h2>
            <div className="mt-8 divide-y divide-border rounded-2xl border border-border bg-background">
              {config.faq.map((item) => (
                <details key={item.question} className="group p-5">
                  <summary className="cursor-pointer list-none font-semibold [&::-webkit-details-marker]:hidden">{item.question}</summary>
                  <p className="mt-3 leading-7 text-muted-foreground">{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="container mx-auto max-w-6xl px-5 py-16">
          <h2 className="text-2xl font-bold">Related Google review solutions</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((page) => (
              <Link key={page.slug} to={`/${page.slug}`} className="rounded-2xl border border-border bg-card p-5 transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="font-semibold">{page.title}</div>
                <div className="mt-2 text-sm leading-6 text-muted-foreground">{page.metaDescription}</div>
                <div className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">Learn more <ArrowRight className="h-4 w-4" /></div>
              </Link>
            ))}
          </div>
        </section>

        <section className="bg-primary text-primary-foreground">
          <div className="container mx-auto max-w-4xl px-5 py-16 text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">Turn customer reviews into a repeatable workflow</h2>
            <p className="mx-auto mt-4 max-w-2xl text-primary-foreground/80">Use GoogleReviewAI to reduce repetitive writing, respond more consistently and keep control over every published message.</p>
            <Button asChild size="lg" variant="secondary" className="mt-8 gap-2">
              <Link to="/auth">Start with GoogleReviewAI <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
