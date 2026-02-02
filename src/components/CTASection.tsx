import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Sparkles, Zap, Check, ArrowRight, Target } from "lucide-react";
import { useDeviceDetection } from "@/hooks/useDeviceDetection";
import { GooglePlayButton } from "./GooglePlayButton";

const GoogleIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const ChatGPTIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="#10a37f">
    <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z"/>
  </svg>
);

export const CTASection = () => {
  const navigate = useNavigate();
  const { isAndroid } = useDeviceDetection();
  
  return (
    <section className="py-14 sm:py-20 md:py-24 gradient-hero relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-10 -right-10 sm:-top-20 sm:-right-20 w-40 sm:w-60 h-40 sm:h-60 bg-card/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -left-10 sm:-bottom-20 sm:-left-20 w-52 sm:w-80 h-52 sm:h-80 bg-card/5 rounded-full blur-3xl" />
      </div>

      <div className="relative container mx-auto px-5 sm:px-6">
        {/* Card with light background for better readability */}
        <div className="bg-card rounded-2xl border border-border shadow-xl p-6 sm:p-10 max-w-3xl mx-auto">
          <div className="text-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mx-auto mb-4">
              <Target className="w-7 h-7 text-primary" />
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4">
              Prêt à dominer votre marché ?
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base mb-6 max-w-xl mx-auto">
              Rejoignez +500 entreprises qui utilisent Starlinko pour devancer leurs concurrents.
            </p>
            
            {/* Benefits list - Light background with proper contrast */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
              <div className="flex items-center gap-3 p-3 bg-muted rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-card flex items-center justify-center flex-shrink-0 shadow-sm">
                  <ChatGPTIcon className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <p className="text-foreground font-semibold text-sm">ChatGPT</p>
                  <p className="text-muted-foreground text-xs">Visibilité AEO</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-card flex items-center justify-center flex-shrink-0 shadow-sm">
                  <GoogleIcon className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <p className="text-foreground font-semibold text-sm">SEO Google</p>
                  <p className="text-muted-foreground text-xs">Articles auto</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-card flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <div className="text-left">
                  <p className="text-foreground font-semibold text-sm">IA</p>
                  <p className="text-muted-foreground text-xs">Réponses auto</p>
                </div>
              </div>
            </div>
            
            {isAndroid ? (
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <GooglePlayButton variant="badge" size="lg" />
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="gap-2 w-full sm:w-auto" 
                  onClick={() => navigate("/auth")}
                >
                  Essayer en ligne
                </Button>
              </div>
            ) : (
              <Button 
                variant="default" 
                size="xl" 
                className="gap-2 w-full sm:w-auto min-w-[250px]" 
                onClick={() => navigate("/auth")}
              >
                <Zap className="w-5 h-5" />
                Démarrer gratuitement
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            )}
            
            <div className="flex flex-wrap items-center justify-center gap-4 mt-5 text-muted-foreground text-xs">
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-secondary" />
                3 jours gratuits
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-secondary" />
                Sans carte bancaire
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-secondary" />
                Annulation facile
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
