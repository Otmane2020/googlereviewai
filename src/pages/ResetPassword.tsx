import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { StarlinkoLogo } from "@/components/StarlinkoLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Eye, EyeOff, Lock, ArrowLeft, Loader2, CheckCircle } from "lucide-react";

const ResetPassword = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [resetError, setResetError] = useState<{ code?: string; description?: string } | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const decodeHashParam = (value: string | null) => {
      if (!value) return undefined;
      // In hashes, spaces are often encoded as '+'
      return decodeURIComponent(value.replace(/\+/g, " "));
    };

    // Handle explicit error states from the email link
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const errorCode = decodeHashParam(hashParams.get("error_code"));
    const errorDescription = decodeHashParam(hashParams.get("error_description"));

    if (errorCode || errorDescription) {
      setResetError({ code: errorCode, description: errorDescription });
      // Clean the URL hash so refresh doesn't keep the error state
      window.history.replaceState(null, "", window.location.pathname);
    }

    const checkSession = async () => {
      // Check if user has a valid session (came from email link)
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        // User is logged in - they can change their password
        setIsValidSession(true);
      }
      setCheckingSession(false);
    };

    // Listen for auth state changes (when user clicks email link)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        if (session) {
          setIsValidSession(true);
          setCheckingSession(false);
        }
      }
    });

    checkSession();

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password.length < 6) {
      toast({
        title: "Mot de passe trop court",
        description: "Le mot de passe doit contenir au moins 6 characters.",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Mots de passe différents",
        description: "Les deux mots de passe ne correspondent pas.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setIsSuccess(true);
        toast({
          title: "Mot de passe modifié !",
          description: "Vous pouvez maintenant vous connecter.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Une erreur inattendue s'est produite.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isValidSession) {
    const title = resetError?.code === "otp_expired" ? "Lien expiré" : "Lien invalide";
    const description = resetError?.description
      ? resetError.description
      : "Ce lien de réinitialisation n'est plus valide. Demandez un nouveau lien.";

    const resendLink = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!email) return;

      setResendLoading(true);
      try {
        const baseUrl =
          window.location.hostname.includes("lovableproject.com") ||
          window.location.hostname.includes("lovable.app")
            ? "https://starlinko.lovable.app"
            : window.location.origin;

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${baseUrl}/reset-password`,
        });

        if (error) {
          toast({ title: "Error", description: error.message, variant: "destructive" });
        } else {
          toast({
            title: "Email envoyé",
            description: "Ouvrez le dernier email reçu pour réinitialiser votre mot de passe.",
          });
        }
      } finally {
        setResendLoading(false);
      }
    };

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <StarlinkoLogo showBadge={false} className="mx-auto" />
          </div>

          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-foreground">{title}</h1>
            <p className="text-muted-foreground">{description}</p>
          </div>

          <form onSubmit={resendLink} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12"
                required
              />
            </div>

            <Button type="submit" className="w-full h-12" disabled={resendLoading}>
              {resendLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Renvoyer un lien"}
            </Button>

            <Button type="button" variant="outline" className="w-full" onClick={() => navigate("/auth")}
            >
              Retour à la connexion
            </Button>
          </form>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="w-full max-w-md text-center space-y-6">
          <div className="w-16 h-16 mx-auto bg-secondary/20 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-secondary" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">Mot de passe modifié !</h1>
            <p className="text-muted-foreground">
              Votre mot de passe a été réinitialisé avec succès.
            </p>
          </div>
          <Button onClick={() => navigate("/auth")} className="w-full">
            Se connecter
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <StarlinkoLogo showBadge={false} className="mx-auto" />
        </div>

        <div>
          <h2 className="text-2xl font-bold text-foreground text-center">
            Nouveau mot de passe
          </h2>
          <p className="text-muted-foreground mt-2 text-center">
            Choisissez un nouveau mot de passe sécurisé
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="password">Nouveau mot de passe</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10 h-12"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Minimum 6 characters
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pl-10 h-12"
                required
              />
            </div>
          </div>

          <Button type="submit" className="w-full h-12 text-base" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              "Réinitialiser le mot de passe"
            )}
          </Button>

          <Link
            to="/auth"
            className="flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à la connexion
          </Link>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
