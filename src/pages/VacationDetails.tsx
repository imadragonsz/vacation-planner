import React, { useState, Suspense } from "react";
import { useLocations, VacationLocation } from "../hooks/useLocations";
import { useAgendas } from "../hooks/useAgendas";
import { supabase } from "../../src/supabaseClient";
import { Vacation } from "../../src/vacation";
import { StyledInput, StyledButton } from "../../src/ui";
import ConfirmDialog from "../../src/ConfirmDialog";
import { darkTheme, lightTheme } from "../../src/styles/theme";

const VacationMap = React.lazy(() => import("../../src/VacationMap"));

export function VacationDetails({
  vacationId,
  theme = "dark",
  user,
}: {
  vacationId: number;
  theme?: "dark" | "light";
  user?: any;
}) {
  const themeVars = theme === "dark" ? darkTheme : lightTheme;
  const { locations, addLocation, updateLocation, removeLocation } =
    useLocations(vacationId);

  // Geocode locations for map pins
  const [geoLocations, setGeoLocations] = useState<any[]>([]);
  React.useEffect(() => {
    let cancelled = false;
    async function geocodeAll() {
      const results = await Promise.all(
        locations.map(async (loc) => {
          if (!loc.address) return { ...loc };
          const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(
            loc.address
          )}`;
          try {
            const res = await fetch(url);
            const data = await res.json();
            if (data && data.length > 0) {
              return {
                ...loc,
                lat: parseFloat(data[0].lat),
                lng: parseFloat(data[0].lon),
              };
            }
          } catch (error) {
            console.error("Error fetching geocode data:", error);
          } finally {
            return { ...loc };
          }
        })
      );
      if (!cancelled) setGeoLocations(results);
    }
    geocodeAll();
    return () => {
      cancelled = true;
    };
  }, [locations]);

  const [newLocName, setNewLocName] = useState("");
  const [newLocAddr, setNewLocAddr] = useState("");
  const [selectedLocation, setSelectedLocation] =
    useState<VacationLocation | null>(null);

  React.useEffect(() => {
    if (!selectedLocation && locations.length > 0) {
      setSelectedLocation(locations[0]);
    }
    if (
      selectedLocation &&
      !locations.find((l) => l.id === selectedLocation.id)
    ) {
      setSelectedLocation(null);
    }
  }, [locations, selectedLocation]);

  const [editingLocationId, setEditingLocationId] = useState<number | null>(
    null
  );
  const [editLocName, setEditLocName] = useState("");
  const [editLocAddr, setEditLocAddr] = useState("");
  const [confirmDeleteLocId, setConfirmDeleteLocId] = useState<number | null>(
    null
  );
  const [locationSearch, setLocationSearch] = useState(""); // eslint-disable-line @typescript-eslint/no-unused-vars

  // Agenda state
  const [editingAgendaId, setEditingAgendaId] = useState<number | null>(null);
  const [editAgendaDate, setEditAgendaDate] = useState("");
  const [editAgendaDesc, setEditAgendaDesc] = useState("");
  const [agendaAddr, setAgendaAddr] = useState("");
  const [confirmDeleteAgendaId, setConfirmDeleteAgendaId] = useState<
    number | null
  >(null);

  // Agendas for selected location
  const locationId = selectedLocation?.id ?? 0;
  const { agendas, addAgenda, updateAgenda } = useAgendas(locationId);

  // Add location handler
  async function handleAddLocation(e: React.FormEvent) {
    e.preventDefault();
    if (newLocName.trim()) {
      await addLocation(newLocName, newLocAddr);
      setNewLocName("");
      setNewLocAddr("");
    }
  }

  // Add agenda handler
  async function handleAddAgenda(e: React.FormEvent) {
    e.preventDefault();
    if (editAgendaDate && editAgendaDesc) {
      if (editingAgendaId) {
        await updateAgenda(
          editingAgendaId,
          editAgendaDate,
          editAgendaDesc,
          agendaAddr
        );
      } else {
        await addAgenda(editAgendaDate, editAgendaDesc, agendaAddr);
      }
      setEditAgendaDate("");
      setEditAgendaDesc("");
      setAgendaAddr("");
      setEditingAgendaId(null);
    }
  }

  // Delete agenda handler
  async function handleDeleteAgenda(id: number) {
    await supabase.from("agendas").delete().eq("id", id);
    setConfirmDeleteAgendaId(null);
  }

  return (
    <div>
      <div style={{ marginTop: 24 }}>
        <h2 style={{ margin: 0 }}>Locations</h2>
        <div style={{ display: "flex", gap: 8 }}>
          {selectedLocation && (
            <StyledButton
              type="button"
              themeVars={themeVars}
              style={{
                fontSize: 14,
                padding: "6px 14px",
                background: themeVars.accent2,
                color: themeVars.text,
                borderRadius: 6,
              }}
              onClick={() => setSelectedLocation(null)}
            >
              Clear Selection
            </StyledButton>
          )}
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        {user && (
          <form
            onSubmit={handleAddLocation}
            style={{
              display: "flex",
              gap: 8,
              marginBottom: 16,
              alignItems: "center",
            }}
          >
            <StyledInput
              type="text"
              value={newLocName}
              onChange={(e) => setNewLocName(e.target.value)}
              placeholder="Location Name"
              themeVars={themeVars}
              style={{ minWidth: 120 }}
            />
            <StyledInput
              type="text"
              value={newLocAddr}
              onChange={(e) => setNewLocAddr(e.target.value)}
              placeholder="Address (optional)"
              themeVars={themeVars}
              style={{ minWidth: 120 }}
            />
            <StyledButton type="submit" accent themeVars={themeVars}>
              Add
            </StyledButton>
          </form>
        )}
        <div style={{ maxHeight: 260, overflowY: "auto", marginBottom: 8 }}>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {(locationSearch.trim()
              ? locations.filter(
                  (loc) =>
                    loc.name
                      .toLowerCase()
                      .includes(locationSearch.toLowerCase()) ||
                    (loc.address || "")
                      .toLowerCase()
                      .includes(locationSearch.toLowerCase())
                )
              : locations
            ).map((loc) => (
              <li
                key={loc.id}
                style={{
                  background: themeVars.card,
                  color: themeVars.text,
                  borderRadius: 8,
                  marginBottom: 4,
                  padding: 8,
                  cursor: "pointer",
                  border:
                    selectedLocation?.id === loc.id
                      ? `2px solid ${themeVars.accent}`
                      : "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                  fontSize: 15,
                }}
                onClick={() => setSelectedLocation(loc)}
              >
                {editingLocationId === loc.id ? (
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      await updateLocation(loc.id, editLocName, editLocAddr);
                      setEditingLocationId(null);
                    }}
                    style={{ display: "flex", gap: 8, flex: 1 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <StyledInput
                      type="text"
                      value={editLocName}
                      onChange={(e) => setEditLocName(e.target.value)}
                      required
                      themeVars={themeVars}
                      style={{ minWidth: 80 }}
                    />
                    <StyledInput
                      type="text"
                      value={editLocAddr}
                      onChange={(e) => setEditLocAddr(e.target.value)}
                      themeVars={themeVars}
                      style={{ minWidth: 80 }}
                    />
                    <StyledButton type="submit" accent themeVars={themeVars}>
                      Save
                    </StyledButton>
                    <StyledButton
                      type="button"
                      danger
                      themeVars={themeVars}
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingLocationId(null);
                      }}
                    >
                      Cancel
                    </StyledButton>
                  </form>
                ) : (
                  <>
                    <span
                      style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        maxWidth: 180,
                      }}
                    >
                      <strong>{loc.name}</strong>
                      {loc.address && (
                        <span style={{ marginLeft: 8, opacity: 0.7 }}>
                          {loc.address}
                        </span>
                      )}
                    </span>
                    {user && (
                      <span
                        style={{ display: "flex", gap: 4 }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <StyledButton
                          title="Edit"
                          onClick={() => {
                            setEditingLocationId(loc.id);
                            setEditLocName(loc.name);
                            setEditLocAddr(loc.address || "");
                          }}
                          themeVars={themeVars}
                          style={{
                            background: "none",
                            color: "#fff",
                            fontSize: 16,
                            opacity: 0.7,
                            padding: 2,
                          }}
                        >
                          ✏️
                        </StyledButton>
                        <StyledButton
                          title="Delete"
                          onClick={() => setConfirmDeleteLocId(loc.id)}
                          themeVars={themeVars}
                          style={{
                            background: "none",
                            color: "#fff",
                            fontSize: 16,
                            opacity: 0.7,
                            padding: 2,
                          }}
                        >
                          🗑️
                        </StyledButton>
                      </span>
                    )}
                    <ConfirmDialog
                      open={confirmDeleteLocId === loc.id}
                      message="Delete this location?"
                      onConfirm={async () => {
                        await removeLocation(loc.id);
                        setConfirmDeleteLocId(null);
                        if (selectedLocation?.id === loc.id)
                          setSelectedLocation(null);
                      }}
                      onCancel={() => setConfirmDeleteLocId(null)}
                      themeVars={themeVars}
                    />
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <Suspense fallback={<div>Loading map...</div>}>
        <VacationMap locations={geoLocations} agendas={agendas} />
      </Suspense>

      {selectedLocation && (
        <div style={{ marginTop: 32 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
            }}
          >
            <h3 style={{ margin: 0 }}>Agendas for {selectedLocation.name}</h3>
            <StyledButton
              type="button"
              themeVars={themeVars}
              style={{
                fontSize: 14,
                padding: "6px 14px",
                background: themeVars.accent2,
                color: themeVars.text,
                borderRadius: 6,
              }}
              onClick={() => setEditingAgendaId(null)}
              disabled={editingAgendaId === null}
            >
              Clear Edit
            </StyledButton>
          </div>
          {user && (
            <form
              onSubmit={handleAddAgenda}
              style={{
                display: "flex",
                gap: 8,
                marginBottom: 16,
                alignItems: "center",
              }}
            >
              <StyledInput
                type="date"
                value={editAgendaDate}
                onChange={(e) => setEditAgendaDate(e.target.value)}
                themeVars={themeVars}
                style={{ minWidth: 120 }}
              />
              <StyledInput
                type="text"
                value={editAgendaDesc}
                onChange={(e) => setEditAgendaDesc(e.target.value)}
                placeholder="Description"
                themeVars={themeVars}
                style={{ minWidth: 120 }}
              />
              <StyledInput
                type="text"
                value={agendaAddr}
                onChange={(e) => setAgendaAddr(e.target.value)}
                placeholder="Address (optional)"
                themeVars={themeVars}
                style={{ minWidth: 120 }}
              />
              <StyledButton type="submit" accent themeVars={themeVars}>
                {editingAgendaId ? "Update Agenda" : "Add Agenda"}
              </StyledButton>
            </form>
          )}
          <div
            style={{
              maxHeight: 320,
              overflowY: "auto",
              marginTop: 8,
              borderRadius: 8,
              border: `1px solid ${themeVars.border}`,
              background: themeVars.card,
            }}
          >
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {agendas.length > 0 && (
                <li
                  style={{
                    position: "sticky",
                    top: 0,
                    background: themeVars.card,
                    zIndex: 1,
                    fontWeight: 700,
                    color: themeVars.accent,
                    padding: "6px 8px",
                    borderBottom: `1px solid ${themeVars.border}`,
                    display: "flex",
                    alignItems: "center",
                    fontSize: 15,
                  }}
                >
                  <span style={{ flex: 2 }}>Date</span>
                  <span style={{ flex: 4 }}>Description</span>
                  <span style={{ flex: 3 }}>Address</span>
                  <span style={{ flex: 1, textAlign: "right" }}>Actions</span>
                </li>
              )}
              {agendas.map((ag) => (
                <li
                  key={ag.id}
                  style={{
                    marginBottom: 0,
                    display: "flex",
                    alignItems: "center",
                    background:
                      editingAgendaId === ag.id ? themeVars.accent2 : undefined,
                    borderRadius: 0,
                    padding: "6px 8px",
                    fontSize: 15,
                    borderBottom: `1px solid ${themeVars.border}`,
                  }}
                >
                  <span
                    style={{
                      flex: 2,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {ag.agenda_date}
                  </span>
                  <span
                    style={{
                      flex: 4,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {ag.description}
                  </span>
                  <span
                    style={{
                      flex: 3,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {ag.address}
                  </span>
                  <span
                    style={{
                      flex: 1,
                      textAlign: "right",
                      display: "flex",
                      gap: 4,
                      justifyContent: "flex-end",
                    }}
                  >
                    <StyledButton
                      title="Edit"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingAgendaId(ag.id);
                        setEditAgendaDate(ag.agenda_date);
                        setEditAgendaDesc(ag.description);
                        setAgendaAddr(ag.address || "");
                      }}
                      themeVars={themeVars}
                      style={{
                        background: "none",
                        color: "#fff",
                        fontSize: 16,
                        opacity: 0.7,
                        padding: 2,
                      }}
                    >
                      ✏️
                    </StyledButton>
                    <StyledButton
                      title="Delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDeleteAgendaId(ag.id);
                      }}
                      themeVars={themeVars}
                      style={{
                        background: "none",
                        color: "#fff",
                        fontSize: 16,
                        opacity: 0.7,
                        padding: 2,
                      }}
                    >
                      🗑️
                    </StyledButton>
                  </span>
                  <ConfirmDialog
                    open={confirmDeleteAgendaId === ag.id}
                    message="Delete this agenda?"
                    onConfirm={() => handleDeleteAgenda(ag.id)}
                    onCancel={() => setConfirmDeleteAgendaId(null)}
                    themeVars={themeVars}
                  />
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

// Optionally, export VacationEditor if needed elsewhere
type VacationEditorProps = {
  vacation: Vacation;
  onVacationUpdated: () => void;
};

export function VacationEditor({
  vacation,
  onVacationUpdated,
}: VacationEditorProps) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(vacation.name);
  const [startDate, setStartDate] = useState(vacation.start_date);
  const [endDate, setEndDate] = useState(vacation.end_date);
  const [showDelete, setShowDelete] = useState(false);
  const themeVars = darkTheme;

  async function handleUpdateVacation() {
    const { error } = await supabase
      .from("vacations")
      .update({ name, start_date: startDate, end_date: endDate })
      .eq("id", vacation.id);

    if (!error) {
      setEditing(false);
      onVacationUpdated();
    }
  }

  async function handleArchiveVacation() {
    const { error } = await supabase
      .from("vacations")
      .update({ archived: true })
      .eq("id", vacation.id);

    if (!error) {
      onVacationUpdated();
    }
  }

  return (
    <div>
      {editing ? (
        <div>
          <StyledInput
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Vacation Name"
            themeVars={themeVars}
          />
          <StyledInput
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            themeVars={themeVars}
          />
          <StyledInput
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            themeVars={themeVars}
          />
          <StyledButton
            onClick={handleUpdateVacation}
            accent
            themeVars={themeVars}
          >
            Save
          </StyledButton>
          <StyledButton onClick={() => setEditing(false)} themeVars={themeVars}>
            Cancel
          </StyledButton>
        </div>
      ) : (
        <div>
          <h3>{vacation.name}</h3>
          <p>
            {vacation.start_date} - {vacation.end_date}
          </p>
          <StyledButton
            onClick={() => setEditing(true)}
            accent
            themeVars={themeVars}
          >
            Edit
          </StyledButton>
          <StyledButton
            onClick={() => setShowDelete(true)}
            danger
            themeVars={themeVars}
          >
            Archive
          </StyledButton>
          <ConfirmDialog
            open={showDelete}
            message="Archive this vacation?"
            onConfirm={handleArchiveVacation}
            onCancel={() => setShowDelete(false)}
            themeVars={themeVars}
          />
        </div>
      )}
    </div>
  );
}
