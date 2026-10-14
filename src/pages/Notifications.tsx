import { useEffect } from "react";
import { Helmet } from "react-helmet";
import { useNavigate } from "@/lib/router-compat";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications, type Notification as AppNotification } from "@/hooks/useNotifications";
import { useWebPush } from "@/hooks/useWebPush";
import { usePWA } from "@/hooks/usePWA";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import {
  Bell, Search, Star, FileText, Target, MoreHorizontal, Loader2, CheckCheck,
  BellRing, BellOff, Sparkles, CircleAlert, ChevronDown, RotateCw, Wallet, X,
  CheckCircle2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const styleForType = (type: string) => {
  if (["new_review", "pending_reviews", "review_deleted", "review_edited"].includes(type))
    return { Icon: Star, iconClass: "text-amber-600", bgClass: "bg-amber-500/10", category: "Avis", categoryEN: "Reviews" };
  if (["ai_response", "ai_response_edited", "reply_published"].includes(type))
    return { Icon: Sparkles, iconClass: "text-violet-600", bgClass: "bg-violet-500/10", category: "Réponses IA", categoryEN: "AI replies" };
  if (type.startsWith("seo_"))
    return { Icon: FileText, iconClass: "text-blue-600", bgClass: "bg-blue-500/10", category: "SEO", categoryEN: "SEO" };
  if (type.startsWith("aeo_") || type === "qa_published")
    return { Icon: Target, iconClass: "text-emerald-600", bgClass: "bg-emerald-500/10", category: "AEO", categoryEN: "AEO" };
  if (type === "low_credits")
    return { Icon: Wallet, iconClass: "text-orange-600", bgClass: "bg-orange-500/10", category: "Crédits", categoryEN: "Credits" };
  return { Icon: Bell, iconClass: "text-primary", bgClass: "bg-primary/10", category: "Information", categoryEN: "Information" };
};

const notificationDestination = (n: AppNotification) => {
  if (n.review_id != null) return "/reviews?review_id=" + encodeURIComponent(n.review_id);
  if (["new_review", "pending_reviews", "review_deleted", "review_edited", "reply_published"].includes(n.type))
    return "/reviews";
  if (n.type.startsWith("seo_")) return "/seo-autopost";
  if (n.type.startsWith("aeo_") || n.type === "qa_published") return "/aeo-rank";
  if (n.type === "low_credits") return "/select-plan";
  if (n.type === "ai_tip") return "/ai-settings";
  return "/dashboard";
};

const Notifications = () => {
  const { i18n } = useTranslation();
  const isEN = i18n.language?.toLowerCase().startsWith("en");
  const tr = (frText: string, enText: string) => isEN ? enText : frText;
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const {
    notifications, unreadCount, loading, error, hasMore, loadMore,
    onlyUnread, setOnlyUnread, searchQuery, setSearchQuery,
    markAsRead, markAllAsRead, refresh,
  } = useNotifications();
  const webPush = useWebPush();
  const { isIOS, isStandalone, isInstalled } = usePWA();

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [authLoading, user, navigate]);

  const openNotification = async (notification: AppNotification) => {
    if (!notification.read) {
      const ok = await markAsRead(notification.id);
      if (!ok) {
        toast({ title: tr("Impossible de marquer comme lu", "Could not mark as read"), variant: "destructive" });
      }
    }
    navigate(notificationDestination(notification));
  };

  const markAll = async () => {
    const ok = await markAllAsRead();
    toast({
      title: ok ? tr("Notifications marquées comme lues", "All notifications marked as read") : tr("Une erreur est survenue", "Something went wrong"),
      variant: ok ? "default" : "destructive",
    });
  };

  const setPush = async (enabled: boolean) => {
    if (enabled && isIOS && !isInstalled && !isStandalone) {
      toast({
        title: tr("Installez l'application", "Install the app first"),
        description: tr("Sur iPhone, ajoutez GoogleReviewAI à l'écran d'accueil avant d'activer les notifications.", "On iPhone, add GoogleReviewAI to your Home Screen before enabling notifications."),
        variant: "destructive",
      });
      return;
    }
    const ok = enabled ? await webPush.subscribe() : await webPush.unsubscribe();
    toast({
      title: ok
        ? enabled ? tr("Notifications activées", "Notifications enabled") : tr("Notifications désactivées", "Notifications disabled")
        : tr("Opération impossible", "Action failed"),
      description: !ok ? tr("Vérifiez les autorisations du navigateur et réessayez.", "Check browser permissions and try again.") : undefined,
      variant: ok ? "default" : "destructive",
    });
  };

  const sendTest = async () => {
    const ok = await webPush.sendTestNotification();
    toast({
      title: ok ? tr("Notification de test envoyée", "Test notification sent") : tr("Test non envoyé", "Test not sent"),
      description: !ok ? tr("Aucun abonnement valide ou erreur d'envoi.", "No valid subscription or a sending error.") : undefined,
      variant: ok ? "default" : "destructive",
    });
  };

  if (authLoading || !user) {
    return <div className="min-h-[50vh] flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      <Helmet>
        <title>{tr("Notifications", "Notifications")} | GoogleReviewAI</title>
        <meta name="robots" content="noindex, nofollow" />
        <link rel="canonical" href="https://googlereviewai.com/notifications" />
      </Helmet>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-7 space-y-6">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-primary/10">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">{tr("Notifications", "Notifications")}</h1>
              {unreadCount > 0 && <span className="rounded-full bg-primary/10 text-primary text-xs font-semibold px-2.5 py-1">{unreadCount > 99 ? "99+" : unreadCount} {tr("non lues", "unread")}</span>}
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{tr("Vos avis, réponses IA et alertes importantes au même endroit.", "Reviews, AI replies and important alerts in one place.")}</p>
          </div>
          <Button variant="outline" size="sm" className="gap-2 shrink-0 self-start" onClick={markAll} disabled={unreadCount === 0 || loading}>
            <CheckCheck className="h-4 w-4" /> {tr("Tout marquer comme lu", "Mark all as read")}
          </Button>
        </header>

        <section className="rounded-2xl border bg-card p-4 sm:p-5 space-y-3" aria-label={tr("Notifications navigateur", "Browser notifications")}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0">
              <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                {webPush.isSubscribed ? <BellRing className="h-5 w-5 text-emerald-600" /> : <BellOff className="h-5 w-5 text-muted-foreground" />}
              </div>
              <div>
                <h2 className="text-sm font-semibold">{tr("Alertes navigateur", "Browser alerts")}</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  {!webPush.isSupported
                    ? tr("Non prises en charge par ce navigateur.", "Not supported by this browser.")
                    : webPush.isSubscribed
                      ? tr("Abonnement push actif sur cet appareil.", "Push subscription active on this device.")
                      : webPush.permission === "denied"
                        ? tr("Bloquées par le navigateur. Autorisez-les dans les paramètres du site.", "Blocked by browser. Allow them in site settings.")
                        : tr("Recevez une alerte lorsqu'un nouvel avis arrive.", "Get an alert when a new review arrives.")}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {webPush.isSupported && webPush.isSubscribed && (
                <>
                  <Button variant="outline" size="sm" disabled={webPush.loading} onClick={sendTest}>
                    {tr("Tester", "Send test")}
                  </Button>
                  <Button variant="outline" size="sm" disabled={webPush.loading} onClick={() => setPush(false)}>
                    {tr("Désactiver", "Disable")}
                  </Button>
                </>
              )}
              {webPush.isSupported && !webPush.isSubscribed && webPush.permission !== "denied" && (
                <Button size="sm" disabled={webPush.loading} onClick={() => setPush(true)}>
                  {webPush.loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <BellRing className="h-4 w-4 mr-2" />}
                  {tr("Activer", "Enable")}
                </Button>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border bg-card overflow-hidden">
          <div className="p-4 border-b flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div className="flex rounded-lg bg-muted p-1 w-fit" role="group" aria-label={tr("Filtrer les notifications", "Filter notifications")}>
              <Button variant={!onlyUnread ? "secondary" : "ghost"} size="sm" className="h-8" onClick={() => setOnlyUnread(false)}>
                {tr("Toutes", "All")}
              </Button>
              <Button variant={onlyUnread ? "secondary" : "ghost"} size="sm" className="h-8" onClick={() => setOnlyUnread(true)}>
                {tr("Non lues", "Unread")}
              </Button>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input aria-label={tr("Rechercher", "Search")} placeholder={tr("Rechercher une notification…", "Search notifications…")}
                  value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)}
                  className="pl-9 pr-9 h-9" />
                {searchQuery && <button type="button" aria-label={tr("Effacer la recherche", "Clear search")} className="absolute right-2 top-1/2 -translate-y-1/2 p-1" onClick={() => setSearchQuery("")}><X className="h-4 w-4" /></button>}
              </div>
              <Button size="icon" variant="ghost" className="h-9 w-9 shrink-0" aria-label={tr("Actualiser", "Refresh")} onClick={refresh} disabled={loading}>
                <RotateCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
              </Button>
            </div>
          </div>

          {error && <div role="alert" className="flex items-center gap-2 m-4 p-3 text-sm bg-destructive/10 text-destructive rounded-lg">
            <CircleAlert className="h-4 w-4 shrink-0" />
            <span className="flex-1">{tr("Impossible de récupérer les notifications.", "Unable to load notifications.")}</span>
            <Button size="sm" variant="outline" onClick={refresh}>{tr("Réessayer", "Retry")}</Button>
          </div>}

          {loading && notifications.length === 0 ? (
            <div className="py-20 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : notifications.length === 0 && !error ? (
            <div className="px-4 py-20 text-center">
              <div className="mx-auto w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4"><CheckCircle2 className="h-7 w-7 text-muted-foreground" /></div>
              <h2 className="font-semibold">{tr("Aucune notification", "No notifications")}</h2>
              <p className="text-sm text-muted-foreground mt-1">{searchQuery ? tr("Aucun résultat. Essayez d'autres mots-clés.", "No results. Try different keywords.") : onlyUnread ? tr("Vous avez tout lu.", "You're all caught up.") : tr("Les nouvelles alertes apparaîtront ici.", "New alerts will appear here.")}</p>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {notifications.map((notification) => {
                const { Icon, iconClass, bgClass, category, categoryEN } = styleForType(notification.type);
                const date = new Date(notification.created_at);
                const time = Number.isNaN(date.getTime()) ? "" : formatDistanceToNow(date, { addSuffix: true, locale: isEN ? enUS : fr });
                return (
                  <div key={notification.id} className={"flex items-start gap-3 p-4 sm:p-5 hover:bg-muted/40 transition-colors " + (!notification.read ? "bg-primary/[0.035]" : "")}>
                    <div className={"w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0 " + bgClass}>
                      <Icon className={"w-5 h-5 " + iconClass} />
                    </div>
                    <button type="button" onClick={() => void openNotification(notification)} className="text-left flex-1 min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md">
                      <div className="flex items-center flex-wrap gap-2 mb-1">
                        {!notification.read && <span className="w-2 h-2 rounded-full bg-primary shrink-0" aria-label={tr("Non lue", "Unread")} />}
                        <span className="text-[11px] font-medium text-muted-foreground">{isEN ? categoryEN : category}</span>
                        <span className="text-[11px] text-muted-foreground">· {time}</span>
                      </div>
                      <p className={"text-sm text-foreground leading-snug " + (!notification.read ? "font-semibold" : "font-medium")}>{notification.title}</p>
                      <p className="text-sm text-muted-foreground leading-relaxed mt-1 break-words">{notification.message}</p>
                    </button>
                    {!notification.read && <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" aria-label={tr("Actions", "Actions")}><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => void markAsRead(notification.id)}>
                          <CheckCheck className="h-4 w-4 mr-2" />{tr("Marquer comme lu", "Mark as read")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>}
                  </div>
                );
              })}
            </div>
          )}

          {hasMore && <div className="border-t p-4 flex justify-center">
            <Button variant="outline" disabled={loading} onClick={loadMore} className="gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronDown className="h-4 w-4" />}
              {tr("Charger plus", "Load more")}
            </Button>
          </div>}
        </section>
      </main>
      <MobileBottomNav />
    </div>
  );
};

export default Notifications;
