import React, { useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Avatar,
  Stack,
  Chip,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import MapIcon from "@mui/icons-material/Map";
import FlightIcon from "@mui/icons-material/Flight";
import EventIcon from "@mui/icons-material/Event";
import BeachAccessIcon from "@mui/icons-material/BeachAccess";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import PublicIcon from "@mui/icons-material/Public";
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
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  user,
  vacations,
  onSelectVacation,
  onNewTrip,
  isMobile,
  search = "",
  onSearchChange,
  activeTab = 0,
  onActiveTabChange,
  displayedVacations = [],
  showArchived = false,
  onShowArchivedChange,
}) => {
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
    ? dayjs(nextTrip.start_date).diff(dayjs(), "day")
    : null;

  const showSearchResults = isMobile && (search.length > 0 || activeTab === 1);

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", py: { xs: 2, md: 4 }, px: 2 }}>
      {/* Mobile Search/Explore Header */}
      {isMobile && (
        <Box sx={{ mb: 4 }}>
          <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
            <Button
              variant={activeTab === 0 ? "contained" : "outlined"}
              size="small"
              onClick={() => onActiveTabChange?.(0)}
              sx={{ borderRadius: 2, fontWeight: 700, flex: 1 }}
            >
              My Trips
            </Button>
            <Button
              variant={activeTab === 1 ? "contained" : "outlined"}
              size="small"
              onClick={() => onActiveTabChange?.(1)}
              sx={{ borderRadius: 2, fontWeight: 700, flex: 1 }}
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
              mb: { xs: 4, md: 6 },
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <Box>
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 900,
                  mb: 1,
                  fontSize: { xs: "2rem", sm: "2.5rem", md: "3rem" },
                }}
              >
                Adventure Awaits,{" "}
                {user?.user_metadata?.display_name || "Traveler"}
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  color: "text.secondary",
                  fontWeight: 500,
                  fontSize: { xs: "1rem", md: "1.25rem" },
                }}
              >
                {activeTripsCount > 0
                  ? `You have ${activeTripsCount} trips currently planned. Ready for the next one?`
                  : "No trips planned yet. Where would you like to go next?"}
              </Typography>
            </Box>
            {activeTripsCount > 0 && (
              <Button
                variant="outlined"
                size="small"
                onClick={onNewTrip}
                startIcon={<AddIcon />}
                sx={{
                  mt: 1,
                  fontWeight: 800,
                  borderRadius: 2,
                  display: { xs: "flex", md: "none" },
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
              sx={{
                p: { xs: 3, md: 4 },
                mb: { xs: 4, md: 6 },
                borderRadius: { xs: 4, md: 6 },
                background: (theme) =>
                  theme.palette.mode === "dark"
                    ? "linear-gradient(135deg, rgba(25, 118, 210, 0.2) 0%, rgba(33, 150, 243, 0.05) 100%)"
                    : "linear-gradient(135deg, rgba(25, 118, 210, 0.08) 0%, rgba(33, 150, 243, 0.03) 100%)",
                border: "1px solid",
                borderColor: (theme) =>
                  theme.palette.mode === "dark"
                    ? "rgba(25, 118, 210, 0.2)"
                    : "rgba(25, 118, 210, 0.15)",
                position: "relative",
                overflow: "hidden",
                cursor: "pointer",
                transition: "transform 0.2s, background 0.2s",
                "&:hover": {
                  transform: "translateY(-4px)",
                  background: (theme) =>
                    theme.palette.mode === "dark"
                      ? "linear-gradient(135deg, rgba(25, 118, 210, 0.3) 0%, rgba(33, 150, 243, 0.1) 100%)"
                      : "linear-gradient(135deg, rgba(25, 118, 210, 0.12) 0%, rgba(33, 150, 243, 0.05) 100%)",
                },
              }}
            >
              <Box sx={{ position: "relative", zIndex: 1 }}>
                <Chip
                  label="Next Adventure"
                  color="primary"
                  sx={{ fontWeight: 800, mb: 3, borderRadius: 1 }}
                />
                <Grid container spacing={{ xs: 2, md: 4 }} alignItems="center">
                  <Grid size={{ xs: 12, md: 7 }}>
                    <Typography
                      variant="h2"
                      sx={{
                        fontWeight: 900,
                        mb: 1,
                        fontSize: { xs: "2.5rem", md: "3.75rem" },
                      }}
                    >
                      {nextTrip.name}
                    </Typography>
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      spacing={{ xs: 1, sm: 2 }}
                      alignItems={{ xs: "flex-start", sm: "center" }}
                      sx={{ mb: 3 }}
                    >
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                      >
                        <LocationOnIcon fontSize="small" color="primary" />
                        <Typography
                          variant="body1"
                          sx={{ fontWeight: 700, opacity: 0.8 }}
                        >
                          {nextTrip.destination}
                        </Typography>
                      </Box>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                      >
                        <EventIcon fontSize="small" color="primary" />
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 700, color: "text.secondary" }}
                        >
                          {dayjs(nextTrip.start_date).format("MMM D")} -{" "}
                          {dayjs(nextTrip.end_date).format("MMM D, YYYY")}
                        </Typography>
                      </Box>
                    </Stack>
                    <Button
                      variant="contained"
                      endIcon={<ArrowForwardIcon />}
                      sx={{
                        py: 1.5,
                        px: 4,
                        width: { xs: "100%", sm: "auto" },
                        borderRadius: 3,
                        fontWeight: 900,
                      }}
                    >
                      View Full Itinerary
                    </Button>
                  </Grid>
                  <Grid size={{ xs: 12, md: 5 }} sx={{ textAlign: "center" }}>
                    <Box
                      sx={{
                        bgcolor: (theme) =>
                          theme.palette.mode === "dark"
                            ? "rgba(255,255,255,0.05)"
                            : "rgba(0,0,0,0.02)",
                        p: { xs: 2, md: 4 },
                        borderRadius: 5,
                        border: (theme) =>
                          theme.palette.mode === "dark"
                            ? "1px solid rgba(255,255,255,0.05)"
                            : "1px solid rgba(0,0,0,0.05)",
                      }}
                    >
                      <Typography
                        variant="h2"
                        sx={{
                          fontWeight: 900,
                          color: "primary.main",
                          fontSize: { xs: "3rem", md: "3.75rem" },
                        }}
                      >
                        {daysUntilNext}
                      </Typography>
                      <Typography
                        variant="overline"
                        sx={{
                          fontWeight: 800,
                          color: "text.secondary",
                          letterSpacing: 2,
                        }}
                      >
                        Days to Go
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
              <FlightIcon
                sx={{
                  position: "absolute",
                  right: { xs: -20, md: -40 },
                  top: { xs: -20, md: -40 },
                  fontSize: { xs: 150, md: 250 },
                  opacity: 0.03,
                  transform: "rotate(45deg)",
                }}
              />
            </Paper>
          ) : (
            <Paper
              elevation={0}
              onClick={onNewTrip}
              sx={{
                p: { xs: 4, md: 6 },
                mb: 6,
                borderRadius: 6,
                bgcolor: (theme) =>
                  theme.palette.mode === "dark"
                    ? "rgba(255,255,255,0.02)"
                    : "rgba(0,0,0,0.01)",
                border: (theme) =>
                  `1px dashed ${
                    theme.palette.mode === "dark"
                      ? "rgba(255,255,255,0.1)"
                      : "rgba(0,0,0,0.1)"
                  }`,
                textAlign: "center",
                cursor: "pointer",
                transition: "all 0.2s",
                "&:hover": {
                  bgcolor: "rgba(255,255,255,0.04)",
                  borderColor: "primary.main",
                },
              }}
            >
              <MapIcon sx={{ fontSize: 80, opacity: 0.1, mb: 3 }} />
              <Typography variant="h4" sx={{ fontWeight: 900, mb: 2 }}>
                Start Your First Adventure
              </Typography>
              <Typography variant="body1" sx={{ mb: 4, opacity: 0.5 }}>
                Create a trip to start adding destinations, activities, and
                managing your budget.
              </Typography>
              <Button
                variant="contained"
                size="large"
                onClick={onNewTrip}
                sx={{ py: 2, px: 6, borderRadius: 3, fontWeight: 900 }}
              >
                Create Your First Trip
              </Button>
            </Paper>
          )}

          {/* Statistics and Quick Actions */}
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 4,
                  bgcolor: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.05)",
                  height: "100%",
                }}
              >
                <Stack
                  spacing={2}
                  direction="row"
                  alignItems="center"
                  sx={{ mb: 2 }}
                >
                  <Avatar
                    sx={{ bgcolor: "primary.main", width: 40, height: 40 }}
                  >
                    <BeachAccessIcon fontSize="small" />
                  </Avatar>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>
                    Trip Summary
                  </Typography>
                </Stack>
                <Typography variant="body2" sx={{ opacity: 0.6, mb: 2 }}>
                  Your global footprint at a glance.
                </Typography>
                <Stack spacing={1}>
                  <Box
                    sx={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <Typography variant="body2">Active Trips</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 900 }}>
                      {activeTripsCount}
                    </Typography>
                  </Box>
                  <Box
                    sx={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <Typography variant="body2">Destinations</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 900 }}>
                      {myVacations.reduce(
                        (acc, v) =>
                          acc + (v.destination && !v.archived ? 1 : 0),
                        0,
                      )}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, md: 8 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 4,
                  bgcolor: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.05)",
                  height: "100%",
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 3 }}>
                  Your Recent Explorations
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    gap: 2,
                    overflowX: "auto",
                    pb: 1,
                    "&::-webkit-scrollbar": { height: 4 },
                    "&::-webkit-scrollbar-thumb": {
                      bgcolor: "rgba(255,255,255,0.05)",
                      borderRadius: 10,
                    },
                  }}
                >
                  {myVacations.slice(0, 5).map((vac) => (
                    <Box
                      key={vac.id}
                      onClick={() => onSelectVacation(vac)}
                      sx={{
                        minWidth: 200,
                        p: 2,
                        borderRadius: 3,
                        bgcolor: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.05)",
                        cursor: "pointer",
                        transition: "all 0.2s",
                        "&:hover": {
                          bgcolor: "rgba(255,255,255,0.08)",
                          borderColor: "primary.main",
                        },
                      }}
                    >
                      <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: 800, mb: 0.5 }}
                      >
                        {vac.name}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ opacity: 0.5, display: "block" }}
                      >
                        {vac.destination}
                      </Typography>
                    </Box>
                  ))}
                  {myVacations.length === 0 && (
                    <Typography
                      variant="body2"
                      sx={{
                        opacity: 0.3,
                        py: 4,
                        textAlign: "center",
                        width: "100%",
                      }}
                    >
                      No recent trips to display.
                    </Typography>
                  )}
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
};
