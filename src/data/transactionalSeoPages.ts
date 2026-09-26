export type TransactionalSeoPageConfig = {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  eyebrow: string;
  heroTitle: string;
  heroDescription: string;
  primaryCta: string;
  secondaryCta: string;
  problemTitle: string;
  problemText: string;
  benefits: { title: string; text: string }[];
  howTitle: string;
  steps: { title: string; text: string }[];
  audienceTitle: string;
  audiences: string[];
  faq: { question: string; answer: string }[];
};

export const transactionalSeoPages: Record<string, TransactionalSeoPageConfig> = {
  "ai-google-review-reply": {
    slug: "ai-google-review-reply",
    title: "AI Google Review Reply",
    metaTitle: "AI Google Review Reply | Write Better Review Responses Faster",
    metaDescription: "Use AI to write personalized Google review replies faster. Respond to positive and negative reviews with consistent, professional, on-brand answers.",
    eyebrow: "AI-powered review replies",
    heroTitle: "Write better Google review replies with AI",
    heroDescription: "Turn every Google review into a thoughtful, personalized response without starting from a blank page. GoogleReviewAI helps businesses reply faster while keeping the final message under human control.",
    primaryCta: "Start replying with AI",
    secondaryCta: "See how it works",
    problemTitle: "Replying to every Google review should not consume your day",
    problemText: "Businesses know review responses matter, but writing dozens of unique replies is repetitive and easy to postpone. AI-assisted replies help you acknowledge customers quickly without falling back on generic copy-and-paste templates.",
    benefits: [
      { title: "Reply in seconds", text: "Generate a relevant first draft from the review's wording, rating and sentiment." },
      { title: "Keep replies personal", text: "Avoid robotic one-line answers by producing responses that reflect what the customer actually said." },
      { title: "Handle negative reviews calmly", text: "Create professional drafts that acknowledge concerns without escalating the conversation." },
    ],
    howTitle: "From new review to ready-to-publish reply",
    steps: [
      { title: "Read the customer review", text: "GoogleReviewAI uses the review context to understand the topic, tone and sentiment." },
      { title: "Generate an AI reply", text: "Get a draft tailored to the review rather than a fixed template." },
      { title: "Review and publish", text: "Edit the wording if needed, then publish the response when you are satisfied." },
    ],
    audienceTitle: "Built for businesses that receive customer reviews every week",
    audiences: ["Restaurants and cafés", "Hotels and hospitality", "Retail and ecommerce locations", "Home services", "Clinics and local professionals", "Agencies managing multiple profiles"],
    faq: [
      { question: "Can AI reply to Google reviews?", answer: "Yes. AI can generate a draft response based on the review content, rating and tone. A business can then review or edit the draft before publishing." },
      { question: "Will the replies sound repetitive?", answer: "They do not have to. GoogleReviewAI creates context-aware drafts so the wording can vary according to each review instead of repeating the same template." },
      { question: "Can I use it for negative reviews?", answer: "Yes. It can help draft calm, professional responses to criticism while leaving the final decision and wording to the business." },
    ],
  },
  "google-review-response-generator": {
    slug: "google-review-response-generator",
    title: "Google Review Response Generator",
    metaTitle: "Google Review Response Generator | Generate Replies with AI",
    metaDescription: "Generate professional Google review responses in seconds. Create tailored replies for positive, neutral and negative customer reviews with AI.",
    eyebrow: "Review response generator",
    heroTitle: "Generate a professional response to any Google review",
    heroDescription: "Paste or select a customer review and create a polished response in seconds. Use the generator for five-star praise, short reviews, detailed feedback and difficult complaints.",
    primaryCta: "Generate review responses",
    secondaryCta: "Explore review AI",
    problemTitle: "A useful response generator needs more than generic templates",
    problemText: "Static templates are fast but often sound copied. A review response generator should adapt to the customer's message, identify what deserves acknowledgement and produce a reply that still sounds like a real business.",
    benefits: [
      { title: "Positive review responses", text: "Thank happy customers while referencing the specific experience they mentioned." },
      { title: "Negative review responses", text: "Draft measured replies that acknowledge issues and move the conversation toward resolution." },
      { title: "Short-review support", text: "Create useful answers even when the customer leaves only a rating or a few words." },
    ],
    howTitle: "How the Google review response generator works",
    steps: [
      { title: "Provide the review", text: "Use the customer's review as the source context for the reply." },
      { title: "Choose the right tone", text: "Generate wording suitable for your brand and the sentiment of the review." },
      { title: "Refine the final answer", text: "Adjust names, facts or next steps before publishing to your Google Business Profile." },
    ],
    audienceTitle: "Useful wherever review volume makes manual writing slow",
    audiences: ["Single-location businesses", "Multi-location brands", "Customer support teams", "Franchises", "Marketing agencies", "Independent business owners"],
    faq: [
      { question: "What is a Google review response generator?", answer: "It is a tool that turns the text of a customer review into a suggested business response, typically using AI to adapt the wording to the review." },
      { question: "Can it generate different responses for 5-star and 1-star reviews?", answer: "Yes. The response can adapt to both the rating and the actual review text so the tone matches the situation." },
      { question: "Should I publish generated replies without checking them?", answer: "It is better to review important facts and wording before publishing, especially for complaints or sensitive customer situations." },
    ],
  },
  "google-review-management": {
    slug: "google-review-management",
    title: "Google Review Management",
    metaTitle: "Google Review Management | Manage Replies, Reputation & Local SEO",
    metaDescription: "Manage Google reviews in one workflow. Track unanswered reviews, use AI-assisted replies and maintain a consistent reputation across locations.",
    eyebrow: "Google review management",
    heroTitle: "Manage Google reviews without losing track of customer feedback",
    heroDescription: "Bring review monitoring, response workflows and AI-assisted replies into one operating process. GoogleReviewAI helps teams stay consistent as review volume grows.",
    primaryCta: "Manage Google reviews",
    secondaryCta: "View review reply AI",
    problemTitle: "Review management becomes an operations problem as volume grows",
    problemText: "Once a business has several locations or a steady stream of reviews, the challenge is no longer writing one reply. Teams need to know what is unanswered, which reviews need attention, who should respond and how to maintain a consistent voice.",
    benefits: [
      { title: "Prioritize unanswered reviews", text: "Focus attention on customer feedback that still needs a response." },
      { title: "Standardize the workflow", text: "Give teams a repeatable process for reading, drafting, reviewing and publishing replies." },
      { title: "Support multiple locations", text: "Use one review-management approach across branches, stores or client accounts." },
    ],
    howTitle: "A practical Google review management workflow",
    steps: [
      { title: "Monitor new reviews", text: "Keep incoming customer feedback visible instead of checking profiles manually one by one." },
      { title: "Prioritize and draft", text: "Identify reviews that need a response and create a context-aware AI draft." },
      { title: "Track completion", text: "Maintain a clear view of what has been handled and what still needs action." },
    ],
    audienceTitle: "Designed for businesses that need a repeatable review process",
    audiences: ["Multi-location businesses", "Franchise operators", "Hospitality groups", "Local service networks", "Marketing agencies", "Reputation management teams"],
    faq: [
      { question: "What does Google review management include?", answer: "It typically includes monitoring new reviews, responding to customers, tracking unanswered feedback and maintaining a consistent process across one or more Google Business Profiles." },
      { question: "Why is responding to reviews part of reputation management?", answer: "Responses show customers that feedback is read and can help a business communicate context, appreciation or next steps publicly." },
      { question: "Can AI help manage a high volume of reviews?", answer: "Yes. AI can reduce the writing workload by preparing drafts while the team keeps control over approvals and publishing." },
    ],
  },
  "ai-review-reply-generator": {
    slug: "ai-review-reply-generator",
    title: "AI Review Reply Generator",
    metaTitle: "AI Review Reply Generator | Personalized Customer Review Responses",
    metaDescription: "Generate personalized replies to customer reviews with AI. Create professional responses for positive, negative and mixed feedback in seconds.",
    eyebrow: "AI reply generator",
    heroTitle: "An AI review reply generator that writes from the customer's actual feedback",
    heroDescription: "Generate useful customer-review responses without relying on rigid scripts. Each draft starts from the review itself, helping businesses answer faster while keeping the message relevant.",
    primaryCta: "Try the AI reply workflow",
    secondaryCta: "See Google review generator",
    problemTitle: "The best reply is specific enough to feel written for that customer",
    problemText: "Customers notice when every business response looks identical. AI can speed up the first draft while still referencing the details, praise or concern that made each review unique.",
    benefits: [
      { title: "Context-aware drafts", text: "Build the reply around the subjects and details mentioned by the reviewer." },
      { title: "Flexible tone", text: "Use professional, warm or concise wording depending on the situation." },
      { title: "Consistent brand voice", text: "Keep response quality more consistent even when several people manage reviews." },
    ],
    howTitle: "Generate a reply without losing human control",
    steps: [
      { title: "Start with real feedback", text: "The review becomes the context for the generated response." },
      { title: "Create a tailored draft", text: "AI produces wording that reflects the sentiment and subject of the feedback." },
      { title: "Apply your judgment", text: "Check facts, edit details and publish only when the response matches your business." },
    ],
    audienceTitle: "A faster writing assistant for customer-facing teams",
    audiences: ["Business owners", "Community managers", "Customer experience teams", "Hotel managers", "Restaurant operators", "Local marketing teams"],
    faq: [
      { question: "How is an AI review reply generator different from a template?", answer: "A template repeats predetermined wording. An AI generator can use the review text as context and produce a different draft for each customer." },
      { question: "Does it work only for Google reviews?", answer: "This product is designed around Google Business Profile review workflows, although the underlying approach of generating contextual replies can apply to other review-writing tasks." },
      { question: "Can I edit the generated reply?", answer: "Yes. The generated text is a draft and can be edited before it is published." },
    ],
  },
  "google-business-review-replies": {
    slug: "google-business-review-replies",
    title: "Google Business Review Replies",
    metaTitle: "Google Business Review Replies | Respond to GBP Reviews with AI",
    metaDescription: "Respond to Google Business Profile reviews faster with AI-assisted replies. Build consistent, professional responses for every business location.",
    eyebrow: "Google Business Profile replies",
    heroTitle: "Respond to Google Business Profile reviews faster",
    heroDescription: "Create clear, professional review replies for your Google Business Profile while keeping tone and messaging consistent. Ideal for local businesses and teams managing multiple profiles.",
    primaryCta: "Reply to business reviews",
    secondaryCta: "Install Chrome extension",
    problemTitle: "Your Google Business Profile is a public customer-service channel",
    problemText: "Review replies are visible to future customers, not only the person who left the review. A structured response workflow helps businesses show that feedback is acknowledged while protecting tone and brand consistency.",
    benefits: [
      { title: "Reply where local customers look", text: "Keep your Google Business Profile review section active and professionally managed." },
      { title: "Respond consistently", text: "Give different team members a common quality standard for public replies." },
      { title: "Scale across locations", text: "Apply the same operating model to several Google Business Profiles." },
    ],
    howTitle: "A better workflow for Google Business review replies",
    steps: [
      { title: "Open the review queue", text: "Identify Google Business reviews that still need attention." },
      { title: "Draft the response", text: "Use AI to prepare relevant wording based on the customer's feedback." },
      { title: "Publish with context", text: "Review the answer, add any location-specific information and publish." },
    ],
    audienceTitle: "Made for businesses that depend on local search and reputation",
    audiences: ["Restaurants", "Hotels", "Medical and dental practices", "Automotive businesses", "Home-service companies", "Retail stores"],
    faq: [
      { question: "Should businesses reply to Google reviews?", answer: "Replying gives businesses a public way to thank customers, acknowledge feedback and provide context when a customer reports a problem." },
      { question: "Can one tool help with several Google Business Profiles?", answer: "Yes. Review-management workflows can be organized across multiple locations so teams do not have to manage each profile in isolation." },
      { question: "Can AI write replies directly from Google review content?", answer: "Yes. AI can use the review text as context to prepare a response draft for the business." },
    ],
  },
  "review-management-software": {
    slug: "review-management-software",
    title: "Review Management Software",
    metaTitle: "Review Management Software | AI Review Replies & Local Reputation",
    metaDescription: "Review management software for local businesses and multi-location teams. Monitor customer reviews, generate AI replies and improve response workflows.",
    eyebrow: "Review management software",
    heroTitle: "Review management software built for faster, more consistent customer responses",
    heroDescription: "Centralize the work behind customer reviews: identify unanswered feedback, generate AI-assisted responses and keep review operations organized as your business grows.",
    primaryCta: "Start managing reviews",
    secondaryCta: "Compare review workflows",
    problemTitle: "Review software should reduce operational work, not create another dashboard to maintain",
    problemText: "The value of review management software is not simply storing reviews. It should help teams decide what needs attention, speed up responses and make reputation work measurable and repeatable.",
    benefits: [
      { title: "One review workflow", text: "Bring monitoring, prioritization and response preparation into the same process." },
      { title: "AI-assisted productivity", text: "Reduce repetitive writing while keeping people responsible for the final customer message." },
      { title: "Local visibility context", text: "Connect review work with the wider health of your Google Business Profile and local presence." },
    ],
    howTitle: "What useful review management software should help you do",
    steps: [
      { title: "See what needs action", text: "Surface new and unanswered reviews so important feedback is not missed." },
      { title: "Respond efficiently", text: "Use AI-assisted drafting to reduce time spent writing routine responses." },
      { title: "Operate consistently", text: "Apply a repeatable standard across locations, employees or client accounts." },
    ],
    audienceTitle: "Suitable for teams that have outgrown manual review handling",
    audiences: ["Growing local businesses", "Multi-location operators", "Franchises", "Agencies", "Hospitality brands", "Reputation teams"],
    faq: [
      { question: "What is review management software?", answer: "Review management software helps businesses monitor customer reviews, organize response workflows and manage reputation tasks across one or more business profiles." },
      { question: "What should I look for in review management software?", answer: "Useful features include review monitoring, clear unanswered-review queues, response assistance, multi-location support and workflows that keep human approval where needed." },
      { question: "How does AI improve review management?", answer: "AI can shorten the time needed to draft responses and help teams maintain a more consistent writing standard across many reviews." },
    ],
  },
};

export const transactionalSeoSlugs = Object.keys(transactionalSeoPages);
