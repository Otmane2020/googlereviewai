import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CalendarDays, ChevronLeft, ChevronRight, FileText, Sparkles, Check, Clock, AlertCircle, Loader2, ExternalLink } from "lucide-react";
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
} from "date-fns";
import { fr, enUS } from "date-fns/locale";

interface ContentItem {
  id: string;
  content_type: string;
  scheduled_date: string;
  status: string;
  title: string | null;
  question: string | null;
  business_id: string;
}

interface ContentDetail extends ContentItem {
  content: string | null;
  answer: string | null;
  keyword_used: string | null;
  google_post_id: string | null;
  published_at: string | null;
  error_message: string | null;
}

const Calendar = () => {
  const { user } = useAuth();
  const { i18n } = useTranslation();
  const isEN = i18n.language?.toLowerCase().startsWith("en");
  const t = (fr: string, en: string) => (isEN ? en : fr);
  const dateLocale = isEN ? enUS : fr;

  const STATUS_STYLE: Record<string, { label: string; className: string; icon: any }> = {
    published: { label: t("Publié", "Published"), className: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30", icon: Check },
    generated: { label: t("Prêt", "Ready"), className: "bg-primary/15 text-primary border-primary/30", icon: Sparkles },
    generating: { label: t("Génération", "Generating"), className: "bg-blue-500/15 text-blue-600 border-blue-500/30", icon: Loader2 },
    failed: { label: t("Échec", "Failed"), className: "bg-destructive/15 text-destructive border-destructive/30", icon: AlertCircle },
    pending: { label: t("Planifié", "Scheduled"), className: "bg-muted text-muted-foreground border-border", icon: Clock },
  };

  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(new Date());
  const [detail, setDetail] = useState<ContentDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [dayPopup, setDayPopup] = useState<{ day: Date; items: ContentItem[] } | null>(null);

  const handleDayClick = (day: Date, dayItems: ContentItem[]) => {
    setSelectedDay(day);
    if (dayItems.length === 1) {
      openDetail(dayItems[0]);
    } else if (dayItems.length > 1) {
      setDayPopup({ day, items: dayItems });
    }
  };

  const openDetail = async (item: ContentItem) => {
    setDetailLoading(true);
    setDetail({ ...item, content: null, answer: null, keyword_used: null, google_post_id: null, published_at: null, error_message: null });
    const { data } = await supabase
      .from("scheduled_content")
      .select("id, content_type, scheduled_date, status, title, question, business_id, content, answer, keyword_used, google_post_id, published_at, error_message")
      .eq("id", item.id)
      .maybeSingle();
    if (data) setDetail(data as ContentDetail);
    setDetailLoading(false);
  };

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
            <h1 className="text-2xl font-bold text-foreground">{t("Calendrier de contenu", "Content calendar")}</h1>
            <p className="text-sm text-muted-foreground">{t("Tous vos articles SEO et Q&R GEO planifiés en un coup d'œil.", "All your scheduled SEO articles and GEO Q&A at a glance.")}</p>
          </div>
        </div>

        <Card className="rounded-2xl border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-lg">{format(cursor, "MMMM yyyy", { locale: dateLocale })}</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => setCursor(subMonths(cursor, 1))}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => { setCursor(new Date()); setSelectedDay(new Date()); }}>
                {t("Aujourd'hui", "Today")}
              </Button>
              <Button variant="outline" size="icon" onClick={() => setCursor(addMonths(cursor, 1))}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {(isEN ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] : ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"]).map((d) => (
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
                      onClick={() => handleDayClick(day, dayItems)}
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
              {selectedDay ? format(selectedDay, "EEEE d MMMM yyyy", { locale: dateLocale }) : t("Choisissez un jour", "Pick a day")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedItems.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                {t("Rien de planifié pour ce jour.", "Nothing scheduled for this day.")}
              </div>
            ) : (
              <div className="space-y-2">
                {selectedItems.map((item) => {
                  const s = STATUS_STYLE[item.status] || STATUS_STYLE.pending;
                  const Icon = s.icon;
                  const isGeo = item.content_type === "aeo_qa";
                  return (
                    <button
                      key={item.id}
                      onClick={() => openDetail(item)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-muted/40 transition-all text-left"
                    >
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isGeo ? "bg-emerald-500/10 text-emerald-600" : "bg-primary/10 text-primary"}`}>
                        {isGeo ? <Sparkles className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {item.title || item.question || (isGeo ? t("Q&R GEO", "GEO Q&A") : t("Article SEO", "SEO Article"))}
                        </p>
                        <p className="text-[11px] text-muted-foreground uppercase tracking-wide">
                          {isGeo ? t("GEO · Q&R Google", "GEO · Google Q&A") : t("SEO · Post Google", "SEO · Google Post")}
                        </p>
                      </div>
                      <Badge variant="outline" className={`${s.className} text-[10px] gap-1`}>
                        <Icon className={`w-3 h-3 ${item.status === "generating" ? "animate-spin" : ""}`} />
                        {s.label}
                      </Badge>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          {detail && (() => {
            const isGeo = detail.content_type === "aeo_qa";
            const s = STATUS_STYLE[detail.status] || STATUS_STYLE.pending;
            const Icon = s.icon;
            return (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isGeo ? "bg-emerald-500/10 text-emerald-600" : "bg-primary/10 text-primary"}`}>
                      {isGeo ? <Sparkles className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {isGeo ? t("GEO · Q&R Google", "GEO · Google Q&A") : t("SEO · Post Google", "SEO · Google Post")}
                      </p>
                      <DialogTitle className="text-base text-left truncate">
                        {detail.title || detail.question || (isGeo ? t("Q&R GEO", "GEO Q&A") : t("Article SEO", "SEO Article"))}
                      </DialogTitle>
                    </div>
                    <Badge variant="outline" className={`${s.className} text-[10px] gap-1 shrink-0`}>
                      <Icon className={`w-3 h-3 ${detail.status === "generating" ? "animate-spin" : ""}`} />
                      {s.label}
                    </Badge>
                  </div>
                  <DialogDescription className="text-xs">
                    {t("Planifié le", "Scheduled on")} {format(new Date(detail.scheduled_date), "EEEE d MMMM yyyy", { locale: dateLocale })}
                    {detail.published_at && ` · ${t("Publié le", "Published on")} ${format(new Date(detail.published_at), isEN ? "MMM d, yyyy 'at' HH:mm" : "d MMM yyyy 'à' HH:mm", { locale: dateLocale })}`}
                  </DialogDescription>
                </DialogHeader>

                <ScrollArea className="flex-1 -mx-6 px-6">
                  {detailLoading ? (
                    <div className="py-12 flex justify-center">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : (
                    <div className="space-y-4 py-2">
                      {detail.keyword_used && (
                        <div>
                          <p className="text-[11px] font-semibold uppercase text-muted-foreground mb-1">{t("Mot-clé ciblé", "Target keyword")}</p>
                          <Badge variant="secondary" className="text-xs">{detail.keyword_used}</Badge>
                        </div>
                      )}

                      {isGeo && detail.question && (
                        <div>
                          <p className="text-[11px] font-semibold uppercase text-muted-foreground mb-1">{t("Question", "Question")}</p>
                          <p className="text-sm font-medium text-foreground">{detail.question}</p>
                        </div>
                      )}

                      {isGeo && detail.answer && (
                        <div>
                          <p className="text-[11px] font-semibold uppercase text-muted-foreground mb-1">{t("Réponse", "Answer")}</p>
                          <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed p-3 rounded-lg bg-muted/40 border border-border/50">
                            {detail.answer}
                          </div>
                        </div>
                      )}

                      {!isGeo && detail.content && (
                        <div>
                          <p className="text-[11px] font-semibold uppercase text-muted-foreground mb-1">{t("Contenu de l'article", "Article content")}</p>
                          <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed p-3 rounded-lg bg-muted/40 border border-border/50">
                            {detail.content}
                          </div>
                        </div>
                      )}

                      {!detail.content && !detail.answer && !detail.error_message && !detailLoading && (
                        <div className="py-8 text-center text-sm text-muted-foreground">
                          {detail.status === "pending"
                            ? t("Le contenu n'a pas encore été généré.", "Content has not been generated yet.")
                            : detail.status === "generating"
                              ? t("Génération en cours...", "Generating...")
                              : t("Aucun contenu disponible.", "No content available.")}
                        </div>
                      )}

                      {detail.error_message && (
                        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                          <p className="text-[11px] font-semibold uppercase text-destructive mb-1">{t("Erreur", "Error")}</p>
                          <p className="text-sm text-destructive">{detail.error_message}</p>
                        </div>
                      )}
                    </div>
                  )}
                </ScrollArea>

                <DialogFooter className="gap-2 sm:gap-2">
                  {detail.google_post_id && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={`https://business.google.com/`} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                        {t("Voir sur Google", "View on Google")}
                      </a>
                    </Button>
                  )}
                  <Button variant="default" size="sm" onClick={() => setDetail(null)}>
                    {t("Fermer", "Close")}
                  </Button>
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Calendar;
