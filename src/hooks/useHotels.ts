import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export type Hotel = {
  id: number;
  location_id: number;
  name: string;
  url: string | null;
  price: number | null;
  rating: number | null;
  notes: string | null;
  is_selected: boolean;
};

export function useHotels(locationId: number | null) {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (locationId) fetchHotels(locationId);
  }, [locationId]);

  async function fetchHotels(locId: number) {
    setLoading(true);
    const { data, error } = await supabase
      .from("hotels")
      .select("*")
      .eq("location_id", locId)
      .order("is_selected", { ascending: false })
      .order("price", { ascending: true });
    if (!error && data) setHotels(data as Hotel[]);
    setLoading(false);
  }

  async function addHotel(
    name: string,
    url?: string,
    price?: number,
    rating?: number,
    notes?: string,
  ) {
    if (!locationId) return;
    const { error } = await supabase.from("hotels").insert([
      {
        location_id: locationId,
        name,
        url,
        price,
        rating,
        notes,
        is_selected: false,
      },
    ]);
    if (!error) fetchHotels(locationId);
    return error;
  }

  async function deleteHotel(id: number) {
    const { error } = await supabase.from("hotels").delete().eq("id", id);
    if (!error && locationId) fetchHotels(locationId);
  }

  async function setSelectedHotel(id: number | null) {
    if (!locationId) return;

    // Unselect all others for this location
    await supabase
      .from("hotels")
      .update({ is_selected: false })
      .eq("location_id", locationId);

    if (id !== null) {
      // Select the target one
      await supabase.from("hotels").update({ is_selected: true }).eq("id", id);
    }

    fetchHotels(locationId);
  }

  async function updateHotel(id: number, updates: Partial<Hotel>) {
    const { error } = await supabase
      .from("hotels")
      .update(updates)
      .eq("id", id);
    if (!error && locationId) fetchHotels(locationId);
  }

  return {
    hotels,
    loading,
    addHotel,
    deleteHotel,
    setSelectedHotel,
    updateHotel,
    fetchHotels,
  };
}
