import { Vacation } from "../vacation";
import { supabase } from "../supabaseClient";

export async function handleArchiveVacation(
  vacation: Vacation,
  pushUndo: () => void,
  fetchVacations: () => void,
  setToast: (toast: { message: string; type: "success" | "error" }) => void
) {
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
      fetchVacations();
      setToast({ message: "Vacation archived.", type: "success" });
    } else {
      setToast({ message: error.message, type: "error" });
    }
  }
}

export function handleUndo(
  undoStack: Vacation[][],
  redoStack: Vacation[][],
  setUndoStack: (stack: Vacation[][]) => void,
  setRedoStack: (stack: Vacation[][]) => void,
  setVacations: (vacations: Vacation[]) => void,
  setToast: (toast: { message: string; type: "info" }) => void
) {
  if (undoStack.length === 0) return;
  const newRedoStack = [undoStack[undoStack.length - 1], ...redoStack];
  setRedoStack(newRedoStack);

  const newUndoStack = undoStack.slice(0, -1);
  setUndoStack(newUndoStack);

  setVacations(undoStack[undoStack.length - 1]);
  setToast({ message: "Undid last change.", type: "info" });
}

export function handleRedo(
  undoStack: Vacation[][],
  redoStack: Vacation[][],
  setUndoStack: (stack: Vacation[][]) => void,
  setRedoStack: (stack: Vacation[][]) => void,
  setVacations: (vacations: Vacation[]) => void,
  setToast: (toast: { message: string; type: "info" }) => void
) {
  if (redoStack.length === 0) return;
  const updatedUndoStack = [...undoStack, redoStack[0]];
  setUndoStack(updatedUndoStack);

  const updatedRedoStack = redoStack.slice(1);
  setRedoStack(updatedRedoStack);

  setVacations(redoStack[0]);
  setToast({ message: "Redid change.", type: "info" });
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
