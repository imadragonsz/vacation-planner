import { useEffect, useState, useCallback } from "react";
import { supabase } from "../supabaseClient";
import { Vacation } from "../vacation";

export function useVacations(fetchVacations: () => void, pushUndo: () => void) {
  const [vacations, setVacations] = useState<Vacation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAllVacations = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("vacations")
      .select("*")
      .eq("archived", false)
      .order("id", { ascending: false });
    if (!error && data) setVacations(data as Vacation[]);
    else setError(error?.message || "Failed to fetch vacations");
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAllVacations();
  }, [fetchAllVacations]);

  const updateVacation = async (vac: Vacation) => {
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from("vacations")
      .update({
        name: vac.name,
        start_date: vac.start_date,
        end_date: vac.end_date,
      })
      .eq("id", vac.id);
    if (!error) fetchAllVacations();
    else setError(error.message);
    setLoading(false);
  };

  // Archive vacation instead of deleting
  const archiveVacation = async (id: number) => {
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from("vacations")
      .update({ archived: true })
      .eq("id", id);
    if (!error) fetchAllVacations();
    else setError(error.message);
    setLoading(false);
  };

  return {
    vacations,
    setVacations, // Ensure setVacations is returned
    loading,
    error,
    fetchVacations: fetchAllVacations,
    updateVacation,
    archiveVacation,
  };
}
export function useAddVacation(
  fetchVacations: () => void,
  pushUndo: () => void
) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  async function addVacation(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !destination || !startDate || !endDate) return;

    setLoading(true);
    pushUndo();

    try {
      const { error } = await supabase
        .from("vacations")
        .insert([
          { name, destination, start_date: startDate, end_date: endDate },
        ]);

      if (error) throw new Error(error.message);

      setName("");
      setDestination("");
      setStartDate("");
      setEndDate("");
      fetchVacations();
    } catch (err) {
      console.error("Error adding vacation:", err);
    } finally {
      setLoading(false);
    }
  }

  return {
    addVacation,
    name,
    setName,
    destination,
    setDestination,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    loading,
  };
}
