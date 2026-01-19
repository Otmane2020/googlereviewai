import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { DashboardHeader } from "@/components/DashboardHeader";
import { MobileBottomNav } from "@/components/MobileBottomNav";
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
  PlusCircle
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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
}

const BusinessesPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [reviewCounts, setReviewCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);
  const [editDescription, setEditDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const { syncBusinesses, isSyncing } = useSyncGoogleBusinesses();
  const [newBusiness, setNewBusiness] = useState({
    name: "",
    address: "",
    phone: "",
    website: "",
  });

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    fetchBusinesses();
  }, [user, navigate]);

  const fetchBusinesses = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("businesses")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching businesses:", error);
    } else {
      setBusinesses(data || []);
      
      // Fetch review counts per business
      if (data && data.length > 0) {
        const googlePlaceIds = data.map(b => b.google_place_id).filter(Boolean);
        if (googlePlaceIds.length > 0) {
          const { data: reviews } = await supabase
            .from("reviews")
            .select("location_id")
            .eq("user_id", user.id)
            .in("location_id", googlePlaceIds);
          
          if (reviews) {
            const counts: Record<string, number> = {};
            reviews.forEach(r => {
              counts[r.location_id] = (counts[r.location_id] || 0) + 1;
            });
            setReviewCounts(counts);
          }
        }
      }
    }
    setLoading(false);
  };

  const handleSyncBusinesses = async () => {
    await syncBusinesses();
    fetchBusinesses();
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
    if (!confirm(`Êtes-vous sûr de vouloir supprimer "${name}" ?`)) return;

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
        description: "La description a été enregistrée.",
      });
      setEditDialogOpen(false);
      setEditingBusiness(null);
      fetchBusinesses();
    }
    setSaving(false);
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
    <div className="min-h-screen bg-muted/30">
      <DashboardHeader />

      {/* Page Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Établissements</h1>
              <p className="text-sm text-muted-foreground">
                Gérez vos établissements Google My Business
              </p>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <Button
            variant="outline"
            className="gap-2"
            onClick={handleSyncBusinesses}
            disabled={isSyncing}
          >
            {isSyncing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            {isSyncing ? "Synchronisation..." : "Synchroniser depuis Google"}
          </Button>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-5 h-5" />
                Ajouter manuellement
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ajouter un établissement</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom de l'établissement *</Label>
                  <Input
                    id="name"
                    value={newBusiness.name}
                    onChange={(e) => setNewBusiness({ ...newBusiness, name: e.target.value })}
                    placeholder="Mon entreprise"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Adresse</Label>
                  <Input
                    id="address"
                    value={newBusiness.address}
                    onChange={(e) => setNewBusiness({ ...newBusiness, address: e.target.value })}
                    placeholder="123 Rue Example, 75001 Paris"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    value={newBusiness.phone}
                    onChange={(e) => setNewBusiness({ ...newBusiness, phone: e.target.value })}
                    placeholder="+33 1 23 45 67 89"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Site web</Label>
                  <Input
                    id="website"
                    value={newBusiness.website}
                    onChange={(e) => setNewBusiness({ ...newBusiness, website: e.target.value })}
                    placeholder="https://example.com"
                  />
                </div>
                <Button 
                  onClick={handleAddBusiness} 
                  disabled={saving || !newBusiness.name.trim()} 
                  className="w-full"
                >
                  {saving ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "Ajouter"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Businesses grid */}
        {businesses.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border p-12 text-center">
            <Building2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Aucun établissement
            </h2>
            <p className="text-muted-foreground mb-6">
              Ajoutez votre premier établissement pour commencer à gérer vos avis.
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="w-5 h-5 mr-2" />
              Ajouter un établissement
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {businesses.map((business) => {
              const reviewCount = business.google_place_id ? (reviewCounts[business.google_place_id] || 0) : 0;
              const isGoogleConnected = !!business.google_place_id;
              
              return (
                <div
                  key={business.id}
                  className="bg-card rounded-2xl border border-border p-6 hover:shadow-lg transition-all hover:-translate-y-1"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex items-center gap-1">
                      {isGoogleConnected ? (
                        <span className="flex items-center gap-1 text-xs text-secondary bg-secondary/10 px-2 py-1 rounded-full">
                          <CheckCircle className="w-3 h-3" />
                          Google
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                          <AlertCircle className="w-3 h-3" />
                          Manuel
                        </span>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => {
                          setEditingBusiness(business);
                          setEditDescription(business.description || "");
                          setEditDialogOpen(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <h3 className="font-semibold text-foreground text-lg mb-2 line-clamp-2">{business.name}</h3>

                  {/* Stats */}
                  <div className="flex items-center gap-1 mb-3">
                    <span className="text-sm font-medium text-[#202124] dark:text-foreground">{business.rating?.toFixed(1) || "–"}</span>
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-3.5 h-3.5 text-[#FBBC04] ${i < Math.round(business.rating || 0) ? "fill-[#FBBC04]" : "fill-transparent"}`} 
                        />
                      ))}
                    </div>
                    <span className="text-sm text-[#70757A] dark:text-muted-foreground">({reviewCount})</span>
                  </div>

                  <div className="space-y-2 text-sm">
                    {business.address && (
                      <div className="flex items-start gap-2 text-muted-foreground">
                        <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{business.address}</span>
                      </div>
                    )}
                    {business.phone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="w-4 h-4 flex-shrink-0" />
                        <span>{business.phone}</span>
                      </div>
                    )}
                    {business.website && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Globe className="w-4 h-4 flex-shrink-0" />
                        <a 
                          href={business.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="truncate hover:text-primary flex items-center gap-1"
                        >
                          {new URL(business.website).hostname}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  {business.description && (
                    <div className="mt-3 p-3 bg-muted/50 rounded-xl">
                      <p className="text-sm text-muted-foreground line-clamp-2">{business.description}</p>
                    </div>
                  )}

                  {/* Posts Section */}
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-foreground">Posts</span>
                      </div>
                      <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
                        <PlusCircle className="w-3 h-3" />
                        Ajouter
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">Aucun post pour le moment</p>
                  </div>

                  <div className="mt-4 pt-4 border-t border-border flex gap-2">
                    <Button
                      variant="default"
                      className="flex-1 gap-2"
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
                placeholder="Décrivez votre établissement..."
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
              Enregistrer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <MobileBottomNav />
    </div>
  );
};

export default BusinessesPage;
