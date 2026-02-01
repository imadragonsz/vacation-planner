import React, { useState, useEffect, lazy, Suspense } from "react";
import { UserContext } from "./context";
import { supabase } from "./supabaseClient";
import NavBar from "./components/NavBar";

import "./styles/App.css";
import { useVacations, useAddVacation } from "./hooks/useVacations";
import VacationListItem from "./VacationListItem";
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
  CircularProgress,
} from "@mui/material";
import MapIcon from "@mui/icons-material/Map";
import ExploreIcon from "@mui/icons-material/Explore";
import HomeIcon from "@mui/icons-material/Home";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import AddIcon from "@mui/icons-material/Add";

import { Vacation } from "./vacation";
import { HomeDashboard } from "./components/HomeDashboard";

// Lazy load pages for performance
const VacationCalendar = lazy(() =>
  import("./pages/VacationCalendar").then((module) => ({
    default: module.VacationCalendar,
  })),
);
const VacationDetails = lazy(() =>
  import("./pages/VacationDetails").then((module) => ({
    default: module.VacationDetails,
  })),
);
const AccountPage = lazy(() => import("./pages/AccountPage"));
const MyItinerary = lazy(() => import("./pages/MyItinerary"));
const AuthForm = lazy(() => import("./components/AuthForm"));
const VacationAddModal = lazy(() => import("./VacationAddModal"));
const VacationEditModal = lazy(() => import("./VacationEditModal"));

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
            light: "#42a5f5",
            dark: "#1565c0",
          },
          secondary: {
            main: "#dc004e",
          },
          background: {
            default: themeMode === "dark" ? "#0f1115" : "#f8f9fa",
            paper: themeMode === "dark" ? "#1a1d23" : "#ffffff",
          },
          text: {
            primary: themeMode === "dark" ? "#ffffff" : "#1a1a1a",
            secondary:
              themeMode === "dark"
                ? "rgba(255,255,255,0.7)"
                : "rgba(0,0,0,0.6)",
          },
          divider:
            themeMode === "dark"
              ? "rgba(255,255,255,0.08)"
              : "rgba(0,0,0,0.08)",
        },
        typography: {
          fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
          h1: { fontWeight: 900 },
          h2: { fontWeight: 900 },
          h3: { fontWeight: 900 },
          h4: { fontWeight: 900 },
          h5: { fontWeight: 800 },
          h6: { fontWeight: 800 },
        },
        components: {
          MuiButton: {
            styleOverrides: {
              root: {
                borderRadius: 10,
                textTransform: "none",
                fontWeight: 700,
                boxShadow: "none",
                "&:hover": {
                  boxShadow: "none",
                },
              },
            },
          },
          MuiPaper: {
            styleOverrides: {
              root: {
                backgroundImage: "none",
                borderRadius: 12,
                border:
                  themeMode === "dark"
                    ? "1px solid rgba(255, 255, 255, 0.05)"
                    : "1px solid rgba(0, 0, 0, 0.05)",
                boxShadow:
                  themeMode === "dark" ? "none" : "0 2px 12px rgba(0,0,0,0.03)",
              },
            },
          },
          MuiTab: {
            styleOverrides: {
              root: {
                fontWeight: 700,
              },
            },
          },
        },
      }),
    [themeMode],
  );

  const {
    vacations,
    loading: vacationsLoading,
    fetchVacations,
  } = useVacations(
    () => {},
    () => {},
  );

  const { loading: addVacationLoading } = useAddVacation(
    fetchVacations,
    () => {},
  );

  const loading = vacationsLoading || addVacationLoading;

  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

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
    null,
  );
  const [dbStatus, setDbStatus] = useState("checking");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register" | "reset">(
    "login",
  );
  const [showAddVacationModal, setShowAddVacationModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"info" | "success" | "error">(
    "info",
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
        },
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
        // Simple timeout-protected check
        const fetchPromise = supabase.from("vacations").select("id").limit(1);
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("DB timeout")), 5000),
        );

        const { error } = await (Promise.race([
          fetchPromise,
          timeoutPromise,
        ]) as any);
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
    let mounted = true;

    const checkInitialAuth = async () => {
      try {
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Auth timeout")), 5000),
        );

        const result = await Promise.race([sessionPromise, timeoutPromise]);
        const session = (result as any)?.data?.session;

        if (!mounted) return;

        if (session?.user) {
          setUser(session.user);
          supabase.auth
            .getUser()
            .then(({ data: { user: verifiedUser } }) => {
              if (mounted && verifiedUser) {
                setUser(verifiedUser);
              }
            })
            .catch(console.error);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error("Auth initialization error:", err);
      } finally {
        if (mounted) setLoadingUser(false);
      }
    };

    checkInitialAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
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
            if (mounted && !data) {
              supabase
                .from("profiles")
                .insert([
                  {
                    id: currentUser.id,
                    display_name:
                      currentUser.user_metadata?.display_name ||
                      currentUser.email?.split("@")[0] ||
                      "New Traveler",
                    avatar_url: currentUser.user_metadata?.avatar_url || null,
                  },
                ])
                .then(() => {
                  if (mounted) fetchVacations(showArchived);
                });
            }
          });
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
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

  // Sync selected vacation with localStorage and vacations list
  useEffect(() => {
    if (vacations.length > 0) {
      const savedId = localStorage.getItem("selectedVacationId");
      if (savedId) {
        const found = vacations.find((v) => v.id === parseInt(savedId));
        if (found) {
          setSelectedVacation(found);
        }
      }
    }
  }, [vacations]);

  useEffect(() => {
    if (selectedVacation) {
      localStorage.setItem(
        "selectedVacationId",
        selectedVacation.id.toString(),
      );
    } else {
      localStorage.removeItem("selectedVacationId");
    }
  }, [selectedVacation]);

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
      // In explore tab, show public trips that OR trips I'm invited to but don't own?
      // Actually let's show all public trips that AREN'T mine for "Discovery"
      return matchesSearch && vacation.is_public && !isMine;
    }
  });

  const displayedVacations = filteredVacations.filter(
    (vacation) => showArchived || !vacation.archived,
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
              setSelectedVacation(null);
            }}
            onBackToTrips={
              showItinerary || showAccount || showCalendar
                ? () => {
                    setShowItinerary(false);
                    setShowAccount(false);
                    setShowCalendar(false);
                  }
                : selectedVacation
                  ? () => {
                      setSelectedVacation(null);
                    }
                  : undefined
            }
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
            <Suspense fallback={<CircularProgress />}>
              <VacationEditModal
                open={!!editingVacation}
                vacation={editingVacation}
                onSave={async (updatedVacation) => {
                  // Only update actual database columns
                  const { error } = await supabase
                    .from("vacations")
                    .update({
                      name: updatedVacation.name,
                      destination: updatedVacation.destination,
                      start_date: updatedVacation.start_date,
                      end_date: updatedVacation.end_date,
                      is_public: updatedVacation.is_public,
                      archived: updatedVacation.archived,
                    })
                    .eq("id", updatedVacation.id);
                  if (!error) {
                    fetchVacations(showArchived);
                    setEditingVacation(null);
                  }
                }}
                onClose={() => setEditingVacation(null)}
              />
            </Suspense>
          )}
          {showAddVacationModal && (
            <Suspense fallback={<CircularProgress />}>
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
                      is_public: data.isPublic,
                    },
                  ]);
                  if (!error) {
                    fetchVacations(showArchived);
                    setShowAddVacationModal(false);
                  }
                }}
              />
            </Suspense>
          )}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                md: "320px 1fr",
                lg: "350px 1fr",
                xl: "380px 1fr",
              },
              minHeight: "calc(100vh - 64px)", // Standard navbar height
              bgcolor: (theme) =>
                theme.palette.mode === "dark"
                  ? "rgba(0,0,0,0.1)"
                  : "transparent",
            }}
          >
            <Box
              component="aside"
              sx={{
                bgcolor:
                  themeMode === "dark"
                    ? "rgba(255, 255, 255, 0.01)"
                    : "rgba(0, 0, 0, 0.01)",
                backdropFilter: "blur(20px)",
                p: 3,
                borderRight:
                  themeMode === "dark"
                    ? "1px solid rgba(255, 255, 255, 0.05)"
                    : "1px solid rgba(0, 0, 0, 0.05)",
                display: isMobile ? "none" : "flex", // Sidebar hidden on mobile in favor of Home Dashboard / Bottom Nav
                flexDirection: "column",
                gap: 2,
                position: "sticky",
                top: 0,
                height: isMobile ? "auto" : "calc(100vh - 64px)",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  mb: 1,
                  px: 0.5,
                }}
              >
                <ExploreIcon sx={{ color: "primary.main", fontSize: 28 }} />
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 900,
                    letterSpacing: -0.5,
                    background:
                      "linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  My Expeditions
                </Typography>
              </Box>
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
                      color: "text.secondary",
                    },
                    "& .MuiTab-root.Mui-selected": {
                      color: "primary.main",
                      bgcolor: (theme) =>
                        theme.palette.mode === "dark"
                          ? "rgba(255,255,255,0.05)"
                          : "rgba(0,0,0,0.04)",
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
                      bgcolor: (theme) =>
                        theme.palette.mode === "dark"
                          ? "rgba(255, 255, 255, 0.03)"
                          : "rgba(0, 0, 0, 0.02)",
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
                      onSelect={() => {
                        setSelectedVacation(vacation);
                        setShowAccount(false);
                        setShowItinerary(false);
                      }}
                      onEdit={openEditVacationModal}
                      onDelete={() =>
                        handleArchiveVacation(
                          vacation,
                          () => {},
                          fetchVacations,
                          (toast) => showToast(toast.message, toast.type),
                        )
                      }
                      onRestore={() =>
                        handleArchiveRestore(
                          vacation,
                          fetchVacations,
                          (toast) => showToast(toast.message, toast.type),
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
                minHeight: "calc(100vh - 64px)",
                overflowY: "auto",
                bgcolor: themeMode === "dark" ? "#0f1115" : "#f5f5f7",
                backgroundImage:
                  themeMode === "dark"
                    ? "radial-gradient(circle at 50% 50%, rgba(25, 118, 210, 0.05) 0%, rgba(0,0,0,0) 100%)"
                    : "radial-gradient(circle at 50% 50%, rgba(25, 118, 210, 0.02) 0%, rgba(255,255,255,0) 100%)",
                p: { xs: 2, sm: 3, md: 4, lg: 5, xl: 6 },
              }}
            >
              <Suspense
                fallback={
                  <Box
                    sx={{
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <CircularProgress />
                  </Box>
                }
              >
                {showAccount && user ? (
                  <AccountPage
                    user={user}
                    onLogout={async () => {
                      await supabase.auth.signOut();
                      setUser(null);
                      setShowAccount(false);
                    }}
                    onHome={() => setShowAccount(false)}
                  />
                ) : showItinerary && user ? (
                  <MyItinerary
                    user={user}
                    onHome={() => setShowItinerary(false)}
                  />
                ) : selectedVacation ? (
                  <VacationDetails
                    vacation={selectedVacation}
                    user={user}
                    onRefresh={() => fetchVacations(showArchived)}
                  />
                ) : (
                  <HomeDashboard
                    user={user}
                    vacations={vacations}
                    onSelectVacation={setSelectedVacation}
                    onNewTrip={() => setShowAddVacationModal(true)}
                    isMobile={isMobile}
                    search={search}
                    onSearchChange={setSearch}
                    activeTab={activeTab}
                    onActiveTabChange={setActiveTab}
                    displayedVacations={displayedVacations}
                    showArchived={showArchived}
                    onShowArchivedChange={setShowArchived}
                  />
                )}
              </Suspense>
            </Box>
          </Box>
          <footer className="vp-footer">© 2025 Vacation Planner</footer>

          {showAuthModal && (
            <div className="auth-modal-wrapper">
              <Suspense fallback={<CircularProgress />}>
                <AuthForm
                  mode={authMode}
                  setMode={setAuthMode}
                  errorMsg={null}
                  onAuth={(err) => {
                    if (!err) setShowAuthModal(false);
                  }}
                />
              </Suspense>
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
