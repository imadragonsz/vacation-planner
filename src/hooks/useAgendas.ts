import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export type Agenda = {
  id: number;
  location_id: number;
  agenda_date: string;
  description: string;
  address?: string;
};

export function useAgendas(locationId: number) {
  const [agendas, setAgendas] = useState<Agenda[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (locationId) fetchAgendas(locationId);
    // eslint-disable-next-line
  }, [locationId]);

  async function fetchAgendas(locId: number) {
    setLoading(true);
    const { data, error } = await supabase
      .from("agendas")
      .select("*")
      .eq("location_id", locId)
      .order("agenda_date", { ascending: true });
    if (!error && data) setAgendas(data as Agenda[]);
    setLoading(false);
  }

  async function addAgenda(
    agenda_date: string,
    description: string,
    address?: string
  ) {
    setLoading(true);
    const { error } = await supabase
      .from("agendas")
      .insert([{ location_id: locationId, agenda_date, description, address }]);
    if (!error) fetchAgendas(locationId);
    setLoading(false);
  }

  async function updateAgenda(
    id: number,
    agenda_date: string,
    description: string,
    address?: string
  ) {
    setLoading(true);
    const { error } = await supabase
      .from("agendas")
      .update({ agenda_date, description, address })
      .eq("id", id);
    if (!error) fetchAgendas(locationId);
    setLoading(false);
  }

  return { agendas, loading, addAgenda, updateAgenda };
}
