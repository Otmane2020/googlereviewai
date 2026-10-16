import { Link } from "@/lib/router-compat";
import { ArrowRight, ArrowUpRight, CheckCircle2, MessageSquareText, ShieldCheck, Sparkles, Star } from "lucide-react";
import { RankiLogo } from "@/components/StarlinkoLogo";

const examples = [
  {
    rating: 5,
    scenario: "Avis positif après un achat",
    review: "Accueil chaleureux et commande arrivée rapidement. Je recommande !",
    reply: "Merci beaucoup pour votre retour ! Nous sommes ravis que notre accueil et la livraison aient répondu à vos attentes. Au plaisir de vous revoir !\n— L'équipe Sweet Deco",
    note: "La réponse reprend les deux points mentionnés sans ajouter de promesse.",
  },
  {
    rating: 2,
    scenario: "Avis négatif sur une livraison",
    review: "Ma commande est arrivée en retard et je n'ai eu aucune information.",
    reply: "Merci d'avoir pris le temps de nous signaler ce problème. Nous sommes désolés du retard et du manque d'informations. Nous vous invitons à contacter notre service client avec votre référence pour examiner votre dossier.\n— L'équipe Sweet Deco",
    note: "On reconnaît le problème, sans révéler de données personnelles.",
  },
  {
    rating: 3,
    scenario: "Avis mitigé sur le service",
    review: "Produit conforme, mais j'ai trouvé l'attente un peu longue en magasin.",
    reply: "Merci pour votre avis et pour votre retour sur le produit. Nous prenons bonne note de votre remarque concernant l'attente en magasin afin d'améliorer l'accueil.\n— L'équipe Sweet Deco",
    note: "Une réponse courte, spécifique et sans formule commerciale insistante.",
  },
];

const faqs = [
  {
    q: "Peut-on répondre gratuitement aux avis Google avec une IA ?",
    a: "Oui. ReviewsAI permet d'essayer trois réponses générées par IA sans carte bancaire. Ce sont trois crédits offerts, pas un forfait illimité gratuit. Au-delà, des abonnements et packs de crédits sont proposés.",
  },
  {
    q: "Comment connecter ma fiche Google Business Profile ?",
    a: "Créez un compte ReviewsAI, connectez-vous avec le compte Google autorisé à gérer l'établissement, puis sélectionnez votre fiche. Vous pourrez consulter les avis disponibles et préparer des réponses.",
  },
  {
    q: "Est-ce que l'IA peut répondre automatiquement aux nouveaux avis ?",
    a: "Selon votre forfait et vos réglages, ReviewsAI propose la génération de réponses et des scénarios de réponse automatique. Pour les commentaires sensibles ou les réclamations, il est préférable de vérifier le texte et les faits avant publication.",
  },
  {
    q: "Quelle langue l'IA utilise-t-elle pour répondre ?",
    a: "La réponse doit respecter la langue du commentaire original : un avis en français reçoit une réponse en français, un avis en anglais reçoit une réponse en anglais. En cas d'avis sans texte, la langue de la fiche Google sert de repli.",
  },
  {
    q: "Les réponses Google font-elles automatiquement monter mon établissement sur Maps ?",
    a: "Il n'existe pas de garantie de classement. Les réponses peuvent améliorer la qualité de la relation client et la confiance des lecteurs, mais le référencement local dépend notamment de la pertinence, de la distance et de la notoriété de l'établissement.",
  },
];

export default function FreeGoogleReviewReplyFR() {
  return (
    <div className="min-h-screen bg-[#F8FAFF] font-sans text-[#1A2946]">
      <header className="border-b border-[#E4E9F4] bg-white">
        <div className="mx-auto flex h-[76px] max-w-6xl items-center justify-between px-5 sm:px-8">
          <Link to="/" aria-label="ReviewsAI — accueil"><RankiLogo /></Link>
          <div className="flex items-center gap-2">
            <Link to="/blog" className="hidden rounded-xl px-3 py-2 text-sm font-semibold text-[#66758F] hover:text-[#3B54F5] sm:inline-flex">Guides</Link>
            <Link to="/auth" className="inline-flex items-center gap-2 rounded-xl bg-[#3B54F5] px-4 py-3 text-sm font-bold text-white hover:bg-[#2D44DB]">Essayer gratuitement <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </header>
      <main>
        <section className="border-b border-[#E3E9F5] bg-[radial-gradient(ellipse_at_85%_0%,#DDE5FF_0%,transparent_48%),linear-gradient(180deg,#FFFFFF,#F7F9FF)]">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1.13fr_.87fr]">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-[#D6DFFE] bg-white px-4 py-2 text-xs font-extrabold text-[#4560DB]">
                <Sparkles className="h-4 w-4" /> Réponses aux avis Google par IA
              </span>
              <h1 className="mt-6 text-[clamp(2.35rem,5vw,4.15rem)] font-extrabold leading-[1.09] tracking-[-0.052em]">
                Répondre aux avis Google avec l'IA <span className="text-[#3B54F5]">gratuitement.</span>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-[#63728A]">
                Un avis positif à remercier, un client insatisfait à rassurer ? ReviewsAI prépare des réponses adaptées à votre activité et à la langue de chaque commentaire. Essayez vos <strong>3 premières réponses IA gratuitement</strong>, sans carte bancaire.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/auth" className="inline-flex min-h-14 items-center gap-2 rounded-2xl bg-[#3B54F5] px-7 font-bold text-white hover:bg-[#2D44DB]">Essayer 3 réponses gratuites <ArrowRight className="h-5 w-5" /></Link>
                <a href="#exemples" className="inline-flex min-h-14 items-center rounded-2xl border border-[#D7DFEF] bg-white px-6 font-bold text-[#344563] hover:bg-[#EFF3FF]">Voir des exemples</a>
              </div>
              <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[#677894]">
                <span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#199E69]" /> Sans carte bancaire</span>
                <span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#199E69]" /> Signature de marque</span>
                <span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#199E69]" /> Langue du client</span>
              </div>
            </div>
            <div className="rounded-[26px] border border-[#DEE6F8] bg-white p-6 shadow-[0_25px_80px_-35px_rgba(41,57,117,.32)] sm:p-8">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 text-sm font-bold text-[#3B54F5]"><MessageSquareText className="h-5 w-5" /> Exemple de réponse</span>
                <span className="rounded-full bg-[#F0F3FA] px-3 py-1 text-xs font-semibold text-[#7A879A]">Démonstration</span>
              </div>
              <div className="mt-6 rounded-xl border border-[#EDF0F7] p-4">
                <div className="flex items-center gap-1">{Array.from({length: 5},(_,i)=><Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />)}</div>
                <p className="mt-3 leading-7 text-[#4B5C79]">« Accueil chaleureux et commande arrivée rapidement. Je recommande ! »</p>
              </div>
              <div className="mt-3 rounded-xl border border-[#DCE4FF] bg-[#F3F6FF] p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-[#4058E0]">Proposition IA</p>
                <p className="mt-3 whitespace-pre-line text-sm leading-7 text-[#40516E]">{examples[0].reply}</p>
              </div>
              <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-[#7B899E]"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" /> Exemples fictifs, non issus de véritables avis clients. Vérifiez toujours les faits avant publication.</p>
            </div>
          </div>
        </section>

        <section id="exemples" className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
          <h2 className="max-w-3xl text-3xl font-extrabold tracking-tight sm:text-4xl">Exemples de réponses IA aux avis positifs, négatifs et mitigés</h2>
          <p className="mt-4 max-w-3xl leading-8 text-[#61718B]">Une réponse utile reprend ce que le client a réellement écrit, sans inventer de faits ni transformer chaque commentaire en publicité. Ces scénarios fictifs montrent le type de ton à adopter.</p>
          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {examples.map(ex => (
              <article key={ex.scenario} className="rounded-3xl border border-[#E1E8F5] bg-white p-6">
                <h3 className="text-xl font-extrabold tracking-tight">{ex.scenario}</h3>
                <p className="mt-3 text-sm leading-7 text-[#76859D]"><strong>Avis :</strong> « {ex.review} »</p>
                <div className="mt-4 border-t border-[#EBEFF8] pt-4">
                  <p className="text-xs font-extrabold uppercase tracking-wide text-[#3B54F5]">Réponse proposée</p>
                  <p className="mt-2 whitespace-pre-line text-sm leading-7 text-[#344664]">{ex.reply}</p>
                </div>
                <p className="mt-5 rounded-xl bg-[#F2F5FF] px-4 py-3 text-xs leading-6 text-[#61718B]">{ex.note}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="border-y border-[#E3E9F5] bg-white py-16 sm:py-20">
          <div className="mx-auto grid max-w-6xl gap-12 px-5 sm:px-8 lg:grid-cols-2">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight">Comment utiliser ReviewsAI pour répondre aux avis Google ?</h2>
              <p className="mt-5 leading-8 text-[#65738A]">L'IA n'a pas besoin de remplacer votre équipe : elle peut préparer un premier jet pendant que vous contrôlez le ton, les informations et les réponses aux réclamations.</p>
            </div>
            <ol className="space-y-7">
              {[
                ["Connecter votre établissement", "Autorisez l'accès au Google Business Profile que vous gérez, puis sélectionnez votre établissement."],
                ["Lire l'avis original", "Lisez la note et le commentaire, y compris les éventuelles informations sur une livraison ou une prestation."],
                ["Générer et relire la réponse", "L'IA propose un message adapté. Vérifiez les faits et choisissez une signature courte au nom de votre établissement."],
                ["Publier et suivre", "Publiez la réponse via Google lorsque l'intégration et vos autorisations le permettent, puis suivez les nouveaux avis."],
              ].map(([title, detail], index) => (
                <li key={title} className="flex gap-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E9EDFF] text-sm font-extrabold text-[#3B54F5]">{index + 1}</span>
                  <div><h3 className="text-lg font-bold">{title}</h3><p className="mt-2 leading-7 text-[#65738A]">{detail}</p></div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-5 py-16 sm:px-8 sm:py-24">
          <h2 className="text-3xl font-extrabold tracking-tight">Questions fréquentes sur les réponses IA Google</h2>
          <div className="mt-8 divide-y divide-[#E1E8F3]">
            {faqs.map(item => (
              <article key={item.q} className="py-6">
                <h3 className="text-lg font-bold">{item.q}</h3>
                <p className="mt-3 leading-8 text-[#63738D]">{item.a}</p>
              </article>
            ))}
          </div>
          <div className="mt-9 rounded-2xl border border-[#DDE5F5] bg-white px-6 py-5">
            <h3 className="font-extrabold">Pour approfondir</h3>
            <p className="mt-2 text-sm leading-7 text-[#61728D]">
              Consultez aussi notre <Link to="/blog/google-my-business-ai-auto-reply-fr" className="font-bold text-[#3B54F5] hover:underline">guide sur l'automatisation des réponses Google Business Profile</Link>,
              {" "}notre <Link to="/google-review-management" className="font-bold text-[#3B54F5] hover:underline">présentation du suivi des avis</Link> et les <Link to="/blog" className="font-bold text-[#3B54F5] hover:underline">autres guides ReviewsAI</Link>.
            </p>
          </div>
        </section>
        <section className="bg-[#152447] py-14 text-center text-white sm:py-20">
          <div className="mx-auto max-w-3xl px-5">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Chaque avis mérite une vraie réponse.</h2>
            <p className="mt-4 text-[#C0CBE5]">Commencez avec trois réponses IA offertes, sans carte bancaire et sans promesse de classement Google.</p>
            <Link to="/auth" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-7 py-4 font-extrabold text-[#3048DB] hover:bg-[#EAF0FF]">Essayer ReviewsAI <ArrowUpRight className="h-4 w-4" /></Link>
          </div>
        </section>
      </main>
      <footer className="bg-white px-5 py-9 text-center text-sm text-[#70809A]">
        ReviewsAI — Logiciel indépendant, non affilié à Google. <Link to="/privacy" className="font-semibold hover:underline">Confidentialité</Link> · <Link to="/" className="font-semibold hover:underline">Accueil</Link>
      </footer>
    </div>
  );
}
