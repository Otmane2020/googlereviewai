import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { MobileBottomNav } from "@/components/MobileBottomNav";
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
}

export default function GmbPost() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isEN = i18n.language?.toLowerCase().startsWith("en");
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
  const [ctaType, setCtaType] = useState("NONE");
  const [ctaUrl, setCtaUrl] = useState("");
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
      .select("id, name, google_place_id, profile_image_url")
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

    if (ctaType && ctaType !== "NONE" && !ctaUrl) {
      toast.error(t("Veuillez saisir une URL pour le bouton d'action", "Please enter a URL for the action button"));
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
          cta_type: ctaType && ctaType !== "NONE" ? ctaType : undefined,
          cta_url: ctaType && ctaType !== "NONE" ? ctaUrl : undefined,
          event_title: (postType === "EVENT" || postType === "OFFER") ? eventTitle : undefined,
          start_date: (postType === "EVENT" || postType === "OFFER") ? startDate : undefined,
          end_date: (postType === "EVENT" || postType === "OFFER") ? endDate : undefined,
          coupon_code: postType === "OFFER" ? couponCode || undefined : undefined,
          terms_conditions: postType === "OFFER" ? terms || undefined : undefined,
        },
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(t("Publication réussie !", "Successfully published!"), {
          description: t("Votre publication est désormais visible sur votre fiche Google Business", "Your post is now visible on your Google Business profile"),
          action: {
            label: t("Voir", "View"),
            onClick: () => window.open("https://business.google.com", "_blank"),
          },
        });
        setContent("");
        setCtaType("NONE");
        setCtaUrl("");
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
      toast.error(t("Erreur lors de la publication", "Error while publishing"));
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
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-emerald-500/20 text-emerald-600">
          <Check className="w-3 h-3" />
          {t("Publié", "Published")}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-amber-500/20 text-amber-600">
        <Clock className="w-3 h-3" />
        {t("En attente", "Pending")}
      </span>
    );
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
            <h1 className="text-lg font-semibold">Créer une publication GMB</h1>
            <p className="text-xs text-muted-foreground">Publiez sur Google Business Profile</p>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Business Selector */}
        {businesses.length > 1 && (
          <Card>
            <CardContent className="pt-4">
              <Label className="text-sm font-medium mb-2 block">Établissement</Label>
              <Select value={selectedBusinessId} onValueChange={setSelectedBusinessId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a business" />
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
                  <p className="font-medium text-amber-700">Aucun établissement</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Connect your Google account to publish posts.
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-3"
                    onClick={() => navigate("/businesses")}
                  >
                    Manage businesses
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
                Nouveau post
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Post Type */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Type de publication</Label>
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
                      {postType === "EVENT" ? "Titre de l'événement" : "Titre de l'offre"}
                    </Label>
                    <Input
                      placeholder={postType === "EVENT" ? "Ex : Soirée portes ouvertes" : "Ex : -20% sur tout le menu"}
                      value={eventTitle}
                      onChange={(e) => setEventTitle(e.target.value.slice(0, 58))}
                      maxLength={58}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Début</Label>
                      <Input
                        type="datetime-local"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Fin</Label>
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
                        <Label className="text-sm font-medium mb-2 block">Code promo (optionnel)</Label>
                        <Input
                          placeholder="Ex : PROMO20"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value.slice(0, 58))}
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium mb-2 block">Conditions (optionnel)</Label>
                        <Textarea
                          placeholder="Ex : Valable jusqu'au... Hors boissons..."
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
                <Label className="text-sm font-medium mb-2 block">Contenu</Label>
                <Textarea
                  placeholder="Informez vos clients : actualités, événements, offres spéciales..."
                  value={content}
                  onChange={(e) => setContent(e.target.value.slice(0, 1500))}
                  className="min-h-[120px] resize-none"
                />
                <p className="text-xs text-muted-foreground text-right mt-1">
                  {content.length}/1500 caractères
                </p>
              </div>

              {/* CTA */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm font-medium mb-2 block">Bouton d'action</Label>
                  <Select value={ctaType} onValueChange={setCtaType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Aucun" />
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
                disabled={isPublishing || !content.trim()}
              >
                {isPublishing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Publication...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Publier sur Google
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Recent Posts */}
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base">Publications récentes</CardTitle>
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
                <p className="text-sm">Aucune publication pour le moment</p>
                <p className="text-xs mt-1">Créez votre première publication Google Business</p>
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
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(post.posted_at || post.created_at), "d MMM yyyy 'at' HH:mm", { locale: fr })}
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

      <MobileBottomNav />
    </div>
  );
}
