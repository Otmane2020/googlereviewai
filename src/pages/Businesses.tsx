import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { StarlinkoLogo } from "@/components/StarlinkoLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { 
  ArrowLeft,
  Building2,
  Plus,
  MapPin,
  Phone,
  Globe,
  Star,
  MoreVertical,
  Trash2,
  Edit,
  Loader2
} from "lucide-react";
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
}

const BusinessesPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
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
    }
    setLoading(false);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard")}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Établissements</h1>
              <p className="text-sm text-muted-foreground">
                Gérez vos établissements Google My Business
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <StarlinkoLogo showBadge={false} />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Add business button */}
        <div className="flex justify-end">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-5 h-5" />
                Ajouter un établissement
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
            {businesses.map((business) => (
              <div
                key={business.id}
                className="bg-card rounded-2xl border border-border p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDeleteBusiness(business.id, business.name)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <h3 className="font-semibold text-foreground text-lg mb-2">{business.name}</h3>

                {business.rating && (
                  <div className="flex items-center gap-2 mb-3">
                    <Star className="w-4 h-4 text-accent fill-accent" />
                    <span className="font-medium">{business.rating}</span>
                    <span className="text-muted-foreground text-sm">
                      ({business.total_reviews} avis)
                    </span>
                  </div>
                )}

                <div className="space-y-2 text-sm">
                  {business.address && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{business.address}</span>
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
                        className="truncate hover:text-primary"
                      >
                        {business.website}
                      </a>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-border">
                  <Button variant="outline" className="w-full" size="sm">
                    Voir les avis
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default BusinessesPage;
