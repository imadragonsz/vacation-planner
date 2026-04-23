import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { TEXT_LIMITS } from "../utils/textLimits";

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

    if (name.length > TEXT_LIMITS.SHORT) {
      window.dispatchEvent(
        new CustomEvent("show-toast", {
          detail: {
            message: `Hotel name must be ${TEXT_LIMITS.SHORT} characters or less.`,
            type: "error",
          },
        }),
      );
      return;
    }

    if (notes && notes.length > TEXT_LIMITS.LONG) {
      window.dispatchEvent(
        new CustomEvent("show-toast", {
          detail: {
            message: `Notes must be ${TEXT_LIMITS.LONG} characters or less.`,
            type: "error",
          },
        }),
      );
      return;
    }

    const { error } = await supabase.from("hotels").insert([
      {
        location_id: locationId,
        name,
        url: url || null,
        price: price !== undefined && price !== null ? price : null,
        rating: rating !== undefined && rating !== null ? rating : null,
        notes: notes || null,
        is_selected: false,
      },
    ]);
    if (!error) fetchHotels(locationId);
    return error;
  }

  async function deleteHotel(id: number) {
    const hotelToDelete = hotels.find((h) => h.id === id);
    const { error } = await supabase.from("hotels").delete().eq("id", id);
    if (!error && locationId) {
      if (hotelToDelete?.is_selected) {
        await supabase
          .from("locations")
          .update({ hotel_url: null })
          .eq("id", locationId);
      }
      fetchHotels(locationId);
    }
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
      const { data: selectedHotel } = await supabase
        .from("hotels")
        .update({ is_selected: true })
        .eq("id", id)
        .select()
        .single();

      if (selectedHotel) {
        await supabase
          .from("locations")
          .update({ hotel_url: selectedHotel.url })
          .eq("id", locationId);
      }
    } else {
      await supabase
        .from("locations")
        .update({ hotel_url: null })
        .eq("id", locationId);
    }

    fetchHotels(locationId);
  }

  async function updateHotel(id: number, updates: Partial<Hotel>) {
    const { error } = await supabase
      .from("hotels")
      .update(updates)
      .eq("id", id);
    if (!error && locationId) {
      const currentHotel = hotels.find((h) => h.id === id);
      if (currentHotel?.is_selected && updates.url !== undefined) {
        await supabase
          .from("locations")
          .update({ hotel_url: updates.url })
          .eq("id", locationId);
      }
      fetchHotels(locationId);
    }
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
