import type { ReactNode } from "react";
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
} from "@tanstack/react-router";
import { AppProviders } from "@/App";
import "@/index.css";
import "@/i18n/config";

const description =
  "Google Review AI automatically replies to Google reviews, tracks local rankings and improves your visibility across Google, ChatGPT, Gemini and Perplexity.";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" },
      { title: "Google Review AI – AI Review Replies & Local SEO" },
      { name: "description", content: description },
      { name: "author", content: "Google Review AI" },
      { name: "robots", content: "index, follow" },
      { name: "googlebot", content: "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" },
      { name: "bingbot", content: "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" },
      { name: "google-site-verification", content: "07-mTOgobA9QM8vgRLYvmLuHBrEU8mVCDhG0HfNEbmw" },
      { name: "theme-color", content: "#ffffff" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
      { name: "apple-mobile-web-app-title", content: "Google Review AI" },
      { name: "mobile-web-app-capable", content: "yes" },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://googlereviewai.com/" },
      { property: "og:title", content: "Google Review AI – AI Review Replies & Local SEO" },
      { property: "og:description", content: description },
      { property: "og:image", content: "https://googlereviewai.com/og-image.png" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:locale", content: "en_US" },
      { property: "og:site_name", content: "Google Review AI" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Google Review AI – AI Review Replies & Local SEO" },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: "https://googlereviewai.com/og-image.png" },
    ],
    links: [
      { rel: "canonical", href: "https://googlereviewai.com/" },
      { rel: "alternate", hrefLang: "en", href: "https://googlereviewai.com/" },
      { rel: "alternate", hrefLang: "x-default", href: "https://googlereviewai.com/" },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "icon", type: "image/png", href: "/favicon.png" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
    ],
  }),
  component: RootComponent,
});

function RootComponent() {
  return (
    <RootDocument>
      <AppProviders>
        <Outlet />
      </AppProviders>
    </RootDocument>
  );
}

const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Google Review AI",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description:
    "AI software for automatic Google review replies, local SEO automation and business visibility tracking across Google and AI search engines.",
  url: "https://googlereviewai.com",
  publisher: {
    "@type": "Organization",
    name: "Google Review AI",
    url: "https://googlereviewai.com",
    logo: "https://googlereviewai.com/icon-512x512.png",
  },
  featureList: [
    "AI-generated responses to Google reviews",
    "Automatic Google review replies",
    "Google Business Profile management",
    "Local SEO automation",
    "Local rank tracking",
    "Visibility tracking across ChatGPT, Gemini and Perplexity",
    "Multi-location management",
  ],
};

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-TC9B9MHW');`,
          }}
        />
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-SG82SWEKN1" />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)};gtag('js',new Date());gtag('config','G-SG82SWEKN1');gtag('event','conversion_event_page_view',{});`,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','1400016238246849');fbq('track','PageView');`,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `_linkedin_partner_id='8548802';window._linkedin_data_partner_ids=window._linkedin_data_partner_ids||[];window._linkedin_data_partner_ids.push(_linkedin_partner_id);(function(l){if(!l){window.lintrk=function(a,b){window.lintrk.q.push([a,b])};window.lintrk.q=[]}var s=document.getElementsByTagName('script')[0];var b=document.createElement('script');b.type='text/javascript';b.async=true;b.src='https://snap.licdn.com/li.lms-analytics/insight.min.js';s.parentNode.insertBefore(b,s)})(window.lintrk);`,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src='https://www.clarity.ms/tag/'+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y)})(window,document,'clarity','script','v81mg7y2cm');`,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.pushAlertByPass=true;window.PA_WIDGET_DISABLE=true;window.PA_DISABLED=true;`,
          }}
        />
        <script async src="https://cdn.pushalert.co/integrate_e9d37ad5dc4d1baed0a28cbb966d31df.js" />
      </head>
      <body>
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-TC9B9MHW"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
