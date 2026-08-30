import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Check, Chrome, ArrowRight, Sparkles, Clock, ShieldCheck } from "lucide-react";

const CHROME_STORE_URL =
  "https://chromewebstore.google.com/detail/business-review-reply-ai/eoegigkpfcmdfgelnbjfijnjofjpaiof";

const ReviewReplyAIForGBP = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Helmet>
        <html lang="en" />
        <title>Review Reply AI for Google Business Profile™ | GoogleReviewAI</title>
        <meta
          name="description"
          content="Review Reply AI for Google Business Profile™ helps businesses generate personalized replies to Google reviews in seconds with a Chrome extension."
        />
        <meta
          name="keywords"
          content="review reply AI, Google Business Profile review replies, AI Google review response, Chrome extension for Google reviews"
        />
        <link
          rel="canonical"
          href="https://googlereviewai.com/review-reply-ai-google-business-profile"
        />
        <meta name="robots" content="index, follow, max-image-preview:large" />
        <meta
          property="og:title"
          content="Review Reply AI for Google Business Profile™"
        />
        <meta
          property="og:description"
          content="Generate thoughtful, personalized replies to Google Business Profile reviews in seconds."
        />
        <meta
          property="og:url"
          content="https://googlereviewai.com/review-reply-ai-google-business-profile"
        />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://googlereviewai.com/landing/review-ai-workflow.jpg" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "Review Reply AI for Google Business Profile™",
            applicationCategory: "BusinessApplication",
            operatingSystem: "Google Chrome",
            description:
              "A Chrome extension that helps businesses create personalized replies to Google Business Profile reviews.",
            url: "https://googlereviewai.com/review-reply-ai-google-business-profile",
            installUrl: CHROME_STORE_URL,
            image: "https://googlereviewai.com/landing/review-ai-workflow.jpg",
            publisher: {
              "@type": "Organization",
              name: "GoogleReviewAI",
              url: "https://googlereviewai.com/",
            },
          })}
        </script>
      </Helmet>

      <Header />

      <main>
        <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-primary/10 via-background to-background">
          <div className="container mx-auto grid max-w-6xl gap-12 px-5 pb-20 pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:pt-24">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-sm font-medium text-primary">
                <Chrome className="h-4 w-4" />
                Chrome extension for business owners
              </div>
              <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Review Reply AI for Google Business Profile™
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">
                Write professional, personalized replies to your Google Business Profile reviews in seconds. Save time, keep your brand voice, and respond consistently.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="gap-2">
                  <a href={CHROME_STORE_URL} target="_blank" rel="noreferrer">
                    Add to Chrome
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/#reviews-ai">See GoogleReviewAI</Link>
                </Button>
              </div>
              <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" />Personalized replies</span>
                <span className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" />Edit before publishing</span>
                <span className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" />Works in Chrome</span>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
              <img
                src="/landing/review-ai-workflow.jpg"
                alt="Review Reply AI for Google Business Profile generating a personalized review response"
                className="h-auto w-full"
                loading="eager"
              />
            </div>
          </div>
        </section>

        <section className="container mx-auto max-w-6xl px-5 py-20">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">A faster review workflow</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Turn every review into a thoughtful response</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Review Reply AI helps restaurants, hotels, retailers, agencies, and local businesses respond clearly without starting from a blank page.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {[
              {
                icon: Sparkles,
                title: "Generate in seconds",
                text: "Create a relevant first draft based on the review and its sentiment.",
              },
              {
                icon: ShieldCheck,
                title: "Stay on brand",
                text: "Use a professional tone that feels personal instead of generic or robotic.",
              },
              {
                icon: Clock,
                title: "Save weekly time",
                text: "Handle more reviews efficiently while keeping the final decision in your hands.",
              },
            ].map(({ icon: Icon, title, text }) => (
              <article key={title} className="rounded-2xl border border-border bg-card p-6">
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-semibold">{title}</h3>
                <p className="mt-2 leading-7 text-muted-foreground">{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="bg-muted/30">
          <div className="container mx-auto grid max-w-6xl gap-12 px-5 py-20 lg:grid-cols-2 lg:items-center">
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
              <img
                src="/landing/reply-to-reviews-ai.jpg"
                alt="Business Review Reply AI workflow for responding to customer reviews"
                className="h-auto w-full"
                loading="lazy"
              />
            </div>
            <div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">How the Chrome extension works</h2>
              <ol className="mt-8 space-y-6">
                {[
                  ["Open your Google Business Profile reviews", "Go to the reviews you want to answer in Chrome."],
                  ["Select a review and generate a reply", "The extension creates a personalized response in seconds."],
                  ["Review, edit, and publish", "Make any final changes, then publish when the reply is ready."],
                ].map(([title, text], index) => (
                  <li key={title} className="flex gap-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">{index + 1}</span>
                    <div>
                      <h3 className="font-semibold">{title}</h3>
                      <p className="mt-1 text-muted-foreground">{text}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <Button asChild className="mt-8 gap-2">
                <a href={CHROME_STORE_URL} target="_blank" rel="noreferrer">
                  View the extension on Chrome Web Store
                  <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        </section>

        <section className="container mx-auto max-w-4xl px-5 py-20">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Frequently asked questions</h2>
          <div className="mt-8 divide-y divide-border rounded-2xl border border-border bg-card">
            {[
              ["What is Review Reply AI for Google Business Profile™?", "It is a Chrome extension that helps businesses create personalized responses to Google Business Profile reviews faster."],
              ["Can I edit an AI-generated reply?", "Yes. You can review and edit the suggested response before publishing it."],
              ["Who can use the extension?", "It is designed for local businesses, marketing teams, agencies, restaurants, hotels, retailers, and other businesses that manage customer reviews."],
              ["Where can I install it?", "The extension is available from its official Chrome Web Store listing."],
            ].map(([question, answer]) => (
              <details key={question} className="group p-5">
                <summary className="cursor-pointer list-none font-semibold [&::-webkit-details-marker]:hidden">{question}</summary>
                <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">{answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="bg-primary text-primary-foreground">
          <div className="container mx-auto max-w-4xl px-5 py-16 text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">Start replying to reviews faster</h2>
            <p className="mx-auto mt-4 max-w-2xl text-primary-foreground/80">
              Install Review Reply AI for Google Business Profile™ and create your next professional review response in seconds.
            </p>
            <Button asChild size="lg" variant="secondary" className="mt-8 gap-2">
              <a href={CHROME_STORE_URL} target="_blank" rel="noreferrer">
                Add to Chrome
                <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default ReviewReplyAIForGBP;
