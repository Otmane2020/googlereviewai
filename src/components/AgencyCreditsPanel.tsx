import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Coins, Building2, ArrowRight, Loader2, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { toast } from "@/hooks/use-toast";

interface BusinessCredits {
  id: string;
  name: string;
  credits: number;
}

interface AgencyCreditsPanelProps {
  onChange?: () => void;
}

export const AgencyCreditsPanel = ({ onChange }: AgencyCreditsPanelProps) => {
  const { user } = useAuth();
  const [pool, setPool] = useState(0);
  const [planName, setPlanName] = useState<string | null>(null);
  const [businesses, setBusinesses] = useState<BusinessCredits[]>([]);
  const [loading, setLoading] = useState(true);
  const [allocating, setAllocating] = useState<string | null>(null);
  const [amounts, setAmounts] = useState<Record<string, string>>({});

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);

    const [{ data: profile }, { data: bizs }] = await Promise.all([
      supabase
        .from("profiles")
        .select("agency_total_credits, plan_name")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("businesses")
        .select("id, name, credits")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("name"),
    ]);

    setPool(profile?.agency_total_credits ?? 0);
    setPlanName(profile?.plan_name ?? null);
    setBusinesses((bizs ?? []) as BusinessCredits[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const isAgency = (planName || "").toLowerCase().includes("agence");

  const handleAllocate = async (businessId: string) => {
    const raw = amounts[businessId];
    const amount = parseInt(raw || "0", 10);
    if (!amount || amount <= 0) {
      toast({ title: "Montant invalide", variant: "destructive" });
      return;
    }
    if (amount > pool) {
      toast({
        title: "Pool insuffisant",
        description: `Il ne reste que ${pool} crédits dans votre pool Agence.`,
        variant: "destructive",
      });
      return;
    }

    setAllocating(businessId);
    const { data, error } = await supabase.rpc("allocate_business_credits", {
      _business_id: businessId,
      _amount: amount,
    });

    if (error || data === false) {
      toast({
        title: "Allocation impossible",
        description: error?.message || "Pool insuffisant.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Crédits alloués ✓",
        description: `${amount} crédits transférés.`,
      });
      setAmounts((prev) => ({ ...prev, [businessId]: "" }));
      await fetchData();
      onChange?.();
    }
    setAllocating(null);
  };

  if (!isAgency) return null;

  return (
    <div className="bg-gradient-to-br from-primary/5 via-card to-secondary/5 rounded-2xl border border-primary/20 p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground text-sm">Pool Agence</h2>
            <p className="text-xs text-muted-foreground">
              Allouez des crédits par établissement
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1.5 justify-end">
            <Coins className="w-4 h-4 text-primary" />
            <span className="text-2xl font-bold text-foreground">{pool}</span>
          </div>
          <p className="text-[10px] text-muted-foreground">crédits restants</p>
        </div>
      </div>

      <Sheet>
        <SheetTrigger asChild>
          <Button size="sm" className="w-full gap-2" disabled={loading || businesses.length === 0}>
            <Building2 className="w-4 h-4" />
            Gérer les crédits par établissement
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-primary" />
              Allocation des crédits
            </SheetTitle>
          </SheetHeader>

          <div className="py-4 space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-primary/5 border border-primary/20">
              <span className="text-sm font-medium text-foreground">Pool disponible</span>
              <div className="flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-primary" />
                <span className="font-bold text-foreground">{pool}</span>
              </div>
            </div>

            {businesses.map((b) => (
              <div
                key={b.id}
                className="p-3 rounded-xl border border-border bg-card"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Building2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm font-medium text-foreground truncate">{b.name}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                    <Coins className="w-3.5 h-3.5 text-primary" />
                    <span className="font-semibold text-foreground">{b.credits}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label htmlFor={`alloc-${b.id}`} className="sr-only">
                      Quantité
                    </Label>
                    <Input
                      id={`alloc-${b.id}`}
                      type="number"
                      min={1}
                      max={pool}
                      placeholder="Quantité"
                      value={amounts[b.id] || ""}
                      onChange={(e) =>
                        setAmounts((prev) => ({ ...prev, [b.id]: e.target.value }))
                      }
                      className="h-9"
                    />
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleAllocate(b.id)}
                    disabled={allocating === b.id || pool === 0}
                    className="gap-1"
                  >
                    {allocating === b.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <ArrowRight className="w-3.5 h-3.5" />
                    )}
                    Allouer
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};
