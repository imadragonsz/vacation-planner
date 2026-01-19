import { useEffect, useState, useCallback } from "react";
import { supabase } from "../supabaseClient";
import { Vacation } from "../vacation";

export function useVacations(fetchVacations: () => void, pushUndo: () => void) {
  const [vacations, setVacations] = useState<Vacation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAllVacations = useCallback(async (includeArchived = false) => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("vacations")
      .select(
        `
        *,
        profiles (
          display_name
        ),
        vacation_participants (
          user_id
        )
      `
      )
      .order("id", { ascending: false });

    if (!error && data) {
      const vacationsWithProfiles = data.map((vac) => ({
        ...vac,
        owner_name: vac.profiles?.display_name,
      }));
      const filteredData = includeArchived
        ? vacationsWithProfiles
        : vacationsWithProfiles.filter((vacation) => !vacation.archived);
      setVacations(filteredData as Vacation[]);
    } else {
      setError(error?.message || "Failed to fetch vacations");
    }
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

  async function addVacation({
    name,
    destination,
    startDate,
    endDate,
    userId,
  }: {
    name: string;
    destination: string;
    startDate: string;
    endDate: string;
    userId?: string;
  }) {
    if (!name || !destination || !startDate || !endDate) {
      console.error("All fields are required to add a vacation.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from("vacations").insert([
        {
          name,
          destination,
          start_date: startDate,
          end_date: endDate,
          archived: false,
          user_id: userId,
        },
      ]);

      if (error) {
        alert("Failed to add vacation. Please try again.");
        console.error("Error adding vacation:", error);
      } else {
        alert("Vacation added successfully!");
        fetchVacations(); // Refresh the vacation list
      }
    } catch (err) {
      alert("An unexpected error occurred. Please try again.");
      console.error("Unexpected error:", err);
    } finally {
      setLoading(false);
    }
  }

  return {
    loading,
    name,
    setName,
    destination,
    setDestination,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    addVacation,
  };
}
