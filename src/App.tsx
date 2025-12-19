import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient.ts";
import { VacationDetails } from "./VacationDetails.tsx";
import { VacationCalendar } from "./VacationCalendar.tsx";
import AccountPage from "./pages/AccountPage.tsx";
import VacationEditModal from "./VacationEditModal.tsx";
import VacationListItem from "./VacationListItem.tsx";
import { Vacation } from "./vacation";
import { darkTheme, lightTheme } from "./styles/theme.ts";
import Toast from "./components/Toast.tsx";
import AuthForm from "./components/AuthForm.tsx";
import NavBar from "./components/NavBar.tsx";

// Removed inline NavBar JSX and replaced it with the NavBar component

// Removed unused imports
// Removed `StyledInput`, `StyledButton`, `handleArchiveVacation`, `handleUndo`, and `handleRedo` imports

interface AppProps {
  user: any;
  setUser: (user: any) => void;
}

function App({ user, setUser }: AppProps) {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const themeVars = theme === "dark" ? darkTheme : lightTheme;
  const [authMode, setAuthMode] = useState<"login" | "register" | "reset">(
    "login"
  );
  const [authError, setAuthError] = useState<string | null>(null);
  const [showAccount, setShowAccount] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [vacations, setVacations] = useState<Vacation[]>([]);
  const [selectedVacation, setSelectedVacation] = useState<Vacation | null>(
    null
  );
  const [editingVacation, setEditingVacation] = useState<Vacation | null>(null);
  const [editingVacationValues, setEditingVacationValues] =
    useState<Vacation | null>(null);
  const [name, setName] = useState("");
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [dbStatus, setDbStatus] = useState<"ok" | "error" | "checking">(
    "checking"
  );
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<{
    message: string;
    type?: "info" | "success" | "error";
  } | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showArchived, setShowArchived] = useState(false); // New state for checkbox

  // Undo/redo stacks for vacation edits
  const [undoStack, setUndoStack] = useState<Vacation[][]>([]);
  const [redoStack, setRedoStack] = useState<Vacation[][]>([]);

  // Push current vacations to undo stack before making changes
  function pushUndo() {
    setUndoStack((prev) => [...prev, vacations]);
    setRedoStack([]); // Clear redo stack on new action
  }

  function handleUndo() {
    if (undoStack.length === 0) return;
    setRedoStack((prev) => [vacations, ...prev]);
    const prevVacations = undoStack[undoStack.length - 1];
    setVacations(prevVacations);
    setUndoStack((prev) => prev.slice(0, -1));
    setToast({ message: "Undid last change.", type: "info" });
  }

  function handleRedo() {
    if (redoStack.length === 0) return;
    setUndoStack((prev) => [...prev, vacations]);
    const nextVacations = redoStack[0];
    setVacations(nextVacations);
    setRedoStack((prev) => prev.slice(1));
    setToast({ message: "Redid change.", type: "info" });
  }

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => setUser(session?.user ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => setUser(session?.user ?? null)
    );
    checkDbConnection();
    fetchVacations();
    return () => listener?.subscription.unsubscribe();
  }, [setUser]); // Added `setUser` to the dependency array

  async function checkDbConnection() {
    setDbStatus("checking");
    const { error } = await supabase.from("vacations").select("id").limit(1);
    setDbStatus(error ? "error" : "ok");
  }

  async function fetchVacations() {
    setLoading(true);
    const { data, error } = await supabase
      .from("vacations")
      .select("*")
      .order("id", { ascending: false });
    if (!error && data) setVacations(data as Vacation[]);
    setLoading(false);
  }

  async function addVacation(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !destination || !startDate || !endDate) return;
    setLoading(true);
    pushUndo();
    const { error } = await supabase
      .from("vacations")
      .insert([
        { name, destination, start_date: startDate, end_date: endDate },
      ]);
    if (!error) {
      setName("");
      setDestination("");
      setStartDate("");
      setEndDate("");
      fetchVacations();
      setToast({ message: "Vacation added!", type: "success" });
    } else {
      setToast({ message: error.message, type: "error" });
    }
    setLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setUser(null);
    setShowAccount(false);
  }

  function openEditVacationModal(vac: Vacation) {
    setEditingVacation(vac);
    setEditingVacationValues({ ...vac });
  }
  function closeEditVacationModal() {
    setEditingVacation(null);
    setEditingVacationValues(null);
  }
  async function handleEditVacationSave(e: React.FormEvent) {
    e.preventDefault();
    if (!editingVacationValues) return;
    pushUndo();
    const { id, name, start_date, end_date } = editingVacationValues;
    const { error } = await supabase
      .from("vacations")
      .update({ name, start_date, end_date })
      .eq("id", id);
    if (!error) {
      fetchVacations();
      closeEditVacationModal();
      setToast({ message: "Vacation updated!", type: "success" });
    } else {
      setToast({ message: error.message, type: "error" });
    }
  }
  async function handleArchiveVacation(vacation: Vacation) {
    if (vacation.archived) {
      setToast({ message: "This vacation is already archived.", type: "info" });
      return;
    }

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

  // Account page (only for logged-in users)
  if (showAccount && user) {
    return (
      <>
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: themeVars.background,
            zIndex: -1,
          }}
          aria-hidden="true"
        />
        <NavBar
          themeVars={themeVars}
          theme={theme}
          setTheme={setTheme}
          user={user}
          setShowAccount={setShowAccount}
          setShowCalendar={setShowCalendar}
          handleLogout={handleLogout}
        />
        <AccountPage
          user={user}
          onLogout={handleLogout}
          onHome={() => {
            setShowAccount(false);
            setShowCalendar(true);
          }}
          themeVars={themeVars}
        />
      </>
    );
  }

  // Calendar page
  if (showCalendar) {
    return (
      <>
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: themeVars.background,
            zIndex: -1,
          }}
          aria-hidden="true"
        />
        <NavBar
          themeVars={themeVars}
          theme={theme}
          setTheme={setTheme}
          user={user}
          setShowAccount={setShowAccount}
          setShowCalendar={setShowCalendar}
          handleLogout={handleLogout}
        />
        <div
          style={{
            minHeight: "100vh",
            background: "transparent",
            fontFamily: "Segoe UI, Roboto, Arial, sans-serif",
            color: themeVars.text,
            display: "flex",
            flexDirection: "row",
            position: "relative",
          }}
        >
          <div style={{ flex: 2, padding: 24 }}>
            <VacationCalendar
              vacations={vacations}
              onVacationClick={user ? setSelectedVacation : undefined}
              onEditVacation={user ? handleArchiveVacation : undefined}
              onDateClick={(date: string) => {
                const found = vacations.find(
                  (v) => v.start_date <= date && v.end_date >= date
                );
                if (found) setSelectedVacation(found);
              }}
              colorByStatus={true}
            />
          </div>
          <div
            style={{
              flex: 1,
              minWidth: 340,
              maxWidth: 420,
              background: themeVars.card,
              color: themeVars.text,
              boxShadow: themeVars.shadow,
              borderLeft: `2px solid ${themeVars.border}`,
              padding: 32,
              position: "sticky",
              top: 0,
              height: "100vh",
              overflowY: "auto",
              transition: "transform 0.3s",
              transform: selectedVacation
                ? "translateX(0)"
                : "translateX(100%)",
              zIndex: 1100,
              display: selectedVacation ? "block" : "none",
            }}
            aria-label="Vacation details side panel"
          >
            {selectedVacation && (
              <>
                <button
                  style={{
                    float: "right",
                    background: "none",
                    border: "none",
                    fontSize: 22,
                    cursor: "pointer",
                    color: themeVars.text,
                  }}
                  aria-label="Close details panel"
                  onClick={() => setSelectedVacation(null)}
                >
                  &times;
                </button>
                <h2 style={{ marginTop: 0 }}>{selectedVacation.name}</h2>
                <p>
                  <b>Destination:</b> {selectedVacation.destination}
                </p>
                <p>
                  <b>Start:</b> {selectedVacation.start_date}
                </p>
                <p>
                  <b>End:</b> {selectedVacation.end_date}
                </p>
                {/* Vacation sharing UI */}
                <div style={{ marginBottom: 16 }}>
                  <h3>Share this vacation</h3>
                  <div
                    style={{ display: "flex", gap: 8, alignItems: "center" }}
                  >
                    <button
                      onClick={() => {
                        const url = `${window.location.origin}${window.location.pathname}?vacationId=${selectedVacation.id}`;
                        navigator.clipboard.writeText(url);
                        setToast({
                          message: "Shareable link copied!",
                          type: "success",
                        });
                      }}
                      style={{
                        fontSize: 15,
                        background: themeVars.accent,
                        color: themeVars.text,
                        border: "none",
                        borderRadius: 6,
                        padding: "8px 16px",
                        cursor: "pointer",
                        transition: "background 0.2s",
                      }}
                    >
                      Copy Link
                    </button>
                    <button
                      onClick={() => {
                        const url = `${window.location.origin}${window.location.pathname}?vacationId=${selectedVacation.id}`;
                        const subject = encodeURIComponent(
                          `Check out my vacation plan: ${selectedVacation.name}`
                        );
                        const body = encodeURIComponent(
                          `Here's a vacation plan I want to share with you!\n\nView it here: ${url}`
                        );
                        window.open(`mailto:?subject=${subject}&body=${body}`);
                      }}
                      style={{
                        fontSize: 15,
                        background: themeVars.accent,
                        color: themeVars.text,
                        border: "none",
                        borderRadius: 6,
                        padding: "8px 16px",
                        cursor: "pointer",
                        transition: "background 0.2s",
                      }}
                    >
                      Share via Email
                    </button>
                  </div>
                </div>
                <VacationDetails
                  vacationId={selectedVacation.id}
                  theme={theme}
                  user={user}
                />
              </>
            )}
          </div>
        </div>
      </>
    );
  }

  // Filter vacations based on the checkbox
  const filteredVacations = vacations.filter(
    (vac) => showArchived || !vac.archived
  );

  // Main planner page
  return (
    <>
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          background: themeVars.background,
          zIndex: -1,
        }}
        aria-hidden="true"
      />
      <NavBar
        themeVars={themeVars}
        theme={theme}
        setTheme={setTheme}
        user={user}
        setShowAccount={setShowAccount}
        setShowCalendar={setShowCalendar}
        handleLogout={handleLogout}
      />
      <div
        className="vp-main"
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "40px 16px",
          minHeight: "100vh",
          background: "transparent",
          color: themeVars.text,
          fontFamily: "Segoe UI, Roboto, Arial, sans-serif",
        }}
      >
        <div
          className="vp-card"
          style={{
            background: themeVars.card,
            borderRadius: 16,
            boxShadow: themeVars.shadow,
            padding: 32,
          }}
        >
          <div
            className="vp-flex-row"
            style={{
              marginBottom: 24,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 16,
            }}
          >
            {/* Undo/Redo buttons */}
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <button
                onClick={handleUndo}
                disabled={undoStack.length === 0}
                style={{
                  background: themeVars.accent2,
                  color: themeVars.text,
                  border: "none",
                  borderRadius: 8,
                  padding: "8px 14px",
                  fontWeight: 600,
                  fontSize: 15,
                  cursor: undoStack.length === 0 ? "not-allowed" : "pointer",
                  opacity: undoStack.length === 0 ? 0.5 : 1,
                }}
                title="Undo"
              >
                Undo
              </button>
              <button
                onClick={handleRedo}
                disabled={redoStack.length === 0}
                style={{
                  background: themeVars.accent2,
                  color: themeVars.text,
                  border: "none",
                  borderRadius: 8,
                  padding: "8px 14px",
                  fontWeight: 600,
                  fontSize: 15,
                  cursor: redoStack.length === 0 ? "not-allowed" : "pointer",
                  opacity: redoStack.length === 0 ? 0.5 : 1,
                }}
                title="Redo"
              >
                Redo
              </button>
            </div>
            <div>
              <h1
                style={{
                  margin: 0,
                  fontWeight: 700,
                  fontSize: 36,
                  letterSpacing: 1,
                }}
              >
                🌴 Vacation Planner
              </h1>
              <div style={{ fontSize: 16, marginTop: 4 }}>
                <strong>Database:</strong>{" "}
                {dbStatus === "checking" ? (
                  <span
                    style={{ color: theme === "dark" ? "#fbc531" : "#e1b000" }}
                  >
                    Checking...
                  </span>
                ) : dbStatus === "ok" ? (
                  <span style={{ color: themeVars.accent }}>Connected</span>
                ) : (
                  <span style={{ color: "#e74c3c" }}>Error</span>
                )}
              </div>
              <div
                style={{ fontSize: 15, marginTop: 8, color: themeVars.accent2 }}
              >
                {vacations.length === 0
                  ? "No vacations yet. Start planning!"
                  : `You have ${vacations.length} vacation${
                      vacations.length > 1 ? "s" : ""
                    }.`}
              </div>
            </div>
            <input
              className="vp-input"
              type="text"
              placeholder="Search vacations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                padding: 10,
                borderRadius: 6,
                border: `1px solid ${themeVars.border}`,
                minWidth: 180,
                background: themeVars.input,
                color: themeVars.inputText,
                fontSize: 16,
              }}
              aria-label="Search vacations"
            />
            {!user && (
              <button
                onClick={() => setShowAuthModal(true)}
                style={{
                  marginLeft: 16,
                  background: themeVars.accent2,
                  color: themeVars.text,
                  border: "none",
                  borderRadius: 8,
                  padding: "10px 18px",
                  fontWeight: 600,
                  fontSize: 16,
                  cursor: "pointer",
                }}
              >
                Login / Register
              </button>
            )}
          </div>
          <button
            onClick={() => setShowCalendar(true)}
            style={{
              marginBottom: 24,
              background: themeVars.accent,
              color: themeVars.text,
              border: "none",
              borderRadius: 8,
              padding: "10px 18px",
              fontWeight: 600,
              fontSize: 16,
              cursor: "pointer",
            }}
          >
            Show Calendar
          </button>
          {user && (
            <form
              onSubmit={addVacation}
              style={{
                marginBottom: 32,
                display: "flex",
                gap: 12,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <input
                type="text"
                placeholder="Trip Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={{
                  padding: 10,
                  borderRadius: 6,
                  border: "none",
                  minWidth: 120,
                }}
              />
              <input
                type="text"
                placeholder="Destination"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                required
                style={{
                  padding: 10,
                  borderRadius: 6,
                  border: "none",
                  minWidth: 120,
                }}
              />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                style={{ padding: 10, borderRadius: 6, border: "none" }}
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                style={{ padding: 10, borderRadius: 6, border: "none" }}
              />
              <button
                type="submit"
                disabled={loading}
                style={{
                  background: themeVars.accent,
                  color: themeVars.text,
                  border: "none",
                  borderRadius: 6,
                  padding: "10px 18px",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontSize: 16,
                  transition: "background 0.2s",
                }}
              >
                Add Vacation
              </button>
            </form>
          )}
          {loading && <p style={{ color: "#fbc531" }}>Loading...</p>}
          <div
            style={{
              display: "flex",
              gap: 32,
              alignItems: "flex-start",
              flexWrap: "wrap",
            }}
          >
            <div style={{ flex: 1, minWidth: 260 }}>
              <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 12 }}>
                Your Vacations
              </h2>
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
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {(() => {
                  const filtered = filteredVacations.filter((vac) => {
                    const q = search.toLowerCase();
                    return (
                      vac.name.toLowerCase().includes(q) ||
                      vac.destination.toLowerCase().includes(q)
                    );
                  });
                  if (filtered.length === 0) {
                    return (
                      <li
                        style={{
                          color: "#888",
                          fontSize: 16,
                          padding: 16,
                          textAlign: "center",
                        }}
                      >
                        No vacations found. Try a different search or add a new
                        vacation!
                      </li>
                    );
                  }
                  return filtered.map((vac) => (
                    <VacationListItem
                      key={vac.id}
                      vacation={vac}
                      selected={selectedVacation?.id === vac.id}
                      themeVars={themeVars}
                      disabled={!user || showCalendar}
                      onSelect={() => {
                        if (!showCalendar) setSelectedVacation(vac);
                      }}
                      onEdit={user ? openEditVacationModal : undefined}
                      onDelete={
                        user
                          ? (id: number) =>
                              handleArchiveVacation({ id } as Vacation)
                          : undefined
                      }
                    />
                  ));
                })()}
              </ul>
            </div>
            <div style={{ flex: 2, minWidth: 320 }}>
              {selectedVacation && (
                <>
                  {/* Vacation sharing UI (main list view) */}
                  <div style={{ marginBottom: 16 }}>
                    <h3>Share this vacation</h3>
                    <div
                      style={{ display: "flex", gap: 8, alignItems: "center" }}
                    >
                      <button
                        onClick={() => {
                          const url = `${window.location.origin}${window.location.pathname}?vacationId=${selectedVacation.id}`;
                          navigator.clipboard.writeText(url);
                          setToast({
                            message: "Shareable link copied!",
                            type: "success",
                          });
                        }}
                        style={{
                          fontSize: 15,
                          background: themeVars.accent,
                          color: themeVars.text,
                          border: "none",
                          borderRadius: 6,
                          padding: "8px 16px",
                          cursor: "pointer",
                          transition: "background 0.2s",
                        }}
                      >
                        Copy Link
                      </button>
                      <button
                        onClick={() => {
                          const url = `${window.location.origin}${window.location.pathname}?vacationId=${selectedVacation.id}`;
                          const subject = encodeURIComponent(
                            `Check out my vacation plan: ${selectedVacation.name}`
                          );
                          const body = encodeURIComponent(
                            `Here's a vacation plan I want to share with you!\n\nView it here: ${url}`
                          );
                          window.open(
                            `mailto:?subject=${subject}&body=${body}`
                          );
                        }}
                        style={{
                          fontSize: 15,
                          background: themeVars.accent,
                          color: themeVars.text,
                          border: "none",
                          borderRadius: 6,
                          padding: "8px 16px",
                          cursor: "pointer",
                          transition: "background 0.2s",
                        }}
                      >
                        Share via Email
                      </button>
                    </div>
                  </div>
                  <VacationDetails
                    vacationId={selectedVacation.id}
                    theme={theme}
                    user={user}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      {user && editingVacation && (
        <VacationEditModal
          vacation={editingVacation}
          values={editingVacationValues}
          onChange={(vals) => setEditingVacationValues(vals)}
          onSave={handleEditVacationSave}
          onClose={closeEditVacationModal}
          themeVars={themeVars}
        />
      )}
      {showAuthModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "#000a",
            zIndex: 3000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={() => setShowAuthModal(false)}
        >
          <div
            style={{
              background: themeVars.card,
              color: themeVars.text,
              padding: 32,
              borderRadius: 12,
              boxShadow: themeVars.shadow,
              minWidth: 320,
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              style={{
                position: "absolute",
                top: 8,
                right: 8,
                background: "none",
                border: "none",
                fontSize: 22,
                cursor: "pointer",
                color: themeVars.text,
              }}
              aria-label="Close auth modal"
              onClick={() => setShowAuthModal(false)}
            >
              &times;
            </button>
            <AuthForm
              themeVars={themeVars}
              onAuth={(err: any) => {
                setAuthError(err ? err.message : null);
                if (!err) setShowAuthModal(false);
              }}
              mode={authMode}
              setMode={setAuthMode}
              errorMsg={authError}
            />
          </div>
        </div>
      )}
      {toast && toast.message && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}

export default App;
