import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export type Agenda = {
  id: number;
  location_id: number;
  agenda_date: string;
  description: string;
  address?: string;
  Time?: string;
  type?:
    | "activity"
    | "flight"
    | "train"
    | "bus"
    | "hotel"
    | "note"
    | "food"
    | "daytrip";
  position: number;
  price?: number;
};

export function useAgendas(locationId: number) {
  const [agendas, setAgendas] = useState<Agenda[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (locationId) {
      fetchAgendas(locationId);
    } else {
      setAgendas([]);
    }

    const handleOnline = () => {
      if (locationId) {
        console.log("Internet restored, refetching agendas...");
        fetchAgendas(locationId);
      }
    };

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
    // eslint-disable-next-line
  }, [locationId]);

  async function fetchAgendas(locId: number) {
    setLoading(true);
    const { data, error } = await supabase
      .from("agendas")
      .select("*")
      .eq("location_id", locId)
      .order("agenda_date", { ascending: true })
      .order("position", { ascending: true })
      .order("Time", { ascending: true });
    if (!error && data) setAgendas(data as Agenda[]);
    setLoading(false);
  }

  async function addAgenda(
    agenda_date: string,
    description: string,
    address?: string,
    Time?: string,
    type: string = "activity",
    price?: number,
  ) {
    setLoading(true);
    // Get max position for this date
    const maxPos = agendas
      .filter((a) => a.agenda_date === agenda_date)
      .reduce((max, a) => Math.max(max, a.position || 0), -1);

    const { error } = await supabase.from("agendas").insert([
      {
        location_id: locationId,
        agenda_date,
        description: description.trim(),
        address: address?.trim() || null,
        Time: Time || null,
        type: type || "activity",
        position: maxPos + 1,
        price: price !== undefined && price !== null ? price : null,
      },
    ]);
    if (!error) {
      setTimeout(() => fetchAgendas(locationId), 100);
    }
    setLoading(false);
  }

  async function updateAgenda(
    id: number,
    agenda_date: string,
    description: string,
    address?: string,
    Time?: string,
    type?: string,
    price?: number,
  ) {
    // Optimistic update
    setAgendas((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              agenda_date,
              description,
              address,
              Time,
              type: type as any,
              price,
            }
          : a,
      ),
    );

    const { error } = await supabase
      .from("agendas")
      .update({
        agenda_date,
        description: description.trim(),
        address: address?.trim() || null,
        Time: Time || null,
        type: type || "activity",
        price: price !== undefined && price !== null ? price : null,
      })
      .eq("id", id);
    if (!error) {
      setTimeout(() => fetchAgendas(locationId), 100);
    }
  }

  async function updateAgendasOrder(items: Agenda[]) {
    // Optimistic update
    setAgendas(items);

    // Update positions in DB
    const updates = items.map((item, index) => ({
      id: item.id,
      position: index,
      location_id: item.location_id,
      agenda_date: item.agenda_date,
      description: item.description,
      type: item.type || "activity",
      Time: item.Time || null,
      address: item.address || null,
      price:
        item.price !== undefined && item.price !== null ? item.price : null,
    }));

    const { error } = await supabase.from("agendas").upsert(updates);
    if (error) {
      console.error("Error updating agenda order:", error);
      fetchAgendas(locationId);
    }
  }

  return { agendas, loading, addAgenda, updateAgenda, updateAgendasOrder };
}
