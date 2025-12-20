import React from "react";
import { Vacation } from "./vacation";
import { supabase } from "./supabaseClient"; // Adjust the import based on your project structure

interface VacationListItemProps {
  vacation: Vacation;
  selected: boolean;
  themeVars: any;
  disabled?: boolean;
  onSelect?: (vac: Vacation) => void;
  onEdit?: (vac: Vacation) => void;
  onDelete?: (id: number) => void;
}

const VacationListItem: React.FC<VacationListItemProps> = ({
  vacation,
  selected,
  themeVars,
  disabled = false,
  onSelect,
  onEdit,
  onDelete,
}) => {
  const handleDelete = async (vacationId: number) => {
    try {
      const { error } = await supabase
        .from("vacations")
        .delete()
        .eq("id", vacationId);

      if (error) {
        console.error("Error deleting vacation:", error);
      } else {
        console.log("Vacation deleted successfully.");
        // Notify parent to update the vacation list
        onDelete && onDelete(vacationId);
      }
    } catch (error) {
      console.error("Unexpected error deleting vacation:", error);
    }
  };

  return (
    <li
      style={{
        marginBottom: 14,
        background: selected ? themeVars.accent : themeVars.accent2,
        color: themeVars.text,
        padding: "16px 18px",
        borderRadius: 10,
        cursor: disabled ? "not-allowed" : "pointer",
        boxShadow: selected ? themeVars.shadow : "none",
        border: selected ? `2px solid ${themeVars.accent}` : "none",
        transition: "all 0.15s",
        opacity: disabled ? 0.6 : 1,
        pointerEvents: disabled ? "none" : "auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
      }}
      onClick={() => {
        if (!disabled && onSelect) onSelect(vacation);
      }}
    >
      <div>
        <div style={{ fontWeight: 700, fontSize: 18 }}>{vacation.name}</div>
        <div style={{ fontSize: 15, opacity: 0.85 }}>
          {vacation.start_date} to {vacation.end_date}
        </div>
        {vacation.archived && (
          <div
            style={{
              fontSize: 14,
              fontStyle: "italic",
              color: "#856404",
            }}
          >
            Archived
          </div>
        )}
      </div>
      <div
        style={{ display: "flex", gap: 4 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          title="Edit"
          onClick={() => onEdit && onEdit(vacation)}
          style={{
            background: "none",
            border: "none",
            color: selected ? themeVars.text : "#fff",
            cursor: "pointer",
            fontSize: 18,
            opacity: 0.7,
            padding: 2,
          }}
          tabIndex={-1}
        >
          ✏️
        </button>
        <button
          title="Delete"
          onClick={async () => {
            if (vacation.archived) {
              const confirmationMessage =
                "Are you sure you want to permanently delete this archived vacation? This action cannot be undone.";
              if (window.confirm(confirmationMessage)) {
                await handleDelete(vacation.id);
              }
            } else {
              onDelete && onDelete(vacation.id); // Archive logic handled in App.tsx without confirmation here
            }
          }}
          style={{
            background: "none",
            border: "none",
            color: selected ? themeVars.text : "#fff",
            cursor: "pointer",
            fontSize: 18,
            opacity: 0.7,
            padding: 2,
          }}
          tabIndex={-1}
        >
          🗑️
        </button>
      </div>
    </li>
  );
};

export default VacationListItem;
