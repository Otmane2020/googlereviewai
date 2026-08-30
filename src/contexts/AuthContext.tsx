import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import i18n, { getExplicitLanguage, getPreferredLocalLanguage, normalizeLanguage, persistLanguage, preserveLanguageForOAuth } from "@/i18n/config";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const languageSyncedForUser = useRef<string | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Sync language once per user. The latest explicit local choice always wins.
        if (session?.user && languageSyncedForUser.current !== session.user.id) {
          languageSyncedForUser.current = session.user.id;
          setTimeout(async () => {
            try {
              const { data } = await supabase
                .from("profiles")
                .select("preferred_language, welcome_email_sent, email, full_name")
                .eq("id", session.user.id)
                .maybeSingle();
              const profile = data as any;
              const explicitLanguage = getExplicitLanguage();
              const profileLanguage = normalizeLanguage(profile?.preferred_language);
              const lang = explicitLanguage || profileLanguage || getPreferredLocalLanguage();

              persistLanguage(lang);
              if (normalizeLanguage(i18n.resolvedLanguage || i18n.language) !== lang) {
                await i18n.changeLanguage(lang);
              }
              if (profileLanguage !== lang) {
                await supabase.from("profiles").update({ preferred_language: lang }).eq("id", session.user.id);
              }

              if (profile && !profile.welcome_email_sent && profile.email) {
                try {
                  await supabase.functions.invoke("send-transactional-email", {
                    body: {
                      templateName: "welcome",
                      recipientEmail: profile.email,
                      idempotencyKey: `welcome-${session.user.id}`,
                      templateData: { name: profile.full_name || "", lang },
                    },
                  });
                  await supabase.from("profiles").update({ welcome_email_sent: true }).eq("id", session.user.id);
                } catch (e) {
                  console.warn("[AuthContext] welcome email failed", e);
                }
              }
            } catch (_) { /* silent */ }
          }, 0);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/`;
    const lang = normalizeLanguage(i18n.resolvedLanguage || i18n.language) || getPreferredLocalLanguage();

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
          preferred_language: lang,
        },
      },
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signInWithGoogle = async () => {
    preserveLanguageForOAuth();
    // Preserve current query params (e.g. ?redirect=checkout&priceKey=...) across the OAuth round-trip
    const search = window.location.pathname === "/auth" ? window.location.search : "";
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth${search}`,
        scopes: "https://www.googleapis.com/auth/business.manage https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile",
        queryParams: {
          access_type: "offline",
          prompt: "consent", // Force consent to get refresh_token
        },
      },
    });
    return { error };
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("SignOut error:", error);
    }
    // Force clear local state even if API call fails
    setSession(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
