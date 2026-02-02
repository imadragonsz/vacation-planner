import { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabaseClient";

export type NotificationType =
  | "join"
  | "leave"
  | "edit_access"
  | "gallery_access";

export interface Notification {
  id: number;
  user_id: string;
  sender_id: string;
  vacation_id: number;
  type: NotificationType;
  message: string;
  is_read: boolean;
  created_at: string;
  profiles?: {
    display_name: string | null;
    avatar_url: string | null;
  };
  vacations?: {
    name: string;
  };
}

export function useNotifications(userId: string | undefined) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("notifications")
      .select(
        `
        *,
        profiles!sender_id (display_name, avatar_url),
        vacations!vacation_id (name)
      `,
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (!error && data) {
      setNotifications(data);
      setUnreadCount(data.filter((n) => !n.is_read).length);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchNotifications();

    if (!userId) return;

    // Realtime subscription
    const channel = supabase
      .channel(`notifications_user_${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
        },
        () => {
          fetchNotifications();
        },
      )
      .subscribe((status) => {
        console.log("Realtime subscription status:", status);
        if (status === "TIMED_OUT" || status === "CLOSED") {
          console.warn("Realtime connection issues. Retrying in 10s...");
          setTimeout(() => {
            if (userId) fetchNotifications();
          }, 10000);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchNotifications]);

  const markAsRead = async (id: number) => {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id);

    if (!error) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  };

  const markAllAsRead = async () => {
    if (!userId) return;
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false);

    if (!error) {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    }
  };

  return {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    refresh: fetchNotifications,
  };
}

export async function createNotification(
  recipientId: string,
  senderId: string,
  vacationId: number,
  type: NotificationType,
  message: string,
) {
  // Don't notify yourself
  if (recipientId === senderId) return;

  const { error } = await supabase.from("notifications").insert([
    {
      user_id: recipientId,
      sender_id: senderId,
      vacation_id: vacationId,
      type,
      message,
    },
  ]);
  return !error;
}
