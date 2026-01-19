import { Vacation } from "../vacation";
import { supabase } from "../supabaseClient";

export async function handleArchiveVacation(
  vacation: Vacation,
  pushUndo: () => void,
  fetchVacations: () => void,
  setToast: (toast: { message: string; type: "success" | "error" }) => void
) {
  if (vacation.archived) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this vacation?"
    );
    if (confirmed) {
      const { error } = await supabase
        .from("vacations")
        .delete()
        .eq("id", vacation.id);
      if (!error) {
        fetchVacations(); // Ensure vacation list is fetched after deletion
        setToast({ message: "Vacation deleted.", type: "success" });
      } else {
        setToast({ message: error.message, type: "error" });
      }
    }
    return; // Ensure the function exits after deletion
  }

  const { data: vacationData, error: fetchError } = await supabase
    .from("vacations")
    .select("archived")
    .eq("id", Number(vacation.id));

  if (fetchError || !vacationData || vacationData.length === 0) {
    setToast({ message: "Failed to fetch vacation status.", type: "error" });
    return;
  }

  const isArchived = vacationData[0]?.archived ?? false;

  if (!isArchived) {
    const confirmed = window.confirm(
      "Are you sure you want to archive this vacation? You can restore it later from the archive."
    );
    if (confirmed) {
      pushUndo();
      const { error } = await supabase
        .from("vacations")
        .update({ archived: true })
        .eq("id", vacation.id);
      if (!error) {
        fetchVacations(); // Ensure vacation list is fetched after archiving
        setToast({ message: "Vacation archived.", type: "success" });
      } else {
        setToast({ message: error.message, type: "error" });
      }
    }
  }
}

export async function handleArchiveRestore(
  vacation: Vacation,
  fetchVacations: () => void,
  setToast: (toast: { message: string; type: "success" | "error" }) => void
) {
  const confirmed = window.confirm(
    "Are you sure you want to restore this vacation?"
  );

  if (!confirmed) return;

  const { error } = await supabase
    .from("vacations")
    .update({ archived: false })
    .eq("id", vacation.id);

  if (!error) {
    fetchVacations();
    setToast({ message: "Vacation restored.", type: "success" });
  } else {
    setToast({ message: error.message, type: "error" });
  }
}

export async function fetchPersonalEvents(userId: string) {
  try {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("user_id", userId);

    if (error) {
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    console.error("Error fetching personal events:", error);
    return [];
  }
}
