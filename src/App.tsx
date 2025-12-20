import React, { useState, useEffect } from "react";
import { UserContext } from "./context";
import { supabase } from "./supabaseClient";
import NavBar from "./components/NavBar";
import { VacationCalendar } from "./pages/VacationCalendar";
import VacationEditModal from "./VacationEditModal";
import AuthForm from "./components/AuthForm";
import VacationListItem from "./VacationListItem";
import { VacationDetails } from "./pages/VacationDetails";
import AccountPage from "./pages/AccountPage";
import "./styles/App.css";
import { darkTheme, lightTheme } from "./styles/theme";
import { useVacations, useAddVacation } from "./hooks/useVacations";

interface Vacation {
  id: number;
  name: string;
  destination: string;
  start_date: string;
  end_date: string;
  archived?: boolean;
}

interface AppProps {
  user: any;
  setUser: React.Dispatch<React.SetStateAction<any>>;
}

function App({ user, setUser }: AppProps) {
  const {
    vacations,
    setVacations, // Added setVacations to manage vacation state
    loading: vacationsLoading,
    fetchVacations,
  } = useVacations(() => {}, pushUndo);

  const {
    addVacation,
    name,
    setName,
    destination,
    setDestination,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    loading: addVacationLoading,
  } = useAddVacation(fetchVacations, pushUndo);

  const loading = vacationsLoading || addVacationLoading;

  // State variables
  const [loadingUser, setLoadingUser] = useState(true);
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [editingVacation, setEditingVacation] = useState<Vacation | null>(null);
  const [editingVacationValues, setEditingVacationValues] =
    useState<Vacation | null>(null);
  const [selectedVacation, setSelectedVacation] = useState<Vacation | null>(
    null
  );
  const [undoStack, setUndoStack] = useState<Vacation[][]>([]);
  const [redoStack, setRedoStack] = useState<Vacation[][]>([]);
  const [dbStatus, setDbStatus] = useState("checking");
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  const themeVars = theme === "dark" ? darkTheme : lightTheme;

  useEffect(() => {
    fetchVacations();
  }, [fetchVacations]);

  // Check database connection
  useEffect(() => {
    async function checkDbConnection() {
      setDbStatus("checking");
      try {
        const { error } = await supabase
          .from("vacations")
          .select("id")
          .limit(1);
        if (error) {
          setDbStatus("error");
        } else {
          setDbStatus("ok");
        }
      } catch (err) {
        setDbStatus("error");
      }
    }
    checkDbConnection();
  }, []);

  // Authentication state listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoadingUser(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setLoadingUser(false);
      }
    );
    return () => listener?.subscription.unsubscribe();
  }, [setUser]);

  // Undo/Redo functionality
  function pushUndo() {
    setUndoStack((prev) => [...prev, vacations]);
    setRedoStack([]);
  }

  function handleUndo() {
    if (undoStack.length === 0) return;
    setRedoStack((prev) => [vacations, ...prev]);
    const previousVacations = undoStack.pop() || [];
    setVacations(previousVacations); // Correctly using setVacations
  }

  function handleRedo() {
    if (redoStack.length === 0) return;
    setUndoStack((prev) => [...prev, vacations]);
    const nextVacations = redoStack.shift() || [];
    setVacations(nextVacations); // Correctly using setVacations
  }

  // Archive a vacation
  async function handleArchiveVacation(vacation: Vacation) {
    if (vacation.archived) return;

    const confirmed = window.confirm(
      "Are you sure you want to archive this vacation? You can restore it later from the archive."
    );
    if (confirmed) {
      pushUndo();
      const { error } = await supabase
        .from("vacations")
        .update({ archived: true })
        .eq("id", vacation.id);
      if (!error) fetchVacations();
      else console.error("Error archiving vacation:", error);
    }
  }

  // Save vacation edits
  function handleSaveVacation(e: React.FormEvent) {
    e.preventDefault();
    if (!editingVacation || !editingVacationValues) return;

    pushUndo();

    supabase
      .from("vacations")
      .update({
        name: editingVacationValues.name,
        destination: editingVacationValues.destination,
        start_date: editingVacationValues.start_date,
        end_date: editingVacationValues.end_date,
      })
      .eq("id", editingVacation.id)
      .then(({ error }) => {
        if (!error) fetchVacations();
        else console.error("Error updating vacation:", error);
        setEditingVacation(null);
      });
  }

  // Open vacation edit modal
  function openEditVacationModal(vacation: Vacation) {
    setEditingVacation(vacation);
    setEditingVacationValues({ ...vacation });
  }

  // Filter vacations
  const filteredVacations = vacations.filter((vacation) => {
    const query = search.toLowerCase();
    return (
      vacation.name.toLowerCase().includes(query) ||
      vacation.destination.toLowerCase().includes(query)
    );
  });

  const displayedVacations = filteredVacations.filter(
    (vacation) => showArchived || !vacation.archived
  );

  // Render loading states
  if (loading || loadingUser) return <p>Loading...</p>;

  // Render account page
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
          onCalendarToggle={() => setShowCalendar((prev) => !prev)}
          themeVars={themeVars}
          theme={theme}
          setTheme={setTheme}
          user={user}
          setShowAccount={setShowAccount}
          setShowCalendar={setShowCalendar}
          handleLogout={async () => {
            await supabase.auth.signOut();
            setUser(null);
            setShowAccount(false);
          }}
        />
        <AccountPage
          user={user}
          onLogout={async () => {
            await supabase.auth.signOut();
            setUser(null);
            setShowAccount(false);
          }}
          onHome={() => {
            setShowAccount(false);
            setShowCalendar(true);
          }}
          themeVars={themeVars}
        />
      </>
    );
  }

  // Main application layout
  return (
    <UserContext.Provider value={{ user }}>
      {user ? (
        <div className="vp-main">
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
            onCalendarToggle={() => setShowCalendar((prev) => !prev)}
            themeVars={themeVars}
            theme={theme}
            setTheme={setTheme}
            user={user}
            setShowAccount={setShowAccount}
            setShowCalendar={setShowCalendar}
            setShowAuthModal={setShowAuthModal}
            handleLogout={async () => {
              await supabase.auth.signOut();
              setUser(null);
              setShowAccount(false);
            }}
          />
          {dbStatus === "error" && (
            <div style={{ color: "red" }}>
              Error connecting to the database. Some features may not work.
            </div>
          )}
          {showCalendar && (
            <VacationCalendar
              vacations={vacations}
              onVacationClick={setEditingVacation}
              onEditVacation={pushUndo}
            />
          )}
          {editingVacation && (
            <VacationEditModal
              vacation={editingVacation}
              values={editingVacationValues}
              onChange={(values) => setEditingVacationValues(values)}
              onSave={handleSaveVacation}
              onClose={() => setEditingVacation(null)}
              themeVars={themeVars}
            />
          )}
          {showAuthModal && (
            <AuthForm
              themeVars={themeVars}
              mode="login"
              setMode={() => {}}
              errorMsg={null}
              onAuth={(err) => {
                if (!err) setShowAuthModal(false);
              }}
            />
          )}
          <div className="vp-content">
            <form onSubmit={addVacation} className="vp-form">
              <input
                type="text"
                placeholder="Trip Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="vp-input"
              />
              <input
                type="text"
                placeholder="Destination"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                required
                className="vp-input"
              />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="vp-input"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className="vp-input"
              />
              <button type="submit" disabled={loading} className="vp-button">
                Add Vacation
              </button>
            </form>
            <aside className="vp-sidebar">
              <h2>Your Vacations</h2>
              <input
                type="text"
                placeholder="Search vacations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="vp-input"
              />
              <label>
                <input
                  type="checkbox"
                  checked={showArchived}
                  onChange={(e) => setShowArchived(e.target.checked)}
                />
                Show Archived Vacations
              </label>
              <ul>
                {displayedVacations.map((vacation) => (
                  <VacationListItem
                    key={vacation.id}
                    vacation={vacation}
                    selected={selectedVacation?.id === vacation.id}
                    themeVars={themeVars}
                    onSelect={() => setSelectedVacation(vacation)}
                    onEdit={openEditVacationModal}
                    onDelete={() => handleArchiveVacation(vacation)}
                  />
                ))}
              </ul>
            </aside>
            <main className="vp-main-content">
              {selectedVacation && (
                <div className="vp-details">
                  <VacationDetails
                    vacationId={selectedVacation.id}
                    theme={theme}
                    user={user}
                  />
                </div>
              )}
            </main>
          </div>
          <footer className="vp-footer">© 2025 Vacation Planner</footer>
          <button
            onClick={handleRedo}
            disabled={redoStack.length === 0}
            className="vp-button"
          >
            Redo
          </button>
          <button
            onClick={handleUndo}
            disabled={undoStack.length === 0}
            className="vp-button"
          >
            Undo
          </button>
        </div>
      ) : (
        <div>Please log in to continue.</div>
      )}
    </UserContext.Provider>
  );
}

export default App;
