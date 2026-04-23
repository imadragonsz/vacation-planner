import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { TEXT_LIMITS } from "../utils/textLimits";

export type VacationLocation = {
  id: number;
  vacation_id: number;
  name: string;
  address: string | null;
  start_date: string | null;
  end_date: string | null;
  lat?: number;
  lng?: number;
  hotel_url?: string | null;
  selected_hotel?: {
    name: string;
    url: string | null;
  } | null;
};

export function useLocations(vacationId: number) {
  const [locations, setLocations] = useState<VacationLocation[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!vacationId) return;

    fetchLocations();

    // Subscribe to changes
    const channel = supabase
      .channel(`locations-changes-${vacationId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "locations",
          filter: `vacation_id=eq.${vacationId}`,
        },
        () => {
          fetchLocations();
        },
      )
      .subscribe();

    const handleOnline = () => {
      console.log("Internet restored, refetching locations...");
      fetchLocations();
    };

    window.addEventListener("online", handleOnline);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener("online", handleOnline);
    };
    // eslint-disable-next-line
  }, [vacationId]);

  async function fetchLocations() {
    setLoading(true);
    const { data, error } = await supabase
      .from("locations")
      .select("*, hotels(name, url, is_selected)")
      .eq("vacation_id", vacationId);

    if (!error && data) {
      // Extract selected hotel from join results
      const formatted = (data as any[]).map((loc) => ({
        ...loc,
        selected_hotel: loc.hotels?.find((h: any) => h.is_selected) || null,
      }));

      // Sort client-side to handle NULL dates consistently (NULLs at the end)
      const sorted = formatted.sort((a, b) => {
        if (!a.start_date && !b.start_date) return 0;
        if (!a.start_date) return 1;
        if (!b.start_date) return -1;
        return a.start_date.localeCompare(b.start_date);
      });
      setLocations(sorted as VacationLocation[]);
    }
    setLoading(false);
  }

  async function addLocation(
    name: string,
    address: string,
    start_date?: string,
    end_date?: string,
  ) {
    if (name.length > TEXT_LIMITS.SHORT) {
      window.dispatchEvent(
        new CustomEvent("show-toast", {
          detail: {
            message: `Location name must be ${TEXT_LIMITS.SHORT} characters or less.`,
            type: "error",
          },
        }),
      );
      return;
    }

    if (address && address.length > TEXT_LIMITS.MEDIUM) {
      window.dispatchEvent(
        new CustomEvent("show-toast", {
          detail: {
            message: `Address must be ${TEXT_LIMITS.MEDIUM} characters or less.`,
            type: "error",
          },
        }),
      );
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("locations").insert([
      {
        vacation_id: vacationId,
        name: name.trim(),
        address: address.trim(),
        start_date: start_date || null,
        end_date: end_date || null,
      },
    ]);
    if (!error) fetchLocations();
    setLoading(false);
  }

  async function updateLocation(
    id: number,
    name: string,
    address: string,
    start_date?: string,
    end_date?: string,
  ) {
    if (name.length > TEXT_LIMITS.SHORT) {
      window.dispatchEvent(
        new CustomEvent("show-toast", {
          detail: {
            message: `Location name must be ${TEXT_LIMITS.SHORT} characters or less.`,
            type: "error",
          },
        }),
      );
      return;
    }

    if (address && address.length > TEXT_LIMITS.MEDIUM) {
      window.dispatchEvent(
        new CustomEvent("show-toast", {
          detail: {
            message: `Address must be ${TEXT_LIMITS.MEDIUM} characters or less.`,
            type: "error",
          },
        }),
      );
      return;
    }

    // Optimistic update
    setLocations((prev) =>
      prev.map((loc) =>
        loc.id === id
          ? {
              ...loc,
              name,
              address,
              start_date: start_date || null,
              end_date: end_date || null,
            }
          : loc,
      ),
    );

    const { error } = await supabase
      .from("locations")
      .update({
        name: name.trim(),
        address: address.trim(),
        start_date: start_date || null,
        end_date: end_date || null,
      })
      .eq("id", id);
    if (!error) {
      setTimeout(() => fetchLocations(), 100);
    }
  }

  async function removeLocation(id: number) {
    if (
      !window.confirm(
        "Are you sure you want to delete this location? All agenda items linked to this location will be updated.",
      )
    )
      return;

    // We don't delete agenda items normally, just nullify their location_id
    // But we need to ensure foreign keys don't block the deletion
    const { error: updateError } = await supabase
      .from("agendas")
      .update({ location_id: null })
      .eq("location_id", id);

    if (updateError) {
      console.error("Error unlinking agenda items:", updateError);
      window.dispatchEvent(
        new CustomEvent("show-toast", {
          detail: {
            message: "Failed to unlink activities. Location remains.",
            type: "error",
          },
        }),
      );
      return;
    }

    const { error } = await supabase.from("locations").delete().eq("id", id);

    if (error) {
      console.error("Error deleting location:", error);
      window.dispatchEvent(
        new CustomEvent("show-toast", {
          detail: {
            message: "Error deleting location.",
            type: "error",
          },
        }),
      );
      fetchLocations(); // Revert on failure
    } else {
      window.dispatchEvent(
        new CustomEvent("show-toast", {
          detail: {
            message: "Location removed.",
            type: "success",
          },
        }),
      );
      setLocations((prev) => prev.filter((loc) => loc.id !== id));
      setTimeout(() => fetchLocations(), 100);
    }
  }

  return { locations, loading, addLocation, updateLocation, removeLocation };
}
