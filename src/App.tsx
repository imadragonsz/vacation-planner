import React, { useState, useEffect } from "react";
import { UserContext } from "./context";
import { supabase } from "./supabaseClient";
import NavBar from "./components/NavBar";
import { VacationCalendar } from "./pages/VacationCalendar";
import VacationEditModal from "./VacationEditModal";
import { VacationDetails } from "./pages/VacationDetails";
import AccountPage from "./pages/AccountPage";
import MyItinerary from "./pages/MyItinerary";
import "./styles/App.css";
import { useVacations, useAddVacation } from "./hooks/useVacations";
import VacationListItem from "./VacationListItem";
import AuthForm from "./components/AuthForm";
import VacationAddModal from "./VacationAddModal";
import { handleArchiveVacation, handleArchiveRestore } from "./utils/handlers";
// @ts-ignore
import ClipLoader from "react-spinners/ClipLoader";
import Toast from "./components/Toast";
import {
  CssBaseline,
  ThemeProvider,
  createTheme,
  Box,
  Checkbox,
  Typography,
  TextField,
  Button,
  Divider,
  Tabs,
  Tab,
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  useMediaQuery,
} from "@mui/material";
import MapIcon from "@mui/icons-material/Map";
import HomeIcon from "@mui/icons-material/Home";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import AddIcon from "@mui/icons-material/Add";

import { Vacation } from "./vacation";

interface AppProps {
  user: any;
  setUser: React.Dispatch<React.SetStateAction<any>>;
}

function App({ user, setUser }: AppProps) {
  const [themeMode, setThemeMode] = useState<"dark" | "light">("dark");

  const theme = React.useMemo(
    () =>
      createTheme({
        palette: {
          mode: themeMode,
          primary: {
            main: "#1976d2",
          },
          secondary: {
            main: "#dc004e",
          },
          background: {
            default: themeMode === "dark" ? "#0f1115" : "#f5f5f7",
            paper: themeMode === "dark" ? "#1a1d23" : "#ffffff",
          },
        },
        typography: {
          fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        },
        components: {
          MuiButton: {
            styleOverrides: {
              root: {
                borderRadius: 8,
                textTransform: "none",
                fontWeight: 600,
              },
            },
          },
        },
      }),
    [themeMode]
  );

  const {
    vacations,
    loading: vacationsLoading,
    fetchVacations,
  } = useVacations(
    () => {},
    () => {}
  );

  const { loading: addVacationLoading } = useAddVacation(
    fetchVacations,
    () => {}
  );

  const loading = vacationsLoading || addVacationLoading;

  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // State variables
  const [loadingUser, setLoadingUser] = useState(true);
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [activeTab, setActiveTab] = useState(0); // 0: My Trips, 1: Shared Trips
  const [showAccount, setShowAccount] = useState(false);
  const [showItinerary, setShowItinerary] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [editingVacation, setEditingVacation] = useState<Vacation | null>(null);
  const [selectedVacation, setSelectedVacation] = useState<Vacation | null>(
    null
  );
  const [dbStatus, setDbStatus] = useState("checking");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register" | "reset">(
    "login"
  );
  const [showAddVacationModal, setShowAddVacationModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"info" | "success" | "error">(
    "info"
  );

  useEffect(() => {
    fetchVacations(showArchived);

    // Subscribe to any changes in the vacations table
    const channel = supabase
      .channel("vacations-list-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "vacations" },
        () => {
          fetchVacations(showArchived);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [showArchived, fetchVacations]);

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
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        setLoadingUser(false);

        // Auto-create profile if it doesn't exist
        if (currentUser) {
          supabase
            .from("profiles")
            .select("id")
            .eq("id", currentUser.id)
            .maybeSingle()
            .then(({ data }) => {
              if (!data) {
                supabase
                  .from("profiles")
                  .insert([
                    {
                      id: currentUser.id,
                      display_name:
                        currentUser.user_metadata?.display_name ||
                        currentUser.email?.split("@")[0] ||
                        "New Traveler",
                    },
                  ])
                  .then(() => {
                    fetchVacations(showArchived);
                  });
              }
            });
        }
      }
    );

    return () => {
      listener?.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount to establish the listener

  // Load theme preference from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark" || savedTheme === "light") {
      setThemeMode(savedTheme as "dark" | "light");
    }
  }, []);

  // Save theme preference to localStorage
  useEffect(() => {
    localStorage.setItem("theme", themeMode);
  }, [themeMode]);

  // Open vacation edit modal
  function openEditVacationModal(vacation: Vacation) {
    setEditingVacation(vacation);
  }

  // Filter vacations
  const filteredVacations = vacations.filter((vacation) => {
    const query = search.toLowerCase();
    const matchesSearch =
      vacation.name.toLowerCase().includes(query) ||
      vacation.destination.toLowerCase().includes(query);

    if (!user) return matchesSearch; // For guests, show all (filtered by archive)

    const isMine =
      vacation.user_id === user.id ||
      vacation.vacation_participants?.some((p) => p.user_id === user.id);

    if (activeTab === 0) {
      return matchesSearch && isMine;
    } else {
      return matchesSearch && !isMine;
    }
  });

  const displayedVacations = filteredVacations.filter(
    (vacation) => showArchived || !vacation.archived
  );

  // Toast notification function
  const showToast = (message: string, type: "info" | "success" | "error") => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Example usage of showToast
  useEffect(() => {
    if (dbStatus === "error") {
      showToast("Error connecting to the database.", "error");
    }
  }, [dbStatus]);

  // Render loading states
  if (loading || loadingUser) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
            background: themeMode === "dark" ? "#0f1115" : "#f5f5f7",
          }}
        >
          <ClipLoader color="#1976d2" size={50} />
        </div>
      </ThemeProvider>
    );
  }

  // Render personal itinerary page
  if (showItinerary && user) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <UserContext.Provider value={{ user }}>
          <div className="vp-main">
            <NavBar
              onCalendarToggle={() => setShowCalendar((prev) => !prev)}
              theme={themeMode}
              setTheme={setThemeMode}
              user={user}
              setShowAccount={setShowAccount}
              setShowItinerary={setShowItinerary}
              setShowCalendar={setShowCalendar}
              setShowAuthModal={setShowAuthModal}
              handleLogout={async () => {
                await supabase.auth.signOut();
                setUser(null);
                setShowAccount(false);
                setShowItinerary(false);
              }}
              onBackToTrips={() => {
                setShowItinerary(false);
                setShowAccount(false);
                setShowCalendar(false);
              }}
            />
            <MyItinerary user={user} onHome={() => setShowItinerary(false)} />
          </div>
        </UserContext.Provider>
      </ThemeProvider>
    );
  }

  // Render account page
  if (showAccount && user) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <UserContext.Provider value={{ user }}>
          <div className="vp-main">
            <NavBar
              onCalendarToggle={() => setShowCalendar((prev) => !prev)}
              theme={themeMode}
              setTheme={setThemeMode}
              user={user}
              setShowAccount={setShowAccount}
              setShowItinerary={setShowItinerary}
              setShowCalendar={setShowCalendar}
              setShowAuthModal={setShowAuthModal}
              handleLogout={async () => {
                await supabase.auth.signOut();
                setUser(null);
                setShowAccount(false);
                setShowItinerary(false);
              }}
              onBackToTrips={() => {
                setShowItinerary(false);
                setShowAccount(false);
                setShowCalendar(false);
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
                setShowCalendar(false);
                setShowItinerary(false);
              }}
            />
          </div>
        </UserContext.Provider>
      </ThemeProvider>
    );
  }

  // Main application layout
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <UserContext.Provider value={{ user }}>
        <div className="vp-main">
          <NavBar
            onCalendarToggle={() => setShowCalendar((prev) => !prev)}
            theme={themeMode}
            setTheme={setThemeMode}
            user={user}
            setShowAccount={setShowAccount}
            setShowItinerary={setShowItinerary}
            setShowCalendar={setShowCalendar}
            setShowAuthModal={setShowAuthModal}
            handleLogout={async () => {
              await supabase.auth.signOut();
              setUser(null);
              setShowAccount(false);
              setShowItinerary(false);
            }}
            onBackToTrips={() => {
              setShowItinerary(false);
              setShowAccount(false);
              setShowCalendar(false);
            }}
          />
          {dbStatus === "error" && (
            <div style={{ color: "red" }}>
              Error connecting to the database. Some features may not work.
            </div>
          )}
          <VacationCalendar
            open={showCalendar}
            onClose={() => setShowCalendar(false)}
            vacations={vacations}
            onVacationClick={(vac) => {
              setSelectedVacation(vac);
              setShowCalendar(false);
            }}
          />
          {editingVacation && (
            <VacationEditModal
              open={!!editingVacation}
              vacation={editingVacation}
              onSave={async (updatedVacation) => {
                const { error } = await supabase
                  .from("vacations")
                  .update(updatedVacation)
                  .eq("id", updatedVacation.id);
                if (!error) {
                  fetchVacations(showArchived);
                  setEditingVacation(null);
                }
              }}
              onClose={() => setEditingVacation(null)}
            />
          )}
          {showAddVacationModal && (
            <VacationAddModal
              open={showAddVacationModal}
              onClose={() => setShowAddVacationModal(false)}
              onSubmit={async (data) => {
                const { error } = await supabase.from("vacations").insert([
                  {
                    name: data.name,
                    destination: data.destination,
                    start_date: data.startDate,
                    end_date: data.endDate,
                    user_id: user.id,
                  },
                ]);
                if (!error) {
                  fetchVacations(showArchived);
                  setShowAddVacationModal(false);
                }
              }}
            />
          )}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", lg: "300px 1fr" },
              minHeight: "calc(100vh - 84px)", // Subtract navbar height
              bgcolor: "rgba(0,0,0,0.2)",
            }}
          >
            <Box
              component="aside"
              sx={{
                bgcolor: "rgba(255, 255, 255, 0.02)",
                backdropFilter: "blur(20px)",
                p: 3,
                borderRight: "1px solid rgba(255, 255, 255, 0.05)",
                display:
                  isMobile &&
                  (selectedVacation ||
                    showAccount ||
                    showCalendar ||
                    showItinerary)
                    ? "none"
                    : "flex",
                flexDirection: "column",
                gap: 2,
                position: "sticky",
                top: 0,
                height: isMobile ? "auto" : "calc(100vh - 84px)",
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 800,
                  opacity: 0.5,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  mb: 1,
                }}
              >
                Your Vacations
              </Typography>
              <Button
                variant="contained"
                onClick={() => setShowAddVacationModal(true)}
                fullWidth
                disabled={!user}
                startIcon={<AddIcon />}
                sx={{
                  py: 1.2,
                  fontWeight: 800,
                  borderRadius: 2,
                  bgcolor: "primary.main",
                  "&:hover": { bgcolor: "primary.dark" },
                  ...(!user && { opacity: 0.5, cursor: "not-allowed" }),
                }}
              >
                {user ? "New Trip" : "Login to Add Trip"}
              </Button>

              {user && (
                <Tabs
                  value={activeTab}
                  onChange={(_, newValue) => setActiveTab(newValue)}
                  variant="fullWidth"
                  sx={{
                    minHeight: 40,
                    mt: 1,
                    "& .MuiTab-root": {
                      minHeight: 40,
                      fontWeight: 700,
                      fontSize: "0.75rem",
                      borderRadius: 1.5,
                      color: "rgba(255,255,255,0.4)",
                    },
                    "& .MuiTab-root.Mui-selected": {
                      color: "#fff",
                      bgcolor: "rgba(255,255,255,0.05)",
                    },
                    "& .MuiTabs-indicator": {
                      display: "none",
                    },
                  }}
                >
                  <Tab label="My Trips" />
                  <Tab label="Explore" />
                </Tabs>
              )}

              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 1.5,
                  mt: 1,
                }}
              >
                <TextField
                  size="small"
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  fullWidth
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      bgcolor: "rgba(255, 255, 255, 0.03)",
                      borderRadius: 2,
                    },
                  }}
                />
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    px: 0.5,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{ opacity: 0.4, fontWeight: 700 }}
                  >
                    Include Archived
                  </Typography>
                  <Checkbox
                    size="small"
                    checked={showArchived}
                    onChange={(e) => setShowArchived(e.target.checked)}
                    sx={{ p: 0, color: "rgba(255,255,255,0.2)" }}
                  />
                </Box>
              </Box>

              <Divider sx={{ my: 1, opacity: 0.05 }} />

              <Box
                component="ul"
                sx={{
                  listStyle: "none",
                  p: 0,
                  m: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: 0.5,
                  flex: 1,
                  overflowY: "auto",
                  "&::-webkit-scrollbar": { width: 4 },
                  "&::-webkit-scrollbar-thumb": {
                    bgcolor: "rgba(255,255,255,0.05)",
                    borderRadius: 10,
                  },
                }}
              >
                {displayedVacations.length > 0 ? (
                  displayedVacations.map((vacation) => (
                    <VacationListItem
                      key={vacation.id}
                      vacation={vacation}
                      selected={selectedVacation?.id === vacation.id}
                      user={user}
                      onSelect={() => setSelectedVacation(vacation)}
                      onEdit={openEditVacationModal}
                      onDelete={() =>
                        handleArchiveVacation(
                          vacation,
                          () => {},
                          fetchVacations,
                          (toast) => showToast(toast.message, toast.type)
                        )
                      }
                      onRestore={() =>
                        handleArchiveRestore(
                          vacation,
                          fetchVacations,
                          (toast) => showToast(toast.message, toast.type)
                        )
                      }
                      onDeletedPermanently={() => {
                        fetchVacations(showArchived);
                        if (selectedVacation?.id === vacation.id) {
                          setSelectedVacation(null);
                        }
                        showToast("Trip deleted permanently", "success");
                      }}
                    />
                  ))
                ) : (
                  <Box sx={{ mt: 8, textAlign: "center", px: 2 }}>
                    <MapIcon
                      sx={{
                        fontSize: 48,
                        opacity: 0.1,
                        mb: 2,
                        color: "primary.main",
                      }}
                    />
                    <Typography
                      variant="body2"
                      sx={{ opacity: 0.4, fontWeight: 700, mb: 1 }}
                    >
                      No trips found
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.2 }}>
                      {search
                        ? "Try a different search term"
                        : "Start by creating your first adventure!"}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>

            <Box
              component="main"
              sx={{
                flex: 1,
                height: "calc(100vh - 84px)",
                overflowY: "auto",
                bgcolor: "inherit",
                p: { xs: 1.5, sm: 2, md: 3 }, // Added padding here
              }}
            >
              {selectedVacation ? (
                <VacationDetails
                  vacation={selectedVacation}
                  user={user}
                  onRefresh={() => fetchVacations(showArchived)}
                />
              ) : (
                <Box
                  sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: 0.2,
                    p: 4,
                    textAlign: "center",
                  }}
                >
                  <MapIcon sx={{ fontSize: 80, mb: 2 }} />
                  <Typography variant="h4" sx={{ fontWeight: 900, mb: 1 }}>
                    Adventure Awaits
                  </Typography>
                  <Typography variant="body1">
                    Select a trip from the sidebar to start planning your next
                    getaway.
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
          <footer className="vp-footer">© 2025 Vacation Planner</footer>

          {showAuthModal && (
            <div className="auth-modal-wrapper">
              <AuthForm
                mode={authMode}
                setMode={setAuthMode}
                errorMsg={null}
                onAuth={(err) => {
                  if (!err) setShowAuthModal(false);
                }}
              />
            </div>
          )}

          {toastMessage && (
            <Toast
              message={toastMessage}
              type={toastType}
              onClose={() => setToastMessage(null)}
            />
          )}

          {isMobile && user && (
            <Paper
              sx={{
                position: "fixed",
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 1100,
              }}
              elevation={3}
            >
              <BottomNavigation
                showLabels
                value={
                  showAccount ? 3 : showCalendar ? 2 : showItinerary ? 1 : 0
                }
                onChange={(event, newValue) => {
                  if (newValue === 0) {
                    setShowAccount(false);
                    setShowCalendar(false);
                    setShowItinerary(false);
                    setSelectedVacation(null);
                  } else if (newValue === 1) {
                    setShowAccount(false);
                    setShowCalendar(false);
                    setShowItinerary(true);
                  } else if (newValue === 2) {
                    setShowAccount(false);
                    setShowCalendar(true);
                    setShowItinerary(false);
                  } else if (newValue === 3) {
                    setShowAccount(true);
                    setShowCalendar(false);
                    setShowItinerary(false);
                  }
                }}
              >
                <BottomNavigationAction label="Trips" icon={<HomeIcon />} />
                <BottomNavigationAction label="Plan" icon={<MapIcon />} />
                <BottomNavigationAction
                  label="Calendar"
                  icon={<CalendarMonthIcon />}
                />
                <BottomNavigationAction
                  label="Account"
                  icon={<AccountCircleIcon />}
                />
              </BottomNavigation>
            </Paper>
          )}
        </div>
      </UserContext.Provider>
    </ThemeProvider>
  );
}

export default App;
