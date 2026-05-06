import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { fr } from "date-fns/locale";

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

const POST_TYPES = [
  { value: "STANDARD", label: "News", icon: Megaphone, description: "Share an update" },
  { value: "OFFER", label: "Offer", icon: Gift, description: "Special promotion" },
  { value: "EVENT", label: "Event", icon: Calendar, description: "Announce an event" },
];

const CTA_TYPES = [
  { value: "NONE", label: "Aucun" },
  { value: "LEARN_MORE", label: "En savoir plus" },
  { value: "BOOK", label: "Book" },
  { value: "ORDER", label: "Commander" },
  { value: "SHOP", label: "Acheter" },
  { value: "SIGN_UP", label: "Sign up" },
  { value: "CALL", label: "Appeler" },
];

export default function GmbPost() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>("");
  const [postType, setPostType] = useState("STANDARD");
  const [content, setContent] = useState("");
  const [ctaType, setCtaType] = useState("NONE");
  const [ctaUrl, setCtaUrl] = useState("");
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
      toast.error("Veuillez saisir du contenu");
      return;
    }

    if (!selectedBusinessId) {
      toast.error("Please select a business");
      return;
    }

    const selectedBusiness = businesses.find(b => b.id === selectedBusinessId);
    if (!selectedBusiness?.google_place_id) {
      toast.error("This business isn't connected to Google");
      return;
    }

    if (ctaType && ctaType !== "NONE" && !ctaUrl) {
      toast.error("Veuillez saisir une URL pour le bouton d'action");
      return;
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
        },
      });

      if (error) throw error;

      if (data?.success) {
        toast.success("Published successfully!", {
          description: "Your post is now live on your Google Business Profile",
          action: {
            label: "Voir",
            onClick: () => window.open("https://business.google.com", "_blank"),
          },
        });
        setContent("");
        setCtaType("NONE");
        setCtaUrl("");
        fetchRecentPosts();
      } else if (data?.requires_reconnect) {
        toast.error("Reconnexion Google requise", {
          action: {
            label: "Reconnecter",
            onClick: () => navigate("/settings"),
          },
        });
      } else {
        throw new Error(data?.error || "Publication failed");
      }
    } catch (error) {
      console.error("Publish error:", error);
      toast.error("Error lors de la publication");
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
          Published
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-amber-500/20 text-amber-600">
        <Clock className="w-3 h-3" />
        En attente
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

              {/* Content */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Contenu</Label>
                <Textarea
                  placeholder="Update your customers: news, events, special offers..."
                  value={content}
                  onChange={(e) => setContent(e.target.value.slice(0, 1500))}
                  className="min-h-[120px] resize-none"
                />
                <p className="text-xs text-muted-foreground text-right mt-1">
                  {content.length}/1500 characters
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
