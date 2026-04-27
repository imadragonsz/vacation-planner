import React, { useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Stack,
  Chip,
  Checkbox,
  FormControlLabel,
  Skeleton,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import FlightIcon from "@mui/icons-material/Flight";
import ExploreIcon from "@mui/icons-material/Explore";
import EventIcon from "@mui/icons-material/Event";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import PublicIcon from "@mui/icons-material/Public";
import { DashboardWidgets } from "./Widgets/DashboardWidgets";
import dayjs from "dayjs";
import { Vacation } from "../vacation";

interface HomeDashboardProps {
  user: any;
  vacations: Vacation[];
  onSelectVacation: (vacation: Vacation) => void;
  onNewTrip: () => void;
  // Search/Explore props for mobile
  isMobile?: boolean;
  search?: string;
  onSearchChange?: (val: string) => void;
  activeTab?: number;
  onActiveTabChange?: (val: number) => void;
  displayedVacations?: Vacation[];
  showArchived?: boolean;
  onShowArchivedChange?: (val: boolean) => void;
  loading?: boolean;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  user,
  vacations,
  onSelectVacation,
  onNewTrip,
  isMobile: isMobileProp,
  search = "",
  onSearchChange,
  activeTab = 0,
  onActiveTabChange,
  displayedVacations = [],
  showArchived = false,
  onShowArchivedChange,
  loading = false,
}) => {
  const theme = useTheme();
  const isMobileMediaQuery = useMediaQuery(theme.breakpoints.down("sm"));
  const isMobile = isMobileProp ?? isMobileMediaQuery;

  // Filter for only trips where the user is an owner or participant
  const myVacations = useMemo(() => {
    if (!user) return [];
    return vacations.filter(
      (v) =>
        v.user_id === user.id ||
        v.vacation_participants?.some((p) => p.user_id === user.id),
    );
  }, [vacations, user]);

  // Find the next upcoming trip
  const nextTrip = useMemo(() => {
    const today = dayjs();
    const futureTrips = myVacations
      .filter((v) => v.start_date && dayjs(v.start_date).isAfter(today))
      .sort((a, b) => dayjs(a.start_date!).diff(dayjs(b.start_date!)));
    return futureTrips[0] || null;
  }, [myVacations]);

  const activeTripsCount = myVacations.filter((v) => !v.archived).length;
  const daysUntilNext = nextTrip
    ? dayjs(nextTrip.start_date).diff(dayjs().startOf("day"), "day")
    : null;

  const showSearchResults =
    (isMobile && (search.length > 0 || activeTab === 1)) ||
    (!isMobile && search.length > 0);

  if (loading) {
    return (
      <Box
        sx={{
          maxWidth: 1400,
          mx: "auto",
          py: { xs: 1, md: 4 },
          px: { xs: 1, md: 4 },
        }}
      >
        <Box sx={{ mb: { xs: 4, md: 6 } }}>
          <Skeleton
            variant="text"
            width="300px"
            height={60}
            sx={{ mb: 1, maxWidth: "100%" }}
          />
          <Skeleton variant="text" width="200px" height={30} />
        </Box>

        <Skeleton
          variant="rectangular"
          height={300}
          sx={{ borderRadius: 6, mb: 6 }}
        />

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Skeleton
              variant="rectangular"
              height={200}
              sx={{ borderRadius: 4 }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 8 }}>
            <Skeleton
              variant="rectangular"
              height={200}
              sx={{ borderRadius: 4 }}
            />
          </Grid>
        </Grid>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        maxWidth: 1400,
        mx: "auto",
        py: { xs: 1, md: 4 },
        px: { xs: 1, md: 4 },
      }}
    >
      {/* Mobile Search/Explore Header */}
      {isMobile && (
        <Box sx={{ mb: 2 }}>
          <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
            <Button
              variant={activeTab === 0 ? "contained" : "outlined"}
              size="large"
              onClick={() => onActiveTabChange?.(0)}
              sx={{
                borderRadius: "12px",
                fontWeight: 700,
                flex: 1,
                py: 1,
                height: 48,
              }}
            >
              My Trips
            </Button>
            <Button
              variant={activeTab === 1 ? "contained" : "outlined"}
              size="large"
              onClick={() => onActiveTabChange?.(1)}
              sx={{
                borderRadius: "12px",
                fontWeight: 700,
                flex: 1,
                py: 1,
                height: 48,
              }}
            >
              Explore
            </Button>
          </Stack>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              bgcolor: (theme) =>
                theme.palette.mode === "dark"
                  ? "rgba(255,255,255,0.03)"
                  : "rgba(0,0,0,0.03)",
              borderRadius: 3,
              p: 0.5,
              border: (theme) =>
                theme.palette.mode === "dark"
                  ? "1px solid rgba(255,255,255,0.05)"
                  : "1px solid rgba(0,0,0,0.05)",
            }}
          >
            <SearchIcon sx={{ ml: 1.5, opacity: 0.3 }} />
            <Box
              component="input"
              value={search}
              onChange={(e: any) => onSearchChange?.(e.target.value)}
              placeholder={
                activeTab === 0
                  ? "Search my trips..."
                  : "Explore other trips..."
              }
              sx={{
                flex: 1,
                bgcolor: "transparent",
                border: "none",
                outline: "none",
                color: "inherit",
                p: 1.5,
                fontSize: "1rem",
                "&::placeholder": {
                  color: (theme) =>
                    theme.palette.mode === "dark"
                      ? "rgba(255,255,255,0.3)"
                      : "rgba(0,0,0,0.4)",
                },
              }}
            />
          </Box>
          <Box sx={{ mt: 1, display: "flex", justifyContent: "flex-end" }}>
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={showArchived}
                  onChange={(e) => onShowArchivedChange?.(e.target.checked)}
                  sx={{
                    p: 0.5,
                    color: (theme) =>
                      theme.palette.mode === "dark"
                        ? "rgba(255,255,255,0.2)"
                        : "rgba(0,0,0,0.2)",
                  }}
                />
              }
              label={
                <Typography
                  variant="caption"
                  sx={{ color: "text.secondary", fontWeight: 700 }}
                >
                  Include Archived
                </Typography>
              }
            />
          </Box>
        </Box>
      )}

      {showSearchResults ? (
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 3 }}>
            {activeTab === 0 ? "Search Results" : "Discovery"}
          </Typography>
          <Grid container spacing={2}>
            {displayedVacations.map((vac) => (
              <Grid size={{ xs: 12, sm: 6 }} key={vac.id}>
                <Paper
                  onClick={() => onSelectVacation(vac)}
                  sx={{
                    p: 2.5,
                    borderRadius: 4,
                    bgcolor: (theme) =>
                      theme.palette.mode === "dark"
                        ? "rgba(255,255,255,0.02)"
                        : "rgba(0,0,0,0.01)",
                    border: (theme) =>
                      theme.palette.mode === "dark"
                        ? "1px solid rgba(255,255,255,0.05)"
                        : "1px solid rgba(0,0,0,0.05)",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    "&:hover": {
                      bgcolor: "rgba(255,255,255,0.05)",
                      borderColor: "primary.main",
                    },
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5 }}>
                    {vac.name}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ opacity: 0.5, display: "flex", alignItems: "center" }}
                  >
                    <LocationOnIcon
                      fontSize="inherit"
                      sx={{ mr: 0.5, color: "primary.main" }}
                    />
                    {vac.destination}
                  </Typography>
                  <Box
                    sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}
                  >
                    <Chip
                      size="small"
                      label={
                        vac.start_date
                          ? dayjs(vac.start_date).format("MMM YYYY")
                          : "No date"
                      }
                      sx={{ borderRadius: 1.5, fontWeight: 700 }}
                    />
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
          {displayedVacations.length === 0 && (
            <Box sx={{ textAlign: "center", py: 8, opacity: 0.5 }}>
              {activeTab === 0 ? (
                <>
                  <SearchIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                  <Typography>No trips matched your search.</Typography>
                </>
              ) : (
                <>
                  <PublicIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>
                    Nothing to Explore Yet
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ maxWidth: 300, mx: "auto" }}
                  >
                    Public trips from other travelers will appear here. Try
                    making one of your own trips public!
                  </Typography>
                </>
              )}
            </Box>
          )}
        </Box>
      ) : (
        <>
          {/* Header Section */}
          <Box
            sx={{
              mb: { xs: 3, md: 6 },
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <Box>
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 950,
                  mb: 1,
                  fontSize: { xs: "1.75rem", sm: "2.5rem", md: "3rem" },
                  letterSpacing: "-0.04em",
                }}
              >
                Adventure Awaits,{" "}
                {user?.user_metadata?.display_name?.split(" ")[0] ||
                  user?.email?.split("@")[0] ||
                  "Traveler"}
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  color: "text.secondary",
                  fontWeight: 500,
                  fontSize: { xs: "0.95rem", md: "1.25rem" },
                  opacity: 0.7,
                }}
              >
                {activeTripsCount > 0
                  ? `You have ${activeTripsCount} trips planned. Ready for the next one?`
                  : "No trips planned yet. Where would you like to go next?"}
              </Typography>
            </Box>
            {activeTripsCount > 0 && (
              <Button
                variant="contained"
                size="medium"
                onClick={onNewTrip}
                startIcon={<AddIcon />}
                sx={{
                  mt: 1,
                  fontWeight: 900,
                  borderRadius: 2,
                  bgcolor: "#ca1d49",
                  display: { xs: "none", md: "flex" },
                }}
              >
                New Trip
              </Button>
            )}
          </Box>

          {/* Hero Section: Next Trip or Create Trip */}
          {nextTrip ? (
            <Paper
              elevation={0}
              onClick={() => onSelectVacation(nextTrip)}
              className="glass-card"
              sx={{
                p: { xs: 3, md: 5 },
                mb: { xs: 4, md: 6 },
                borderRadius: { xs: 2, md: 3 },
                background: (theme) =>
                  theme.palette.mode === "dark"
                    ? "linear-gradient(135deg, rgba(202, 29, 73, 0.45) 0%, rgba(0, 0, 0, 0.8) 100%)"
                    : "linear-gradient(135deg, #ca1d49 0%, #a0173a 100%)",
                color: "white",
                border: "1px solid",
                borderColor: "rgba(202, 29, 73, 0.5)",
                position: "relative",
                overflow: "hidden",
                cursor: "pointer",
                transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
                  borderColor: "primary.main",
                },
              }}
            >
              <Box sx={{ position: "relative", zIndex: 1 }}>
                <Chip
                  label="Next Adventure"
                  size="small"
                  sx={{
                    mb: 3,
                    fontWeight: 900,
                    bgcolor: "rgba(255,255,255,0.2)",
                    color: "white",
                    borderRadius: 1.5,
                    textTransform: "uppercase",
                    letterSpacing: 1.2,
                    fontSize: "0.65rem",
                  }}
                />
                <Grid container spacing={{ xs: 2, md: 4 }} alignItems="center">
                  <Grid size={{ xs: 12, md: 8 }}>
                    <Typography
                      variant="h2"
                      sx={{
                        fontWeight: 950,
                        mb: 1,
                        fontSize: { xs: "2.25rem", md: "3.75rem" },
                        letterSpacing: "-0.03em",
                        lineHeight: 1.1,
                      }}
                    >
                      {nextTrip.name}
                    </Typography>
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      spacing={{ xs: 1, sm: 3 }}
                      alignItems={{ xs: "flex-start", sm: "center" }}
                      sx={{ mb: 3, mt: 1 }}
                    >
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <LocationOnIcon
                          sx={{
                            fontSize: 20,
                            color: "white",
                          }}
                        />
                        <Typography
                          variant="h6"
                          sx={{ fontWeight: 700, opacity: 0.9 }}
                        >
                          {nextTrip.destination}
                        </Typography>
                      </Box>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <EventIcon
                          sx={{
                            fontSize: 20,
                            color: "white",
                          }}
                        />
                        <Typography
                          variant="subtitle1"
                          sx={{ fontWeight: 600, opacity: 0.8 }}
                        >
                          {dayjs(nextTrip.start_date).format("MMM D")} -{" "}
                          {dayjs(nextTrip.end_date).format("MMM D, YYYY")}
                        </Typography>
                      </Box>
                    </Stack>
                    <Stack direction="row" spacing={1}>
                      <Button
                        variant="contained"
                        endIcon={<ArrowForwardIcon />}
                        sx={{
                          bgcolor: "white",
                          color: "black",
                          fontWeight: 900,
                          px: 3,
                          py: 1.5,
                          borderRadius: 3,
                          "&:hover": { bgcolor: "rgba(255,255,255,0.9)" },
                          display: { xs: "none", sm: "flex" },
                        }}
                      >
                        View Details
                      </Button>
                      {daysUntilNext !== null && (
                        <Box
                          sx={{
                            bgcolor: "rgba(255,255,255,0.15)",
                            backdropFilter: "blur(10px)",
                            px: 2,
                            py: 1.5,
                            borderRadius: 3,
                            border: "1px solid rgba(255,255,255,0.1)",
                            display: "flex",
                            alignItems: "center",
                          }}
                        >
                          <Typography
                            variant="subtitle2"
                            sx={{ fontWeight: 800, letterSpacing: 0.5 }}
                          >
                            🚀 {daysUntilNext} DAYS TO GO
                          </Typography>
                        </Box>
                      )}
                    </Stack>
                  </Grid>
                </Grid>
              </Box>

              {/* Background Art */}
              <FlightIcon
                sx={{
                  position: "absolute",
                  right: -40,
                  bottom: -40,
                  fontSize: { xs: 180, md: 280 },
                  opacity: 0.1,
                  transform: "rotate(-15deg)",
                  pointerEvents: "none",
                }}
              />
            </Paper>
          ) : user ? (
            <Paper
              elevation={0}
              className="glass-panel onboarding-gradient"
              sx={{
                p: { xs: 5, md: 8 },
                mb: 6,
                borderRadius: 8,
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 3,
                border: "1px solid rgba(255, 255, 255, 0.08)",
                boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
              }}
            >
              <Box
                sx={{
                  bgcolor: "rgba(202, 29, 73, 0.1)",
                  p: 3,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mb: 1,
                }}
              >
                <ExploreIcon sx={{ fontSize: 60, color: "#ca1d49" }} />
              </Box>
              <Box sx={{ maxWidth: 600 }}>
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 950,
                    mb: 2,
                    letterSpacing: "-0.02em",
                  }}
                >
                  Your Adventure Starts Here
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    mb: 4,
                    opacity: 0.7,
                    fontWeight: 400,
                    lineHeight: 1.6,
                    color: "text.secondary",
                  }}
                >
                  Travel planning made seamless. Map out your next destination,
                  organize your activities, and share the journey with friends.
                </Typography>
              </Box>
              <Button
                variant="contained"
                size="large"
                onClick={onNewTrip}
                className="interactive-element"
                sx={{
                  py: 2,
                  px: 8,
                  borderRadius: 4,
                  fontWeight: 950,
                  bgcolor: "#ca1d49",
                  fontSize: "1.1rem",
                  boxShadow: "0 10px 30px rgba(202, 29, 73, 0.3)",
                  "&:hover": {
                    bgcolor: "#e02154",
                    transform: "translateY(-2px)",
                  },
                }}
              >
                Create Your First Trip
              </Button>
            </Paper>
          ) : null}

          {/* Dynamic Widget System */}
          <Box sx={{ mt: 3, mb: 10 }}>
            <DashboardWidgets
              user={user}
              vacations={vacations}
              onSelectVacation={onSelectVacation}
              onNavigate={(path) => {
                if (path === "/explore") onActiveTabChange?.(1);
                else if (path === "/my-itinerary") {
                  // Direct navigation via window event if handle is in App.tsx
                  window.dispatchEvent(
                    new CustomEvent("nav-itinerary", { detail: true }),
                  );
                } else if (path === "/activity-suggestions") {
                  window.dispatchEvent(
                    new CustomEvent("nav-suggestions", { detail: true }),
                  );
                }
              }}
            />
          </Box>
        </>
      )}
    </Box>
  );
};
