import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean | null;
  review_id: number | null;
  created_at: string;
}

const PAGE_SIZE = 25;
const FIELDS = "id,type,title,message,read,review_id,created_at";

/**
 * Notifications intended for users. email_* rows are operational audit logs,
 * not inbox messages; they remain untouched in the database.
 */
export const useNotifications = () => {
  const { user } = useAuth();
  const userId = user?.id;
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 300);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const refresh = useCallback(() => {
    setPage(0);
    setRefreshKey((value) => value + 1);
  }, []);

  const changeSearch = useCallback((value: string) => {
    setSearchQuery(value);
    setPage(0);
  }, []);

  const changeOnlyUnread = useCallback((value: boolean) => {
    setOnlyUnread(value);
    setPage(0);
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (!userId) {
      setNotifications([]);
      setUnreadCount(0);
      setHasMore(false);
      setLoading(false);
      setError(null);
      return;
    }

    const fetchNotifications = async () => {
      setLoading(true);
      setError(null);
      const safeSearch = debouncedSearch.replace(/[(),.%_*\\]/g, " ").trim().slice(0, 120);

      let query = supabase
        .from("notifications")
        .select(FIELDS)
        .eq("user_id", userId)
        .not("type", "like", "email_%")
        .order("created_at", { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (onlyUnread) query = query.or("read.eq.false,read.is.null");
      if (safeSearch) {
        query = query.or("title.ilike.%" + safeSearch + "%,message.ilike.%" + safeSearch + "%");
      }

      const countQuery = supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .not("type", "like", "email_%")
        .or("read.eq.false,read.is.null");

      const [itemsResult, countResult] = await Promise.all([query, countQuery]);
      if (cancelled) return;

      if (itemsResult.error || countResult.error) {
        setError(itemsResult.error?.message || countResult.error?.message || "Unable to load notifications");
        setLoading(false);
        return;
      }

      const items = (itemsResult.data || []) as Notification[];
      setNotifications((previous) => {
        if (page === 0) return items;
        const ids = new Set(previous.map((item) => item.id));
        return [...previous, ...items.filter((item) => !ids.has(item.id))];
      });
      setHasMore(items.length === PAGE_SIZE);
      setUnreadCount(countResult.count ?? 0);
      setLoading(false);
    };

    void fetchNotifications();
    return () => { cancelled = true; };
  }, [userId, page, debouncedSearch, onlyUnread, refreshKey]);

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel("notifications-live-" + userId + "-" + Math.random().toString(36).slice(2))
      .on("postgres_changes", {
        event: "*", schema: "public", table: "notifications", filter: "user_id=eq." + userId,
      }, () => refresh())
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [userId, refresh]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) setPage((value) => value + 1);
  }, [loading, hasMore]);

  const markAsRead = useCallback(async (id: string): Promise<boolean> => {
    if (!userId) return false;
    const { error: updateError } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", userId)
      .eq("id", id);
    if (updateError) {
      setError(updateError.message);
      return false;
    }
    setNotifications((previous) => previous.map((item) =>
      item.id === id ? { ...item, read: true } : item
    ));
    refresh();
    return true;
  }, [userId, refresh]);

  const markAllAsRead = useCallback(async (): Promise<boolean> => {
    if (!userId) return false;
    const { error: updateError } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", userId)
      .not("type", "like", "email_%")
      .or("read.eq.false,read.is.null");
    if (updateError) {
      setError(updateError.message);
      return false;
    }
    setNotifications((previous) => previous.map((item) => ({ ...item, read: true })));
    refresh();
    return true;
  }, [userId, refresh]);

  return {
    notifications, unreadCount, loading, error, hasMore, loadMore,
    onlyUnread, setOnlyUnread: changeOnlyUnread,
    searchQuery, setSearchQuery: changeSearch,
    markAsRead, markAllAsRead, refresh,
  };
};
