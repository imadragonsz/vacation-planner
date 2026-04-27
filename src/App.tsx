import React, { useState, useEffect, lazy, Suspense } from "react";
import { UserContext } from "./context";
import { supabase } from "./supabaseClient";
import "./styles/App.css";
import { useVacations, useAddVacation } from "./hooks/useVacations";
import Toast from "./components/Toast";
import {
  CssBaseline,
  ThemeProvider,
  createTheme,
  Box,
  TextField,
  Stack,
  Button,
  useMediaQuery,
  CircularProgress,
  Tooltip,
  BottomNavigation,
  BottomNavigationAction,
  Paper,
} from "@mui/material";
import MapIcon from "@mui/icons-material/Map";
import ExploreIcon from "@mui/icons-material/Explore";
import HomeIcon from "@mui/icons-material/Home";
import SearchIcon from "@mui/icons-material/Search";
import SettingsIcon from "@mui/icons-material/Settings";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import { Vacation } from "./vacation";
import { HomeDashboard } from "./components/HomeDashboard";
import { NotificationMenu } from "./components/NotificationMenu";
import AdminPanel from "./components/AdminPanel";
import { useLocation, useNavigate } from "react-router-dom";
import { OfflineBanner } from "./components/OfflineBanner";

const VacationDetails = lazy(() =>
  import("./pages/VacationDetails").then((m) => ({
    default: m.VacationDetails,
  })),
);
const AccountPage = lazy(() => import("./pages/AccountPage"));
const MyItinerary = lazy(() => import("./pages/MyItinerary"));
const AuthForm = lazy(() => import("./components/AuthForm"));
// @ts-ignore
const ActivitySuggestions = lazy(() => import("./pages/ActivitySuggestions"));
const VacationAddModal = lazy(() => import("./VacationAddModal"));

interface AppProps {
  user: any;
  setUser: React.Dispatch<React.SetStateAction<any>>;
}

type AuthMode = "login" | "register" | "reset";

function App({ user, setUser }: AppProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [themeMode, setThemeMode] = useState<"dark" | "light">(() => {
    return (localStorage.getItem("theme") as "dark" | "light") || "dark";
  });

  const toggleTheme = () => {
    const newMode = themeMode === "dark" ? "light" : "dark";
    setThemeMode(newMode);
    localStorage.setItem("theme", newMode);
    document.documentElement.setAttribute("data-theme", newMode);
  };

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", themeMode);
  }, [themeMode]);

  const theme = React.useMemo(
    () =>
      createTheme({
        palette: {
          mode: themeMode,
          primary: { main: "#e31b4d" },
          secondary: { main: "#8B5CF6" },
          background: {
            default: themeMode === "dark" ? "#030304" : "#f5f5f7",
            paper: themeMode === "dark" ? "#080809" : "#ffffff",
          },
          text: {
            primary: themeMode === "dark" ? "#ffffff" : "#1a1a1a",
            secondary:
              themeMode === "dark"
                ? "rgba(255, 255, 255, 0.85)"
                : "rgba(0, 0, 0, 0.75)",
          },
        },
        shape: { borderRadius: 12 },
        typography: {
          fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
          h1: { fontWeight: 950 },
          h2: { fontWeight: 950 },
          h3: { fontWeight: 950 },
        },
        components: {
          MuiCssBaseline: {
            styleOverrides: {
              body: {
                backgroundColor: themeMode === "dark" ? "#030304" : "#f5f5f7",
                color: themeMode === "dark" ? "#ffffff" : "#1a1a1a",
                transition: "background-color 0.3s ease, color 0.3s ease",
              },
            },
          },
          MuiButton: {
            styleOverrides: {
              root: {
                borderRadius: 6,
                textTransform: "none",
                fontWeight: 700,
              },
            },
          },
          MuiPaper: {
            styleOverrides: {
              root: {
                borderRadius: 12,
                backgroundImage: "none",
                transition:
                  "background-color 0.3s ease, border-color 0.3s ease",
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
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [loadingUser, setLoadingUser] = useState(true);
  const [authBootstrapMessage, setAuthBootstrapMessage] = useState<
    string | null
  >(null);
  const [authBootstrapTimedOut, setAuthBootstrapTimedOut] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [showArchived] = useState(
    () => localStorage.getItem("showArchived") === "true",
  );
  const [showAccount, setShowAccount] = useState(false);
  const [showItinerary, setShowItinerary] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [selectedVacation, setSelectedVacation] = useState<Vacation | null>(
    null,
  );
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAddVacationModal, setShowAddVacationModal] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "info" | "success" | "error";
  } | null>(null);

  useEffect(() => {
    const handleNavItinerary = () => {
      setShowItinerary(true);
      setSelectedVacation(null);
      setShowAccount(false);
      setShowAdmin(false);
      setShowSuggestions(false);
    };

    const handleNavSuggestions = () => {
      setShowSuggestions(true);
      setSelectedVacation(null);
      setShowAccount(false);
      setShowItinerary(false);
      setShowAdmin(false);
    };

    window.addEventListener("nav-itinerary", handleNavItinerary);
    window.addEventListener("nav-suggestions", handleNavSuggestions);

    const handleShowToast = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setToast({ message: detail.message, type: detail.type });
    };

    window.addEventListener("show-toast", handleShowToast);

    return () => {
      window.removeEventListener("nav-itinerary", handleNavItinerary);
      window.removeEventListener("nav-suggestions", handleNavSuggestions);
      window.removeEventListener("show-toast", handleShowToast);
    };
  }, []);

  useEffect(() => {
    if (location.pathname !== "/auth") {
      return;
    }

    const modeParam = new URLSearchParams(location.search).get("mode");
    const resolvedMode: AuthMode =
      modeParam === "register" || modeParam === "reset" ? modeParam : "login";

    setAuthMode(resolvedMode);
    setShowAuthModal(true);
  }, [location.pathname, location.search]);

  const closeAuthModal = () => {
    setShowAuthModal(false);
    if (location.pathname === "/auth") {
      navigate("/", { replace: true });
    }
  };

  useEffect(() => {
    if (loadingUser) {
      return;
    }

    fetchVacations(showArchived);
    const channel = supabase
      .channel("app")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "vacations" },
        () => fetchVacations(showArchived),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadingUser, showArchived, fetchVacations]);

  useEffect(() => {
    let mounted = true;
    let bootstrapComplete = false;

    const withTimeout = async <T,>(
      promise: PromiseLike<T>,
      label: string,
      timeoutMs = 4000,
    ): Promise<T> => {
      let timeoutId: number | undefined;

      try {
        return await Promise.race([
          Promise.resolve(promise),
          new Promise<T>((_, reject) => {
            timeoutId = window.setTimeout(() => {
              reject(new Error(`${label} timed out`));
            }, timeoutMs);
          }),
        ]);
      } finally {
        if (timeoutId) {
          window.clearTimeout(timeoutId);
        }
      }
    };

    const finishAuthBootstrap = () => {
      bootstrapComplete = true;
      if (mounted) {
        setAuthBootstrapTimedOut(false);
        setLoadingUser(false);
      }
    };

    const authBootstrapTimeout = window.setTimeout(() => {
      if (!mounted || bootstrapComplete) {
        return;
      }

      console.error(
        "Auth bootstrap timed out. Falling back to signed-out state.",
      );
      setUser(null);
      setUserProfile(null);
      setAuthBootstrapTimedOut(true);
      setAuthBootstrapMessage(
        "Session restore timed out. You can still use the app and sign in again.",
      );
      setLoadingUser(false);
    }, 8000);

    const syncUserState = async (sessionUser: any) => {
      if (!mounted) {
        return;
      }

      setUser(sessionUser ?? null);
      setAuthBootstrapMessage(null);
      setAuthBootstrapTimedOut(false);

      if (!sessionUser) {
        setUserProfile(null);
        finishAuthBootstrap();
        return;
      }
      finishAuthBootstrap();
    };

    const checkAuth = async () => {
      try {
        const {
          data: { session },
        } = await withTimeout(supabase.auth.getSession(), "Session restore");

        await syncUserState(session?.user ?? null);
      } catch (authError) {
        console.error("Auth bootstrap failed:", authError);
        if (mounted) {
          setUser(null);
          setUserProfile(null);
          setAuthBootstrapTimedOut(true);
          setAuthBootstrapMessage(
            "Could not restore your session. Please sign in again.",
          );
          finishAuthBootstrap();
        }
      }
    };
    checkAuth();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      await syncUserState(session?.user ?? null);
    });
    return () => {
      mounted = false;
      window.clearTimeout(authBootstrapTimeout);
      subscription.unsubscribe();
    };
  }, [setUser]);

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      if (!user?.id) {
        setUserProfile(null);
        return;
      }

      try {
        const { data: profile, error: profileError } = await Promise.race([
          supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .maybeSingle(),
          new Promise<never>((_, reject) => {
            window.setTimeout(
              () => reject(new Error("Profile bootstrap timed out")),
              4000,
            );
          }),
        ]);

        if (!mounted) {
          return;
        }

        if (profileError) {
          console.error("Failed to fetch profile:", profileError);
        }

        setUserProfile(profile ?? null);
      } catch (profileError) {
        console.error("Profile bootstrap failed:", profileError);
        if (mounted) {
          setUserProfile(null);
        }
      }
    };

    loadProfile();

    return () => {
      mounted = false;
    };
  }, [user?.id]);

  const displayedVacations = vacations.filter(
    (v) =>
      (showArchived || !v.archived) &&
      (v.name.toLowerCase().includes(search.toLowerCase()) ||
        v.destination.toLowerCase().includes(search.toLowerCase())),
  );

  if (loadingUser) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box
          sx={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 2,
            bgcolor: "background.default",
            color: "text.primary",
            px: 3,
            textAlign: "center",
          }}
        >
          <CircularProgress color="primary" />
          <Box sx={{ fontWeight: 700, letterSpacing: "0.02em" }}>
            Restoring your session...
          </Box>
          {authBootstrapMessage && (
            <Box sx={{ maxWidth: 420, opacity: 0.8 }}>
              {authBootstrapMessage}
            </Box>
          )}
          {authBootstrapTimedOut && (
            <Button
              variant="contained"
              onClick={() => {
                setUser(null);
                setUserProfile(null);
                setLoadingUser(false);
              }}
            >
              Continue Signed Out
            </Button>
          )}
        </Box>
      </ThemeProvider>
    );
  }

  const isAdmin = userProfile?.role === "admin";

  const handleHome = () => {
    setSelectedVacation(null);
    setShowAccount(false);
    setShowItinerary(false);
    setShowSuggestions(false);
    setShowAdmin(false);
  };

  const getNavValue = () => {
    if (showAccount) return "account";
    if (showItinerary) return "itinerary";
    if (showSuggestions) return "suggestions";
    if (showAdmin) return "admin";
    return "home";
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <OfflineBanner />
      <UserContext.Provider value={{ user }}>
        <Box
          sx={{
            display: "flex",
            height: "100vh",
            width: "100vw",
            bgcolor: "background.default",
            color: "text.primary",
          }}
        >
          {authBootstrapMessage && !user && (
            <Box
              sx={{
                position: "fixed",
                top: 16,
                left: "50%",
                transform: "translateX(-50%)",
                zIndex: 2000,
                px: 2,
                py: 1.5,
                borderRadius: 2,
                bgcolor: "rgba(202,29,73,0.12)",
                border: "1px solid rgba(202,29,73,0.35)",
                color: "white",
                backdropFilter: "blur(14px)",
              }}
            >
              {authBootstrapMessage}
            </Box>
          )}
          {!isMobile && (
            <Box
              sx={{
                width: 80,
                bgcolor: themeMode === "dark" ? "#000" : "#fff",
                borderRight: "1px solid",
                borderColor:
                  themeMode === "dark"
                    ? "rgba(255,255,255,0.05)"
                    : "rgba(0,0,0,0.05)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                py: 4,
                gap: 4,
                transition: "background-color 0.3s ease",
              }}
            >
              <Box
                sx={{
                  bgcolor: "#ca1d49",
                  width: 48,
                  height: 48,
                  borderRadius: 3,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  cursor: "pointer",
                  mb: 2,
                }}
                onClick={handleHome}
              >
                <ExploreIcon sx={{ fontSize: 28 }} />
              </Box>
              <Tooltip title="Home" placement="right">
                <Box
                  sx={{
                    color:
                      !selectedVacation &&
                      !showAccount &&
                      !showItinerary &&
                      !showSuggestions &&
                      !showAdmin
                        ? "#ca1d49"
                        : themeMode === "dark"
                          ? "rgba(255,255,255,0.4)"
                          : "rgba(0,0,0,0.4)",
                    cursor: "pointer",
                  }}
                  onClick={handleHome}
                >
                  <HomeIcon sx={{ fontSize: 24 }} />
                </Box>
              </Tooltip>
              <Tooltip title="Global Itinerary" placement="right">
                <Box
                  sx={{
                    color: showItinerary
                      ? "#ca1d49"
                      : themeMode === "dark"
                        ? "rgba(255,255,255,0.4)"
                        : "rgba(0,0,0,0.4)",
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    if (user) {
                      setShowItinerary(true);
                      setSelectedVacation(null);
                      setShowAccount(false);
                      setShowAdmin(false);
                      setShowSuggestions(false);
                    } else setShowAuthModal(true);
                  }}
                >
                  <MapIcon sx={{ fontSize: 24 }} />
                </Box>
              </Tooltip>
              <Tooltip title="Activity Suggestions" placement="right">
                <Box
                  sx={{
                    color: showSuggestions
                      ? "#ca1d49"
                      : themeMode === "dark"
                        ? "rgba(255,255,255,0.4)"
                        : "rgba(0,0,0,0.4)",
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    if (user) {
                      setShowSuggestions(true);
                      setSelectedVacation(null);
                      setShowAccount(false);
                      setShowItinerary(false);
                      setShowAdmin(false);
                    } else setShowAuthModal(true);
                  }}
                >
                  <ExploreIcon sx={{ fontSize: 24 }} />
                </Box>
              </Tooltip>
              {isAdmin && (
                <Tooltip title="Admin Panel" placement="right">
                  <Box
                    sx={{
                      color: showAdmin
                        ? "#ca1d49"
                        : themeMode === "dark"
                          ? "rgba(255,255,255,0.4)"
                          : "rgba(0,0,0,0.4)",
                      cursor: "pointer",
                    }}
                    onClick={() => {
                      setShowAdmin(true);
                      setSelectedVacation(null);
                      setShowAccount(false);
                      setShowItinerary(false);
                      setShowSuggestions(false);
                    }}
                  >
                    <AdminPanelSettingsIcon sx={{ fontSize: 24 }} />
                  </Box>
                </Tooltip>
              )}
              <Tooltip title="Toggle Theme" placement="right">
                <Box
                  sx={{
                    mt: "auto",
                    color:
                      themeMode === "dark"
                        ? "rgba(255,255,255,0.4)"
                        : "rgba(0,0,0,0.4)",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    "&:hover": { color: "#ca1d49", transform: "scale(1.1)" },
                  }}
                  onClick={toggleTheme}
                >
                  {themeMode === "dark" ? (
                    <LightModeIcon sx={{ fontSize: 24 }} />
                  ) : (
                    <DarkModeIcon sx={{ fontSize: 24 }} />
                  )}
                </Box>
              </Tooltip>
              <Tooltip title="Account Settings" placement="right">
                <Box
                  sx={{
                    color: showAccount
                      ? "#ca1d49"
                      : themeMode === "dark"
                        ? "rgba(255,255,255,0.4)"
                        : "rgba(0,0,0,0.4)",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    "&:hover": { color: "#ca1d49", transform: "scale(1.1)" },
                  }}
                  onClick={() => {
                    if (user) {
                      setShowAccount(true);
                      setSelectedVacation(null);
                      setShowItinerary(false);
                      setShowAdmin(false);
                      setShowSuggestions(false);
                    } else setShowAuthModal(true);
                  }}
                >
                  <SettingsIcon sx={{ fontSize: 24 }} />
                </Box>
              </Tooltip>
            </Box>
          )}
          <Box
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                height: 70,
                px: { xs: 2, md: 4 },
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                bgcolor:
                  themeMode === "dark"
                    ? "rgba(0,0,0,0.2)"
                    : "rgba(255,255,255,0.7)",
                backdropFilter: "blur(20px)",
                borderBottom: "1px solid",
                borderColor:
                  themeMode === "dark"
                    ? "rgba(255,255,255,0.05)"
                    : "rgba(0,0,0,0.05)",
                zIndex: 1100,
              }}
            >
              <TextField
                placeholder="Search missions..."
                variant="standard"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  disableUnderline: true,
                  startAdornment: (
                    <SearchIcon
                      sx={{ color: "text.secondary", mr: 1, fontSize: 20 }}
                    />
                  ),
                }}
                sx={{
                  bgcolor:
                    themeMode === "dark"
                      ? "rgba(255,255,255,0.03)"
                      : "rgba(0,0,0,0.03)",
                  px: 2,
                  py: 0.8,
                  borderRadius: 2,
                  width: { xs: "100%", sm: 300 },
                }}
              />
              <Stack direction="row" spacing={2} alignItems="center">
                <NotificationMenu userId={user?.id} />
                {!user && (
                  <Button
                    variant="contained"
                    onClick={() => setShowAuthModal(true)}
                    sx={{
                      px: 3,
                      height: 40,
                      fontWeight: 700,
                      boxShadow: "0 4px 14px 0 rgba(139, 92, 246, 0.39)",
                    }}
                  >
                    Log In
                  </Button>
                )}
                {user && (
                  <Button
                    variant="outlined"
                    onClick={() => supabase.auth.signOut()}
                    sx={{
                      height: 40,
                      borderColor:
                        themeMode === "dark"
                          ? "rgba(255,255,255,0.1)"
                          : "rgba(0,0,0,0.1)",
                      color:
                        themeMode === "dark"
                          ? "rgba(255,255,255,0.7)"
                          : "rgba(0,0,0,0.7)",
                      "&:hover": {
                        borderColor: "primary.main",
                        bgcolor: "rgba(139, 92, 246, 0.1)",
                      },
                    }}
                  >
                    Log Out
                  </Button>
                )}
              </Stack>
            </Box>
            <Box
              sx={{
                flex: 1,
                overflow: "auto",
                position: "relative",
                pb: isMobile ? 8 : 0,
              }}
            >
              <Suspense
                fallback={
                  <Box
                    sx={{ display: "flex", justifyContent: "center", mt: 10 }}
                  >
                    <CircularProgress color="primary" />
                  </Box>
                }
              >
                {showAccount ? (
                  <AccountPage
                    user={user}
                    onLogout={() => supabase.auth.signOut()}
                    onHome={handleHome}
                  />
                ) : showItinerary ? (
                  <MyItinerary user={user} onHome={handleHome} />
                ) : showSuggestions ? (
                  <ActivitySuggestions
                    user={user}
                    onHome={handleHome}
                    onAdmin={() => {
                      setShowSuggestions(false);
                      setShowAdmin(true);
                    }}
                    vacations={vacations}
                  />
                ) : showAdmin && isAdmin ? (
                  <AdminPanel
                    onViewTrip={(trip) => {
                      setSelectedVacation(trip);
                      setShowAdmin(false);
                    }}
                  />
                ) : selectedVacation ? (
                  <VacationDetails
                    vacation={selectedVacation}
                    user={user}
                    onRefresh={() => fetchVacations(showArchived)}
                    onBack={handleHome}
                  />
                ) : (
                  <HomeDashboard
                    user={user}
                    vacations={vacations}
                    onSelectVacation={setSelectedVacation}
                    onNewTrip={() => setShowAddVacationModal(true)}
                    displayedVacations={displayedVacations}
                    search={search}
                    onSearchChange={setSearch}
                    loading={loading}
                  />
                )}
              </Suspense>
            </Box>
          </Box>
        </Box>

        {isMobile && (
          <Paper
            sx={{
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 1200,
              bgcolor: "#000",
              borderTop: "1px solid rgba(255,255,255,0.05)",
            }}
            elevation={3}
          >
            <BottomNavigation
              value={getNavValue()}
              onChange={(_event, newValue) => {
                if (newValue === "home") handleHome();
                else if (newValue === "itinerary") {
                  if (user) {
                    setShowItinerary(true);
                    setSelectedVacation(null);
                    setShowAccount(false);
                    setShowAdmin(false);
                    setShowSuggestions(false);
                  } else setShowAuthModal(true);
                } else if (newValue === "suggestions") {
                  if (user) {
                    setShowSuggestions(true);
                    setSelectedVacation(null);
                    setShowAccount(false);
                    setShowItinerary(false);
                    setShowAdmin(false);
                  } else setShowAuthModal(true);
                } else if (newValue === "admin") {
                  if (isAdmin) {
                    setShowAdmin(true);
                    setSelectedVacation(null);
                    setShowAccount(false);
                    setShowItinerary(false);
                    setShowSuggestions(false);
                  }
                } else if (newValue === "account") {
                  if (user) {
                    setShowAccount(true);
                    setSelectedVacation(null);
                    setShowItinerary(false);
                    setShowAdmin(false);
                    setShowSuggestions(false);
                  } else setShowAuthModal(true);
                }
              }}
              sx={{
                bgcolor: "transparent",
                height: 65,
                "& .MuiBottomNavigationAction-root": {
                  color: "rgba(255,255,255,0.4)",
                  "&.Mui-selected": { color: "#ca1d49" },
                },
              }}
            >
              <BottomNavigationAction
                label="Home"
                value="home"
                icon={<HomeIcon />}
              />
              <BottomNavigationAction
                label="Itinerary"
                value="itinerary"
                icon={<MapIcon />}
              />
              <BottomNavigationAction
                label="Ideas"
                value="suggestions"
                icon={<ExploreIcon />}
              />
              {isAdmin && (
                <BottomNavigationAction
                  label="Admin"
                  value="admin"
                  icon={<AdminPanelSettingsIcon />}
                />
              )}
              <BottomNavigationAction
                label="Profile"
                value="account"
                icon={<SettingsIcon />}
              />
            </BottomNavigation>
          </Paper>
        )}

        {showAddVacationModal && (
          <Suspense fallback={null}>
            <VacationAddModal
              open={showAddVacationModal}
              onClose={() => setShowAddVacationModal(false)}
              onSubmit={() => {
                fetchVacations(showArchived);
                setShowAddVacationModal(false);
              }}
            />
          </Suspense>
        )}
        {showAuthModal && (
          <Suspense fallback={null}>
            <AuthForm
              open={showAuthModal}
              onClose={closeAuthModal}
              onAuth={(err) => {
                if (err) {
                  return;
                }

                closeAuthModal();
                fetchVacations(showArchived);
              }}
              mode={authMode}
              setMode={setAuthMode}
              errorMsg={null}
            />
          </Suspense>
        )}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </UserContext.Provider>
    </ThemeProvider>
  );
}

export default App;
