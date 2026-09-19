import type { SeoArticle } from "../seoArticles";
import { sources } from "./sources";

export const localSeoArticles: SeoArticle[] = [
  {
    slug: "local-business-schema-markup", title: "Local Business Schema Markup: A Correct JSON-LD Implementation Guide",
    description: "Learn how to model an organization, locations, services, articles and breadcrumbs without contradictory or misleading structured data.",
    category: "Technical SEO", targetKeyword: "local business schema markup",
    keywords: ["LocalBusiness JSON-LD", "local SEO schema", "Organization schema", "structured data local business"],
    publishedAt: "2026-09-17", updatedAt: "2026-09-19", readTime: "11 min",
    intro: "LocalBusiness schema is a machine-readable description of a real organization or place. It can clarify a business name, URL, address, telephone, opening hours and relationships between a parent brand and its branches. It cannot create a location, rating or service that customers cannot verify on the page.",
    quickAnswer: "Use the most specific accurate LocalBusiness subtype, assign a stable @id, include only visible and current facts, model each genuine location separately, and validate the JSON-LD after deployment. Keep schema consistent with the Google Business Profile and page content.",
    keyTakeaways: ["One real location should map to one stable entity.", "Visible content and structured data must agree.", "More properties are not automatically better.", "Article and BreadcrumbList markup belong on article pages, not inside the local entity."],
    sections: [
      { heading: "Choose the entity you are describing", paragraphs: ["Decide whether the page represents the parent organization, one branch or a professional. A chain homepage usually describes the Organization; a branch page can describe a specific LocalBusiness. Mixing every address into one object makes the model ambiguous.", "Select the most specific valid subtype only when it matches the operation. A Dentist or Restaurant is more informative than LocalBusiness, but an inaccurate subtype is worse than a general correct one." ] },
      { heading: "Create stable identifiers", paragraphs: ["Give the organization and each location an @id based on a canonical URL plus a fragment, such as https://example.com/locations/paris#location. Reuse that identifier when another object refers to the same entity.", "Stable identifiers help prevent several independent blocks from looking like different businesses. Do not change them during routine design updates." ] },
      { heading: "Add properties customers can verify", paragraphs: ["Useful fields include name, URL, telephone, address, geo coordinates, openingHoursSpecification and image when accurate. PriceRange should be meaningful, not added simply because an example includes it.", "Service-area businesses should follow platform and schema guidance carefully. Do not expose a hidden residential address merely to fill a field."], bullets: ["Use canonical URLs", "Match visible opening hours", "Use full international telephone format", "Keep coordinates attached to the real location", "Link only official social profiles with sameAs"] },
      { heading: "Model multiple locations and services", paragraphs: ["Each branch needs a dedicated object and page with its own address, telephone and hours. Connect it to the parent organization where appropriate. Do not aggregate ratings from every branch into each local entity.", "Service markup can describe a real offering, but the service must also be visible and explained. Avoid generating hundreds of invisible service-city combinations in JSON-LD." ] },
      { heading: "Separate page schema from business schema", paragraphs: ["A blog guide can carry Article or BlogPosting markup alongside publisher information and BreadcrumbList. The publisher may reference the Organization @id. FAQ content, if marked up, must be visible and follow current eligibility policies.", "Keep each object focused. A single giant graph is not inherently better than a small accurate graph." ] },
      { heading: "Validate and monitor", paragraphs: ["Test syntax, then inspect the rendered page to confirm the values match visible content. Recheck after theme changes because scripts can be duplicated or stripped. Search Console enhancements can surface some issues, but not every semantic mistake.", "Create an operational update checklist for moves, holiday hours, telephone changes and rebrands so schema is not forgotten." ] }
    ],
    faq: [
      { question: "Does LocalBusiness schema improve rankings directly?", answer: "Structured data helps systems understand page content, but it does not guarantee a ranking improvement." },
      { question: "Can I add review stars to my own business schema?", answer: "Self-serving review markup has specific restrictions in Google Search. Do not add ratings unless the implementation follows current policies and reflects eligible visible content." },
      { question: "Should every page repeat the full LocalBusiness object?", answer: "A consistent organization reference can be site-wide, while detailed location data should be attached to the relevant location page." }
    ], relatedSlugs: ["entity-seo-local-business", "faq-schema-local-business", "google-business-profile-ai-optimization"],
    sources: [sources.schemaLocal, sources.structuredData, sources.articleSchema]
  },
  {
    slug: "faq-schema-local-business", title: "Local Business FAQs: Research, Writing and Schema Best Practices",
    description: "Build useful FAQ sections from real customer questions and mark them up accurately without creating thin SEO content.",
    category: "AEO", targetKeyword: "FAQ schema for local business",
    keywords: ["local business FAQ", "FAQPage schema", "AEO questions", "customer question research"],
    publishedAt: "2026-09-16", updatedAt: "2026-09-19", readTime: "9 min",
    intro: "A useful FAQ removes uncertainty at the point a customer is deciding whether to call, visit or buy. The research should begin with real conversations, not a list of generic keywords. Schema can describe visible questions and answers, but it does not transform weak answers into authoritative content.",
    quickAnswer: "Collect questions from calls, support, reviews and sales; group them by decision stage; answer directly; link to deeper policy or service pages; and add FAQ structured data only to visible content that follows current guidelines.",
    keyTakeaways: ["Prioritize questions that block a customer action.", "Keep short answers accurate outside their page context.", "Do not use FAQs to repeat location keywords.", "Maintain policy answers when business terms change."],
    sections: [
      { heading: "Find questions with commercial and support value", paragraphs: ["Export recurring questions from email, chat and call notes. Review low-star feedback for expectations that were unclear. Ask frontline staff which questions consume time or cause unsuitable enquiries.", "Search suggestions can expand the list, but first-party questions reveal the language and constraints of actual customers." ] },
      { heading: "Organize the FAQ around the decision", paragraphs: ["Group questions into eligibility, pricing, preparation, timing, policies and aftercare. Put the questions most likely to block action first. A visitor should not scan thirty minor questions to find whether the business serves their area.", "If an answer requires a full explanation, provide a concise response and link to the definitive page. Avoid hiding essential terms only inside an accordion." ] },
      { heading: "Write extractable but complete answers", paragraphs: ["Begin with yes, no, a range or a clear definition when possible. Include the condition that changes the answer. “Yes, same-day appointments are available when capacity allows; call before travelling” is safer than an unconditional promise.", "Remove promotional filler. An FAQ answer should solve the question before it sells the product." ] },
      { heading: "Know when not to answer generically", paragraphs: ["Medical, legal, financial and safety questions may depend on personal facts. State the general information, identify the limit and direct the reader to a qualified professional. Do not use an FAQ to simulate an individual assessment.", "For prices, explain inclusions and variables. Unsupported “starting from” figures create distrust if normal customers cannot obtain them." ] },
      { heading: "Implement schema conservatively", paragraphs: ["Mark up only questions and answers visible on the page. Do not add fabricated user questions, hidden promotional claims or duplicate markup across unrelated pages. Search engines control eligibility and display.", "Validate the output and keep the content synchronized. If a cancellation policy changes, both the visible answer and JSON-LD must change." ] },
      { heading: "Measure whether the FAQ works", paragraphs: ["Track reduced support contacts, clicks to relevant services, assisted conversions and queries leading to the page. A question with no traffic can still be valuable if it prevents a costly misunderstanding.", "Review the list quarterly with frontline teams. Remove outdated questions and promote a recurring complex issue into a full guide." ] }
    ],
    faq: [
      { question: "How many FAQs should a local page contain?", answer: "Use only the questions that materially help the visitor. Five strong answers can be more useful than thirty generic ones." },
      { question: "Does FAQ schema guarantee visibility?", answer: "No. It describes content; search engines decide how or whether to display it." },
      { question: "Can the same FAQ appear on several pages?", answer: "Repeat a critical policy when users need it, but avoid cloning large generic FAQ blocks across the site." }
    ], relatedSlugs: ["answer-engine-optimization-guide", "local-business-schema-markup", "voice-search-local-seo"],
    sources: [sources.helpfulContent, sources.structuredData]
  },
  {
    slug: "near-me-search-optimization", title: "Near Me SEO: How to Improve Local Relevance Without Keyword Stuffing",
    description: "A practical guide to near-me visibility using accurate locations, service clarity, Business Profile signals and local proof.",
    category: "Local SEO", targetKeyword: "near me search optimization",
    keywords: ["near me SEO", "local intent optimization", "Google Maps near me", "proximity search"],
    publishedAt: "2026-09-16", updatedAt: "2026-09-19", readTime: "10 min",
    intro: "A customer who searches “near me” usually wants a relevant business that can serve them now or soon. Repeating the words near me on a website does not move the business closer. The controllable work is accurate location data, clear category and service relevance, trustworthy prominence and a page experience that helps the nearby customer act.",
    quickAnswer: "Complete and verify your Business Profile, choose accurate categories, keep address or service-area data consistent, build useful location pages, earn authentic local prominence and make hours, directions, availability and contact actions easy on mobile.",
    keyTakeaways: ["Distance is contextual and cannot be fixed with copy.", "Relevance comes from accurate categories and service content.", "Prominence grows through real reputation and authority.", "Mobile conversion is part of near-me performance."],
    sections: [
      { heading: "Understand relevance, distance and prominence", paragraphs: ["Google describes local results through these broad concepts. Relevance is how well the business matches the need. Distance considers the searcher's context. Prominence reflects how established the business appears through information such as links and reviews.", "A useful plan separates what can be improved from what cannot. You can clarify a service; you cannot ethically create a fake office nearer to the searcher." ] },
      { heading: "Fix the Business Profile foundation", paragraphs: ["Use the real-world business name, correct primary category, current hours, accurate contact information and relevant attributes. Add service descriptions that match real operations. Keep special hours current.", "For a service-area business, configure coverage according to policy and hide addresses where customers are not served. Do not use coworking or mailbox addresses to manufacture proximity." ] },
      { heading: "Build useful location pages", paragraphs: ["A branch page should include hours, directions, parking or access, local contact details, services available there and a clear action. A service-area page needs genuine local information, not a cloned paragraph with a new city name.", "Connect each page through navigation or a location finder. Orphaned pages created only for search engines provide a poor customer journey." ] },
      { heading: "Earn local proof", paragraphs: ["Authentic reviews, local coverage, professional associations, partnerships and community involvement can corroborate prominence. Ask all eligible customers for honest feedback rather than selecting only happy customers.", "Use review themes to improve the page. If customers praise late opening or easy parking, make those verifiable facts easy to find." ] },
      { heading: "Optimize the mobile decision path", paragraphs: ["Near-me searches often carry urgency. Display open status, telephone, directions, booking and key qualifications without forcing several taps. Avoid intrusive banners that cover the primary action.", "Measure calls, direction requests, bookings and qualified leads—not only rankings. A visible listing that gives unclear information may still lose the customer." ] },
      { heading: "Avoid common near-me tactics", paragraphs: ["Do not insert “near me” into every title, buy reviews, create doorway pages or set service areas the company cannot cover. These tactics create policy and trust risk.", "Use natural location language where it helps a person: neighborhood, transport, delivery boundary and response expectation." ] }
    ],
    faq: [
      { question: "Should I put 'near me' in my page title?", answer: "Usually describe the real service and location naturally. Search engines infer the searcher's location; awkward phrase repetition is unnecessary." },
      { question: "Can service areas improve rankings everywhere listed?", answer: "Listing an area does not guarantee visibility there. The business still needs genuine relevance, operational coverage and local evidence." },
      { question: "Do reviews matter for near-me searches?", answer: "Reviews can support prominence and conversion, but they work alongside relevance, distance and other signals." }
    ], relatedSlugs: ["google-maps-ranking-factors", "service-area-business-local-seo", "local-landing-pages-seo"],
    sources: [sources.localRanking, sources.guidelines, sources.reviews]
  },
  {
    slug: "service-area-business-local-seo", title: "Local SEO for Service-Area Businesses Without Fake Locations",
    description: "Build local visibility for mobile and at-home services using compliant profiles, service hubs, area evidence and lead qualification.",
    category: "Local SEO", targetKeyword: "local SEO for service-area businesses",
    keywords: ["service area business SEO", "SAB Google Business Profile", "local service pages", "mobile business SEO"],
    publishedAt: "2026-09-15", updatedAt: "2026-09-19", readTime: "11 min",
    intro: "A service-area business travels to customers instead of serving them at a public storefront. Its local SEO problem is different: it must communicate genuine coverage and availability without inventing branches. The strongest strategy combines a policy-compliant profile, a clear service architecture and proof from the areas the team actually serves.",
    quickAnswer: "Use one eligible Business Profile per real operation, configure service areas honestly, create strong service pages, add distinct area pages only where useful local information exists, and qualify leads with coverage, timing and pricing details.",
    keyTakeaways: ["A service area is not a collection of ranking locations.", "Fake addresses create suspension risk.", "Service pages usually matter before city pages.", "Local proof should come from real completed work and customers."],
    sections: [
      { heading: "Configure the real operating model", paragraphs: ["Document where staff are based, where customers are served and whether any location is staffed and customer-facing during stated hours. Configure the Business Profile to reflect reality.", "Do not create profiles at virtual offices, employee homes or unstaffed storage units merely to target another city. Short-term visibility is not worth profile suspension and customer confusion." ] },
      { heading: "Build the service architecture first", paragraphs: ["Create complete pages for the highest-value services. Explain symptoms or needs, process, inclusions, exclusions, timing, pricing variables, qualifications and next steps. These pages establish relevance more effectively than dozens of thin town pages.", "Link related services logically and distinguish emergency from planned work when intent and operations differ." ] },
      { heading: "Decide which area pages deserve to exist", paragraphs: ["An area page needs a user purpose: distinct availability, travel terms, regulations, case evidence or local logistics. If the only unique text is the city name, consolidate into a service-area hub.", "Show coverage in a readable way and explain boundaries. Customers value knowing whether their postcode is served and whether travel charges apply." ] },
      { heading: "Develop local proof ethically", paragraphs: ["Request reviews from customers throughout the real service area. Publish case studies with permission, removing private address details. Mention the location only when it is relevant to the work.", "Earn links and mentions through suppliers, professional bodies, community partnerships and useful local expertise—not bulk directory submissions." ] },
      { heading: "Convert and qualify the lead", paragraphs: ["Ask for the postcode, service type, urgency and preferred contact method. State normal response expectations. A well-qualified lead is more valuable than traffic from an area the team cannot serve profitably.", "Track booked jobs by service and area, not just form submissions. This reveals which visibility translates into operationally suitable demand." ] },
      { heading: "Audit expansion decisions", paragraphs: ["Before targeting a new city, confirm capacity, travel economics and proof. Create content after the service is operational, not before. If demand becomes stable enough for a staffed branch, model it as a distinct location only when it meets platform rules.", "Review service boundaries seasonally as staffing and traffic conditions change." ] }
    ],
    faq: [
      { question: "Can I rank in a city without an office there?", answer: "A service-area business can be relevant where it genuinely operates, but visibility is not guaranteed and should not be pursued with fake addresses." },
      { question: "How many service areas should I list?", answer: "List areas the business can realistically and consistently serve. Platform limits and guidelines apply." },
      { question: "Should every town have a landing page?", answer: "No. Create a page only when it provides genuinely distinct and useful local information." }
    ], relatedSlugs: ["near-me-search-optimization", "local-landing-pages-seo", "local-seo-for-home-services"],
    sources: [sources.guidelines, sources.localRanking, sources.helpfulContent]
  },
  {
    slug: "local-landing-pages-seo", title: "Local Landing Page SEO: Build City and Location Pages People Actually Need",
    description: "Create differentiated local pages with services, logistics, proof, FAQs and conversion paths instead of doorway-page templates.",
    category: "Local SEO", targetKeyword: "local landing pages SEO",
    keywords: ["city landing pages", "location page SEO", "local service pages", "multi-location content"],
    publishedAt: "2026-09-15", updatedAt: "2026-09-19", readTime: "10 min",
    intro: "A local landing page should help a visitor understand what is available in a particular place and complete a local action. It should not exist only because a city name has search volume. Pages that repeat the same generic copy at scale create a weak experience and compete with one another.",
    quickAnswer: "Give each page a unique operational purpose: branch details, locally available services, staff, access, proof, policies and questions. Consolidate pages that cannot provide distinct value, and link every valid location through a clear site structure.",
    keyTakeaways: ["Differentiate with facts, not rewritten adjectives.", "Match one page to one clear local intent.", "Use a template for design, not for identical copy.", "Track local actions and lead quality."],
    sections: [
      { heading: "Choose the correct page type", paragraphs: ["A physical branch page represents a real place customers can visit. A service-area page explains coverage in an area. A local service page may combine a service and location when the offering, regulations or evidence are genuinely distinct.", "Do not mix these purposes. The title, canonical URL and primary action should reflect what the page actually represents." ] },
      { heading: "Collect local inputs before writing", paragraphs: ["Interview the branch or operations team. Gather services offered, hours, staff, booking rules, accessibility, parking, transport, landmarks, local projects and recurring questions. Verify every fact.", "Without local inputs, the writer will produce filler. Delay the page rather than publish invented specificity." ] },
      { heading: "Use a conversion-focused structure", paragraphs: ["Open with what the business provides and where. Follow with locally available services, proof, practical visit or coverage information, FAQs and a clear contact or booking action. Make telephone and directions usable on mobile.", "A map can help a physical branch but should not replace written address and access information." ] },
      { heading: "Add proof that belongs to the location", paragraphs: ["Use reviews, case examples and staff credentials connected to that branch or area. Do not display the same testimonial as local proof on twenty pages without context.", "Local media, community partnerships and professional memberships can support relevance when they are genuine." ] },
      { heading: "Prevent internal competition", paragraphs: ["Map each target intent to a preferred URL. If two pages answer the same need in the same area, merge them or clarify their roles. Use internal links from service hubs and location finders.", "Canonical tags should reflect actual duplication; they are not a substitute for deciding which page deserves to exist." ] },
      { heading: "Measure page usefulness", paragraphs: ["Track organic entrances, calls, directions, bookings, area-qualified leads and engagement with practical sections. Compare conversion quality across locations.", "Refresh details when staff, hours, access or services change. A local page with stale information damages both trust and entity consistency." ] }
    ],
    faq: [
      { question: "How much unique content does a location page need?", answer: "Enough to answer the real local decision. There is no percentage rule; the facts, proof and customer journey should be genuinely specific." },
      { question: "Can I reuse the same design across pages?", answer: "Yes. Reusable layout is efficient. The problem is duplicating the substantive content and purpose." },
      { question: "Should city pages be indexed before service launches?", answer: "No. Publish pages for genuine current operations, not speculative coverage." }
    ], relatedSlugs: ["service-area-business-local-seo", "entity-seo-local-business", "near-me-search-optimization"],
    sources: [sources.helpfulContent, sources.localRanking, sources.guidelines]
  }
];
