import type { SeoArticle } from "../seoArticles";
import { sources } from "./sources";

export const reviewArticles: SeoArticle[] = [
  {
    slug: "google-reviews-local-seo-impact", title: "Do Google Reviews Help Local SEO? Evidence, Limits and a Better Strategy",
    description: "Understand how Google reviews support prominence, trust and conversion—and what reviews cannot fix in local SEO.",
    category: "Review Management", targetKeyword: "do Google reviews help local SEO",
    keywords: ["Google review SEO", "reviews local ranking", "review recency", "local reputation signals"],
    publishedAt: "2026-09-14", updatedAt: "2026-09-19", readTime: "10 min",
    intro: "Google reviews can support local prominence and strongly influence whether a customer chooses a business. They are not a switch that overrides distance, weak relevance or incorrect profile information. The useful question is therefore not how many reviews guarantee a rank, but how to build a representative and policy-safe review system that improves reputation and customer intelligence.",
    quickAnswer: "Google states that more reviews and positive ratings can help local ranking, but local results also depend on relevance and distance. Ask eligible customers consistently for honest feedback, never buy or selectively gate reviews, respond professionally, and use recurring themes to improve the business.",
    keyTakeaways: ["Review count and score can support prominence, not guarantee rank.", "Authenticity and policy compliance matter more than rapid volume.", "Review themes improve conversion and operations.", "Replies should serve customers, not stuff keywords."],
    sections: [
      { heading: "Where reviews fit in local ranking", paragraphs: ["Google publicly describes local ranking through relevance, distance and prominence. Review count and score are among the information that may contribute to prominence. A competitor can still outrank a higher-rated business when it is closer or more relevant to the query.", "This is why review acquisition should sit beside accurate categories, complete service content and a strong website—not replace them." ] },
      { heading: "Review signals that matter to customers", paragraphs: ["Customers notice overall rating, number of reviews, recency, detailed themes and how the business handles problems. A perfect score based on twelve reviews may be less persuasive than a strong score supported by hundreds of recent, specific experiences.", "Read the distribution, not only the average. Repeated complaints about delay or unclear pricing point to operational and content gaps." ] },
      { heading: "Build a policy-safe request process", paragraphs: ["Ask customers at a natural point after the service. Make the request simple and neutral. Do not offer rewards for positive reviews, discourage dissatisfied customers or ask only customers likely to leave five stars.", "Train staff on one process and monitor unusual bursts. Sustainable review velocity should reflect real transaction volume."], bullets: ["Ask all eligible customers consistently", "Use the official review link", "Do not suggest wording or star ratings", "Never create reviews for customers", "Respect platform and privacy rules"] },
      { heading: "Respond for reputation, not keyword density", paragraphs: ["A good reply acknowledges the actual feedback, protects private information and offers an appropriate next step. Repeating a city and service in every response looks artificial and makes customer service worse.", "Escalate safety, legal, discrimination and refund disputes. AI can draft routine replies, but sensitive cases need human judgment." ] },
      { heading: "Turn review themes into content improvements", paragraphs: ["Tag reviews by service, staff, speed, value, facilities and complaint type. Compare themes with service pages. If customers repeatedly mention a benefit the page never explains, add accurate supporting detail.", "Do not copy a review into an unsupported claim. Summarize patterns and keep testimonials attributable and genuine." ] },
      { heading: "Measure the full effect", paragraphs: ["Track review growth, rating distribution, response coverage and response time alongside calls, bookings and direction requests. Compare periods rather than attributing one ranking change to one review.", "A useful program improves both visibility evidence and customer experience. If the same complaint persists, the priority is operational correction." ] }
    ],
    faq: [
      { question: "How many Google reviews do I need to rank?", answer: "There is no universal number. Competition, relevance, distance and other prominence signals vary by query and market." },
      { question: "Do keywords in reviews help SEO?", answer: "Customers naturally mentioning services can provide context, but businesses should never script or manipulate review wording." },
      { question: "Should every review receive a reply?", answer: "Consistent coverage is useful, especially for detailed or negative reviews, but quality and appropriate escalation matter more than a forced reply." }
    ], relatedSlugs: ["how-to-get-more-google-reviews-ethically", "review-response-seo-best-practices", "google-maps-ranking-factors"],
    sources: [sources.localRanking, sources.reviews, sources.reviewPolicy]
  },
  {
    slug: "review-response-seo-best-practices", title: "Google Review Response SEO: Write Helpful Replies Without Keyword Spam",
    description: "Learn how to write specific, natural Google review replies that protect reputation and reinforce accurate service context.",
    category: "Review Management", targetKeyword: "review response SEO",
    keywords: ["Google review reply SEO", "keywords in review responses", "local review management", "review response best practices"],
    publishedAt: "2026-09-14", updatedAt: "2026-09-19", readTime: "9 min",
    intro: "A review response is public customer service. Future customers read it to judge whether the business listens, accepts responsibility and handles conflict calmly. Any search benefit is secondary. Replies overloaded with city names and service keywords weaken trust and often sound automated.",
    quickAnswer: "Reference one real detail, answer the substance, protect private information and close with a proportionate next step. Use natural service language only when relevant. Route sensitive complaints to human review rather than auto-publishing them.",
    keyTakeaways: ["Write for the reviewer and future customer.", "Specificity beats length.", "Never reveal customer records publicly.", "Templates should control structure, not duplicate wording."],
    sections: [
      { heading: "What a useful public reply must do", paragraphs: ["The reply should show the feedback was understood. Thank the reviewer or acknowledge the concern, mention a relevant detail, respond to the central point and close naturally. Five-star ratings with no text need only a short thank-you.", "A reply does not need to win an argument. Its wider audience includes every future customer reading the exchange." ] },
      { heading: "Use service context naturally", paragraphs: ["If a customer mentions an emergency repair, color treatment or tasting menu, referencing it can make the reply specific. Do not force the full target phrase and city into every answer.", "Repeated promotional language makes replies less credible and can obscure the customer-service purpose." ] },
      { heading: "Handle negative feedback safely", paragraphs: ["Acknowledge the experience without confirming unverified allegations. Move booking numbers, health information, payment details and personnel disputes into a private channel. Apologize directly when the business clearly fell short.", "Do not accuse a reviewer of lying. If content violates policy, report it while keeping any public reply calm and factual." ] },
      { heading: "Create escalation rules", paragraphs: ["Define categories that cannot be auto-published: safety, discrimination, legal threats, chargebacks, self-harm, medical issues and personal-data exposure. Assign an owner and response deadline.", "A short holding message is safer than a detailed improvised answer when facts are still being investigated." ] },
      { heading: "Prevent robotic repetition", paragraphs: ["Create several approved openings and closings, then personalize the middle from the review. Audit a sample monthly for repeated phrases, invented details and tonal mismatch.", "For AI-assisted drafts, provide business context and prohibited claims, and require the model to say when information is insufficient." ] },
      { heading: "Measure response quality", paragraphs: ["Track response coverage and time, but also escalations, corrected drafts and recurring complaint themes. Faster is not better if speed produces risky answers.", "Use patterns to improve training and operations. The strongest review response program gradually reduces preventable complaints." ] }
    ],
    faq: [
      { question: "Should I add keywords to Google review replies?", answer: "Use relevant service language naturally when it reflects the review. Avoid repetitive keyword insertion." },
      { question: "How long should a response be?", answer: "Long enough to acknowledge and address the feedback. Most routine replies can remain concise." },
      { question: "Can AI publish replies automatically?", answer: "Routine low-risk cases can be automated with guardrails, but sensitive cases need human approval." }
    ], relatedSlugs: ["how-to-respond-to-google-reviews", "ai-review-response-prompts", "google-reviews-local-seo-impact"],
    sources: [sources.reviews, sources.reviewPolicy]
  },
  {
    slug: "ai-review-response-prompts", title: "AI Review Response Prompts: Context, Guardrails and Quality Checks",
    description: "Build safer AI prompts for Google review replies using verified context, tone rules, escalation logic and human approval.",
    category: "AI Automation", targetKeyword: "AI review response prompts",
    keywords: ["Google review AI prompt", "review reply prompt", "AI reputation management", "automated review drafting"],
    publishedAt: "2026-09-13", updatedAt: "2026-09-19", readTime: "11 min",
    intro: "A prompt that says “reply politely” leaves the model to invent tone, facts and next steps. A production review workflow needs verified business context, explicit constraints, risk classification and a defined output format. The model should draft within policy, not decide business policy.",
    quickAnswer: "Provide the review, rating, allowed business facts, brand voice and escalation rules. Instruct the model not to invent details, expose private data or promise compensation. Require a risk label and route sensitive drafts to a person.",
    keyTakeaways: ["Separate permanent business rules from each review.", "Classify risk before generating the reply.", "Make uncertainty an acceptable output.", "Test prompts against difficult cases, not only five-star reviews."],
    sections: [
      { heading: "Split the prompt into stable and variable context", paragraphs: ["Stable context includes tone, approved contact channel, service facts and prohibited claims. Variable context includes the review text, rating, language, location and verified order facts. Keeping them separate simplifies maintenance.", "Send only data needed for the reply. Do not include payment information, passwords or unnecessary customer records." ] },
      { heading: "Classify before drafting", paragraphs: ["Ask the system to label the case routine, needs approval or urgent escalation. Define the rules in plain language. A one-star rating alone may not be high risk, while a five-star review containing private health information can be.", "If risk is high, the desired output may be an internal summary and safe holding reply rather than a final public response." ] },
      { heading: "Specify the response contract", paragraphs: ["Require a concise response in the reviewer's language, one specific reference when available and no unsupported claim. Set a maximum length and forbid promotional keyword stuffing.", "Ask for structured fields such as risk, reason, draft and follow-up action. This makes automation easier to audit."], bullets: ["Risk level", "Detected language", "Public draft", "Internal escalation reason", "Facts needing verification"] },
      { heading: "Add refusal and uncertainty rules", paragraphs: ["The model should never invent a visit, employee action, refund or investigation result. If context is missing, it should produce neutral wording or request human review.", "Prohibit legal admissions unless approved policy allows them. A generative model should not improvise liability decisions." ] },
      { heading: "Test an adversarial case set", paragraphs: ["Include sarcasm, mixed sentiment, wrong-business complaints, fake-review suspicions, threats, discrimination allegations, emojis and several languages. Measure factuality, privacy, tone and escalation accuracy.", "Retest whenever the model, prompt or business policy changes. Preserve failures as regression cases." ] },
      { heading: "Monitor production quality", paragraphs: ["Sample published replies and compare edited versus generated text. Track override rate, risk false negatives and repeated phrases. High edit volume suggests missing context or an unrealistic tone guide.", "Let customers and staff report unsuitable replies quickly. Automation needs an operational feedback loop." ] }
    ],
    faq: [
      { question: "What is the best single prompt for review replies?", answer: "There is no universal prompt. The safest prompt reflects the business, risk policy, approved facts and workflow." },
      { question: "Should the model receive customer identity data?", answer: "Only provide the minimum data required and follow applicable privacy obligations. Public replies rarely need private identity details." },
      { question: "How do I stop repetitive AI replies?", answer: "Use several approved structures, require review-specific details and audit phrase frequency, while preserving consistent policy." }
    ], relatedSlugs: ["automate-google-review-responses-with-ai", "review-response-seo-best-practices", "negative-google-review-response-examples"],
    sources: [sources.reviews, sources.reviewPolicy, sources.helpfulContent]
  },
  {
    slug: "google-business-profile-ai-optimization", title: "Google Business Profile Optimization for Local and AI Search",
    description: "Improve the accuracy and usefulness of your Business Profile so customers and discovery systems receive consistent local facts.",
    category: "Google Business Profile", targetKeyword: "Google Business Profile AI optimization",
    keywords: ["Business Profile GEO", "GBP AI search", "local AI visibility", "Google profile optimization"],
    publishedAt: "2026-09-13", updatedAt: "2026-09-19", readTime: "10 min",
    intro: "A Google Business Profile is a major public source of local business information. Optimizing it for modern discovery does not mean inserting AI keywords. It means ensuring that category, location, hours, services, attributes, media and reputation accurately describe the operation and agree with the website.",
    quickAnswer: "Verify the profile, choose the most accurate primary category, complete services and attributes, maintain hours, link to the best matching website page, publish authentic media, and manage reviews. Correct inconsistencies across the web before chasing AI visibility.",
    keyTakeaways: ["Accuracy is the first optimization.", "Category choice must match the core operation.", "The linked landing page should confirm profile facts.", "Profile maintenance is continuous."],
    sections: [
      { heading: "Audit identity and eligibility", paragraphs: ["Confirm the real-world name, address or service-area configuration, telephone and ownership. Remove marketing taglines from the name unless they are genuinely part of the public brand.", "Review duplicates and old locations carefully. Major identity errors can affect customers and downstream descriptions." ] },
      { heading: "Choose categories and services precisely", paragraphs: ["The primary category should represent the main business, not the most attractive keyword. Add secondary categories only for real distinct operations. Complete service information using plain language.", "The website should explain the same services. A profile claiming a service absent from the site creates uncertainty." ] },
      { heading: "Maintain operational facts", paragraphs: ["Update regular and special hours, booking URLs, accessibility, service options and other applicable attributes. Verify holiday changes before customers travel.", "Assign an internal owner and backup. Profiles decay when everyone assumes someone else updates them." ] },
      { heading: "Use photos and updates as evidence", paragraphs: ["Publish real, current images that help customers recognize the place, team or service. Avoid stock visuals that misrepresent facilities.", "Posts and updates should communicate genuine changes or offers and link to a relevant page. Frequency alone is not a strategy." ] },
      { heading: "Integrate reviews and questions", paragraphs: ["Request honest reviews consistently and respond according to risk policy. Monitor public questions and ensure important answers are also available on the website.", "Review themes can reveal which attributes or service explanations are missing." ] },
      { heading: "Measure customer actions and accuracy", paragraphs: ["Track calls, bookings, directions and website visits, then compare with qualified outcomes. Audit how search and AI systems describe the brand.", "If an answer is wrong, correct the strongest underlying sources rather than publishing pages that merely repeat the desired wording." ] }
    ],
    faq: [
      { question: "Is there an AI optimization field in Google Business Profile?", answer: "No. Accurate, complete and consistent business information is the practical foundation for all discovery experiences." },
      { question: "Should I add every possible category?", answer: "No. Select categories that accurately describe real core operations." },
      { question: "How often should a profile be audited?", answer: "Review it monthly and whenever hours, services, location or contact information change." }
    ], relatedSlugs: ["google-business-profile-optimization-checklist", "entity-seo-local-business", "generative-engine-optimization-local-business"],
    sources: [sources.guidelines, sources.localRanking, sources.profileInfo, sources.reviews]
  },
  {
    slug: "local-content-calendar", title: "A 12-Month Local SEO, AEO and GEO Content Calendar",
    description: "Plan a sustainable year of service pages, answer guides, proof assets and local updates based on customer decisions.",
    category: "Content Strategy", targetKeyword: "local SEO content calendar",
    keywords: ["local content plan", "SEO editorial calendar", "GEO content strategy", "AEO publishing plan"],
    publishedAt: "2026-09-12", updatedAt: "2026-09-19", readTime: "10 min",
    intro: "A content calendar should allocate editorial attention to the pages customers need most. It is not a target for publishing a fixed number of articles. A useful local plan balances core service information, seasonal questions, original proof, profile updates and maintenance of existing pages.",
    quickAnswer: "Audit existing demand first, prioritize missing service and decision pages, schedule seasonal content before demand peaks, publish one evidence asset per quarter, and reserve monthly capacity for updates. Measure qualified actions, not article count.",
    keyTakeaways: ["Improve existing high-intent pages before expanding topics.", "Schedule around customer timing, not arbitrary frequency.", "Every quarter should produce new evidence.", "Maintenance belongs inside the calendar."],
    sections: [
      { heading: "Set outcomes and editorial limits", paragraphs: ["Choose the services, locations and customer stages the program must support. Define who supplies expertise, who reviews facts and how much can be maintained.", "A smaller calendar with expert review is safer than mass production across unrelated topics." ] },
      { heading: "Build four content lanes", paragraphs: ["Use core commercial pages, answer guides, proof assets and timely updates. Commercial pages explain services and locations. Answer guides resolve decisions. Proof assets provide data or cases. Updates communicate real changes.", "Assign each idea to one lane and one business outcome to prevent vague blog filler." ] },
      { heading: "Plan the year by customer timing", paragraphs: ["Publish seasonal guides four to eight weeks before demand. Schedule policy and pricing reviews before known changes. Coordinate profile updates with offers and events.", "For evergreen topics, choose timing based on expert availability and source quality rather than a trend headline." ] },
      { heading: "Example quarterly rhythm", paragraphs: ["Month one can improve a service hub; month two can answer a related comparison; month three can publish a case study or dataset. Repeat for another cluster while refreshing prior winners.", "This creates depth around a business topic instead of scattering authority."], bullets: ["Q1: audit and core service clarity", "Q2: comparison and eligibility answers", "Q3: original evidence and local proof", "Q4: refresh, consolidate and plan from performance"] },
      { heading: "Create a content brief that protects quality", paragraphs: ["Every brief should include audience, primary decision, unique evidence, source list, proposed headings, internal links and conversion action. State what the article must not claim.", "Require an expert reviewer for regulated or specialized subjects and record the review date." ] },
      { heading: "Review performance and prune responsibly", paragraphs: ["Measure impressions, qualified visits, assisted conversions, AI citations and support reduction. A page can be valuable without high traffic if it answers a critical customer question.", "Update strong pages, merge overlapping content and redirect obsolete URLs. Do not delete simply to create an appearance of freshness." ] }
    ],
    faq: [
      { question: "How often should a local business publish?", answer: "Publish only as often as the team can produce and maintain useful, accurate content. There is no universal frequency." },
      { question: "Should every post be 2,000 words?", answer: "No. Google states there is no preferred word count. Match depth to the decision and evidence." },
      { question: "What should be updated monthly?", answer: "Prioritize operational facts, high-value pages, profile hours, broken links and content affected by changing policies." }
    ], relatedSlugs: ["answer-engine-optimization-guide", "ai-search-citation-strategy", "local-landing-pages-seo"],
    sources: [sources.helpfulContent, sources.aiSearch]
  }
];
