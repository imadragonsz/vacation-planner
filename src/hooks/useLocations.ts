import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export type VacationLocation = {
  id: number;
  vacation_id: number;
  name: string;
  address: string | null;
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
      .eq("vacation_id", vacationId)
      .order("id", { ascending: true });
    if (!error && data) setLocations(data as VacationLocation[]);
    setLoading(false);
  }

  async function addLocation(name: string, address: string) {
    setLoading(true);
    const { error } = await supabase
      .from("locations")
      .insert([{ vacation_id: vacationId, name, address }]);
    if (!error) fetchLocations();
    setLoading(false);
  }

  async function updateLocation(id: number, name: string, address: string) {
    setLoading(true);
    const { error } = await supabase
      .from("locations")
      .update({ name, address })
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
