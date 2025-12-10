import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto px-4 py-12">
        <Link to="/">
          <Button variant="ghost" className="mb-8">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
        </Link>

        <div className="prose prose-gray dark:prose-invert max-w-none">
          <h1 className="text-3xl font-bold text-foreground mb-2">Politique de Confidentialité</h1>
          <p className="text-muted-foreground mb-8">Dernière mise à jour : 1er janvier 2024</p>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-foreground mb-4">Résumé de notre engagement</h2>
            <p className="text-muted-foreground">
              Chez Starlinko, nous nous engageons à protéger votre vie privée et vos données personnelles. 
              Cette politique décrit comment vos informations sont collectées, utilisées et protégées 
              lorsque vous utilisez notre plateforme SaaS Starlinko.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-foreground mb-4">1. Informations collectées</h2>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Nom complet, adresse e-mail et identifiant Google (via OAuth 2.0)</li>
              <li>Photo de profil Google (si disponible)</li>
              <li>Données issues de Google Business Profile (établissements, avis, statistiques)</li>
              <li>Données d'utilisation et journaux de connexion</li>
              <li>Informations de facturation et d'abonnement (via Stripe)</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-foreground mb-4">2. Utilisation de vos données</h2>
            <h3 className="text-lg font-medium text-foreground mb-3">Finalités du traitement</h3>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Connexion sécurisée via Google OAuth</li>
              <li>Accès et gestion de vos fiches Google Business Profile</li>
              <li>Génération automatique de réponses et rapports</li>
              <li>Facturation et gestion des abonnements</li>
              <li>Amélioration continue du service</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-foreground mb-4">3. Partage et hébergement des données</h2>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li><strong>Google :</strong> pour l'authentification et l'accès aux données Google Business Profile.</li>
              <li><strong>Supabase :</strong> pour le stockage sécurisé et l'hébergement des données.</li>
              <li><strong>Stripe :</strong> pour la gestion des paiements et abonnements.</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              <strong>Engagement :</strong> Starlinko ne vend, ne loue et ne partage jamais vos données 
              personnelles à des tiers à des fins commerciales.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-foreground mb-4">4. Sécurité</h2>
            <h3 className="text-lg font-medium text-foreground mb-3">Mesures de protection</h3>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Chiffrement TLS 1.3 et stockage AES-256</li>
              <li>Authentification OAuth 2.0 sans mot de passe local</li>
              <li>Accès restreint selon le principe du moindre privilège</li>
              <li>Surveillance et sauvegardes automatiques</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-foreground mb-4">5. Vos droits (RGPD)</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-foreground">Droit d'accès</h3>
                <p className="text-muted-foreground">Vous pouvez demander l'accès à l'ensemble de vos données personnelles.</p>
              </div>
              <div>
                <h3 className="text-lg font-medium text-foreground">Droit de rectification</h3>
                <p className="text-muted-foreground">Vous pouvez corriger ou mettre à jour vos informations à tout moment.</p>
              </div>
              <div>
                <h3 className="text-lg font-medium text-foreground">Droit à l'effacement</h3>
                <p className="text-muted-foreground">Vous pouvez demander la suppression définitive de vos données.</p>
              </div>
              <div>
                <h3 className="text-lg font-medium text-foreground">Droit à la portabilité</h3>
                <p className="text-muted-foreground">Vous pouvez obtenir une copie de vos données dans un format structuré.</p>
              </div>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-foreground mb-4">6. Contact et réclamations</h2>
            <p className="text-muted-foreground mb-4">Pour toute question ou demande relative à vos données :</p>
            <ul className="list-none text-muted-foreground space-y-2">
              <li><strong>Email :</strong> privacy@starlinko.com</li>
              <li><strong>Délégué à la protection des données :</strong> dpo@starlinko.com</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              <strong>Droit de réclamation :</strong> Vous pouvez déposer une réclamation auprès de la CNIL 
              (Commission Nationale de l'Informatique et des Libertés) si vous estimez que vos droits ne sont pas respectés.
            </p>
          </section>

          <footer className="border-t border-border pt-6 mt-10">
            <p className="text-sm text-muted-foreground">
              <strong>Éditeur :</strong> Starlinko – 280 Boulevard de la Boissière, 93100 Montreuil, France
            </p>
            <p className="text-sm text-muted-foreground">
              SIRET : 897 801 775 00015 – contact@starlinko.com
            </p>
            <p className="text-sm text-muted-foreground mt-4">
              © 2025 Starlinko – Tous droits réservés.
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
