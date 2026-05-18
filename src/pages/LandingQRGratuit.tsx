import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2, Gift, Truck, QrCode, Sparkles, Star, ShieldCheck, ArrowRight, Zap, Store, Smartphone,
} from "lucide-react";
import hero from "@/assets/nfc-plaque-counter.jpg";
import designs from "@/assets/nfc-plaque-designs.jpg";
import usecase from "@/assets/nfc-plaque-tap.jpg";
import plaqueFront from "@/assets/nfc-plaque-front.jpg";

export default function LandingQRGratuit() {
  const startUrl = "/auth?next=/boutique/qr-imprime";

  useEffect(() => {
    document.title = "Plaque NFC + QR Google Avis — Offerte | Ranki.ai";
    const setMeta = (name: string, content: string) => {
      let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
      if (!el) { el = document.createElement("meta"); el.name = name; document.head.appendChild(el); }
      el.content = content;
    };
    setMeta("description", "Recevez gratuitement votre plaque NFC + QR code Google Avis. Vos clients tapent ou scannent — vous récoltez des avis 5★. Offerte à tous les utilisateurs Ranki.ai.");
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/40 via-white to-emerald-50/30">


      {/* Top sticky CTA */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b">
        <div className="container max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="font-bold flex items-center gap-2">
            <span className="text-amber-500">★</span> Ranki.ai
          </Link>
          <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700">
            <Link to={startUrl}>Recevoir mon QR gratuit</Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="container max-w-6xl mx-auto px-4 pt-10 pb-12 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 mb-4">
            <Gift className="w-3.5 h-3.5 mr-1" /> Offerte à tous — tous plans
          </Badge>
          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight tracking-tight">
            Votre <span className="text-emerald-600">Plaque NFC + QR Google</span><br />
            <span className="text-amber-500">100% offerte</span>
          </h1>
          <p className="text-lg text-muted-foreground mt-5">
            Plaque premium 12×12 cm. Vos clients <strong className="text-foreground">tapent leur téléphone (NFC)</strong> ou
            <strong className="text-foreground"> scannent le QR code</strong> — et laissent un avis Google en quelques secondes.
            <strong className="text-foreground"> Offerte à tous les utilisateurs Ranki.ai</strong>, quel que soit le plan.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mt-7">
            <Button asChild size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-base h-12 px-6">
              <Link to={startUrl}>
                Je commande ma plaque gratuite <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-base h-12">
              <Link to="/select-plan">Voir les abonnements</Link>
            </Button>
          </div>

          <ul className="grid grid-cols-2 gap-x-4 gap-y-2 mt-6 text-sm">
            <li className="flex items-center gap-2"><Smartphone className="w-4 h-4 text-emerald-600" /> NFC + QR code</li>
            <li className="flex items-center gap-2"><Truck className="w-4 h-4 text-emerald-600" /> Livraison offerte</li>
            <li className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-emerald-600" /> Lien modifiable à vie</li>
            <li className="flex items-center gap-2"><Zap className="w-4 h-4 text-emerald-600" /> Reçue sous 5–7 jours</li>
          </ul>
        </div>

        <div className="relative">
          <img
            src={hero}
            alt="Plaque NFC + QR Google Avis posée sur un comptoir de café, un client tape son téléphone"
            width={1536}
            height={1024}
            className="rounded-2xl shadow-2xl w-full h-auto object-cover aspect-[3/2]"
          />
          <div className="absolute -bottom-4 -left-4 bg-white shadow-xl rounded-xl px-4 py-3 flex items-center gap-2 border">
            <div className="flex">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
            </div>
            <span className="text-sm font-semibold">+38% d'avis en 30 jours</span>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="container max-w-6xl mx-auto px-4 py-14">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Comment ça marche</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { n: "1", t: "Créez votre compte", d: "Inscription en 30 secondes, connectez votre fiche Google My Business." },
            { n: "2", t: "On personnalise & on expédie", d: "Plaque NFC + QR imprimée avec votre établissement, livrée chez vous gratuitement." },
            { n: "3", t: "Vos clients tapent ou scannent", d: "Posez-la sur le comptoir. Vos clients laissent un avis 5★ en 1 geste." },
          ].map((s) => (
            <Card key={s.n} className="p-6 rounded-2xl border-2 hover:border-emerald-300 transition">
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center mb-3">
                {s.n}
              </div>
              <h3 className="font-bold text-lg mb-1">{s.t}</h3>
              <p className="text-sm text-muted-foreground">{s.d}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Designs */}
      <section className="bg-white py-16 border-y">
        <div className="container max-w-6xl mx-auto px-4 grid md:grid-cols-2 gap-10 items-center">
          <img
            src={designs}
            alt="Trois designs de plaques NFC + QR Google Avis"
            width={1536}
            height={1024}
            loading="lazy"
            className="rounded-2xl shadow-xl w-full h-auto object-cover aspect-[3/2]"
          />
          <div>
            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 mb-3">3 designs au choix</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Une plaque qui colle à votre marque</h2>
            <p className="text-muted-foreground mb-5">
              Bleu Google classique, élégant noir & or, ou minimaliste émeraude — choisissez le style
              qui s'intègre parfaitement à votre établissement.
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2"><CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" /> Format 12 × 12 cm, plastique premium</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" /> Puce NFC <strong>+</strong> QR code dynamique</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" /> Lien modifiable à vie depuis Starlinko</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" /> Adhésif inclus + support à poser</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Use case */}
      <section className="container max-w-6xl mx-auto px-4 py-16 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 mb-3">
            <Store className="w-3.5 h-3.5 mr-1" /> Pour tous les commerces
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Restaurants, salons, boutiques, hôtels…</h2>
          <p className="text-muted-foreground mb-5">
            Collez-le sur votre comptoir, votre menu, votre porte d'entrée ou votre
            ticket de caisse. Les clients satisfaits laissent un avis en 1 scan — sans
            même réfléchir.
          </p>
          <Button asChild size="lg" className="bg-emerald-600 hover:bg-emerald-700">
            <Link to={startUrl}>Commander ma plaque gratuite <ArrowRight className="w-4 h-4 ml-2" /></Link>
          </Button>
        </div>
        <img
          src={usecase}
          alt="Client tapant son téléphone sur une plaque NFC pour laisser un avis Google"
          width={1280}
          height={1024}
          loading="lazy"
          className="rounded-2xl shadow-xl w-full h-auto object-cover aspect-[4/3]"
        />
      </section>

      {/* Testimonials */}
      <section className="bg-gradient-to-br from-emerald-50 to-amber-50 py-16">
        <div className="container max-w-6xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-10">Ils ont reçu leur plaque NFC gratuite</h2>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { name: "Lina, Le Petit Bistrot", quote: "Reçu en 4 jours, déjà 22 nouveaux avis en 2 semaines !" },
              { name: "Marc, Coiffeur Urbain", quote: "Mes clients adorent. Plus besoin de demander, ils scannent." },
              { name: "Sofia, Boutique Mode", quote: "Design élégant, ça s'intègre parfaitement à ma déco." },
            ].map((t) => (
              <Card key={t.name} className="p-5 rounded-2xl bg-white">
                <div className="flex mb-2">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
                </div>
                <p className="text-sm italic text-foreground mb-3">"{t.quote}"</p>
                <p className="text-xs font-semibold text-muted-foreground">{t.name}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="container max-w-3xl mx-auto px-4 py-16 text-center">
        <Smartphone className="w-14 h-14 mx-auto text-emerald-600 mb-4" />
        <h2 className="text-3xl md:text-4xl font-bold mb-3">Prêt à recevoir votre plaque NFC gratuite ?</h2>
        <p className="text-muted-foreground mb-6">
          1 plaque offerte par compte. Livraison France & International. Sans frais cachés.
        </p>
        <Button asChild size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-base h-12 px-8">
          <Link to={startUrl}>
            Je commande ma plaque gratuite <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </Button>
        <p className="text-xs text-muted-foreground mt-4">
          Réservé aux nouveaux abonnés Starlinko (plans payants à partir de 9,99€/mois).
        </p>
      </section>

      <footer className="border-t bg-white">
        <div className="container max-w-6xl mx-auto px-4 py-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Starlinko · <Link to="/privacy" className="underline">Confidentialité</Link> · <Link to="/terms" className="underline">CGV</Link>
        </div>
      </footer>
    </div>
  );
}
