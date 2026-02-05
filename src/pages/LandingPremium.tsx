 import { useState } from "react";
 import { useNavigate } from "react-router-dom";
 import { Button } from "@/components/ui/button";
 import { 
   Star, 
   Zap, 
   Check, 
   TrendingUp, 
   MessageSquare, 
   FileText, 
   Bot,
   Rocket,
   Gift,
   Shield,
   Lock,
   ArrowRight,
   Sparkles,
   Target,
   BarChart3,
   Globe,
   Users,
   Loader2
 } from "lucide-react";
 import { StarlinkoLogo } from "@/components/StarlinkoLogo";
 import { useAuth } from "@/contexts/AuthContext";
 import { supabase } from "@/integrations/supabase/client";
 import { toast } from "@/hooks/use-toast";
 
 const ChatGPTIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
   <svg className={className} viewBox="0 0 24 24" fill="currentColor">
     <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z"/>
   </svg>
 );
 
 const GoogleIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
   <svg className={className} viewBox="0 0 24 24">
     <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
     <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
     <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
     <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
   </svg>
 );
 
 const LandingPremium = () => {
   const navigate = useNavigate();
   const { user, loading: authLoading } = useAuth();
   const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("yearly");
   const [isLoading, setIsLoading] = useState(false);
 
   const handleSubscribe = async () => {
     if (!user) {
       navigate("/auth?redirect=/landing");
       return;
     }
 
     setIsLoading(true);
     try {
       const priceKey = billingCycle === "yearly" ? "allinone_yearly" : "allinone_monthly";
       
       const { data, error } = await supabase.functions.invoke("create-checkout", {
         body: {
           priceKey,
           successUrl: `${window.location.origin}/dashboard?success=true`,
           cancelUrl: `${window.location.origin}/landing?canceled=true`,
         },
       });
 
       if (error) throw error;
 
       if (data?.url) {
         window.location.href = data.url;
       }
     } catch (error: unknown) {
       const message = error instanceof Error ? error.message : "Erreur lors du paiement";
       toast({
         title: "Erreur",
         description: message,
         variant: "destructive",
       });
     } finally {
       setIsLoading(false);
     }
   };
 
   const features = [
     { icon: GoogleIcon, label: "SEO Google", desc: "Visibilité locale optimisée" },
     { icon: ChatGPTIcon, label: "AEO ChatGPT", desc: "Recommandé par l'IA" },
     { icon: MessageSquare, label: "Avis Google", desc: "Réponses automatiques IA" },
     { icon: FileText, label: "Publications IA", desc: "Contenus optimisés auto" },
     { icon: BarChart3, label: "Dashboard", desc: "Statistiques complètes" },
     { icon: Target, label: "Réputation", desc: "Score & recommandations" },
   ];
 
   const benefits = [
     { icon: TrendingUp, text: "Jusqu'à +30% de CA potentiel" },
     { icon: Rocket, text: "Effet cumulatif en 60 jours" },
     { icon: Globe, text: "Visible sur Google & ChatGPT" },
     { icon: Users, text: "+2000 entreprises équipées" },
   ];
 
   return (
     <div className="min-h-screen bg-background">
       {/* Header */}
       <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
         <div className="container mx-auto px-5 py-4 flex items-center justify-between">
           <StarlinkoLogo className="h-8" />
           <Button 
             variant="outline" 
             size="sm"
             onClick={() => navigate("/auth")}
           >
             Connexion
           </Button>
         </div>
       </header>
 
       {/* Hero Section */}
       <section className="relative pt-24 pb-16 sm:pt-32 sm:pb-24 overflow-hidden gradient-hero">
         <div className="absolute inset-0 overflow-hidden">
           <div className="absolute -top-40 -right-40 w-80 h-80 bg-card/5 rounded-full blur-3xl" />
           <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-card/5 rounded-full blur-3xl" />
         </div>
 
         <div className="relative container mx-auto px-5 text-center">
           {/* Badge */}
           <div className="inline-flex items-center gap-2 px-4 py-2 bg-card/10 backdrop-blur-sm rounded-full border border-card/20 mb-6">
             <Star className="w-4 h-4 text-accent fill-accent" />
             <span className="text-card text-sm font-medium">One Pack · One Price</span>
           </div>
 
           {/* Headline */}
           <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-card leading-tight mb-4">
             Boostez votre visibilité sur
             <span className="block text-accent-gold mt-2">Google & ChatGPT</span>
           </h1>
 
           {/* Subheadline */}
           <p className="text-lg sm:text-xl text-card/85 max-w-2xl mx-auto mb-6 leading-relaxed">
             Passez devant vos concurrents en <strong>60 jours</strong>, sans effort technique.
           </p>
 
           {/* Value proposition badges */}
           <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
             <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-secondary/20 text-card rounded-full text-sm font-medium">
               <TrendingUp className="w-4 h-4" />
               Jusqu'à +30% de CA
             </span>
             <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-card/10 text-card rounded-full text-sm font-medium">
               <Check className="w-4 h-4 text-secondary" />
               AEO + SEO inclus
             </span>
           </div>
 
           {/* CTA */}
           <Button 
             variant="hero" 
             size="xl" 
             className="gap-2 shadow-2xl"
             onClick={() => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })}
           >
             <Zap className="w-5 h-5" />
             Activer ma visibilité maintenant
             <ArrowRight className="w-4 h-4" />
           </Button>
 
           {/* Trust */}
           <div className="flex flex-wrap items-center justify-center gap-4 mt-6 text-card/70 text-sm">
             <span className="flex items-center gap-1.5">
               <Check className="w-4 h-4 text-secondary" />
               Sans engagement
             </span>
             <span className="flex items-center gap-1.5">
               <Check className="w-4 h-4 text-secondary" />
               Annulation facile
             </span>
             <span className="flex items-center gap-1.5">
               <Check className="w-4 h-4 text-secondary" />
               Accès immédiat
             </span>
           </div>
         </div>
 
         {/* Wave */}
         <div className="absolute bottom-0 left-0 right-0">
           <svg viewBox="0 0 1440 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
             <path
               d="M0 100L60 92C120 84 240 68 360 60C480 52 600 52 720 56C840 60 960 68 1080 72C1200 76 1320 76 1380 76L1440 76V100H1380C1320 100 1200 100 1080 100C960 100 840 100 720 100C600 100 480 100 360 100C240 100 120 100 60 100H0Z"
               fill="hsl(var(--background))"
             />
           </svg>
         </div>
       </section>
 
       {/* Why Starlinko */}
       <section className="py-16 sm:py-24 bg-background">
         <div className="container mx-auto px-5">
           <div className="text-center mb-12">
             <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full mb-4">
               <Rocket className="w-4 h-4 text-primary" />
               <span className="text-primary text-sm font-semibold">Pourquoi ça fonctionne</span>
             </div>
             <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4">
               Starlinko automatise ce que vos concurrents font encore à la main
             </h2>
           </div>
 
           <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
             {benefits.map((benefit, i) => (
               <div key={i} className="flex items-start gap-4 p-5 bg-card rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow">
                 <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                   <benefit.icon className="w-6 h-6 text-primary" />
                 </div>
                 <p className="text-foreground font-medium leading-snug pt-2">{benefit.text}</p>
               </div>
             ))}
           </div>
         </div>
       </section>
 
       {/* Features - L'Offre Unique */}
       <section className="py-16 sm:py-24 bg-muted/50">
         <div className="container mx-auto px-5">
           <div className="text-center mb-12">
             <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-secondary/10 rounded-full mb-4">
               <Sparkles className="w-4 h-4 text-secondary" />
               <span className="text-secondary text-sm font-semibold">L'offre unique Starlinko</span>
             </div>
             <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4">
               Tous les leviers activés
             </h2>
             <p className="text-muted-foreground text-lg max-w-xl mx-auto">
               Un seul pack. Un seul prix. <span className="text-foreground font-semibold">Aucune option. Aucun add-on.</span>
             </p>
           </div>
 
           <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-4xl mx-auto">
             {features.map((feature, i) => (
               <div 
                 key={i} 
                 className="flex items-center gap-4 p-5 bg-card rounded-2xl border border-border shadow-sm hover:border-primary/30 transition-colors"
               >
                 <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center flex-shrink-0">
                   <feature.icon className="w-6 h-6 text-primary" />
                 </div>
                 <div>
                   <p className="text-foreground font-semibold">{feature.label}</p>
                   <p className="text-muted-foreground text-sm">{feature.desc}</p>
                 </div>
               </div>
             ))}
           </div>
 
           {/* Included badge */}
           <div className="mt-10 text-center">
             <div className="inline-flex items-center gap-3 px-6 py-3 bg-card rounded-full border border-border shadow-sm">
               <Bot className="w-5 h-5 text-primary" />
               <span className="text-foreground font-medium">SEO + AEO inclus automatiquement</span>
               <span className="px-2 py-0.5 bg-secondary/20 text-secondary text-xs font-semibold rounded-full">Pas d'option cachée</span>
             </div>
           </div>
         </div>
       </section>
 
       {/* Pricing Section */}
       <section id="pricing" className="py-16 sm:py-24 bg-background">
         <div className="container mx-auto px-5">
           <div className="text-center mb-10">
             <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-accent/10 rounded-full mb-4">
               <Gift className="w-4 h-4 text-accent" />
               <span className="text-accent-foreground text-sm font-semibold">Tarif simplifié</span>
             </div>
             <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4">
               Un seul prix, tout inclus
             </h2>
           </div>
 
           {/* Billing Toggle */}
           <div className="flex justify-center mb-8">
             <div className="inline-flex items-center gap-2 p-1.5 bg-muted rounded-full">
               <button
                 onClick={() => setBillingCycle("monthly")}
                 className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                   billingCycle === "monthly"
                     ? "bg-primary text-primary-foreground shadow-sm"
                     : "text-muted-foreground hover:text-foreground"
                 }`}
               >
                 Mensuel
               </button>
               <button
                 onClick={() => setBillingCycle("yearly")}
                 className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                   billingCycle === "yearly"
                     ? "bg-primary text-primary-foreground shadow-sm"
                     : "text-muted-foreground hover:text-foreground"
                 }`}
               >
                 Annuel
                 <span className="px-2 py-0.5 bg-secondary text-secondary-foreground text-xs rounded-full font-semibold">
                   2 mois offerts
                 </span>
               </button>
             </div>
           </div>
 
           {/* Pricing Card */}
           <div className="max-w-md mx-auto">
             <div className="relative bg-card rounded-3xl border-2 border-primary shadow-xl p-8">
               {/* Badge */}
               <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                 <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-primary text-primary-foreground text-sm font-bold rounded-full shadow-lg">
                   <Zap className="w-4 h-4" />
                   All-in-One Visibility
                 </span>
               </div>
 
               {/* Plan name */}
               <div className="text-center pt-4 mb-6">
                 <h3 className="text-xl font-bold text-foreground mb-2">Starlinko Pack Complet</h3>
                 <p className="text-muted-foreground text-sm">SEO + AEO + Avis + Publications IA</p>
               </div>
 
               {/* Price */}
               <div className="text-center mb-6">
                 {billingCycle === "yearly" ? (
                   <>
                     <div className="flex items-baseline justify-center gap-1">
                       <span className="text-5xl font-bold text-foreground">32,50€</span>
                       <span className="text-muted-foreground">/mois</span>
                     </div>
                     <p className="text-sm text-muted-foreground mt-2">
                       Facturé <span className="font-semibold text-foreground">390€/an</span> (10 mois payés, 12 actifs)
                     </p>
                     <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 bg-secondary/10 rounded-full">
                       <Gift className="w-4 h-4 text-secondary" />
                       <span className="text-secondary text-sm font-semibold">2 mois offerts = 78€ économisés</span>
                     </div>
                   </>
                 ) : (
                   <>
                     <div className="flex items-baseline justify-center gap-1">
                       <span className="text-5xl font-bold text-foreground">39€</span>
                       <span className="text-muted-foreground">/mois</span>
                     </div>
                     <p className="text-sm text-muted-foreground mt-2">
                       Sans engagement – Annulation à tout moment
                     </p>
                   </>
                 )}
               </div>
 
               {/* Features list */}
               <ul className="space-y-3 mb-8">
                 {[
                   "Accès complet à toutes les fonctionnalités",
                   "SEO Google optimisé (visibilité locale)",
                   "AEO – Visible sur ChatGPT & IA",
                   "Réponses automatiques aux avis Google",
                   "Publications & contenus IA",
                   "Tableau de bord tout-en-un",
                   "Mises à jour incluses",
                 ].map((feature, i) => (
                   <li key={i} className="flex items-center gap-3">
                     <div className="w-5 h-5 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0">
                       <Check className="w-3 h-3 text-secondary" />
                     </div>
                     <span className="text-foreground text-sm">{feature}</span>
                   </li>
                 ))}
               </ul>
 
               {/* CTA */}
               <Button 
                 size="xl" 
                 className="w-full gap-2 h-14 text-base rounded-xl shadow-lg"
                 onClick={handleSubscribe}
                 disabled={isLoading || authLoading}
               >
                 {isLoading ? (
                   <Loader2 className="w-5 h-5 animate-spin" />
                 ) : (
                   <>
                     <Zap className="w-5 h-5" />
                     Activer ma visibilité maintenant
                   </>
                 )}
               </Button>
 
               {/* Trust indicators */}
               <div className="flex flex-wrap items-center justify-center gap-4 mt-5 text-muted-foreground text-xs">
                 <span className="flex items-center gap-1.5">
                   <Shield className="w-3.5 h-3.5 text-secondary" />
                   Paiement sécurisé Stripe
                 </span>
                 <span className="flex items-center gap-1.5">
                   <Lock className="w-3.5 h-3.5 text-secondary" />
                   Données protégées
                 </span>
               </div>
             </div>
           </div>
 
           {/* Bottom CTA text */}
           <p className="text-center text-muted-foreground text-sm mt-8 max-w-md mx-auto">
             Commencez à être recommandé par <span className="font-semibold text-foreground">ChatGPT</span> et visible sur <span className="font-semibold text-foreground">Google</span> dès aujourd'hui.
           </p>
         </div>
       </section>
 
       {/* SEO & AEO Section */}
       <section className="py-16 sm:py-24 bg-muted/50">
         <div className="container mx-auto px-5">
           <div className="max-w-3xl mx-auto text-center">
             <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full mb-4">
               <Bot className="w-4 h-4 text-primary" />
               <span className="text-primary text-sm font-semibold">SEO + AEO = Visibilité maximale</span>
             </div>
             <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-6">
               Starlinko ne fait pas que du SEO classique
             </h2>
             <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
               Il vous rend <span className="text-foreground font-semibold">visible ET recommandé</span> sur Google, dans ChatGPT, et dans les moteurs IA nouvelle génération.
             </p>
 
             <div className="grid sm:grid-cols-2 gap-6">
               <div className="p-6 bg-card rounded-2xl border border-border text-left">
                 <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4">
                   <GoogleIcon className="w-6 h-6" />
                 </div>
                 <h3 className="text-lg font-bold text-foreground mb-2">SEO Google</h3>
                 <p className="text-muted-foreground text-sm">
                   Optimisation locale, réputation, avis, publications – tout pour être visible sur Google Maps et la recherche locale.
                 </p>
               </div>
               <div className="p-6 bg-card rounded-2xl border border-border text-left">
                 <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary/20 to-secondary/5 flex items-center justify-center mb-4">
                   <ChatGPTIcon className="w-6 h-6 text-secondary" />
                 </div>
                 <h3 className="text-lg font-bold text-foreground mb-2">AEO – IA & ChatGPT</h3>
                 <p className="text-muted-foreground text-sm">
                   Contenus structurés pour être recommandé par ChatGPT, Google AI, Gemini et les assistants IA de nouvelle génération.
                 </p>
               </div>
             </div>
 
             <div className="mt-8">
               <span className="inline-flex items-center gap-2 px-4 py-2 bg-secondary/10 text-secondary rounded-full text-sm font-semibold">
                 <Check className="w-4 h-4" />
                 Inclus automatiquement dans votre abonnement
               </span>
             </div>
           </div>
         </div>
       </section>
 
       {/* Final CTA */}
       <section className="py-16 sm:py-24 gradient-hero">
         <div className="container mx-auto px-5 text-center">
           <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-card mb-4">
             Prêt à passer devant vos concurrents ?
           </h2>
           <p className="text-card/80 text-lg mb-8 max-w-xl mx-auto">
             Rejoignez +2000 entreprises qui utilisent Starlinko pour leur visibilité en ligne.
           </p>
           <Button 
             variant="hero" 
             size="xl" 
             className="gap-2 shadow-2xl"
             onClick={() => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })}
           >
             <Zap className="w-5 h-5" />
             Commencer maintenant
             <ArrowRight className="w-4 h-4" />
           </Button>
         </div>
       </section>
 
       {/* Footer */}
       <footer className="py-8 border-t border-border bg-background">
         <div className="container mx-auto px-5 text-center">
           <StarlinkoLogo className="h-6 mx-auto mb-4 opacity-70" />
           <p className="text-muted-foreground text-sm">
             © 2025 Starlinko. Tous droits réservés.
           </p>
         </div>
       </footer>
 
       {/* Sticky TrustAvis Badge */}
       <div className="fixed bottom-4 right-4 z-50">
         <a
           href="https://trust-avis.com/entreprise/starlinko"
           target="_blank"
           rel="noopener noreferrer"
           className="inline-flex items-center gap-1.5 bg-card/95 backdrop-blur-sm border border-border rounded-full px-3 py-1.5 shadow-lg text-sm hover:shadow-xl transition-all"
         >
           <div className="w-4 h-4 bg-[#3B82F6] rounded flex items-center justify-center">
             <Star className="w-2.5 h-2.5 text-white fill-white" />
           </div>
           <span className="font-medium">
             <span className="text-foreground">Trust</span>
             <span className="text-[#3B82F6]">Avis</span>
           </span>
           <span className="text-muted-foreground">4.8</span>
         </a>
       </div>
     </div>
   );
 };
 
 export default LandingPremium;