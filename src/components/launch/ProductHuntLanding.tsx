import { useState } from "react";
import { Link } from "@/lib/router-compat";
import { useTranslation } from "react-i18next";
import {
  ArrowRight, ArrowUpRight, Bell, Check, CheckCheck, ChevronRight,
  CircleCheck, Globe2, Layers3, MapPin, Menu, MessageSquareText,
  MousePointer2, Send, ShieldCheck, Star, TrendingUp, Wand2, X,
} from "lucide-react";
import { RankiLogo } from "@/components/StarlinkoLogo";
import { BrandSparkle } from "@/components/BrandSparkle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { RankiPricingSection } from "@/components/ranki/RankiPricingSection";
import { FAQSection } from "@/components/FAQSection";


function Stars({ count = 5 }: { count?: number }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={count + " / 5"}>
      {Array.from({ length: 5 }, (_, index) => (
        <Star key={index} aria-hidden="true" className={"h-3.5 w-3.5 " + (index < count ? "fill-amber-400 text-amber-400" : "text-slate-200")} />
      ))}
    </span>
  );
}

/** A clearly labeled product walkthrough, not a live customer review or fake metric. */
function ReviewWorkflowDemo({ fr }: { fr: boolean }) {
  const [reviewKind, setReviewKind] = useState<"positive" | "critical">("positive");
  const [showReply, setShowReply] = useState(true);
  const positive = reviewKind === "positive";
  const review = positive
    ? {
        author: "Camille D.", rating: 5,
        en: "Beautiful coffee table, exactly as described. Fast delivery and really helpful team!",
        fr: "Très belle table basse, conforme à la description. Livraison rapide et équipe très à l'écoute !",
      }
    : {
        author: "Alex M.", rating: 2,
        en: "The delivery was later than expected. I would have appreciated more updates.",
        fr: "La livraison a pris plus de temps que prévu. J'aurais aimé être mieux informé.",
      };
  const response = positive
    ? fr
      ? "Merci beaucoup Camille pour votre retour ! Nous sommes ravis que la table et notre accompagnement vous aient plu. À bientôt !"
      : "Thank you, Camille! We're delighted you love the table and had a great experience with our team. See you again soon!"
    : fr
      ? "Merci Alex de nous avoir fait part de votre expérience. Nous sommes désolés pour le manque de suivi et allons faire le point avec notre équipe."
      : "Thank you for sharing your experience, Alex. We're sorry the updates were not clear enough and will review this with our team.";

  return (
    <div className="relative mx-auto w-full max-w-[600px]">
      <div className="pointer-events-none absolute -inset-8 rounded-[48px] bg-gradient-to-br from-[#3B54F5]/15 via-[#B7C5FF]/10 to-[#34A853]/15 blur-3xl" />
      <div className="relative overflow-hidden rounded-[25px] border border-[#DDE4F3] bg-white shadow-[0_36px_100px_-30px_rgba(19,40,101,.26)]">
        <div className="flex h-12 items-center gap-2 border-b border-[#E9EDF5] px-5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#FF6E69]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#FFCC58]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#51C994]" />
          <span className="ml-3 inline-flex min-w-0 items-center gap-1.5 rounded-lg bg-[#F5F7FC] px-3 py-1.5 text-[10px] font-medium text-[#65738C]">
            <ShieldCheck className="h-3 w-3" /> reviewsai.store / reviews
          </span>
          <span className="ml-auto rounded-full bg-[#F1F3F9] px-2 py-1 text-[10px] font-medium text-[#7E8AA0]">
            {fr ? "Aperçu produit" : "Product preview"}
          </span>
        </div>
        <div className="flex min-h-[420px]">
          <aside className="hidden w-[68px] shrink-0 flex-col items-center gap-5 border-r border-[#ECF0F7] bg-[#FCFDFF] py-5 sm:flex">
            <BrandSparkle className="h-9 w-9 object-contain" />
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E9EDFF] text-[#3B54F5]">
              <MessageSquareText className="h-5 w-5" />
            </div>
            <Bell className="h-[18px] w-[18px] text-[#A3AEC1]" />
            <TrendingUp className="h-[18px] w-[18px] text-[#A3AEC1]" />
            <Layers3 className="h-[18px] w-[18px] text-[#A3AEC1]" />
          </aside>
          <div className="min-w-0 flex-1 p-4 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.13em] text-[#8996AB]">
                  {fr ? "ESPACE AVIS" : "REVIEW WORKSPACE"}
                </p>
                <h3 className="text-lg font-extrabold tracking-tight text-[#152443] sm:text-xl">
                  {fr ? "Vos avis, au même endroit." : "All your reviews. One place."}
                </h3>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#D9EFDF] bg-[#F0FBF3] px-2.5 py-1.5 text-[11px] font-semibold text-[#218D52]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#36B972]" />
                {fr ? "Connecté à Google" : "Google connected"}
              </span>
            </div>

            <div className="mt-6 flex flex-wrap gap-2" aria-label={fr ? "Choisir un exemple d'avis" : "Choose a sample review"}>
              <button type="button" aria-pressed={positive} onClick={() => { setReviewKind("positive"); setShowReply(true); }}
                className={"rounded-xl border px-3.5 py-2 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-[#3B54F5] " +
                  (positive ? "border-[#3B54F5] bg-[#EEF1FF] text-[#334AE3]" : "border-[#E2E7F1] bg-white text-[#63718A] hover:border-[#9FB1FE]")}>
                {fr ? "Avis positif" : "Positive review"}
              </button>
              <button type="button" aria-pressed={!positive} onClick={() => { setReviewKind("critical"); setShowReply(true); }}
                className={"rounded-xl border px-3.5 py-2 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-[#3B54F5] " +
                  (!positive ? "border-[#3B54F5] bg-[#EEF1FF] text-[#334AE3]" : "border-[#E2E7F1] bg-white text-[#63718A] hover:border-[#9FB1FE]")}>
                {fr ? "Avis négatif" : "Critical review"}
              </button>
            </div>

            <div className="mt-4 rounded-2xl border border-[#E8ECF5] bg-white p-4 shadow-[0_8px_28px_-20px_rgba(29,47,94,.3)] sm:p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EDF0FE] text-sm font-bold text-[#3B54F5]">
                  {review.author[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <span className="text-sm font-bold text-[#152443]">{review.author}</span>
                    <span className="text-[10px] text-[#8C98AD]">{fr ? "Exemple" : "Sample"}</span>
                  </div>
                  <div className="mt-0.5"><Stars count={review.rating} /></div>
                  <p className="mt-2.5 text-[13px] leading-[1.65] text-[#4D5D75]">{fr ? review.fr : review.en}</p>
                </div>
              </div>
            </div>

            <div className="relative mt-3 rounded-2xl border border-[#DCE3FF] bg-[#F5F7FF] p-4 sm:p-5">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-xs font-bold text-[#344BDC]">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-white"><BrandSparkle className="h-4 w-4" /></span>
                  {fr ? "Réponse préparée par l'IA" : "AI-drafted reply"}
                </span>
                <span className="rounded-full border border-[#CDD7FF] bg-white px-2.5 py-1 text-[10px] font-semibold text-[#6475AF]">
                  {fr ? "À vérifier" : "Ready to review"}
                </span>
              </div>
              {showReply ? (
                <div aria-live="polite">
                  <p className="text-[13px] leading-[1.7] text-[#374763]">{response}</p>
                  <p className="mt-2.5 whitespace-pre-line text-[13px] font-semibold text-[#27395B]">
                    {fr ? "— L'équipe Sweet Deco" : "— The Sweet Deco team"}
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#3B54F5] px-3 py-2 text-[11px] font-bold text-white">
                      <CheckCheck className="h-3.5 w-3.5" /> {fr ? "Prêt à publier" : "Ready to publish"}
                    </span>
                    <button type="button" onClick={() => setShowReply(false)} className="rounded-lg border border-[#D8DFF6] bg-white px-3 py-2 text-[11px] font-semibold text-[#556784] hover:bg-[#F7F8FE]">
                      {fr ? "Modifier l'exemple" : "Edit example"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="rounded-lg border border-dashed border-[#BFCBFA] bg-white p-3 text-xs text-[#66748B]">
                    {fr ? "Votre équipe peut modifier une réponse avant publication." : "Your team can edit a reply before publishing it."}
                  </p>
                  <button type="button" onClick={() => setShowReply(true)} className="inline-flex items-center gap-1.5 text-xs font-bold text-[#3B54F5]">
                    <Wand2 className="h-3.5 w-3.5" /> {fr ? "Afficher la réponse IA" : "Show AI reply"}
                  </button>
                </div>
              )}
            </div>
            <p className="mt-3 text-center text-[10px] text-[#99A4B6]">
              {fr ? "Démonstration illustrative. Aucun avis réel n'est utilisé." : "Illustrative demo. No real customer reviews are used."}
            </p>
          </div>
        </div>
      </div>
      <div className="pointer-events-none absolute -bottom-6 -left-4 hidden items-center gap-2.5 rounded-2xl border border-[#DCE5F3] bg-white px-4 py-3 shadow-xl sm:flex">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F1FAF5] text-[#2D9D62]"><CircleCheck className="h-5 w-5" /></span>
        <span>
          <span className="block text-[10px] text-[#92A0B2]">{fr ? "Une voix fidèle à votre marque" : "Your brand, your voice"}</span>
          <span className="block text-xs font-bold text-[#213253]">{fr ? "Des réponses naturelles" : "Replies that sound human"}</span>
        </span>
      </div>
    </div>
  );
}

const faqCopy = {
  en: [
    { question: "Does ReviewsAI post replies automatically?", answer: "You can generate a reply and review it before publishing. Depending on your plan and settings, automatic responses can also be enabled for connected Google Business Profile locations." },
    { question: "Can I try it without paying?", answer: "Yes. Start with 3 complimentary AI reply credits, without adding a card. You can choose a paid plan later." },
    { question: "Can I manage more than one location?", answer: "Yes. Starter supports 1 Google Business Profile location, Pro supports up to 3, and Business is designed for unlimited locations." },
    { question: "Will it use the right business name?", answer: "ReviewsAI uses the selected Google location and a short brand name for its default signature, such as “The Sweet Deco team.” You can edit your tone and signature in settings." },
    { question: "Is publishing to Google guaranteed?", answer: "No. Google reviews and posts are subject to Google's APIs, policies and approval processes. ReviewsAI shows the relevant submission status when available." },
  ],
  fr: [
    { question: "ReviewsAI publie-t-il les réponses automatiquement ?", answer: "Vous pouvez générer une réponse, la relire puis la publier. Selon votre forfait et vos paramètres, vous pouvez aussi activer les réponses automatiques pour vos établissements Google connectés." },
    { question: "Puis-je essayer sans payer ?", answer: "Oui. Vous disposez de 3 crédits IA offerts pour tester les réponses, sans carte bancaire. Vous pouvez ensuite choisir un forfait." },
    { question: "Puis-je gérer plusieurs établissements ?", answer: "Oui. Starter comprend 1 établissement Google Business Profile, Pro jusqu'à 3, et Business permet de gérer un nombre illimité d'établissements." },
    { question: "L'IA utilise-t-elle le bon nom d'entreprise ?", answer: "ReviewsAI tient compte de l'établissement sélectionné et utilise le nom court de la marque dans la signature par défaut, par exemple « L'équipe Sweet Deco ». Vous pouvez personnaliser le ton et la signature." },
    { question: "Une publication sur Google est-elle garantie ?", answer: "Non. Les publications et les avis restent soumis aux API, aux règles et aux validations de Google. ReviewsAI affiche le statut de soumission lorsqu'il est disponible." },
  ],
};

export default function ProductHuntLanding() {
  const { i18n } = useTranslation();
  const fr = (i18n.resolvedLanguage || i18n.language || "en").toLowerCase().startsWith("fr");
  const [mobileOpen, setMobileOpen] = useState(false);
  const nav = [
    { href: "#product", label: fr ? "Le produit" : "Product" },
    { href: "#how-it-works", label: fr ? "Comment ça marche" : "How it works" },
    { href: "#features", label: fr ? "Fonctionnalités" : "Features" },
    { href: "#pricing", label: fr ? "Tarifs" : "Pricing" },
  ];

  const features = [
    {
      icon: MessageSquareText,
      title: fr ? "Ne laissez aucun avis de côté." : "No review gets overlooked.",
      desc: fr ? "Consultez les retours Google de vos établissements et préparez vos réponses depuis un espace unique." : "Keep Google feedback from your locations together and work through replies in one focused inbox.",
      bg: "bg-[#EBEFFF]", color: "text-[#3B54F5]",
    },
    {
      icon: Wand2,
      title: fr ? "L'IA répond avec votre ton." : "Replies that sound like your business.",
      desc: fr ? "Une réponse adaptée à la note et au commentaire, avec une signature courte au nom de votre marque." : "Draft a thoughtful reply based on each rating and comment, with your tone and a clean brand signature.",
      bg: "bg-[#E8F8F0]", color: "text-[#188954]",
    },
    {
      icon: Bell,
      title: fr ? "Vous restez au courant." : "Know when something needs attention.",
      desc: fr ? "Recevez des alertes pour les nouveaux avis et gardez le suivi sans surveiller Google en permanence." : "Get notified about new reviews, then follow up without checking Google all day.",
      bg: "bg-[#FFF4E2]", color: "text-[#CF8422]",
    },
  ];

  const steps = [
    { icon: MapPin, title: fr ? "Connectez votre fiche Google" : "Connect Google Business Profile", desc: fr ? "Sélectionnez les établissements à gérer selon votre forfait." : "Choose the locations you want to manage under your plan." },
    { icon: Wand2, title: fr ? "Préparez votre réponse" : "Create your reply", desc: fr ? "L'IA vous propose un texte adapté, que vous pouvez personnaliser." : "Get a contextual AI draft that you can review and edit." },
    { icon: Send, title: fr ? "Publiez, puis suivez" : "Publish and keep track", desc: fr ? "Transmettez les réponses autorisées à Google et suivez vos avis." : "Submit approved replies to Google and stay on top of feedback." },
  ];

  return (
    <div className="reviewsai-launch min-h-screen overflow-x-hidden bg-[#F8FAFF] font-sans text-[#172744] selection:bg-[#C9D2FF]">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-white focus:p-3">
        {fr ? "Aller au contenu" : "Skip to content"}
      </a>
      <header className="sticky top-0 z-50 border-b border-[#E7ECF5]/85 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[76px] max-w-[1220px] items-center justify-between gap-4 px-5 sm:px-8">
          <Link to="/" aria-label="ReviewsAI homepage" className="shrink-0 text-[#172744]"><RankiLogo /></Link>
          <nav className="hidden items-center gap-8 lg:flex" aria-label={fr ? "Navigation principale" : "Main navigation"}>
            {nav.map((item) => <a key={item.href} href={item.href} className="text-[13px] font-semibold text-[#60708B] transition-colors hover:text-[#3B54F5]">{item.label}</a>)}
          </nav>
          <div className="hidden items-center gap-3 sm:flex">
            <LanguageSwitcher />
            <Link to="/auth" className="rounded-xl px-3 py-2.5 text-sm font-bold text-[#34445F] transition-colors hover:text-[#3B54F5]">
              {fr ? "Connexion" : "Log in"}
            </Link>
            <Link to="/auth" className="inline-flex items-center gap-2 rounded-xl bg-[#3B54F5] px-4 py-3 text-sm font-bold text-white shadow-[0_7px_22px_-11px_#3B54F5] transition-transform hover:-translate-y-0.5 hover:bg-[#2E45DE]">
              {fr ? "Essayer gratuitement" : "Get started free"} <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="flex items-center gap-2 sm:hidden">
            <LanguageSwitcher />
            <button type="button" onClick={() => setMobileOpen((x) => !x)}
              aria-label={fr ? "Ouvrir le menu" : "Open menu"} aria-expanded={mobileOpen}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#DEE5F4] bg-white text-[#25385C]">
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        {mobileOpen && (
          <nav className="border-t border-[#E7ECF5] bg-white px-5 pb-5 pt-2 shadow-xl sm:hidden" aria-label="Mobile navigation">
            {nav.map((item) => <a key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className="block rounded-xl px-2 py-3 text-sm font-semibold text-[#35435B]">{item.label}</a>)}
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Link to="/auth" className="rounded-xl border border-[#DDE4F5] px-4 py-3 text-center text-sm font-bold">{fr ? "Connexion" : "Log in"}</Link>
              <Link to="/auth" className="rounded-xl bg-[#3B54F5] px-4 py-3 text-center text-sm font-bold text-white">{fr ? "Commencer" : "Start free"}</Link>
            </div>
          </nav>
        )}
      </header>

      <main id="main-content">
        <section id="product" className="relative isolate overflow-hidden bg-[radial-gradient(ellipse_at_83%_12%,#E4EAFF_0%,transparent_47%),linear-gradient(180deg,#FCFDFF_0%,#F6F8FE_100%)] pb-20 pt-14 sm:pb-28 sm:pt-20 lg:pb-36 lg:pt-24">
          <div className="pointer-events-none absolute right-[-8%] top-20 h-72 w-72 rounded-full bg-[#3B54F5]/10 blur-[100px]" />
          <div className="mx-auto grid max-w-[1220px] items-center gap-14 px-5 sm:px-8 lg:grid-cols-[.94fr_1.06fr] lg:gap-10">
            <div className="relative z-10 text-center lg:text-left">
              <div className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-[#DFE5FA] bg-white px-3 py-2 shadow-[0_4px_16px_-12px_#7289BD]">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#E8EDFF]"><BrandSparkle className="h-3.5 w-3.5" /></span>
                <span className="text-[11px] font-extrabold tracking-[0.065em] text-[#5263A3] sm:text-xs">
                  {fr ? "VOTRE RÉPUTATION, EN MIEUX." : "YOUR REPUTATION, SIMPLIFIED."}
                </span>
                <ArrowUpRight className="h-3.5 w-3.5 text-[#6478C9]" />
              </div>
              <h1 className="max-w-[630px] text-[clamp(2.7rem,5.15vw,4.65rem)] font-extrabold leading-[1.07] tracking-[-0.065em] text-[#14233E]">
                {fr ? <>Chaque avis mérite <span className="text-[#3B54F5]">une vraie réponse.</span></> : <>Every review deserves <span className="text-[#3B54F5]">a great reply.</span></>}
              </h1>
              <p className="mx-auto mt-6 max-w-[515px] text-[16px] leading-[1.82] text-[#596982] sm:text-lg lg:mx-0">
                {fr
                  ? "Répondez aux avis Google avec une IA qui respecte votre ton, suit vos établissements et vous laisse garder le contrôle. Moins de tâches répétitives. Plus d'attention pour vos clients."
                  : "Meet the AI workspace for Google reviews. Draft thoughtful, on-brand replies, stay on top of every location, and keep control over what gets published."}
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
                <Link to="/auth" className="group inline-flex min-h-14 items-center justify-center gap-2.5 rounded-2xl bg-[#3B54F5] px-7 text-sm font-bold text-white shadow-[0_18px_34px_-18px_rgba(59,84,245,.85)] transition-all hover:-translate-y-0.5 hover:bg-[#2E45DE] sm:text-base">
                  {fr ? "Essayer 3 réponses IA gratuites" : "Try 3 AI replies for free"}
                  <ArrowRight className="h-[18px] w-[18px] transition-transform group-hover:translate-x-1" />
                </Link>
                <a href="#how-it-works" className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-[#D7DFEF] bg-white px-6 text-sm font-bold text-[#364761] transition-colors hover:bg-[#F1F4FC] sm:text-base">
                  <MousePointer2 className="h-4 w-4 text-[#5264EA]" /> {fr ? "Découvrir le produit" : "See how it works"}
                </a>
              </div>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-medium text-[#687993] lg:justify-start">
                {[fr ? "Sans carte bancaire" : "No credit card", fr ? "3 crédits IA offerts" : "3 free AI credits", fr ? "Connexion Google Business" : "Google Business connection"].map((item) => (
                  <span key={item} className="inline-flex items-center gap-1.5"><Check className="h-4 w-4 text-[#20A76A]" /> {item}</span>
                ))}
              </div>
            </div>
            <ReviewWorkflowDemo fr={fr} />
          </div>
        </section>

        <section className="border-y border-[#E8ECF5] bg-white py-7">
          <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-center gap-4 px-5 text-center sm:flex-row sm:gap-8 sm:text-left">
            <p className="text-xs font-bold uppercase tracking-[.1em] text-[#8996AB]">{fr ? "Pensé pour celles et ceux qui accueillent des clients" : "Built for teams that serve real customers"}</p>
            <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-semibold text-[#5F6E84] sm:gap-5">
              <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#3B54F5]" />{fr ? "Commerces" : "Retail"}</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#22A46E]" />{fr ? "Services locaux" : "Local services"}</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#F5B449]" />{fr ? "Hôtellerie & restauration" : "Hospitality"}</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#EA7070]" />{fr ? "Multi-établissements" : "Multi-location"}</span>
            </div>
          </div>
        </section>

        <section id="features" className="bg-white py-20 sm:py-28">
          <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
            <div className="mx-auto mb-12 max-w-[740px] text-center">
              <span className="text-xs font-extrabold uppercase tracking-[.16em] text-[#3B54F5]">{fr ? "L'ESSENTIEL, SANS COMPLEXITÉ" : "LESS BUSYWORK. MORE CONNECTION."}</span>
              <h2 className="mt-4 text-[clamp(2rem,4vw,3.25rem)] font-extrabold leading-[1.13] tracking-[-0.045em] text-[#172744]">
                {fr ? "Tout ce qu'il vous faut pour prendre soin de vos avis." : "Make every customer interaction count."}
              </h2>
              <p className="mt-5 text-base leading-8 text-[#6A7890]">
                {fr ? "De la première notification à la réponse finale, chaque étape trouve sa place." : "From the first notification to the final reply, it's all in one calm workflow."}
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {features.map((feature) => (
                <article key={feature.title} className="group min-h-[270px] rounded-[26px] border border-[#E6EBF4] bg-[#FCFDFF] p-7 transition-all hover:-translate-y-1 hover:border-[#C9D3FF] hover:shadow-[0_20px_44px_-30px_#677CC5]">
                  <span className={"inline-flex h-12 w-12 items-center justify-center rounded-[15px] " + feature.bg + " " + feature.color}>
                    <feature.icon className="h-6 w-6" strokeWidth={1.9} />
                  </span>
                  <h3 className="mt-8 text-xl font-extrabold tracking-[-0.03em] text-[#1C2B46]">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-[1.8] text-[#687791]">{feature.desc}</p>
                </article>
              ))}
            </div>

            <div className="mt-5 grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
              <article className="relative overflow-hidden rounded-[28px] bg-[#142447] p-8 text-white sm:p-10">
                <div className="pointer-events-none absolute -right-28 -top-28 h-80 w-80 rounded-full bg-[#4969FF]/30 blur-[65px]" />
                <span className="relative z-10 text-xs font-bold uppercase tracking-[.14em] text-[#A8B9FF]">SEO + GEO</span>
                <h3 className="relative z-10 mt-5 max-w-lg text-[clamp(1.6rem,3vw,2.3rem)] font-extrabold leading-[1.16] tracking-[-0.04em]">
                  {fr ? "Votre réputation ne s'arrête pas aux avis." : "Go beyond review management."}
                </h3>
                <p className="relative z-10 mt-4 max-w-lg text-sm leading-7 text-[#BAC9E7]">
                  {fr ? "Selon votre forfait, retrouvez le suivi local, les contenus et les outils GEO dans le même espace." : "Depending on your plan, explore local visibility tracking, Google content and GEO tools in the same workspace."}
                </p>
                <div className="relative z-10 mt-8 grid grid-cols-2 gap-3 sm:max-w-[500px]">
                  <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
                    <MapPin className="h-5 w-5 text-[#AFC0FF]" />
                    <p className="mt-3 text-sm font-bold">{fr ? "Visibilité locale" : "Local visibility"}</p>
                    <p className="mt-1 text-xs text-[#BAC9E7]">Google Maps</p>
                  </div>
                  <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
                    <TrendingUp className="h-5 w-5 text-[#9CE7C2]" />
                    <p className="mt-3 text-sm font-bold">{fr ? "Contenus assistés par l'IA" : "AI-assisted content"}</p>
                    <p className="mt-1 text-xs text-[#BAC9E7]">{fr ? "Posts & FAQ" : "Posts & FAQs"}</p>
                  </div>
                </div>
              </article>
              <article className="relative overflow-hidden rounded-[28px] border border-[#E6EAF5] bg-[#F2F5FF] p-8 sm:p-10">
                <span className="text-xs font-bold uppercase tracking-[.14em] text-[#5369C3]">{fr ? "UNE VRAIE IDENTITÉ" : "YOUR BRAND VOICE"}</span>
                <h3 className="mt-5 text-[clamp(1.6rem,3vw,2.3rem)] font-extrabold leading-[1.16] tracking-[-0.04em] text-[#192A4C]">
                  {fr ? "Pas de réponse robotique." : "Never sound like a bot."}
                </h3>
                <p className="mt-4 text-sm leading-7 text-[#65738C]">
                  {fr ? "Des réponses humaines, une signature cohérente et la possibilité de modifier chaque proposition." : "Human-sounding drafts, the right business name, and room to make every reply your own."}
                </p>
                <div className="mt-8 rounded-2xl border border-[#DCE3FB] bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-2 text-[11px] font-bold text-[#6C7C9B]">
                    <BrandSparkle className="h-5 w-5" /> {fr ? "SIGNATURE PERSONNALISÉE" : "ON-BRAND SIGNATURE"}
                  </div>
                  <p className="mt-3 text-sm font-semibold leading-relaxed text-[#314460]">{fr ? "Merci pour votre confiance !" : "Thanks for choosing us!"}</p>
                  <div className="mt-3 text-sm font-bold text-[#3B54F5]">{fr ? "— L'équipe Sweet Deco" : "— The Sweet Deco team"}</div>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="border-y border-[#E6EBF5] bg-[#F8FAFF] py-20 sm:py-28">
          <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
            <div className="max-w-[650px]">
              <span className="text-xs font-extrabold uppercase tracking-[.15em] text-[#3B54F5]">{fr ? "COMMENT ÇA MARCHE" : "THREE SIMPLE STEPS"}</span>
              <h2 className="mt-4 text-[clamp(2rem,4vw,3.15rem)] font-extrabold leading-[1.15] tracking-[-0.045em] text-[#172744]">
                {fr ? "De l'avis à la réponse, en toute simplicité." : "From feedback to follow-up, without the busywork."}
              </h2>
            </div>
            <div className="relative mt-12 grid gap-5 md:grid-cols-3">
              {steps.map((step, index) => (
                <article key={step.title} className="relative rounded-[25px] border border-[#E2E8F3] bg-white p-7 shadow-[0_10px_35px_-29px_#8591B8]">
                  <div className="mb-8 flex items-center justify-between">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EFF2FF] text-[#3B54F5]">
                      <step.icon className="h-[22px] w-[22px]" />
                    </span>
                    <span className="text-5xl font-extrabold tracking-tight text-[#EFF2FA]">0{index + 1}</span>
                  </div>
                  <h3 className="text-lg font-extrabold tracking-tight text-[#233251]">{step.title}</h3>
                  <p className="mt-3 text-sm leading-[1.8] text-[#6A7890]">{step.desc}</p>
                  {index < 2 && <ChevronRight className="absolute -right-4 top-1/2 z-10 hidden h-7 w-7 rounded-full border border-[#E2E7F3] bg-white p-1 text-[#7A8BBB] md:block" />}
                </article>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-2 text-xs font-semibold text-[#8793AA]">
              <ShieldCheck className="h-4 w-4 text-[#26A775]" />
              {fr ? "Vous gardez le contrôle des réponses et des établissements connectés." : "You stay in control of your connected locations and replies."}
            </div>
          </div>
        </section>

        <RankiPricingSection />

        <div id="faq" className="[&>section]:bg-white [&>section]:py-20">
          <FAQSection
            faqs={fr ? faqCopy.fr : faqCopy.en}
            title={fr ? "Encore une question ?" : "A few things you might be wondering."}
            subtitle={fr ? "Toutes les réponses avant de démarrer." : "What to know before you get started."}
            badgeText="FAQ"
          />
        </div>

        <section className="bg-[#F8FAFF] px-5 pb-20 pt-10 sm:px-8 sm:pb-28">
          <div className="relative mx-auto max-w-[1180px] overflow-hidden rounded-[32px] bg-[#16274C] px-7 py-14 text-center text-white sm:px-14 sm:py-20">
            <div className="pointer-events-none absolute -left-28 -bottom-36 h-80 w-80 rounded-full bg-[#3B54F5]/40 blur-[80px]" />
            <div className="pointer-events-none absolute -right-24 -top-36 h-80 w-80 rounded-full bg-[#34A853]/20 blur-[80px]" />
            <div className="relative z-10">
              <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold text-[#D6E0FF]">
                <BrandSparkle className="h-4 w-4" /> {fr ? "Un bon départ est gratuit." : "A better reply starts here."}
              </span>
              <h2 className="mx-auto max-w-3xl text-[clamp(2.15rem,4vw,3.7rem)] font-extrabold leading-[1.12] tracking-[-0.055em]">
                {fr ? "Faites de chaque avis une occasion de bien répondre." : "Your next great customer reply is one click away."}
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-[15px] leading-7 text-[#BBC9E8]">
                {fr ? "Connectez votre établissement et essayez vos 3 premières réponses IA. Aucune carte bancaire nécessaire." : "Connect your business and try your first 3 AI-drafted replies. No card required."}
              </p>
              <Link to="/auth" className="group mt-8 inline-flex min-h-14 items-center justify-center gap-2.5 rounded-2xl bg-white px-8 text-sm font-extrabold text-[#3048DB] transition-transform hover:-translate-y-0.5 sm:text-base">
                {fr ? "Commencer gratuitement" : "Start free"} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#E5EAF3] bg-white">
        <div className="mx-auto grid max-w-[1200px] gap-10 px-5 py-12 sm:grid-cols-[1.4fr_1fr_1fr] sm:px-8">
          <div>
            <RankiLogo className="text-[#172744]" />
            <p className="mt-4 max-w-xs text-sm leading-7 text-[#7A879C]">
              {fr ? "Le compagnon IA pour vos avis Google et votre visibilité locale." : "Your AI workspace for Google reviews and local visibility."}
            </p>
          </div>
          <div>
            <h3 className="mb-4 text-xs font-extrabold uppercase tracking-[.13em] text-[#223250]">{fr ? "Produit" : "Product"}</h3>
            <div className="flex flex-col gap-3 text-sm text-[#77849A]">
              <a href="#product" className="hover:text-[#3B54F5]">{fr ? "Présentation" : "Overview"}</a>
              <a href="#features" className="hover:text-[#3B54F5]">{fr ? "Fonctionnalités" : "Features"}</a>
              <a href="#pricing" className="hover:text-[#3B54F5]">{fr ? "Tarifs" : "Pricing"}</a>
              <Link to="/blog" className="hover:text-[#3B54F5]">Blog</Link>
            </div>
          </div>
          <div>
            <h3 className="mb-4 text-xs font-extrabold uppercase tracking-[.13em] text-[#223250]">{fr ? "Informations" : "Company"}</h3>
            <div className="flex flex-col gap-3 text-sm text-[#77849A]">
              <Link to="/privacy" className="hover:text-[#3B54F5]">{fr ? "Confidentialité" : "Privacy"}</Link>
              <Link to="/terms" className="hover:text-[#3B54F5]">{fr ? "Conditions d'utilisation" : "Terms"}</Link>
              <a href="mailto:support@reviewsai.store" className="hover:text-[#3B54F5]">support@reviewsai.store</a>
            </div>
          </div>
        </div>
        <div className="mx-auto flex max-w-[1200px] flex-col justify-between gap-3 border-t border-[#EDF0F6] px-5 py-6 text-xs text-[#8B97A9] sm:flex-row sm:px-8">
          <span>© {new Date().getFullYear()} ReviewsAI. {fr ? "Tous droits réservés." : "All rights reserved."}</span>
          <span className="inline-flex items-center gap-2"><Globe2 className="h-3.5 w-3.5" /> reviewsai.store</span>
        </div>
      </footer>
    </div>
  );
}
