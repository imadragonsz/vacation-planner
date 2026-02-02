import { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabaseClient";
import { createNotification } from "./useNotifications";

export type Participant = {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  allow_gallery: boolean;
  allow_edit: boolean;
};

export function useParticipants(vacationId: number) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchParticipants = useCallback(async () => {
    setLoading(true);

    // 1. Fetch owner info from vacations table
    const { data: vacData } = await supabase
      .from("vacations")
      .select(
        `
        user_id,
        profiles!user_id (
          display_name,
          avatar_url
        )
      `,
      )
      .eq("id", vacationId)
      .single();

    // 2. Fetch other participants
    const { data, error } = await supabase
      .from("vacation_participants")
      .select(
        `
        user_id,
        allow_gallery,
        allow_edit,
        profiles!user_id (
          display_name,
          avatar_url
        )
      `,
      )
      .eq("vacation_id", vacationId);

    const result: Participant[] = [];

    // Add owner first
    if (vacData) {
      const ownerProfile = Array.isArray(vacData.profiles)
        ? vacData.profiles[0]
        : vacData.profiles;
      result.push({
        user_id: vacData.user_id,
        allow_gallery: true, // Owner always has access
        allow_edit: true,
        display_name: ownerProfile?.display_name || "Owner",
        avatar_url: ownerProfile?.avatar_url || null,
      });
    }

    // Add other participants
    if (!error && data) {
      data.forEach((p: any) => {
        // Avoid adding owner twice if they are also in the participants table
        if (vacData && p.user_id === vacData.user_id) return;

        result.push({
          user_id: p.user_id,
          allow_gallery: p.allow_gallery ?? false,
          allow_edit: p.allow_edit ?? false,
          display_name: p.profiles?.display_name || null,
          avatar_url: p.profiles?.avatar_url || null,
        });
      });
    }

    setParticipants(result);
    setLoading(false);
  }, [vacationId]);

  useEffect(() => {
    fetchParticipants();
  }, [fetchParticipants]);

  const joinVacation = async (userId: string) => {
    // Check if already a participant to avoid 409
    const { data: existing } = await supabase
      .from("vacation_participants")
      .select("user_id")
      .eq("vacation_id", vacationId)
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) return true;

    // Get vacation info to notify owner
    const { data: vacData } = await supabase
      .from("vacations")
      .select("name, user_id, profiles!user_id(display_name)")
      .eq("id", vacationId)
      .single();

    const { error } = await supabase.from("vacation_participants").insert([
      {
        vacation_id: vacationId,
        user_id: userId,
        allow_gallery: false,
        allow_edit: false,
      },
    ]);

    if (!error) {
      if (vacData && vacData.user_id !== userId) {
        // Fetch joining user's name
        const { data: userData } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("id", userId)
          .single();

        await createNotification(
          vacData.user_id,
          userId,
          vacationId,
          "join",
          `${userData?.display_name || "Someone"} joined your trip "${vacData.name}"`,
        );
      }
      fetchParticipants();
      return true;
    }
    return false;
  };

  const updateGalleryAccess = async (userId: string, allow: boolean) => {
    // Get vacation info to notify user
    const { data: vacData } = await supabase
      .from("vacations")
      .select("name, user_id")
      .eq("id", vacationId)
      .single();

    const { error } = await supabase
      .from("vacation_participants")
      .update({ allow_gallery: allow })
      .eq("vacation_id", vacationId)
      .eq("user_id", userId);

    if (!error) {
      if (vacData && vacData.user_id !== userId) {
        await createNotification(
          userId,
          vacData.user_id,
          vacationId,
          "gallery_access",
          `You have been ${allow ? "granted" : "revoked"} gallery access for "${vacData.name}"`,
        );
      }
      fetchParticipants();
      return true;
    }
    return false;
  };

  const updateEditAccess = async (userId: string, allow: boolean) => {
    // Get vacation info to notify user
    const { data: vacData } = await supabase
      .from("vacations")
      .select("name, user_id")
      .eq("id", vacationId)
      .single();

    const { error } = await supabase
      .from("vacation_participants")
      .update({ allow_edit: allow })
      .eq("vacation_id", vacationId)
      .eq("user_id", userId);

    if (!error) {
      if (vacData && vacData.user_id !== userId) {
        await createNotification(
          userId,
          vacData.user_id,
          vacationId,
          "edit_access",
          `You have been ${allow ? "granted" : "revoked"} editing permissions for "${vacData.name}"`,
        );
      }
      fetchParticipants();
      return true;
    }
    return false;
  };

  const leaveVacation = async (userId: string) => {
    // Get vacation info before leaving
    const { data: vacData } = await supabase
      .from("vacations")
      .select("name, user_id")
      .eq("id", vacationId)
      .single();

    const { error } = await supabase
      .from("vacation_participants")
      .delete()
      .eq("vacation_id", vacationId)
      .eq("user_id", userId);

    if (!error) {
      if (vacData && vacData.user_id !== userId) {
        const { data: userData } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("id", userId)
          .single();

        await createNotification(
          vacData.user_id,
          userId,
          vacationId,
          "leave",
          `${userData?.display_name || "Someone"} left your trip "${vacData.name}"`,
        );
      }
      fetchParticipants();
      return true;
    }
    return false;
  };

  return {
    participants,
    loading,
    joinVacation,
    leaveVacation,
    updateGalleryAccess,
    updateEditAccess,
    refreshParticipants: fetchParticipants,
  };
}
