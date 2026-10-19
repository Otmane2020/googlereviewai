// Internal HTML scraper, adapted from Ranki.ai's src/lib/ranki/scrape.server.ts.
// Public websites only: do not allow private/loopback network targets.
const forbidden = (host:string) => host === "localhost" || host.endsWith(".localhost") ||
  /^(?:127\.|10\.|192\.168\.|169\.254\.|0\.|::1$|\[::1\]$)/.test(host) ||
  /^172\.(?:1[6-9]|2[0-9]|3[01])\./.test(host) || /^fc|^fd|^fe80/i.test(host) || host.endsWith(".local");
function publicUrl(raw:string):URL {
 const u=new URL(/^https?:\/\//i.test(raw)?raw:"https://"+raw);
 if(!["http:","https:"].includes(u.protocol)||u.username||u.password||forbidden(u.hostname.toLowerCase())||!u.hostname.includes("."))throw Error("UNSAFE_WEBSITE_URL");
 return u;
}
function decode(s:string){return s.replace(/&nbsp;/gi," ").replace(/&amp;/gi,"&").replace(/&quot;/gi,'"').replace(/&#39;/gi,"'").replace(/&lt;/gi,"<").replace(/&gt;/gi,">");}
export async function internalScrape(input:string):Promise<{content:string;title:string|null;url:string}> {
 let url=publicUrl(input);
 for(let step=0;step<4;step++){
  const res=await fetch(url.toString(),{redirect:"manual",headers:{"Accept":"text/html,application/xhtml+xml","User-Agent":"ReviewsAIResearchBot/1.0 (+https://reviewsai.store)"},signal:AbortSignal.timeout(12000)});
  if([301,302,303,307,308].includes(res.status)){
   const loc=res.headers.get("location");if(!loc)throw Error("CRAWL_REDIRECT_WITHOUT_LOCATION");
   url=publicUrl(new URL(loc,url).toString());continue;
  }
  if(!res.ok)throw Error("CRAWL_HTTP_"+res.status);
  const mime=res.headers.get("content-type")||"";
  if(!mime.includes("text/html"))throw Error("CRAWL_NOT_HTML");
  const html=(await res.text()).slice(0,350000);
  const title=decode(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]||"").replace(/\s+/g," ").trim()||null;
  const meta=html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)?.[1]||"";
  const heads=[...html.matchAll(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi)].slice(0,24).map(m=>decode(m[1].replace(/<[^>]+>/g," ")).trim());
  const text=decode(html.replace(/<(script|style|noscript|svg)[^>]*>[\s\S]*?<\/\1>/gi," ").replace(/<[^>]+>/g," ")).replace(/\s+/g," ").trim();
  const content=[title,decode(meta),...heads,text].filter(Boolean).join("\n").slice(0,12000);
  if(content.length<100)throw Error("CRAWL_CONTENT_TOO_SHORT");
  return {content,title,url:url.toString()};
 }
 throw Error("CRAWL_TOO_MANY_REDIRECTS");
}
