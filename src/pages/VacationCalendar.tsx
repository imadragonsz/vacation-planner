import React, { useState } from "react";
import { Vacation } from "../../src/vacation";

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getMonthName(month: number) {
  return new Date(2000, month, 1).toLocaleString("default", { month: "long" });
}

interface VacationCalendarProps {
  vacations: Vacation[];
  onVacationClick?: (vac: Vacation) => void;
  onEditVacation?: (vac: Vacation) => void;
  // onDeleteVacation?: (vacId: number) => void;
  onDateClick?: (date: string) => void;
  colorByStatus?: boolean;
}

export function VacationCalendar({
  vacations,
  onVacationClick,
  onEditVacation,
  // onDeleteVacation,
  onDateClick,
  colorByStatus,
}: VacationCalendarProps) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [showArchived, setShowArchived] = useState(false); // New state for checkbox
  const daysInMonth = getDaysInMonth(year, month);
  const [editingVacation, setEditingVacation] = useState<Vacation | null>(null);

  // Filter vacations based on the checkbox
  const filteredVacations = vacations.filter(
    (vac) => showArchived || !vac.archived
  );

  // Map each day to vacations
  const dayVacations: { [day: number]: Vacation[] } = {};
  for (let d = 1; d <= daysInMonth; d++) dayVacations[d] = [];
  filteredVacations.forEach((vac) => {
    const start = new Date(vac.start_date);
    const end = new Date(vac.end_date);
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      if (date >= start && date <= end) {
        dayVacations[d].push(vac);
      }
    }
  });

  function prevMonth() {
    setMonth((m) => (m === 0 ? 11 : m - 1));
    if (month === 0) setYear((y) => y - 1);
  }
  function nextMonth() {
    setMonth((m) => (m === 11 ? 0 : m + 1));
    if (month === 11) setYear((y) => y + 1);
  }
  function closeModal() {
    setEditingVacation(null);
  }

  // Calendar grid
  const firstDay = new Date(year, month, 1).getDay();
  const weeks: number[][] = [];
  let week: number[] = [];
  for (let i = 0; i < firstDay; i++) week.push(0);
  for (let d = 1; d <= daysInMonth; d++) {
    week.push(d);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length) {
    while (week.length < 7) week.push(0);
    weeks.push(week);
  }

  return (
    <div
      style={{
        background: "#fff",
        color: "#222",
        borderRadius: 16,
        boxShadow: "0 2px 12px #0001",
        padding: 24,
        maxWidth: 700,
        margin: "0 auto 40px auto",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <button
          onClick={prevMonth}
          style={{
            fontSize: 20,
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
        >
          &lt;
        </button>
        <h2 style={{ margin: 0 }}>
          {getMonthName(month)} {year}
        </h2>
        <button
          onClick={nextMonth}
          style={{
            fontSize: 20,
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
        >
          &gt;
        </button>
      </div>
      <div style={{ marginBottom: 16 }}>
        <label>
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
          />
          Show Archived Vacations
        </label>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 4,
          marginBottom: 8,
        }}
      >
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div
            key={d}
            style={{
              fontWeight: 700,
              textAlign: "center",
              padding: "4px 0",
              color: "#888",
            }}
          >
            {d}
          </div>
        ))}
      </div>
      {weeks.map((week, i) => (
        <div
          key={i}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: 4,
            marginBottom: 2,
          }}
        >
          {week.map((d, j) =>
            d === 0 ? (
              <div key={j} />
            ) : (
              <div
                key={j}
                style={{
                  minHeight: 54,
                  background: "#f7f8fa",
                  borderRadius: 8,
                  padding: 4,
                  position: "relative",
                  cursor: onDateClick ? "pointer" : undefined,
                  border:
                    today.getFullYear() === year &&
                    today.getMonth() === month &&
                    today.getDate() === d
                      ? "2px solid #2980ef"
                      : "1px solid #e1e1e1",
                }}
                onClick={() => {
                  if (onDateClick) {
                    const mm = String(month + 1).padStart(2, "0");
                    const dd = String(d).padStart(2, "0");
                    onDateClick(`${year}-${mm}-${dd}`);
                  }
                }}
              >
                <div style={{ fontWeight: 600, fontSize: 15 }}>{d}</div>
                {dayVacations[d].map((vac, idx) => {
                  let bg = "#2980ef";
                  if (colorByStatus) {
                    const now = new Date();
                    const start = new Date(vac.start_date);
                    const end = new Date(vac.end_date);
                    if (end < now) bg = "#7f8c8d";
                    else if (start > now) bg = "#2980ef";
                    else bg = "#27ae60";
                  }
                  return (
                    <div
                      key={vac.id + "-" + idx}
                      style={{
                        background: bg,
                        color: "#fff",
                        borderRadius: 6,
                        padding: "2px 6px",
                        fontSize: 13,
                        marginTop: 2,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        cursor: onVacationClick ? "pointer" : undefined,
                        display: "flex",
                        alignItems: "center",
                      }}
                      title={vac.name}
                      onClick={(e) => {
                        e.stopPropagation();
                        onVacationClick && onVacationClick(vac);
                      }}
                    >
                      {vac.name}
                      {onEditVacation && (
                        <button
                          title="Edit"
                          style={{
                            marginLeft: 8,
                            background: "none",
                            border: "none",
                            color: "#fff",
                            cursor: "pointer",
                            fontSize: 16,
                            opacity: 0.8,
                            padding: 0,
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingVacation(vac);
                          }}
                        >
                          ✏️
                        </button>
                      )}
                      {/* Delete button removed as requested */}
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>
      ))}
      {onEditVacation && editingVacation && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: "#f7f8fa",
              padding: 20,
              borderRadius: 12,
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
              width: "90%",
              maxWidth: 500,
              color: "#23283a",
            }}
          >
            <h2 style={{ color: "#273c75" }}>Edit Vacation</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (onEditVacation && editingVacation) {
                  onEditVacation(editingVacation);
                  closeModal();
                }
              }}
            >
              <label style={{ display: "block", marginBottom: 10 }}>
                Name:
                <input
                  type="text"
                  value={editingVacation.name}
                  onChange={(e) =>
                    setEditingVacation({
                      ...editingVacation,
                      name: e.target.value,
                    })
                  }
                  style={{
                    width: "calc(100% - 20px)",
                    padding: 10,
                    borderRadius: 8,
                    border: "1px solid #dbe2ef",
                    marginTop: 5,
                    boxSizing: "border-box",
                  }}
                />
              </label>
              <label style={{ display: "block", marginBottom: 10 }}>
                Start Date:
                <input
                  type="date"
                  value={editingVacation.start_date}
                  onChange={(e) =>
                    setEditingVacation({
                      ...editingVacation,
                      start_date: e.target.value,
                    })
                  }
                  style={{
                    width: "calc(100% - 20px)",
                    padding: 10,
                    borderRadius: 8,
                    border: "1px solid #dbe2ef",
                    marginTop: 5,
                    boxSizing: "border-box",
                  }}
                />
              </label>
              <label style={{ display: "block", marginBottom: 10 }}>
                End Date:
                <input
                  type="date"
                  value={editingVacation.end_date}
                  onChange={(e) =>
                    setEditingVacation({
                      ...editingVacation,
                      end_date: e.target.value,
                    })
                  }
                  style={{
                    width: "calc(100% - 20px)",
                    padding: 10,
                    borderRadius: 8,
                    border: "1px solid #dbe2ef",
                    marginTop: 5,
                    boxSizing: "border-box",
                  }}
                />
              </label>
              <div style={{ marginTop: 20, textAlign: "right" }}>
                <button
                  type="submit"
                  style={{
                    background: "#2ecc71",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    padding: "10px 20px",
                    cursor: "pointer",
                    marginRight: 10,
                  }}
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  style={{
                    background: "#e74c3c",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    padding: "10px 20px",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
