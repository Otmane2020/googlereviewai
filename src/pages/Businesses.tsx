import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useRequireSubscription } from "@/hooks/useRequireSubscription";
import { DashboardHeader } from "@/components/DashboardHeader";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { SelectBusinessesDialog } from "@/components/SelectBusinessesDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useSyncGoogleBusinesses } from "@/hooks/useSyncGoogleBusinesses";
import { 
  Building2,
  Plus,
  MapPin,
  Phone,
  Globe,
  Star,
  Edit,
  Loader2,
  RefreshCw,
  MessageSquare,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  FileText,
  PlusCircle,
  Crown,
  Sparkles,
  Tag,
  Link,
  Map,
  X,
  Coins
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { AgencyCreditsPanel } from "@/components/AgencyCreditsPanel";

interface Business {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  website: string | null;
  rating: number | null;
  total_reviews: number;
  is_active: boolean;
  google_place_id: string | null;
  description: string | null;
  auto_keywords: string[] | null;
  maps_url: string | null;
  profile_image_url: string | null;
  credits: number | null;
}

const BusinessesPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isEN = i18n.language?.toLowerCase().startsWith("en");
  const t = (fr: string, en: string) => (isEN ? en : fr);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [reviewCounts, setReviewCounts] = useState<Record<string, number>>({});
  const [reviewRatings, setReviewRatings] = useState<Record<string, number>>({});
  const [businessPosts, setBusinessPosts] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);
  const [editDescription, setEditDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const { syncBusinesses, isSyncing } = useSyncGoogleBusinesses();
  const [newBusiness, setNewBusiness] = useState({
    name: "",
    address: "",
    phone: "",
    website: "",
  });
  
  // Plan limit state
  const [maxBusinesses, setMaxBusinesses] = useState(1);
  const [showSelectDialog, setShowSelectDialog] = useState(false);
  const [googleBusinessesForSelection, setGoogleBusinessesForSelection] = useState<any[]>([]);

  // Use subscription verification hook
  const { loading: subscriptionLoading } = useRequireSubscription();

  useEffect(() => {
    if (!subscriptionLoading && user) {
      fetchBusinesses();
      fetchMaxBusinesses();
    }
  }, [subscriptionLoading, user]);

  const fetchMaxBusinesses = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("max_businesses")
      .eq("id", user.id)
      .single();
    if (data) {
      setMaxBusinesses(data.max_businesses || 1);
    }
  };

  const fetchBusinesses = async () => {
    if (!user) return;
    
    // Only fetch ACTIVE businesses
    const { data, error } = await supabase
      .from("businesses")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching businesses:", error);
    } else {
      setBusinesses(data || []);
      
      // Fetch review counts and ratings per business
      if (data && data.length > 0) {
        const googlePlaceIds = data.map(b => b.google_place_id).filter(Boolean);
        const businessIds = data.map(b => b.id);
        
        if (googlePlaceIds.length > 0) {
          const { data: reviews } = await supabase
            .from("reviews")
            .select("location_id, rating")
            .eq("user_id", user.id)
            .in("location_id", googlePlaceIds);
          
          if (reviews) {
            const counts: Record<string, number> = {};
            const ratings: Record<string, number[]> = {};
            
            reviews.forEach(r => {
              counts[r.location_id] = (counts[r.location_id] || 0) + 1;
              if (!ratings[r.location_id]) ratings[r.location_id] = [];
              ratings[r.location_id].push(r.rating);
            });
            
            setReviewCounts(counts);
            
            // Calculate average ratings
            const avgRatings: Record<string, number> = {};
            Object.entries(ratings).forEach(([locationId, ratingsList]) => {
              avgRatings[locationId] = ratingsList.reduce((a, b) => a + b, 0) / ratingsList.length;
            });
            setReviewRatings(avgRatings);
          }
        }

        // Fetch posts for each business
        const { data: posts } = await supabase
          .from("scheduled_content")
          .select("*")
          .eq("user_id", user.id)
          .in("business_id", businessIds)
          .order("created_at", { ascending: false });

        if (posts) {
          const postsMap: Record<string, any[]> = {};
          posts.forEach(p => {
            if (!postsMap[p.business_id]) postsMap[p.business_id] = [];
            postsMap[p.business_id].push(p);
          });
          setBusinessPosts(postsMap);
        }
      }
    }
    setLoading(false);
  };

  const handleSyncBusinesses = async () => {
    const result = await syncBusinesses();
    
    // Check if selection is required
    if (result?.requires_selection) {
      setGoogleBusinessesForSelection(result.google_businesses || []);
      setMaxBusinesses(result.max_businesses || 1);
      setShowSelectDialog(true);
      return;
    }
    
    fetchBusinesses();
  };

  // Force show selection dialog for "Edit" button
  const handleChangeBusinesses = async () => {
    // Pass true to force selection mode
    const result = await syncBusinesses(true);
    
    if (result?.google_businesses && result.google_businesses.length > 0) {
      // Always show selection dialog when user wants to change businesses
      setGoogleBusinessesForSelection(result.google_businesses);
      setMaxBusinesses(result.max_businesses || maxBusinesses);
      setShowSelectDialog(true);
    } else {
      // No businesses from Google
      fetchBusinesses();
      toast({
        title: "Synchronisation",
        description: "Aucun établissement Google trouvé sur votre compte.",
        variant: "destructive",
      });
    }
  };

  const handleBusinessSelectionSuccess = () => {
    fetchBusinesses();
    toast({
      title: "Établissements mis à jour",
      description: "Vos établissements ont été synchronisés.",
    });
  };

  const handleAddBusiness = async () => {
    if (!user || !newBusiness.name.trim()) return;
    setSaving(true);

    const { error } = await supabase
      .from("businesses")
      .insert({
        user_id: user.id,
        name: newBusiness.name,
        address: newBusiness.address || null,
        phone: newBusiness.phone || null,
        website: newBusiness.website || null,
      });

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter l'établissement.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Établissement ajouté",
        description: `${newBusiness.name} a été ajouté avec succès.`,
      });
      setNewBusiness({ name: "", address: "", phone: "", website: "" });
      setDialogOpen(false);
      fetchBusinesses();
    }
    setSaving(false);
  };

  const handleDeleteBusiness = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}" ?`)) return;

    const { error } = await supabase
      .from("businesses")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'établissement.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Établissement supprimé",
        description: `${name} a été supprimé.`,
      });
      fetchBusinesses();
    }
  };

  const handleUpdateDescription = async () => {
    if (!editingBusiness) return;
    setSaving(true);

    const { error } = await supabase
      .from("businesses")
      .update({ description: editDescription })
      .eq("id", editingBusiness.id);

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la description.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Description mise à jour",
        description: "Description enregistrée.",
      });
      setEditDialogOpen(false);
      setEditingBusiness(null);
      fetchBusinesses();
    }
    setSaving(false);
  };

  const handleAnalyzeBusiness = async (business: Business) => {
    if (!user) return;
    setAnalyzingId(business.id);
    
    try {
      const { error } = await supabase.functions.invoke("analyze-business-website", {
        body: {
          businessId: business.id,
          website: business.website,
          gmbDescription: business.description,
        },
      });

      if (error) throw error;

      toast({
        title: "Analyse terminée",
        description: "Mots-clés extraits avec succès.",
      });
      fetchBusinesses();
    } catch (error) {
      console.error("Error analyzing business:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'analyser le site web.",
        variant: "destructive",
      });
    } finally {
      setAnalyzingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 pb-20">
      <DashboardHeader />

      {/* Mobile-First Page Header */}
      <div className="bg-card border-b border-border">
        <div className="px-4 py-4">
          {/* Top row: Title + Badge */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-bold text-foreground">{t("Établissements", "Businesses")}</h1>
              <p className="text-xs text-muted-foreground">
                {t("Gérez vos profils Google", "Manage your Google profiles")}
              </p>
            </div>
            <Badge variant="outline" className="gap-1 flex-shrink-0 bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/30">
              <Crown className="w-3 h-3 text-primary" />
              <span className="font-semibold">{businesses.filter(b => b.is_active).length}/{maxBusinesses}</span>
            </Badge>
          </div>
          
          {/* Action buttons - stacked on mobile */}
          <div className="flex gap-2">
            {businesses.length < maxBusinesses && (
              <Button
                variant="default"
                size="sm"
                onClick={handleSyncBusinesses}
                disabled={isSyncing}
                className="flex-1"
              >
                {isSyncing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <PlusCircle className="w-4 h-4 mr-2" />
                )}
                {t("Ajouter", "Add")}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleChangeBusinesses}
              disabled={isSyncing}
              className={`gap-2 ${businesses.length >= maxBusinesses ? "flex-1" : ""}`}
            >
              {isSyncing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent font-semibold">
                {isSyncing ? t("Sync...", "Sync...") : t("Modifier", "Edit")}
              </span>
            </Button>
          </div>
        </div>
      </div>

      <main className="px-4 py-4 space-y-4">
        <AgencyCreditsPanel onChange={fetchBusinesses} />

        {/* Businesses grid */}
        {businesses.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border p-8 text-center">
            <Building2 className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
            <h2 className="text-lg font-semibold text-foreground mb-2">
              {t("Aucun établissement", "No business")}
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              {t("Connectez votre premier établissement Google", "Connect your first Google business")}
            </p>
            <Button onClick={handleSyncBusinesses} disabled={isSyncing} size="sm">
              {isSyncing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              {t("Connecter Google", "Connect Google")}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {businesses.map((business) => {
              const reviewCount = business.google_place_id ? (reviewCounts[business.google_place_id] || 0) : 0;
              const calculatedRating = business.google_place_id ? (reviewRatings[business.google_place_id] || business.rating) : business.rating;
              const posts = businessPosts[business.id] || [];
              const isGoogleConnected = !!business.google_place_id;
              
              return (
                <div
                  key={business.id}
                  className="bg-card rounded-xl border border-border p-4 hover:shadow-md transition-all active:scale-[0.98]"
                >
                  {/* Header: Logo + Name + Badge */}
                  <div className="flex items-start gap-3 mb-3">
                    {/* Logo / Photo */}
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0 border border-primary/20 overflow-hidden">
                      {business.profile_image_url ? (
                        <img 
                          src={business.profile_image_url}
                          alt={business.name}
                          className="w-full h-full object-cover"
                        />
                      ) : isGoogleConnected ? (
                        <img 
                          src="https://www.google.com/images/branding/googleg/1x/googleg_standard_color_128dp.png"
                          alt="Google"
                          className="w-7 h-7"
                        />
                      ) : (
                        <span className="text-xl font-bold text-primary">
                          {business.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {isGoogleConnected ? (
                          <span className="flex items-center gap-1 text-xs text-secondary bg-secondary/10 px-2 py-0.5 rounded-full">
                            <CheckCircle className="w-3 h-3" />
                            Google
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                            <AlertCircle className="w-3 h-3" />
                            {t("Manuel", "Manual")}
                          </span>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-foreground ml-auto"
                          onClick={() => {
                            setEditingBusiness(business);
                            setEditDescription(business.description || "");
                            setEditDialogOpen(true);
                          }}
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                      <h3 className="font-semibold text-foreground text-base leading-tight line-clamp-2">{business.name}</h3>
                      {/* Rating & Reviews - aligned under name */}
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-sm font-semibold text-foreground">{calculatedRating?.toFixed(1) || "–"}</span>
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`w-3.5 h-3.5 ${i < Math.round(calculatedRating || 0) ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30"}`} 
                            />
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground">({reviewCount} {t("avis", "reviews")})</span>
                      </div>
                      {/* Crédits par établissement */}
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                          <Coins className="w-3 h-3" />
                          {business.credits ?? 0} {t("crédits", "credits")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Description with popup preview */}
                  <Sheet>
                    <SheetTrigger asChild>
                      {business.description ? (
                        <div className="mb-3 p-3 bg-muted/50 rounded-xl cursor-pointer hover:bg-muted/70 transition-colors">
                          <p className="text-sm text-muted-foreground line-clamp-3">{business.description}</p>
                          <p className="text-xs text-primary mt-1">{t("Voir plus", "See more")} →</p>
                        </div>
                      ) : (
                        <div className="mb-3 p-3 bg-muted/30 rounded-xl border border-dashed border-muted-foreground/20 cursor-pointer hover:bg-muted/40 transition-colors">
                          <p className="text-xs text-muted-foreground italic">{t("Aucune description. Touchez pour en générer une avec l'IA.", "No description. Tap to generate one with AI.")}</p>
                        </div>
                      )}
                    </SheetTrigger>
                    <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto">
                      <SheetHeader>
                        <SheetTitle className="flex items-center gap-2">
                          <FileText className="w-5 h-5" />
                          {t("Description de", "Description of")} {business.name}
                        </SheetTitle>
                      </SheetHeader>
                      <div className="py-4 space-y-4">
                        {business.description ? (
                          <div className="p-4 bg-muted/50 rounded-xl">
                            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{business.description}</p>
                          </div>
                        ) : (
                          <div className="p-4 bg-muted/30 rounded-xl border border-dashed border-muted-foreground/20">
                            <p className="text-sm text-muted-foreground italic text-center">{t("Aucune description disponible", "No description available")}</p>
                          </div>
                        )}
                        
                        {/* Action buttons */}
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            className="flex-1 gap-2"
                            onClick={() => {
                              setEditingBusiness(business);
                              setEditDescription(business.description || "");
                              setEditDialogOpen(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                            {t("Modifier", "Edit")}
                          </Button>
                          <Button 
                            className="flex-1 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
                            disabled={analyzingId === business.id}
                            onClick={async () => {
                              setAnalyzingId(business.id);
                              try {
                                const { data, error } = await supabase.functions.invoke('analyze-business-website', {
                                  body: { businessId: business.id }
                                });
                                
                                if (error) throw error;
                                
                                if (data?.description) {
                                  // Update local state
                                  setBusinesses(prev => prev.map(b => 
                                    b.id === business.id ? { ...b, description: data.description, auto_keywords: data.keywords || b.auto_keywords } : b
                                  ));
                                  toast({
                                    title: "Description générée ✨",
                                    description: "Description créée par l'IA",
                                  });
                                } else {
                                  toast({
                                    title: "Génération terminée",
                                    description: data?.message || "Vérifiez les informations de l'établissement",
                                    variant: "destructive"
                                  });
                                }
                              } catch (err) {
                                console.error('Error generating description:', err);
                                toast({
                                  title: "Erreur",
                                  description: "Impossible de générer la description",
                                  variant: "destructive"
                                });
                              } finally {
                                setAnalyzingId(null);
                              }
                            }}
                          >
                            {analyzingId === business.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Sparkles className="w-4 h-4" />
                            )}
                            {analyzingId === business.id ? t("Génération...", "Generating...") : t("Régénérer avec IA", "Regenerate with AI")}
                          </Button>
                        </div>
                      </div>
                    </SheetContent>
                  </Sheet>

                  {/* Quick info: Address + Phone */}
                  <div className="space-y-1 text-sm mb-4">
                    {business.address && (
                      <div className="flex items-start gap-2 text-muted-foreground">
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                        <span className="line-clamp-1 text-xs">{business.address}</span>
                      </div>
                    )}
                    {business.phone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="text-xs">{business.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Action buttons row with popups */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {/* URL Popup with edit functionality */}
                    <Sheet>
                      <SheetTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                          <Link className="w-3.5 h-3.5" />
                          {t("Liens", "Links")}
                        </Button>
                      </SheetTrigger>
                      <SheetContent side="bottom" className="max-h-[70vh] overflow-y-auto">
                        <SheetHeader>
                          <SheetTitle className="flex items-center gap-2">
                            <Link className="w-5 h-5" />
                            {t("Liens de", "Links of")} {business.name}
                          </SheetTitle>
                        </SheetHeader>
                        <div className="space-y-4 py-4">
                          {/* Editable Website URL */}
                          <div className="space-y-2">
                            <Label className="flex items-center gap-2 text-sm font-medium">
                              <Globe className="w-4 h-4 text-primary" />
                              {t("URL du site web", "Website URL")}
                            </Label>
                            <div className="flex gap-2">
                              <Input
                                type="url"
                                placeholder="https://www.monsite.fr"
                                defaultValue={business.website || ""}
                                id={`website-input-${business.id}`}
                                className="flex-1"
                              />
                              <Button
                                size="sm"
                                onClick={async () => {
                                  const input = document.getElementById(`website-input-${business.id}`) as HTMLInputElement;
                                  const newUrl = input?.value?.trim() || null;
                                  
                                  const { error } = await supabase
                                    .from("businesses")
                                    .update({ website: newUrl, updated_at: new Date().toISOString() })
                                    .eq("id", business.id);
                                  
                                  if (!error) {
                                    setBusinesses(prev => prev.map(b => 
                                      b.id === business.id ? { ...b, website: newUrl } : b
                                    ));
                                    toast({ title: "URL enregistrée ✓" });
                                  }
                                }}
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {t("Cette URL sera analysée par l'IA pour enrichir vos mots-clés", "This URL will be analyzed by AI to enrich your keywords")}
                            </p>
                          </div>

                          {/* Analyze with AI button */}
                          <Button
                            className="w-full gap-2"
                            disabled={analyzingId === business.id || !business.website}
                            onClick={async () => {
                              setAnalyzingId(business.id);
                              try {
                                const { data, error } = await supabase.functions.invoke('analyze-business-website', {
                                  body: { 
                                    businessId: business.id,
                                    website: business.website,
                                    generateContent: true
                                  }
                                });
                                
                                if (error) throw error;
                                
                                setBusinesses(prev => prev.map(b => 
                                  b.id === business.id ? { 
                                    ...b, 
                                    description: data?.description || b.description,
                                    auto_keywords: data?.keywords || b.auto_keywords 
                                  } : b
                                ));
                                
                                toast({
                                  title: "Analyse terminée ✨",
                                  description: `${data?.keywords?.length || 0} mots-clés + ${data?.aeo_questions?.length || 0} questions AEO générées`,
                                });
                              } catch (err) {
                                console.error('Error analyzing:', err);
                                toast({
                                  title: "Erreur",
                                  description: "Impossible d'analyser le site",
                                  variant: "destructive"
                                });
                              } finally {
                                setAnalyzingId(null);
                              }
                            }}
                          >
                            {analyzingId === business.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Sparkles className="w-4 h-4" />
                            )}
                            {analyzingId === business.id 
                              ? t("Analyse...", "Analyzing...") 
                              : t("Analyser avec Firecrawl + IA", "Analyze with Firecrawl + AI")}
                          </Button>

                          {/* Google Maps link */}
                          {business.maps_url && (
                            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                              <div className="flex items-center gap-3">
                                <Map className="w-5 h-5 text-destructive" />
                                <div>
                                  <p className="text-sm font-medium">Google Maps</p>
                                  <p className="text-xs text-muted-foreground">{t("Voir sur la carte", "View on map")}</p>
                                </div>
                              </div>
                              <Button size="sm" variant="outline" asChild>
                                <a href={business.maps_url} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              </Button>
                            </div>
                          )}

                          {/* Open website button */}
                          {business.website && (
                            <Button variant="outline" className="w-full gap-2" asChild>
                              <a href={business.website} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="w-4 h-4" />
                                {t("Ouvrir le site web", "Open website")}
                              </a>
                            </Button>
                          )}
                        </div>
                      </SheetContent>
                    </Sheet>

                    {/* Keywords Popup */}
                    <Sheet>
                      <SheetTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                          <Tag className="w-3.5 h-3.5" />
                          {t("Mots-clés", "Keywords")}
                          {business.auto_keywords && business.auto_keywords.length > 0 && (
                            <Badge variant="secondary" className="ml-1 h-4 px-1.5 text-[10px]">
                              {business.auto_keywords.length}
                            </Badge>
                          )}
                        </Button>
                      </SheetTrigger>
                      <SheetContent side="bottom" className="max-h-[70vh]">
                        <SheetHeader>
                          <SheetTitle className="flex items-center gap-2">
                            <Tag className="w-5 h-5" />
                            {t("Mots-clés de", "Keywords of")} {business.name}
                          </SheetTitle>
                        </SheetHeader>
                        <div className="py-4">
                          <div className="flex items-center justify-between mb-4">
                            <p className="text-sm text-muted-foreground">
                              {business.auto_keywords?.length || 0} {t("mots-clés détectés", "keywords detected")}
                            </p>
                            <Button 
                              variant="default" 
                              size="sm" 
                              className="gap-1.5"
                              onClick={() => handleAnalyzeBusiness(business)}
                              disabled={analyzingId === business.id || (!business.website && !business.description)}
                            >
                              {analyzingId === business.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Sparkles className="w-4 h-4" />
                              )}
                              {analyzingId === business.id ? t("Analyse...", "Analyzing...") : t("Analyser", "Analyze")}
                            </Button>
                          </div>
                          {business.auto_keywords && business.auto_keywords.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {business.auto_keywords.map((keyword, idx) => (
                                <Badge key={idx} variant="secondary" className="text-sm px-3 py-1">
                                  {keyword}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8">
                              <Sparkles className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                              <p className="text-sm text-muted-foreground">
                                {business.website || business.description 
                                  ? t("Cliquez sur Analyser pour extraire les mots-clés automatiquement", "Click Analyze to extract keywords automatically") 
                                  : t("Ajoutez un site web ou une description pour détecter les mots-clés", "Add a website or description to detect keywords")}
                              </p>
                            </div>
                          )}
                        </div>
                      </SheetContent>
                    </Sheet>

                    {/* Posts Popup */}
                    <Sheet>
                      <SheetTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                          <FileText className="w-3.5 h-3.5" />
                          Posts
                          {posts.length > 0 && (
                            <Badge variant="secondary" className="ml-1 h-4 px-1.5 text-[10px]">
                              {posts.length}
                            </Badge>
                          )}
                        </Button>
                      </SheetTrigger>
                      <SheetContent side="bottom" className="max-h-[70vh]">
                        <SheetHeader>
                          <SheetTitle className="flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            {t("Posts de", "Posts of")} {business.name}
                          </SheetTitle>
                        </SheetHeader>
                        <div className="py-4">
                          <div className="flex items-center justify-between mb-4">
                            <p className="text-sm text-muted-foreground">{posts.length} {t("posts", "posts")}</p>
                            <Button variant="default" size="sm" className="gap-1.5">
                              <PlusCircle className="w-4 h-4" />
                              {t("Nouveau post", "New post")}
                            </Button>
                          </div>
                          {posts.length > 0 ? (
                            <div className="space-y-3 max-h-[40vh] overflow-y-auto">
                              {posts.map((post) => (
                                <div key={post.id} className="p-3 bg-muted/50 rounded-xl">
                                  <div className="flex items-start justify-between mb-1">
                                    <p className="text-sm font-medium text-foreground line-clamp-2">
                                      {post.title || post.question || "Post sans titre"}
                                    </p>
                                    <Badge 
                                      variant={post.status === "published" ? "default" : "secondary"}
                                      className="text-[10px] ml-2 flex-shrink-0"
                                    >
                                      {post.status}
                                    </Badge>
                                  </div>
                                  {post.content || post.answer ? (
                                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                      {post.content || post.answer}
                                    </p>
                                  ) : null}
                                  <p className="text-[10px] text-muted-foreground mt-2">
                                    {new Date(post.scheduled_date || post.created_at).toLocaleDateString("fr-FR")}
                                  </p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8">
                              <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                              <p className="text-sm text-muted-foreground">Aucun post pour le moment</p>
                            </div>
                          )}
                        </div>
                      </SheetContent>
                    </Sheet>
                  </div>

                  {/* Main action button */}
                  <Button
                    variant="default"
                    className="w-full gap-2"
                    size="sm"
                    onClick={() =>
                      navigate(
                        `/reviews?business=${business.google_place_id ?? business.id}`
                      )
                    }
                  >
                    <MessageSquare className="w-4 h-4" />
                    Voir les avis
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Edit Description Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier la description</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Établissement</Label>
              <p className="text-sm font-medium text-foreground">{editingBusiness?.name}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Describe your business..."
                rows={4}
                className="resize-none"
              />
            </div>
            <Button 
              onClick={handleUpdateDescription} 
              disabled={saving}
              className="w-full"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Business Selection Dialog */}
      {user && (
        <SelectBusinessesDialog
          open={showSelectDialog}
          onOpenChange={setShowSelectDialog}
          businesses={googleBusinessesForSelection}
          maxBusinesses={maxBusinesses}
          userId={user.id}
          onSuccess={handleBusinessSelectionSuccess}
        />
      )}

      <MobileBottomNav />
    </div>
  );
};

export default BusinessesPage;
