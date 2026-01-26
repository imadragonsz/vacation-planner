import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export type VacationLocation = {
  id: number;
  vacation_id: number;
  name: string;
  address: string | null;
  start_date: string | null;
  end_date: string | null;
  lat?: number;
  lng?: number;
};

export function useLocations(vacationId: number) {
  const [locations, setLocations] = useState<VacationLocation[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (vacationId) fetchLocations();
    // eslint-disable-next-line
  }, [vacationId]);

  async function fetchLocations() {
    setLoading(true);
    const { data, error } = await supabase
      .from("locations")
      .select("*")
      .eq("vacation_id", vacationId);

    if (!error && data) {
      // Sort client-side to handle NULL dates consistently (NULLs at the end)
      const sorted = (data as VacationLocation[]).sort((a, b) => {
        if (!a.start_date && !b.start_date) return 0;
        if (!a.start_date) return 1;
        if (!b.start_date) return -1;
        return a.start_date.localeCompare(b.start_date);
      });
      setLocations(sorted);
    }
    setLoading(false);
  }

  async function addLocation(
    name: string,
    address: string,
    start_date?: string,
    end_date?: string,
  ) {
    setLoading(true);
    const { error } = await supabase.from("locations").insert([
      {
        vacation_id: vacationId,
        name,
        address,
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
    setLoading(true);
    const { error } = await supabase
      .from("locations")
      .update({
        name,
        address,
        start_date: start_date || null,
        end_date: end_date || null,
      })
      .eq("id", id);
    if (!error) fetchLocations();
    setLoading(false);
  }

  async function removeLocation(id: number) {
    setLoading(true);
    const { error } = await supabase.from("locations").delete().eq("id", id);
    if (!error) fetchLocations();
    setLoading(false);
  }

  return { locations, loading, addLocation, updateLocation, removeLocation };
}
