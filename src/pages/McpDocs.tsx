import { Helmet } from "react-helmet";

const TOOLS: [string, string][] = [
  ["list_managed_businesses", "List your connected Google Business Profile locations."],
  ["list_reviews", "List reviews, filtered by business, reply status, rating or date."],
  ["generate_review_reply", "Draft a reply in your brand voice (saved, not published; uses 1 credit on limited plans)."],
  ["publish_review_reply", "Publish an approved reply publicly on Google."],
  ["get_business_insights", "Views, calls, website clicks and direction requests over N days."],
  ["check_maps_ranking", "Run a Google Maps rank scan for a keyword on a grid around the business."],
  ["get_ranking_history", "Previous Maps rank scans and their average position."],
];

const EXAMPLES = [
  "Show my unanswered reviews from this week with 3 stars or less.",
  "Draft replies to the two latest negative reviews for my Lyon restaurant, then let me review them.",
  "How many calls and direction requests did my business get in the last 30 days?",
  "Where do I rank on Google Maps for \"plombier paris 11\"?",
];

export default function McpDocs() {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>ReviewsAI for Claude & ChatGPT (MCP) | ReviewsAI</title>
        <meta
          name="description"
          content="Connect ReviewsAI to Claude or ChatGPT: read Google reviews, draft and publish AI replies, check Google Business stats and Maps ranking."
        />
        <link rel="canonical" href="https://reviewsai.store/mcp-docs" />
      </Helmet>
      <main className="container mx-auto max-w-3xl px-4 py-12 space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold">ReviewsAI connector for Claude and ChatGPT</h1>
          <p className="text-muted-foreground">
            Manage your Google reviews from your AI assistant. ReviewsAI is independent software and is not affiliated
            with Google.
          </p>
        </header>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Connect</h2>
          <p>
            Server URL: <code className="rounded bg-muted px-1">https://reviewsai.store/mcp</code>
          </p>
          <ol className="list-decimal pl-5 space-y-1 text-sm">
            <li>You need a ReviewsAI account with at least one Google Business Profile connected.</li>
            <li>
              <strong>Claude:</strong> Settings → Connectors → Add custom connector → paste the URL above.
            </li>
            <li>
              <strong>ChatGPT:</strong> Settings → Apps → search for ReviewsAI (or, in developer mode, create an app with
              the URL above).
            </li>
            <li>Sign in to ReviewsAI and approve access on the consent screen.</li>
          </ol>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Tools</h2>
          <ul className="space-y-1 text-sm">
            {TOOLS.map(([n, d]) => (
              <li key={n}>
                <code className="rounded bg-muted px-1">{n}</code> — {d}
              </li>
            ))}
          </ul>
          <p className="text-sm text-muted-foreground">
            Replies are only published on Google when you ask for it. Your assistant should show you the text first.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Example prompts</h2>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            {EXAMPLES.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Data, privacy and revoking access</h2>
          <p className="text-sm">
            The connector only accesses data in your own ReviewsAI account, with the same permissions as the web app.
            Disconnect the connector in your assistant's settings at any time. See our{" "}
            <a className="underline" href="/privacy">
              privacy policy
            </a>{" "}
            and{" "}
            <a className="underline" href="/terms">
              terms
            </a>
            . Support: <a className="underline" href="mailto:support@reviewsai.store">support@reviewsai.store</a>.
          </p>
        </section>
      </main>
    </div>
  );
}
