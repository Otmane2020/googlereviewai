// ReviewsAI internal HTML scraper. No external scraping subscription.
const privateHost = (host: string): boolean => {
 const h=host.toLowerCase().replace(/^\[|\]$/g,"");
 if(h==="localhost"||h.endsWith(".localhost")||h.endsWith(".local")||h.endsWith(".internal"))return true;
 if(h.includes(":"))return true; // IPv6 is rejected; prevents local address bypasses.
 const parts=h.split(".");
 if(parts.length===4&&parts.every(p=>/^\d+$/.test(p))){
  const n=parts.map(Number);
  return n.some(v=>v>255)||n[0]===0||n[0]===10||n[0]===127||n[0]>=224||
    (n[0]===169&&n[1]===254)||(n[0]===172&&n[1]>=16&&n[1]<=31)||
    (n[0]===192&&n[1]===168)||(n[0]===100&&n[1]>=64&&n[1]<=127)||
    (n[0]===192&&n[1]===0)||(n[0]===198&&n[1]>=18&&n[1]<=19);
 }
 return false;
};
function safeUrl(value:string): URL {
 const url=new URL(/^https?:\/\//i.test(value)?value:"https://"+value);
 if(url.protocol!=="https:"&&url.protocol!=="http:")throw Error("CRAWL_UNSAFE_PROTOCOL");
 if(url.username||url.password||!url.hostname.includes(".")||privateHost(url.hostname))throw Error("CRAWL_UNSAFE_HOST");
 if(url.port&&!["80","443"].includes(url.port))throw Error("CRAWL_UNSAFE_PORT");
 return url;
}
function decode(s:string){return s.replace(/&nbsp;/gi," ").replace(/&amp;/gi,"&").replace(/&quot;/gi,'"').replace(/&#39;|&apos;/gi,"'").replace(/&lt;/gi,"<").replace(/&gt;/gi,">").replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Math.min(Number(n),1114111)));}
async function fetchHtml(initial:URL): Promise<{html:string,url:string}> {
 let url=initial;
 for(let redirect=0;redirect<5;redirect++){
  const response=await fetch(url.toString(),{redirect:"manual",signal:AbortSignal.timeout(12000),headers:{
   "Accept":"text/html,application/xhtml+xml;q=0.9,*/*;q=0.5",
   "Accept-Language":"fr-FR,fr;q=0.9,en;q=0.8",
   "User-Agent":"Mozilla/5.0 (compatible; ReviewsAIResearchBot/2.0; +https://reviewsai.store)"
  }});
  if([301,302,303,307,308].includes(response.status)){
   const target=response.headers.get("location");if(!target)throw Error("CRAWL_BAD_REDIRECT");
   url=safeUrl(new URL(target,url).toString());continue;
  }
  if(!response.ok)throw Error("CRAWL_HTTP_"+response.status);
  const mime=response.headers.get("content-type")||"";
  if(mime&&!/(text\/html|application\/xhtml\+xml)/i.test(mime))throw Error("CRAWL_UNSUPPORTED_CONTENT");
  const length=Number(response.headers.get("content-length")||0);
  if(length>1000000)throw Error("CRAWL_DOCUMENT_TOO_LARGE");
  const html=(await response.text()).slice(0,400000);
  if(!html.trim())throw Error("CRAWL_EMPTY_HTML");
  return {html,url:url.toString()};
 }
 throw Error("CRAWL_REDIRECT_LIMIT");
}
export async function internalScrape(input:string):Promise<{content:string;title:string|null;url:string}> {
 const initial=safeUrl(input);
 const candidates=[initial];
 if(!initial.hostname.startsWith("www.")){
  const www=new URL(initial);www.hostname="www."+initial.hostname;candidates.push(www);
 }else{
  const apex=new URL(initial);apex.hostname=initial.hostname.slice(4);candidates.push(apex);
 }
 const failures:string[]=[];
 for(const candidate of candidates){
  try{
   const {html,url}=await fetchHtml(candidate);
   const title=decode(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]||"").replace(/<[^>]+>/g," ").trim()||null;
   const description=html.match(/<meta\s+[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i)?.[1]
    ||html.match(/<meta\s+[^>]*content=["']([^"']*)["'][^>]*name=["']description["']/i)?.[1]||"";
   const headings=[...html.matchAll(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi)].slice(0,20)
    .map(m=>decode(m[1].replace(/<[^>]+>/g," ")).replace(/\s+/g," ").trim());
   const readable=decode(html.replace(/<(script|style|noscript|svg|nav|footer)[^>]*>[\s\S]*?<\/\1>/gi," ")
    .replace(/<[^>]+>/g," ")).replace(/\s+/g," ").trim();
   const content=[title,decode(description),...headings,readable].filter(Boolean).join("\n").slice(0,12000);
   if(content.length<100)throw Error("CRAWL_TOO_LITTLE_TEXT");
   return {content,title,url};
  }catch(error){failures.push(candidate.hostname+":"+(error instanceof Error?error.message:"CRAWL_REQUEST_FAILED"));}
 }
 throw Error("CRAWL_FAILED: "+failures.join("; ").slice(0,400));
}
