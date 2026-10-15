/**
 * The old campaign landing duplicated obsolete plan prices, included a forced
 * French-only locale and charged legacy Stripe prices. Serve the primary,
 * fully translated Reviews AI landing here so that every campaign URL shows
 * identical Starter / Pro / Business prices and checkout amounts in EUR / USD.
 * Keep /landing route for existing marketing links.
 */
export { default } from "@/pages/Index";
