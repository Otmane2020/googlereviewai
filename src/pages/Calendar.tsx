import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, ChevronLeft, ChevronRight, FileText, Sparkles, Check, Clock, AlertCircle, Loader2 } from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  parseISO,
} from "date-fns";

interface ContentItem {
  id: string;
  content_type: string;
  scheduled_date: string;
  status: string;
  title: string | null;
  question: string | null;
  business_id: string;
}

const STATUS_STYLE: Record<string, { label: string; className: string; icon: any }> = {
  published: { label: "Publié", className: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30", icon: Check },
  generated: { label: "Prêt", className: "bg-primary/15 text-primary border-primary/30", icon: Sparkles },
  generating: { label: "Génération", className: "bg-blue-500/15 text-blue-600 border-blue-500/30", icon: Loader2 },
  failed: { label: "Échec", className: "bg-destructive/15 text-destructive border-destructive/30", icon: AlertCircle },
  pending: { label: "Planifié", className: "bg-muted text-muted-foreground border-border", icon: Clock },
};

const Calendar = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(new Date());

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("scheduled_content")
        .select("id, content_type, scheduled_date, status, title, question, business_id")
        .eq("user_id", user.id)
        .order("scheduled_date", { ascending: true });
      setItems((data as ContentItem[]) || []);
      setLoading(false);
    })();
  }, [user]);

  const monthStart = startOfMonth(cursor);
  const monthEnd = endOfMonth(cursor);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = useMemo(() => {
    const out: Date[] = [];
    let d = gridStart;
    while (d <= gridEnd) {
      out.push(d);
      d = addDays(d, 1);
    }
    return out;
  }, [gridStart, gridEnd]);

  const itemsByDay = useMemo(() => {
    const map = new Map<string, ContentItem[]>();
    items.forEach((it) => {
      const key = it.scheduled_date;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(it);
    });
    return map;
  }, [items]);

  const selectedItems = selectedDay
    ? itemsByDay.get(format(selectedDay, "yyyy-MM-dd")) || []
    : [];

  return (
    <div className="bg-gradient-to-b from-background to-muted/20 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
            <CalendarDays className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Calendrier de contenu</h1>
            <p className="text-sm text-muted-foreground">All your scheduled SEO articles & GEO Q&As in one view.</p>
          </div>
        </div>

        <Card className="rounded-2xl border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-lg">{format(cursor, "MMMM yyyy")}</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => setCursor(subMonths(cursor, 1))}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => { setCursor(new Date()); setSelectedDay(new Date()); }}>
                Today
              </Button>
              <Button variant="outline" size="icon" onClick={() => setCursor(addMonths(cursor, 1))}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                <div key={d} className="text-[11px] font-semibold text-muted-foreground text-center py-1">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {loading ? (
                <div className="col-span-7 py-12 flex justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : (
                days.map((day) => {
                  const key = format(day, "yyyy-MM-dd");
                  const dayItems = itemsByDay.get(key) || [];
                  const inMonth = isSameMonth(day, cursor);
                  const isToday = isSameDay(day, new Date());
                  const isSelected = selectedDay && isSameDay(day, selectedDay);
                  const seoCount = dayItems.filter((i) => i.content_type === "seo_article").length;
                  const geoCount = dayItems.filter((i) => i.content_type === "aeo_qa").length;
                  return (
                    <button
                      key={key}
                      onClick={() => setSelectedDay(day)}
                      className={`min-h-[84px] rounded-lg border p-2 text-left transition-all ${
                        isSelected
                          ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                          : "border-border hover:border-primary/40 hover:bg-muted/40"
                      } ${!inMonth ? "opacity-40" : ""}`}
                    >
                      <div className={`flex items-center justify-between mb-1 ${isToday ? "text-primary font-bold" : "text-foreground"}`}>
                        <span className="text-xs font-semibold">{format(day, "d")}</span>
                        {isToday && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
                      </div>
                      <div className="space-y-1">
                        {seoCount > 0 && (
                          <div className="flex items-center gap-1 text-[10px] text-primary">
                            <FileText className="w-2.5 h-2.5" />
                            <span className="font-semibold">{seoCount} SEO</span>
                          </div>
                        )}
                        {geoCount > 0 && (
                          <div className="flex items-center gap-1 text-[10px] text-emerald-600">
                            <Sparkles className="w-2.5 h-2.5" />
                            <span className="font-semibold">{geoCount} GEO</span>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">
              {selectedDay ? format(selectedDay, "EEEE, MMMM d, yyyy") : "Pick a day"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedItems.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                Nothing scheduled for this day.
              </div>
            ) : (
              <div className="space-y-2">
                {selectedItems.map((item) => {
                  const s = STATUS_STYLE[item.status] || STATUS_STYLE.pending;
                  const Icon = s.icon;
                  const isGeo = item.content_type === "aeo_qa";
                  return (
                    <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isGeo ? "bg-emerald-500/10 text-emerald-600" : "bg-primary/10 text-primary"}`}>
                        {isGeo ? <Sparkles className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {item.title || item.question || (isGeo ? "GEO Q&A" : "SEO Article")}
                        </p>
                        <p className="text-[11px] text-muted-foreground uppercase tracking-wide">
                          {isGeo ? "GEO · Google Q&A" : "SEO · Google Post"}
                        </p>
                      </div>
                      <Badge variant="outline" className={`${s.className} text-[10px] gap-1`}>
                        <Icon className={`w-3 h-3 ${item.status === "generating" ? "animate-spin" : ""}`} />
                        {s.label}
                      </Badge>
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
};

export default Calendar;
