import { useState, useCallback } from "react";
import { supabase } from "../supabaseClient";

export type ItemParticipant = {
  item_id: number;
  user_id: string;
  display_name: string | null;
};

export function useItemParticipants(type: "location" | "agenda") {
  const [participants, setParticipants] = useState<
    Record<number, ItemParticipant[]>
  >({});
  const tableName =
    type === "location" ? "location_participants" : "agenda_participants";
  const idColumn = type === "location" ? "location_id" : "agenda_id";

  const fetchParticipants = useCallback(
    async (itemIds: number[]) => {
      if (itemIds.length === 0) return;

      const { data, error } = await supabase
        .from(tableName)
        .select(
          `
        ${idColumn},
        profile_id,
        profiles (
          display_name
        )
      `
        )
        .in(idColumn, itemIds);

      if (!error && data) {
        const grouped = data.reduce((acc: any, curr: any) => {
          const itemId = curr[idColumn];
          if (!acc[itemId]) acc[itemId] = [];
          acc[itemId].push({
            item_id: itemId,
            user_id: curr.profile_id,
            display_name: curr.profiles?.display_name || null,
          });
          return acc;
        }, {});
        setParticipants(grouped);
      }
    },
    [tableName, idColumn]
  );

  const joinItem = async (itemId: number, userId: string) => {
    const { error } = await supabase
      .from(tableName)
      .insert([{ [idColumn]: itemId, profile_id: userId }]);

    if (!error) {
      fetchParticipants([itemId]);
      return true;
    }
    return false;
  };

  const leaveItem = async (itemId: number, userId: string) => {
    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq(idColumn, itemId)
      .eq("profile_id", userId);

    if (!error) {
      fetchParticipants([itemId]);
      return true;
    }
    return false;
  };

  return {
    participants,
    joinItem,
    leaveItem,
    fetchParticipants,
  };
}
