import { useState, useEffect } from "react";
import { useNavigate } from "@/lib/router-compat";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Send, Megaphone, Gift, Calendar, Clock, Check, AlertCircle, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr, enUS } from "date-fns/locale";

interface Business {
  id: string;
  name: string;
  google_place_id: string | null;
  profile_image_url: string | null;
  website: string | null;
}

interface GmbPost {
  id: string;
  summary: string;
  topic_type: string;
  status: string;
  posted_at: string | null;
  created_at: string;
  cta_type: string | null;
  cta_url: string | null;
  media_url: string | null;
}

export default function GmbPost() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isEN = !i18n.language?.toLowerCase().startsWith("fr");
  const t = (fr: string, en: string) => (isEN ? en : fr);

  const POST_TYPES = [
    { value: "STANDARD", label: t("Actualité", "News"), icon: Megaphone, description: t("Partager une nouveauté", "Share an update") },
    { value: "OFFER", label: t("Offre", "Offer"), icon: Gift, description: t("Promotion spéciale", "Special promotion") },
    { value: "EVENT", label: t("Événement", "Event"), icon: Calendar, description: t("Annoncer un événement", "Announce an event") },
  ];

  const CTA_TYPES = [
    { value: "NONE", label: t("Aucun", "None") },
    { value: "LEARN_MORE", label: t("En savoir plus", "Learn more") },
    { value: "BOOK", label: t("Réserver", "Book") },
    { value: "ORDER", label: t("Commander", "Order") },
    { value: "SHOP", label: t("Acheter", "Shop") },
    { value: "SIGN_UP", label: t("S'inscrire", "Sign up") },
    { value: "CALL", label: t("Appeler", "Call") },
  ];

  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>("");
  const [postType, setPostType] = useState("STANDARD");
  const [content, setContent] = useState("");
  const [ctaType, setCtaType] = useState("LEARN_MORE");
  const [ctaUrl, setCtaUrl] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  // Champs spécifiques EVENT / OFFER
  const [eventTitle, setEventTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [terms, setTerms] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [recentPosts, setRecentPosts] = useState<GmbPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchBusinesses();
    fetchRecentPosts();
  }, [user]);

  useEffect(() => {
    if (selectedBusinessId) {
      fetchRecentPosts();
    }
  }, [selectedBusinessId]);

  const fetchBusinesses = async () => {
    const { data, error } = await supabase
      .from("businesses")
      .select("id, name, google_place_id, profile_image_url, website")
      .eq("is_active", true)
      .order("name");

    if (!error && data) {
      setBusinesses(data);
      if (data.length > 0) {
        setSelectedBusinessId(data[0].id);
      }
    }
    setIsLoading(false);
  };

  useEffect(() => {
    const business = businesses.find(b => b.id === selectedBusinessId);
    setCtaUrl(business?.website?.startsWith("http") ? business.website : business?.website ? "https://" + business.website : "");
    setMediaUrl("");
  }, [selectedBusinessId, businesses]);

  const imageErrorMessage = (message: string) => {
    if (/OPENROUTER_API_KEY|not configured|missing API key/i.test(message))
      return t("La génération d'images n'est pas configurée. Contactez le support.", "Image generation is not configured. Contact support.");
    if (/\b(401|403)\b|authentication|invalid api key|unauthorized/i.test(message))
      return t("L'authentification du fournisseur d'images a échoué.", "Image provider authentication failed.");
    if (/\b429\b|rate.limit|quota|daily image limit|insufficient credits/i.test(message))
      return t("Limite du service d'images atteinte. Réessayez plus tard.", "Image service limit reached. Please try again later.");
    if (/storage|bucket|upload|save generated/i.test(message))
      return t("L'image n'a pas pu être enregistrée. Réessayez plus tard.", "The image could not be saved. Please try again later.");
    if (/timeout|abort|network|failed to fetch/i.test(message))
      return t("Délai de génération dépassé. Réessayez.", "Image generation timed out. Please retry.");
    return t("Service de génération d'images temporairement indisponible. Vous pouvez publier sans image.", "Image generation is temporarily unavailable. You can still publish without an image.");
  };

  const handleGenerateImage = async () => {
    if (isGeneratingImage) return;
    if (!selectedBusinessId || !content.trim()) {
      toast.error(t("Saisissez le texte avant de générer une photo.", "Write the post text before generating a photo."));
      return;
    }
    setIsGeneratingImage(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-gmb-image", {
        body: { business_id: selectedBusinessId, summary: content.trim() },
      });
      if (error) {
        // FunctionsHttpError only exposes a generic non-2xx message unless
        // we read the JSON error returned by generate-gmb-image.
        let backendError: string | undefined;
        try {
          backendError = (await (error as { context?: Response }).context?.clone?.().json?.())?.error;
        } catch { /* Network errors may not contain JSON. */ }
        throw new Error(backendError || error.message || t("Service d'image indisponible.", "Image service unavailable."));
      }
      if (!data?.success || !data?.image_url) {
        throw new Error(data?.error || t("Aucune image générée. Réessayez.", "No image generated. Please retry."));
      }
      setMediaUrl(data.image_url);
      toast.success(t("Image IA générée !", "AI photo generated!"));
    } catch (error) {
      const details = error instanceof Error ? error.message : String(error);
      console.error("[generate-gmb-image] Image generation failed:", details);
      toast.error(t("Génération impossible", "Image generation failed"), {
        description: imageErrorMessage(details),
      });
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const fetchRecentPosts = async () => {
    if (!selectedBusinessId) return;
    
    const { data, error } = await supabase
      .from("gmb_posts")
      .select("*")
      .eq("business_id", selectedBusinessId)
      .order("created_at", { ascending: false })
      .limit(10);

    if (!error && data) {
      setRecentPosts(data);
    }
  };

  const handlePublish = async () => {
    if (!content.trim()) {
      toast.error(t("Veuillez saisir du contenu", "Please enter content"));
      return;
    }

    if (!selectedBusinessId) {
      toast.error(t("Veuillez sélectionner un établissement", "Please select a business"));
      return;
    }

    const selectedBusiness = businesses.find(b => b.id === selectedBusinessId);
    if (!selectedBusiness?.google_place_id) {
      toast.error(t("Cet établissement n'est pas connecté à Google", "This business is not connected to Google"));
      return;
    }

    // Standard text-only posts need no website or call-to-action.
    if (postType === "OFFER" && !ctaUrl.trim() && !selectedBusiness.website) {
      toast.error(t("Une URL est nécessaire pour une offre.", "An HTTPS website is required for an offer."));
      return;
    }

    // Validations spécifiques
    if (postType === "EVENT" || postType === "OFFER") {
      if (!eventTitle.trim()) {
        toast.error(postType === "EVENT" ? t("Titre de l'événement requis", "Event title required") : t("Titre de l'offre requis", "Offer title required"));
        return;
      }
      if (!startDate || !endDate) {
        toast.error(t("Dates de début et de fin requises", "Start and end dates required"));
        return;
      }
      if (new Date(endDate) < new Date(startDate)) {
        toast.error(t("La date de fin doit être après la date de début", "End date must be after start date"));
        return;
      }
    }

    setIsPublishing(true);

    try {
      const { data, error } = await supabase.functions.invoke("publish-gmb-post", {
        body: {
          business_id: selectedBusinessId,
          summary: content,
          topic_type: postType,
          cta_type: postType === "OFFER" ? undefined : (ctaType || "NONE"),
          cta_url: ctaUrl || undefined,
          media_url: mediaUrl || undefined,
          event_title: (postType === "EVENT" || postType === "OFFER") ? eventTitle : undefined,
          start_date: (postType === "EVENT" || postType === "OFFER") ? startDate : undefined,
          end_date: (postType === "EVENT" || postType === "OFFER") ? endDate : undefined,
          coupon_code: postType === "OFFER" ? couponCode || undefined : undefined,
          terms_conditions: postType === "OFFER" ? terms || undefined : undefined,
        },
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(data.state === "LIVE"
          ? t("Publication visible sur Google !", "Post is live on Google!")
          : t("Post transmis à Google", "Post sent to Google"), {
          description: data.state === "LIVE"
            ? t("Google confirme la mise en ligne.", "Google confirmed the post is live.")
            : t("En attente de validation par Google, ne republiez pas.", "Awaiting Google approval; do not resubmit."),
          action: {
            label: t("Voir", "View"),
            onClick: () => window.open("https://business.google.com", "_blank"),
          },
        });
        setContent("");
        setCtaType("LEARN_MORE");
        setCtaUrl(selectedBusiness?.website?.startsWith("http") ? selectedBusiness.website : selectedBusiness?.website ? "https://" + selectedBusiness.website : "");
        setMediaUrl("");
        setEventTitle("");
        setStartDate("");
        setEndDate("");
        setCouponCode("");
        setTerms("");
        fetchRecentPosts();
      } else if (data?.requires_reconnect) {
        toast.error(t("Reconnexion Google requise", "Google reconnection required"), {
          action: {
            label: t("Reconnecter", "Reconnect"),
            onClick: () => navigate("/settings"),
          },
        });
      } else {
        throw new Error(data?.error || "Publication failed");
      }
    } catch (error) {
      console.error("Publish error:", error);
      toast.error(t("Erreur lors de la publication", "Error while publishing"), {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const getPostTypeIcon = (type: string) => {
    const postType = POST_TYPES.find(p => p.value === type);
    return postType?.icon || Megaphone;
  };

  const getPostTypeLabel = (type: string) => {
    const postType = POST_TYPES.find(p => p.value === type);
    return postType?.label || "News";
  };

  const getStatusBadge = (status: string) => {
    if (status === "published") {
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-emerald-500/20 text-emerald-600"><Check className="w-3 h-3" />{t("Google : en ligne", "Google: Live")}</span>;
    }
    if (status === "rejected") {
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-red-500/20 text-red-600"><AlertCircle className="w-3 h-3" />{t("Refusé par Google", "Rejected")}</span>;
    }
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-amber-500/20 text-amber-600">
      <Clock className="w-3 h-3" />{status === "processing" ? t("Google : en cours", "Google: Processing") : t("Non confirmé", "Unverified")}
    </span>;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-xl border-b border-border">
        <div className="flex items-center gap-3 px-4 h-14">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-muted rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-semibold">{t("Créer une publication GMB", "Create a GMB post")}</h1>
            <p className="text-xs text-muted-foreground">{t("Publiez sur Google Business Profile", "Publish on Google Business Profile")}</p>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Business Selector */}
        {businesses.length > 1 && (
          <Card>
            <CardContent className="pt-4">
              <Label className="text-sm font-medium mb-2 block">{t("Établissement", "Business")}</Label>
              <Select value={selectedBusinessId} onValueChange={setSelectedBusinessId}>
                <SelectTrigger>
                  <SelectValue placeholder={t("Sélectionner un établissement", "Select a business")} />
                </SelectTrigger>
                <SelectContent>
                  {businesses.map((business) => (
                    <SelectItem key={business.id} value={business.id}>
                      <div className="flex items-center gap-2">
                        {business.profile_image_url ? (
                          <img 
                            src={business.profile_image_url} 
                            alt={business.name}
                            className="w-5 h-5 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium">
                            {business.name.charAt(0)}
                          </div>
                        )}
                        <span>{business.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        )}

        {/* No Business Warning */}
        {businesses.length === 0 && (
          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-700">{t("Aucun établissement", "No business")}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t("Connectez votre compte Google pour publier des posts.", "Connect your Google account to publish posts.")}
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-3"
                    onClick={() => navigate("/businesses")}
                  >
                    {t("Gérer les établissements", "Manage businesses")}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Post Form */}
        {businesses.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-primary" />
                {t("Nouveau post", "New post")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Post Type */}
              <div>
                <Label className="text-sm font-medium mb-2 block">{t("Type de publication", "Post type")}</Label>
                <div className="grid grid-cols-3 gap-2">
                  {POST_TYPES.map((type) => {
                    const Icon = type.icon;
                    const isSelected = postType === type.value;
                    return (
                      <button
                        key={type.value}
                        onClick={() => setPostType(type.value)}
                        className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${
                          isSelected 
                            ? "border-primary bg-primary/10" 
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <Icon className={`w-5 h-5 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                        <span className={`text-xs font-medium ${isSelected ? "text-primary" : ""}`}>
                          {type.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Champs Événement / Offre */}
              {(postType === "EVENT" || postType === "OFFER") && (
                <div className="space-y-3 p-3 rounded-xl border border-primary/20 bg-primary/5">
                  <div>
                    <Label className="text-sm font-medium mb-2 block">
                      {postType === "EVENT" ? t("Titre de l'événement", "Event title") : t("Titre de l'offre", "Offer title")}
                    </Label>
                    <Input
                      placeholder={postType === "EVENT" ? t("Ex : Soirée portes ouvertes", "E.g. Open house evening") : t("Ex : -20% sur tout le menu", "E.g. -20% on the entire menu")}
                      value={eventTitle}
                      onChange={(e) => setEventTitle(e.target.value.slice(0, 58))}
                      maxLength={58}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm font-medium mb-2 block">{t("Début", "Start")}</Label>
                      <Input
                        type="datetime-local"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium mb-2 block">{t("Fin", "End")}</Label>
                      <Input
                        type="datetime-local"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </div>
                  </div>
                  {postType === "OFFER" && (
                    <>
                      <div>
                        <Label className="text-sm font-medium mb-2 block">{t("Code promo (optionnel)", "Promo code (optional)")}</Label>
                        <Input
                          placeholder={t("Ex : PROMO20", "E.g. PROMO20")}
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value.slice(0, 58))}
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium mb-2 block">{t("Conditions (optionnel)", "Terms (optional)")}</Label>
                        <Textarea
                          placeholder={t("Ex : Valable jusqu'au... Hors boissons...", "E.g. Valid until... Excludes drinks...")}
                          value={terms}
                          onChange={(e) => setTerms(e.target.value.slice(0, 5000))}
                          className="min-h-[60px] resize-none"
                        />
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Content */}
              <div>
                <Label className="text-sm font-medium mb-2 block">{t("Contenu", "Content")}</Label>
                <Textarea
                  placeholder={t("Informez vos clients : actualités, événements, offres spéciales...", "Inform your customers: news, events, special offers...")}
                  value={content}
                  onChange={(e) => { setContent(e.target.value.slice(0, 1500)); setMediaUrl(""); }}
                  className="min-h-[120px] resize-none"
                />
                <p className="text-xs text-muted-foreground text-right mt-1">
                  {content.length}/1500 {t("caractères", "characters")}
                </p>
              </div>

              {/* Generated photo (automatically created at publish time if missing) */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">{t("Photo Google Business", "Google Business photo")}</Label>
                <p className="text-xs text-muted-foreground">{t(
                  "Générez et prévisualisez votre image. Sans image choisie, Reviews AI en générera une automatiquement à la publication.",
                  "Generate and preview your image. If none is selected, an AI image will be generated when you publish.",
                )}</p>
                <Button type="button" variant="outline" onClick={handleGenerateImage}
                  disabled={isGeneratingImage || isPublishing || !content.trim()}>
                  {isGeneratingImage ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Megaphone className="w-4 h-4 mr-2" />}
                  {isGeneratingImage ? t("Génération de l'image...", "Generating image...") : t("Générer une image IA", "Generate AI photo")}
                </Button>
                {mediaUrl && (
                  <div className="space-y-2">
                    <img src={mediaUrl} alt={t("Aperçu de l'image pour Google", "Google photo preview")} className="w-full max-h-64 rounded-xl object-cover border" />
                    <Button type="button" size="sm" variant="ghost" onClick={() => setMediaUrl("")}>
                      {t("Retirer l'image", "Remove photo")}
                    </Button>
                  </div>
                )}
              </div>

              {/* CTA */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm font-medium mb-2 block">{t("Bouton d'action", "Action button")}</Label>
                  <Select value={ctaType} onValueChange={setCtaType}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("Aucun", "None")} />
                    </SelectTrigger>
                    <SelectContent>
                      {CTA_TYPES.map((cta) => (
                        <SelectItem key={cta.value} value={cta.value}>
                          {cta.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {ctaType && ctaType !== "NONE" && (
                  <div>
                    <Label className="text-sm font-medium mb-2 block">URL</Label>
                    <Input
                      type="url"
                      placeholder="https://..."
                      value={ctaUrl}
                      onChange={(e) => setCtaUrl(e.target.value)}
                    />
                  </div>
                )}
              </div>

              {/* Publish Button */}
              <Button 
                className="w-full bg-emerald-500 hover:bg-emerald-600" 
                size="lg"
                onClick={handlePublish}
                disabled={isPublishing || isGeneratingImage || !content.trim()}
              >
                {isPublishing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    {t("Publication...", "Publishing...")}
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    {t("Publier sur Google", "Publish on Google")}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Recent Posts */}
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base">{t("Publications récentes", "Recent posts")}</CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={fetchRecentPosts}
              className="h-8 px-2"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {recentPosts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Megaphone className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">{t("Aucune publication pour le moment", "No posts yet")}</p>
                <p className="text-xs mt-1">{t("Créez votre première publication Google Business", "Create your first Google Business post")}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentPosts.map((post) => {
                  const Icon = getPostTypeIcon(post.topic_type);
                  const isPublished = post.status === "published";
                  return (
                    <div 
                      key={post.id} 
                      className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
                        isPublished 
                          ? "bg-emerald-500/10 border-emerald-500/30" 
                          : "bg-muted/50 border-transparent"
                      }`}
                    >
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Icon className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-muted-foreground">
                            {getPostTypeLabel(post.topic_type)}
                          </span>
                          {getStatusBadge(post.status)}
                        </div>
                        <p className="text-sm line-clamp-2">{post.summary}</p>
                        {post.media_url && <img src={post.media_url} alt="" className="mt-2 h-24 w-40 object-cover rounded-lg border" />}
                        {post.cta_url && <a href={post.cta_url} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-primary underline mt-2 inline-block">{t("En savoir plus", "Learn more")}</a>}
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(post.posted_at || post.created_at), isEN ? "MMM d, yyyy 'at' HH:mm" : "d MMM yyyy 'à' HH:mm", { locale: isEN ? enUS : fr })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  );
}