import { geoAeoArticles } from "./articles/geoAeoArticles";
import { localSeoArticles } from "./articles/localSeoArticles";
import { reviewArticles } from "./articles/reviewArticles";
import { industryArticles } from "./articles/industryArticles";

export const seoLongFormArticles = [
  ...geoAeoArticles,
  ...localSeoArticles,
  ...reviewArticles,
  ...industryArticles,
];
