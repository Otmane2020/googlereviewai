import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";
import { DashboardHeader } from "@/components/DashboardHeader";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Bell, 
  Search, 
  Star, 
  Sparkles, 
  FileText,
  Target,
  MoreHorizontal,
  Loader2,
  CheckCheck,
  BellRing,
  BellOff
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "new_review":
    case "pending_reviews":
      return { icon: Star, color: "bg-yellow-500", iconColor: "text-white" };
    case "ai_response":
    case "ai_tip":
      return { icon: Sparkles, color: "bg-purple-500", iconColor: "text-white" };
    case "seo_reminder":
    case "seo_promo":
      return { icon: FileText, color: "bg-blue-500", iconColor: "text-white" };
    case "aeo_reminder":
    case "aeo_promo":
      return { icon: Target, color: "bg-green-500", iconColor: "text-white" };
    default:
      return { icon: Bell, color: "bg-primary", iconColor: "text-primary-foreground" };
  }
};

const getTimeAgo = (dateString: string) => {
  return formatDistanceToNow(new Date(dateString), { addSuffix: false });
};

const Notifications = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission | "unsupported">("default");

  // Check notification permission
  useEffect(() => {
    if ("Notification" in window) {
      setPushPermission(Notification.permission);
    } else {
      setPushPermission("unsupported");
    }
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    navigate("/auth");
    return null;
  }

  // Filter notifications based on search
  const filteredNotifications = notifications.filter(
    (n) =>
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group notifications by time
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const newNotifications = filteredNotifications.filter(
    (n) => new Date(n.created_at) > oneDayAgo
  );
  const olderNotifications = filteredNotifications.filter(
    (n) => new Date(n.created_at) <= oneDayAgo
  );

  const handleNotificationClick = (notification: typeof notifications[0]) => {
    markAsRead(notification.id);
    
    if (notification.type === "new_review" && notification.review_id) {
      navigate(`/reviews?review_id=${notification.review_id}`);
    } else if (notification.type === "pending_reviews" || notification.review_id) {
      navigate(notification.review_id ? `/reviews?review_id=${notification.review_id}` : "/reviews?status=pending");
    } else if (notification.type === "seo_reminder" || notification.type === "seo_promo") {
      navigate("/seo-autopost");
    } else if (notification.type === "aeo_reminder" || notification.type === "aeo_promo") {
      navigate("/aeo-rank");
    } else if (notification.type === "ai_tip") {
      navigate("/ai-settings");
    } else if (notification.type === "ai_response" && notification.review_id) {
      navigate(`/reviews?review_id=${notification.review_id}`);
    } else {
      navigate("/reviews");
    }
  };

  const NotificationItem = ({ notification }: { notification: typeof notifications[0] }) => {
    const { icon: Icon, color, iconColor } = getNotificationIcon(notification.type);
    
    return (
      <div
        className={`flex items-start gap-3 p-4 hover:bg-muted/50 transition-colors cursor-pointer ${
          !notification.read ? "bg-primary/5" : ""
        }`}
        onClick={() => handleNotificationClick(notification)}
      >
        <div className="relative flex-shrink-0">
          <div className={`w-14 h-14 rounded-full ${color} flex items-center justify-center`}>
            <Icon className={`w-6 h-6 ${iconColor}`} />
          </div>
          {!notification.read && (
            <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-primary rounded-full border-2 border-background" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className={`text-sm leading-snug ${!notification.read ? "font-semibold" : "font-medium"}`}>
            <span className="text-foreground">{notification.title}</span>
            {" "}
            <span className="text-muted-foreground">{notification.message}</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {getTimeAgo(notification.created_at)}
          </p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
              <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => {
              e.stopPropagation();
              markAsRead(notification.id);
            }}>
              <CheckCheck className="w-4 h-4 mr-2" />
              Mark as read
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <DashboardHeader />

      <main className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="sticky top-14 z-40 bg-background border-b border-border/50">
          <div className="flex items-center justify-between px-4 py-3">
            <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10"
                onClick={() => setShowSearch(!showSearch)}
              >
                <Search className="w-5 h-5" />
              </Button>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-primary text-sm"
                  onClick={markAllAsRead}
                >
                  Mark all read
                </Button>
              )}
            </div>
          </div>

          {/* Search bar */}
          {showSearch && (
            <div className="px-4 pb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 rounded-xl"
                  autoFocus
                />
              </div>
            </div>
          )}
          
          {/* Push notification status - PushAlert handles subscription */}
          <div className="px-4 py-3 border-t border-border/30">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {pushPermission === "granted" ? (
                  <BellRing className="w-4 h-4 text-green-500" />
                ) : (
                  <BellOff className="w-4 h-4 text-muted-foreground" />
                )}
                <span className="text-sm text-muted-foreground">
                  {pushPermission === "granted" 
                    ? "Notifications enabled" 
                    : pushPermission === "denied"
                      ? "Notifications blocked"
                      : "Notifications not set up"
                  }
                </span>
              </div>
              {pushPermission === "denied" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.reload()}
                  className="rounded-lg text-xs"
                >
                  Reload
                </Button>
              )}
            </div>
            {pushPermission === "denied" && (
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                Click 🔒 in the address bar → Notifications → Allow
              </p>
            )}
          </div>
        </div>

        {/* Notifications list */}
        {filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
              <Bell className="w-10 h-10 text-muted-foreground/50" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-1">Aucune notification</h2>
            <p className="text-sm text-muted-foreground">
              You'll receive notifications here for new activity
            </p>
          </div>
        ) : (
          <div>
            {newNotifications.length > 0 && (
              <div>
                <div className="px-4 py-3 bg-muted/30">
                  <h2 className="text-base font-bold text-foreground">Nouveau</h2>
                </div>
                <div className="divide-y divide-border/50">
                  {newNotifications.map((notification) => (
                    <NotificationItem key={notification.id} notification={notification} />
                  ))}
                </div>
              </div>
            )}

            {olderNotifications.length > 0 && (
              <div>
                <div className="px-4 py-3 bg-muted/30">
                  <h2 className="text-base font-bold text-foreground">Plus ancien</h2>
                </div>
                <div className="divide-y divide-border/50">
                  {olderNotifications.map((notification) => (
                    <NotificationItem key={notification.id} notification={notification} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <MobileBottomNav />
    </div>
  );
};

export default Notifications;
