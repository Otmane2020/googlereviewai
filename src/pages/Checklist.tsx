import { useEffect, useMemo, useState } from "react";
import { Check, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

type Section = { title: string; items: string[] };

const SECTIONS: Section[] = [
  {
    title: "1. Authentification & Onboarding",
    items: [
      "Inscription email/mot de passe → réception email de vérification",
      "Connexion email/mot de passe",
      "Connexion via Google OAuth",
      "Mot de passe oublié → email reset → nouveau mot de passe fonctionne",
      "Déconnexion redirige vers landing",
      "Nouvel utilisateur reçoit 25 crédits gratuits + email de bienvenue",
      "Switch FR/EN persiste après refresh et reconnexion",
    ],
  },
  {
    title: "2. Connexion Google Business Profile",
    items: [
      'Bouton "Connecter Google" lance OAuth avec scopes GMB',
      "Sélection multi-établissements si plusieurs trouvés",
      "Sync auto des fiches après connexion (nom, adresse, site, catégories)",
      'Refresh token stocké (vérifier qu\'un cron suivant ne dit pas "No refresh token")',
      "Déconnexion Google → données conservées mais sync désactivée",
    ],
  },
  {
    title: "3. Dashboard",
    items: [
      "Affiche le nom de l'établissement (pas du user)",
      "Dropdown change l'établissement actif si plusieurs",
      "Compteurs : total avis, note moyenne, en attente, taux de réponse",
      "Header sticky lors du scroll (mobile + desktop)",
      "Bouton refresh resync avis",
      "Cartes d'action redirigent correctement",
    ],
  },
  {
    title: "4. Avis Google",
    items: [
      "Liste affiche tous les avis synchronisés",
      "Filtre par note / par statut (en attente / répondu)",
      "Génération réponse IA (OpenRouter Gemini)",
      "Édition manuelle de la réponse",
      "Publication réponse vers Google → vérifier sur la fiche réelle",
      "Suppression d'un avis côté Google → marqué supprimé après sync",
      "Signature personnalisée prioritaire sur Brand Voice",
      "Compteur de crédits décrémente après génération IA",
    ],
  },
  {
    title: "5. AEO (GeoRank AI)",
    items: [
      "Génération hebdo gratuite (Freemium)",
      "Génération quotidienne (plan 9,99€)",
      "Aperçu article avant publication",
      "Publication automatique vers GMB",
      'Bouton "Voir les abonnements" ouvre la session Stripe (pas /choose-plan)',
    ],
  },
  {
    title: "6. SEO Autopilot",
    items: [
      "Analyse du site (Firecrawl)",
      "Génération du plan éditorial",
      "Articles programmés visibles dans le calendrier",
      "Publication auto au planning prévu",
      "Bouton abonnement → checkout Stripe",
    ],
  },
  {
    title: "7. Maps Rank",
    items: [
      "Création d'une grille géographique",
      "Scoring couleur par position (vert/orange/rouge)",
      "Métriques moyennes calculées",
      "Historique conservé",
    ],
  },
  {
    title: "8. Paiements / Stripe",
    items: [
      "Choix d'un plan → checkout Stripe (test mode)",
      "Promo code accepté",
      "Essai gratuit appliqué pour nouveaux clients uniquement",
      "Customer récurrent : pas de trial à nouveau",
      "Achat pack crédits → solde augmenté",
      "Webhook met à jour plan_name et subscription_status",
      "Annulation abonnement → accès maintenu jusqu'à fin de période",
      'Re-souscription depuis "Plan annulé"',
    ],
  },
  {
    title: "9. Notifications",
    items: [
      "Push : activer dans Settings → recevoir le test",
      "Push : nouvel avis déclenche notification (< 24 h, non répondu)",
      "Email : nouvel avis envoyé (si activé dans Paramètres IA)",
      "Pas de doublon si avis déjà répondu",
      "Désactivation push supprime la souscription DB",
    ],
  },
  {
    title: "10. Paramètres",
    items: [
      "Modifier nom complet, email, mot de passe",
      "Switch langue",
      "Configuration IA : ton, longueur, note minimum, auto-publish",
      "Signature personnalisée enregistrée et utilisée",
      "Support : envoi message → reçu sur email admin",
    ],
  },
  {
    title: "11. PWA / Mobile",
    items: [
      "Installation PWA (Add to Home Screen)",
      "Icône + splash screen Ranki.ai",
      "Service Worker met à jour sans casser",
      "Bottom nav mobile fonctionnelle",
      "App Capacitor Android : pas de bannière PWA/push web",
    ],
  },
  {
    title: "12. Extension Chrome",
    items: ["Edge functions répondent OK aux requêtes chrome-extension://"],
  },
  {
    title: "13. Pages publiques / SEO",
    items: [
      "Landing page FR par défaut",
      "100 articles SEO accessibles",
      "FAQ schema JSON-LD présent",
      "sitemap.xml + robots.txt corrects",
      "Routes profondes (/pricing, /blog/...) ne renvoient pas 404 au refresh",
      "CGU + Politique de confidentialité accessibles",
    ],
  },
  {
    title: "14. Admin (compte admin uniquement)",
    items: [
      "Accès /admin réservé",
      "Outils de réconciliation / purge ghost reviews",
      "Analytics visiteurs",
    ],
  },
];

const STORAGE_KEY = "ranki.checklist.v1";

export default function Checklist() {
  const allKeys = useMemo(
    () =>
      SECTIONS.flatMap((s, si) =>
        s.items.map((_, ii) => `${si}-${ii}`)
      ),
    []
  );

  const [checked, setChecked] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setChecked(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(checked));
    } catch {}
  }, [checked]);

  const toggle = (key: string) =>
    setChecked((prev) => ({ ...prev, [key]: !prev[key] }));

  const reset = () => setChecked({});

  const doneCount = allKeys.filter((k) => checked[k]).length;
  const total = allKeys.length;
  const pct = total ? Math.round((doneCount / total) * 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            Checklist de tests Ranki.ai
          </h1>
          <p className="mt-2 text-muted-foreground">
            Coche au fur et à mesure — l'avancement est sauvegardé localement.
          </p>

          <Card className="mt-6 p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-sm font-medium">
                    {doneCount} / {total} terminés
                  </span>
                  <span className="text-sm text-muted-foreground">{pct}%</span>
                </div>
                <Progress value={pct} className="h-2" />
              </div>
              <Button variant="outline" size="sm" onClick={reset}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </div>
          </Card>
        </header>

        <div className="space-y-6">
          {SECTIONS.map((section, si) => {
            const sectionKeys = section.items.map((_, ii) => `${si}-${ii}`);
            const sectionDone = sectionKeys.filter((k) => checked[k]).length;
            return (
              <Card key={si} className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">{section.title}</h2>
                  <span className="text-xs text-muted-foreground">
                    {sectionDone}/{section.items.length}
                  </span>
                </div>
                <ul className="space-y-2">
                  {section.items.map((item, ii) => {
                    const key = `${si}-${ii}`;
                    const isDone = !!checked[key];
                    return (
                      <li key={key}>
                        <button
                          type="button"
                          onClick={() => toggle(key)}
                          className="w-full text-left flex items-start gap-3 rounded-lg p-2 -mx-2 hover:bg-accent/50 transition-colors"
                        >
                          <span
                            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all ${
                              isDone
                                ? "bg-emerald-500 border-emerald-500 text-white"
                                : "border-input bg-background"
                            }`}
                            aria-hidden
                          >
                            <Check
                              className={`h-3.5 w-3.5 transition-opacity ${
                                isDone ? "opacity-100" : "opacity-0"
                              }`}
                              strokeWidth={3}
                            />
                          </span>
                          <span
                            className={`text-sm leading-relaxed ${
                              isDone
                                ? "text-emerald-600 line-through"
                                : "text-foreground"
                            }`}
                          >
                            {item}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
