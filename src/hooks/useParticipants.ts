import { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabaseClient";

export type Participant = {
  user_id: string;
  display_name: string | null;
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
        profiles (
          display_name
        )
      `
      )
      .eq("vacation_id", vacationId);

    if (!error && data) {
      setParticipants(
        data.map((p: any) => ({
          user_id: p.user_id,
          display_name: p.profiles?.display_name || null,
        }))
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
      .insert([{ vacation_id: vacationId, user_id: userId }]);

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
    refreshParticipants: fetchParticipants,
  };
}
