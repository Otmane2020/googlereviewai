import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Helmet } from "react-helmet";

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Conditions Générales d'Utilisation | Ranki.ai</title>
        <meta 
          name="description" 
          content="Consultez les conditions générales d'utilisation de Ranki.ai. Règles d'abonnement, facturation, propriété intellectuelle et responsabilités." 
        />
        <meta name="keywords" content="CGU, conditions générales, termes service, abonnement, Ranki.ai" />
        <link rel="canonical" href="https://ranki.ai/terms" />
        
        <meta property="og:title" content="CGU - Conditions Générales | Ranki.ai" />
        <meta property="og:description" content="Conditions d'utilisation de la plateforme Ranki.ai." />
        <meta property="og:url" content="https://ranki.ai/terms" />
        <meta property="og:type" content="website" />
      </Helmet>
      <div className="container max-w-4xl mx-auto px-4 py-12">
        <Link to="/">
          <Button variant="ghost" className="mb-8">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
        </Link>

        <div className="prose prose-gray dark:prose-invert max-w-none">
          <h1 className="text-3xl font-bold text-foreground mb-2">Conditions Générales d'Utilisation</h1>
          <p className="text-muted-foreground mb-8">Dernière mise à jour : 1er janvier 2024</p>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-foreground mb-4">Acceptation des conditions</h2>
            <p className="text-muted-foreground">
              En accédant ou en utilisant le service Ranki.ai, développé et exploité par la société Ranki.ai, 
              vous acceptez sans réserve les présentes Conditions Générales d'Utilisation (CGU). 
              Si vous n'acceptez pas ces conditions, vous ne devez pas utiliser la plateforme.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-foreground mb-4">1. Objet du service</h2>
            <p className="text-muted-foreground mb-4">
              Ranki.ai est une application SaaS qui permet aux entreprises de connecter leurs comptes 
              Google Business Profile afin de :
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Synchroniser et gérer automatiquement leurs fiches et avis</li>
              <li>Analyser les performances locales et statistiques</li>
              <li>Generate des réponses et rapports automatisés</li>
              <li>Centraliser la gestion multi-établissements</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-foreground mb-4">2. Création de compte</h2>
            
            <h3 className="text-lg font-medium text-foreground mb-3">2.1 Conditions d'inscription</h3>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
              <li>L'utilisateur doit être majeur ou représenter une personne morale.</li>
              <li>Un compte Google valide est requis pour l'authentification OAuth.</li>
              <li>Les informations transmises doivent être exactes et à jour.</li>
            </ul>

            <h3 className="text-lg font-medium text-foreground mb-3">2.2 Responsabilité de l'utilisateur</h3>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>L'utilisateur est responsable de la sécurité de son compte Google.</li>
              <li>Toute activité réalisée via le compte est réputée effectuée par l'utilisateur concerné.</li>
              <li>En cas d'usage non autorisé, l'utilisateur doit immédiatement contacter le support.</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-foreground mb-4">3. Utilisation acceptable</h2>
            <h3 className="text-lg font-medium text-foreground mb-3">Utilisations interdites</h3>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Generation of fake reviews or manipulation of Google ratings.</li>
              <li>Usage du service à des fins illégales, frauduleuses ou diffamatoires.</li>
              <li>Partage d'accès non autorisé ou revente du service.</li>
              <li>Tentative de contournement des restrictions de sécurité.</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-foreground mb-4">4. Abonnement et facturation</h2>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Le service est proposé sous forme d'abonnement mensuel ou annuel.</li>
              <li>Paiement via Stripe, conforme aux normes PCI-DSS.</li>
              <li>Annulation possible à tout moment depuis l'espace utilisateur.</li>
              <li>En cas de résiliation, le compte reste actif jusqu'à la fin de la période déjà réglée.</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-foreground mb-4">5. Propriété intellectuelle</h2>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Ranki.ai et son contenu sont la propriété exclusive de Ranki.ai.</li>
              <li>Les utilisateurs conservent la propriété de leurs données et établissements.</li>
              <li>Toute reproduction, copie ou diffusion non autorisée du logiciel est interdite.</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-foreground mb-4">6. Limitation de responsabilité</h2>
            <p className="text-muted-foreground">
              Le service est fourni "tel quel". Ranki.ai ne saurait être tenue responsable de tout dommage indirect, 
              perte de données ou interruption due à des causes externes (pannes réseau, API Google, etc.).
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-foreground mb-4">7. Résiliation</h2>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>L'utilisateur peut supprimer son compte à tout moment via l'interface Ranki.ai.</li>
              <li>Ranki.ai peut suspendre un compte en cas de fraude, non-paiement ou violation des présentes conditions.</li>
              <li>Les données seront supprimées dans un délai maximum de 30 jours après résiliation.</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-foreground mb-4">8. Modifications et droit applicable</h2>
            <p className="text-muted-foreground">
              Ranki.ai se réserve le droit de modifier les présentes CGU à tout moment. 
              Les utilisateurs seront informés par e-mail avant leur entrée en vigueur. 
              Le présent contrat est régi par le droit français. En cas de litige, 
              les tribunaux compétents seront ceux du ressort de Paris, France.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-foreground mb-4">Contact</h2>
            <ul className="list-none text-muted-foreground space-y-2">
              <li><strong>Support :</strong> support@ranki.ai</li>
              <li><strong>Questions légales :</strong> legal@ranki.ai</li>
            </ul>
          </section>

          <footer className="border-t border-border pt-6 mt-10">
            <p className="text-sm text-muted-foreground">
              <strong>Éditeur :</strong> Ranki.ai PRO – 280 Boulevard de la Boissière, 93100 Montreuil, France
            </p>
            <p className="text-sm text-muted-foreground">
              SIRET : 897 801 775 00015 – contact@ranki.ai
            </p>
            <p className="text-sm text-muted-foreground mt-4">
              © 2025 Ranki.ai – Tous droits réservés.
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
