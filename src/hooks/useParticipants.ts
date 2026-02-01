import { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabaseClient";

export type Participant = {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  allow_gallery: boolean;
};

export function useParticipants(vacationId: number) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchParticipants = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("vacation_participants")
      .select(
        `
        user_id,
        allow_gallery,
        profiles!user_id (
          display_name,
          avatar_url
        )
      `,
      )
      .eq("vacation_id", vacationId);

    if (!error && data) {
      setParticipants(
        data.map((p: any) => ({
          user_id: p.user_id,
          allow_gallery: p.allow_gallery ?? false,
          display_name: p.profiles?.display_name || null,
          avatar_url: p.profiles?.avatar_url || null,
        })),
      );
    }
    setLoading(false);
  }, [vacationId]);

  useEffect(() => {
    fetchParticipants();
  }, [fetchParticipants]);

  const joinVacation = async (userId: string) => {
    const { error } = await supabase
      .from("vacation_participants")
      .insert([
        { vacation_id: vacationId, user_id: userId, allow_gallery: false },
      ]);

    if (!error) {
      fetchParticipants();
      return true;
    }
    return false;
  };

  const updateGalleryAccess = async (userId: string, allow: boolean) => {
    const { error } = await supabase
      .from("vacation_participants")
      .update({ allow_gallery: allow })
      .eq("vacation_id", vacationId)
      .eq("user_id", userId);

    if (!error) {
      fetchParticipants();
      return true;
    }
    return false;
  };

  const leaveVacation = async (userId: string) => {
    const { error } = await supabase
      .from("vacation_participants")
      .delete()
      .eq("vacation_id", vacationId)
      .eq("user_id", userId);

    if (!error) {
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
    refreshParticipants: fetchParticipants,
  };
}
