import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  Container,
  IconButton,
  Button,
  Avatar,
  Chip,
  Skeleton,
  Grid,
  TextField,
  InputAdornment,
} from "@mui/material";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import EventNoteIcon from "@mui/icons-material/EventNote";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import TravelExploreIcon from "@mui/icons-material/TravelExplore";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import TripOriginIcon from "@mui/icons-material/TripOrigin";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import { supabase } from "../supabaseClient";
import { generateICal } from "../utils/ical";
import dayjs from "dayjs";

type MyItineraryProps = {
  user: any;
  onHome: () => void;
};

export default function MyItinerary({ user, onHome }: MyItineraryProps) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(
    null,
  );

  const filteredItems = useMemo(() => {
    if (!searchQuery) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.vacation.toLowerCase().includes(q) ||
        item.activities.some((ag: any) => ag.name.toLowerCase().includes(q)),
    );
  }, [items, searchQuery]);

  const selectedItem = useMemo(() => {
    return (
      filteredItems.find((item) => item.id === selectedLocationId) ||
      filteredItems[0] ||
      null
    );
  }, [filteredItems, selectedLocationId]);

  useEffect(() => {
    async function fetchMyItinerary() {
      if (!user) {
        return;
      }
      setLoading(true);

      const userId = user.id;

      try {
        // Step 1: Fetch joined location IDs
        const { data: lpData, error: lpError } = await supabase
          .from("location_participants")
          .select("location_id")
          .eq("profile_id", userId);

        if (lpError) {
          console.error(
            "[MyItinerary] Error fetching location_participants:",
            lpError,
          );
        }

        const joinedLocIds = lpData?.map((lp) => lp.location_id) || [];

        // Step 2: Fetch joined agenda IDs
        const { data: apData, error: apError } = await supabase
          .from("agenda_participants")
          .select("agenda_id")
          .eq("profile_id", userId);

        if (apError) {
          console.error(
            "[MyItinerary] Error fetching agenda_participants:",
            apError,
          );
        }

        const joinedAgIds = apData?.map((ap) => ap.agenda_id) || [];

        // Map to group items by location
        const locationGroups: Record<number, any> = {};
        const seenAgendaIds = new Set<number>();

        // Step 3: Fetch Location Details for joined locations
        if (joinedLocIds.length > 0) {
          const { data: locations } = await supabase
            .from("locations")
            .select("*, vacations(name)")
            .in("id", joinedLocIds);

          if (locations) {
            for (const loc of locations) {
              locationGroups[loc.id] = {
                id: loc.id,
                name: loc.name,
                startDate: loc.start_date,
                endDate: loc.end_date,
                vacation: (loc.vacations as any)?.name || "Shared Trip",
                type: "Destination",
                activities: [],
              };

              // Fetch only activities the user has joined for this destination
              const { data: locAgendas } = await supabase
                .from("agendas")
                .select("*")
                .eq("location_id", loc.id)
                .in("id", joinedAgIds);

              if (locAgendas) {
                locAgendas.forEach((ag: any) => {
                  seenAgendaIds.add(ag.id);
                  locationGroups[loc.id].activities.push({
                    id: ag.id,
                    name: ag.description,
                    date: ag.agenda_date,
                    time: ag.Time,
                  });
                });
              }
            }
          }
        }

        // Step 4: Fetch Explicit Agenda Details for activities where destination NOT joined
        const remainingAgIds = joinedAgIds.filter(
          (id) => !seenAgendaIds.has(id),
        );
        if (remainingAgIds.length > 0) {
          const { data: agendas } = await supabase
            .from("agendas")
            .select("*, locations(*, vacations(name))")
            .in("id", remainingAgIds);

          if (agendas) {
            for (const ag of agendas) {
              const loc = ag.locations as any;
              if (!loc) continue;

              if (!locationGroups[loc.id]) {
                locationGroups[loc.id] = {
                  id: loc.id,
                  name: loc.name,
                  startDate: loc.start_date,
                  endDate: loc.end_date,
                  vacation: loc.vacations?.name || "Shared Trip",
                  type: "Destination",
                  activities: [],
                };
              }

              locationGroups[loc.id].activities.push({
                id: ag.id,
                name: ag.description,
                date: ag.agenda_date,
                time: ag.Time,
              });
            }
          }
        }

        // Convert the groups to an array and sort
        const processedGroups = Object.values(locationGroups).map((group) => {
          // Sort activities within group
          group.activities.sort((a: any, b: any) => {
            if (!a.date && !b.date) return 0;
            if (!a.date) return 1;
            if (!b.date) return -1;
            const dateCompare =
              new Date(a.date).getTime() - new Date(b.date).getTime();
            if (dateCompare !== 0) return dateCompare;
            return (a.time || "").localeCompare(b.time || "");
          });

          // Group activities by date
          const dailyActivities: Record<string, any[]> = {};
          group.activities.forEach((ag: any) => {
            const dateStr = ag.date || "Unscheduled";
            if (!dailyActivities[dateStr]) dailyActivities[dateStr] = [];
            dailyActivities[dateStr].push(ag);
          });
          group.dailyActivities = dailyActivities;

          // Determine the "representative date" for sorting groups (earliest activity)
          group.earliestDate = group.activities[0]?.date || null;
          return group;
        });

        // Sort groups by their destination start date
        processedGroups.sort((a, b) => {
          if (!a.startDate && !b.startDate) {
            // Fallback to earliest activity if no location start date
            if (!a.earliestDate && !b.earliestDate) return 0;
            if (!a.earliestDate) return 1;
            if (!b.earliestDate) return -1;
            return (
              new Date(a.earliestDate).getTime() -
              new Date(b.earliestDate).getTime()
            );
          }
          if (!a.startDate) return 1;
          if (!b.startDate) return -1;
          return (
            new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
          );
        });

        setItems(processedGroups);
        if (processedGroups.length > 0 && selectedLocationId === null) {
          setSelectedLocationId(processedGroups[0].id);
        }
      } catch (err) {
        console.error("[MyItinerary] Critical error:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchMyItinerary();
  }, [user, selectedLocationId]);

  const handleExportCalendar = () => {
    const events: any[] = [];
    items.forEach((group) => {
      group.activities.forEach((ag: any) => {
        if (ag.date) {
          // Construct a valid ISO-like string for start time
          // If no time, assume 09:00 AM
          const timeStr = ag.time || "09:00:00";
          const startDateTime = `${ag.date}T${timeStr}`;

          events.push({
            title: ag.name,
            start: startDateTime,
            description: `Trip: ${group.vacation}\nDestination: ${group.name}`,
            location: group.name,
          });
        }
      });
    });

    if (events.length > 0) {
      generateICal(events);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 4, md: 6 } }}>
      <Box
        sx={{
          mb: 4,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 3,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
          <IconButton
            onClick={onHome}
            sx={{
              bgcolor: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.05)",
              color: "#fff",
              p: 1.5,
              "&:hover": {
                bgcolor: "rgba(255,255,255,0.1)",
                transform: "translateX(-4px)",
              },
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 900,
                letterSpacing: -1,
                background:
                  "linear-gradient(90deg, #fff 0%, rgba(255,255,255,0.5) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              My Plan
            </Typography>
            <Typography
              variant="body1"
              sx={{ opacity: 0.4, fontWeight: 700, mt: -0.5 }}
            >
              Your personal itinerary across all trips
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          {items.length > 0 && (
            <Button
              variant="contained"
              startIcon={<CalendarTodayIcon />}
              onClick={handleExportCalendar}
              sx={{
                borderRadius: 3,
                px: 3,
                py: 1.2,
                fontWeight: 900,
                textTransform: "none",
                boxShadow: "0 8px 32px rgba(33, 150, 243, 0.3)",
                background: "linear-gradient(45deg, #2196f3 30%, #21cbf3 90%)",
                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: "0 12px 40px rgba(33, 150, 243, 0.4)",
                },
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            >
              Sync to Calendar
            </Button>
          )}
        </Box>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "320px 1fr" },
          gap: 6,
          alignItems: "start",
        }}
      >
        {/* Sidebar */}
        <Box
          sx={{
            position: { lg: "sticky" },
            top: { lg: 32 },
            display: "flex",
            flexDirection: "column",
            gap: 3,
          }}
        >
          <TextField
            fullWidth
            placeholder="Search activities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: "primary.main", opacity: 0.5 }} />
                </InputAdornment>
              ),
              sx: {
                borderRadius: 4,
                bgcolor: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.05)",
                "&:hover": { bgcolor: "rgba(255,255,255,0.05)" },
                "& fieldset": { border: "none" },
              },
            }}
          />

          <Paper
            sx={{
              p: 3,
              borderRadius: 6,
              bgcolor: "rgba(255,255,255,0.02)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <Typography
              variant="overline"
              sx={{ fontWeight: 900, opacity: 0.4, mb: 2, display: "block" }}
            >
              Locations Overview
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {filteredItems.map((item: any) => {
                const isActive = selectedItem?.id === item.id;
                return (
                  <Button
                    key={`nav-${item.id}`}
                    fullWidth
                    onClick={() => setSelectedLocationId(item.id)}
                    sx={{
                      justifyContent: "flex-start",
                      textAlign: "left",
                      px: 2,
                      py: 1.5,
                      borderRadius: 3,
                      color: isActive
                        ? "primary.main"
                        : "rgba(255,255,255,0.6)",
                      bgcolor: isActive
                        ? "rgba(33, 150, 243, 0.1)"
                        : "transparent",
                      border: isActive
                        ? "1px solid rgba(33, 150, 243, 0.2)"
                        : "1px solid transparent",
                      textTransform: "none",
                      "&:hover": {
                        bgcolor: isActive
                          ? "rgba(33, 150, 243, 0.15)"
                          : "rgba(255,255,255,0.03)",
                      },
                      transition: "all 0.2s ease",
                    }}
                  >
                    <Box sx={{ overflow: "hidden" }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: isActive ? 900 : 700,
                          whiteSpace: "nowrap",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {item.name}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ opacity: 0.5, display: "block", mt: -0.2 }}
                      >
                        {item.vacation}
                      </Typography>
                    </Box>
                    <Box sx={{ flex: 1 }} />
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 900,
                        bgcolor: isActive
                          ? "primary.main"
                          : "rgba(255,255,255,0.05)",
                        color: isActive ? "#fff" : "inherit",
                        px: 1,
                        borderRadius: 1,
                        minWidth: 20,
                        textAlign: "center",
                      }}
                    >
                      {item.activities.length}
                    </Typography>
                  </Button>
                );
              })}
              {filteredItems.length === 0 && (
                <Typography
                  variant="body2"
                  sx={{ opacity: 0.3, fontStyle: "italic", p: 1 }}
                >
                  No matches found
                </Typography>
              )}
            </Box>
          </Paper>

          <Box
            sx={{
              p: 3,
              borderRadius: 6,
              bgcolor: "primary.main",
              color: "white",
              display: "flex",
              alignItems: "center",
              gap: 2,
              boxShadow: "0 10px 40px rgba(33, 150, 243, 0.2)",
            }}
          >
            <FilterListIcon />
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 900 }}>
                {items.length} Destinations
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                Total activities in your radar
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Main Content */}
        <Box>
          {loading ? (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {[1, 2, 3].map((i) => (
                <Skeleton
                  key={i}
                  variant="rectangular"
                  height={300}
                  sx={{ borderRadius: 6, bgcolor: "rgba(255,255,255,0.02)" }}
                />
              ))}
            </Box>
          ) : filteredItems.length === 0 ? (
            <Paper
              elevation={0}
              sx={{
                p: { xs: 6, md: 12 },
                textAlign: "center",
                bgcolor: "rgba(255,255,255,0.01)",
                backdropFilter: "blur(20px)",
                border: "1px dashed rgba(255,255,255,0.1)",
                borderRadius: 8,
              }}
            >
              <TravelExploreIcon
                sx={{
                  fontSize: 80,
                  opacity: 0.1,
                  mb: 3,
                  color: "primary.main",
                }}
              />
              <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
                {searchQuery
                  ? "No matching plans found"
                  : "No stops in your radar yet."}
              </Typography>
              <Typography
                sx={{ opacity: 0.3, maxWidth: 400, mx: "auto", mb: 4 }}
              >
                {searchQuery
                  ? "Try adjusting your search query or clear it to see all your plans."
                  : "Exploring is more fun together! Browse trips and join activities to build your master travel plan."}
              </Typography>
              <Button
                variant="outlined"
                onClick={() => {
                  if (searchQuery) setSearchQuery("");
                  else onHome();
                }}
                sx={{
                  borderRadius: 3,
                  px: 4,
                  fontWeight: 900,
                  borderColor: "rgba(255,255,255,0.1)",
                  color: "rgba(255,255,255,0.6)",
                  "&:hover": {
                    borderColor: "primary.main",
                    color: "primary.main",
                  },
                }}
              >
                {searchQuery ? "Clear Search" : "Find a Trip"}
              </Button>
            </Paper>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {selectedItem && (
                <Box key={`group-${selectedItem.id}`}>
                  {/* Destination Header */}
                  <Paper
                    elevation={0}
                    sx={{
                      p: 4,
                      mb: 3,
                      borderRadius: 6,
                      bgcolor: "rgba(33, 150, 243, 0.03)",
                      backdropFilter: "blur(40px)",
                      border: "1px solid rgba(33, 150, 243, 0.1)",
                      display: "flex",
                      alignItems: { xs: "flex-start", sm: "center" },
                      flexDirection: { xs: "column", sm: "row" },
                      gap: 4,
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 80,
                        height: 80,
                        bgcolor: "rgba(33, 150, 243, 0.1)",
                        border: "2px solid rgba(33, 150, 243, 0.2)",
                        color: "primary.main",
                      }}
                    >
                      <LocationOnIcon sx={{ fontSize: 40 }} />
                    </Avatar>

                    <Box sx={{ flex: 1 }}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 2,
                          mb: 1,
                          flexWrap: "wrap",
                        }}
                      >
                        <Typography
                          variant="h4"
                          sx={{ fontWeight: 900, letterSpacing: -1.5 }}
                        >
                          {selectedItem.name}
                        </Typography>
                        <Chip
                          label={selectedItem.vacation}
                          sx={{
                            bgcolor: "primary.main",
                            fontWeight: 900,
                            fontSize: "0.75rem",
                            color: "#fff",
                            px: 1,
                          }}
                        />
                      </Box>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 3,
                          flexWrap: "wrap",
                        }}
                      >
                        <Typography
                          variant="subtitle1"
                          sx={{
                            opacity: 0.6,
                            fontWeight: 700,
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                          }}
                        >
                          <CalendarTodayIcon sx={{ fontSize: 18 }} />
                          {selectedItem.startDate
                            ? dayjs(selectedItem.startDate).format("MMMM D")
                            : "???"}{" "}
                          —{" "}
                          {selectedItem.endDate
                            ? dayjs(selectedItem.endDate).format("MMMM D, YYYY")
                            : "???"}
                        </Typography>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <EventNoteIcon sx={{ fontSize: 18, opacity: 0.4 }} />
                          <Typography
                            variant="subtitle1"
                            sx={{ color: "primary.main", fontWeight: 800 }}
                          >
                            {selectedItem.activities.length} Activities
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Paper>

                  {/* Timeline */}
                  <Box
                    sx={{
                      pl: { xs: 2, sm: 6 },
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                    }}
                  >
                    {Object.keys(selectedItem.dailyActivities).length > 0 ? (
                      (
                        Object.entries(selectedItem.dailyActivities) as [
                          string,
                          any[],
                        ][]
                      ).map(([date, activities], idx) => (
                        <Box
                          key={date}
                          sx={{
                            position: "relative",
                            "&::before": {
                              content: '""',
                              position: "absolute",
                              left: -24,
                              top: 12,
                              bottom: -32,
                              width: 2,
                              bgcolor: "rgba(255,255,255,0.05)",
                              display:
                                idx ===
                                Object.keys(selectedItem.dailyActivities)
                                  .length -
                                  1
                                  ? "none"
                                  : "block",
                            },
                          }}
                        >
                          {/* Day indicator */}
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 2,
                              mb: 3,
                            }}
                          >
                            <TripOriginIcon
                              sx={{
                                fontSize: 16,
                                color: "primary.main",
                                ml: -3.85,
                                filter:
                                  "drop-shadow(0 0 8px rgba(33, 150, 243, 0.5))",
                                bgcolor: "#121212",
                                zIndex: 1,
                              }}
                            />
                            <Typography
                              variant="h6"
                              sx={{
                                fontWeight: 900,
                                color: "primary.main",
                                letterSpacing: 0.5,
                                textTransform: "uppercase",
                                fontSize: "0.9rem",
                              }}
                            >
                              {date !== "Unscheduled"
                                ? dayjs(date).format("dddd, MMM D")
                                : "Unscheduled"}
                            </Typography>
                          </Box>

                          <Grid container spacing={2}>
                            {activities.map((ag: any) => (
                              <Grid
                                size={{ xs: 12, md: 6 }}
                                key={`ag-${ag.id}`}
                              >
                                <Paper
                                  sx={{
                                    p: 3,
                                    borderRadius: 5,
                                    bgcolor: "rgba(255,255,255,0.02)",
                                    border: "1px solid rgba(255,255,255,0.05)",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 3,
                                    transition:
                                      "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                    "&:hover": {
                                      bgcolor: "rgba(255,255,255,0.06)",
                                      transform: "translateY(-4px) scale(1.01)",
                                      borderColor: "primary.main",
                                      boxShadow: "0 12px 40px rgba(0,0,0,0.3)",
                                    },
                                  }}
                                >
                                  <Avatar
                                    sx={{
                                      width: 50,
                                      height: 50,
                                      bgcolor: "rgba(156, 39, 176, 0.1)",
                                      color: "secondary.main",
                                    }}
                                  >
                                    <EventNoteIcon sx={{ fontSize: 24 }} />
                                  </Avatar>

                                  <Box sx={{ flex: 1 }}>
                                    <Typography
                                      variant="subtitle1"
                                      sx={{
                                        fontWeight: 800,
                                        lineHeight: 1.2,
                                        mb: 0.5,
                                      }}
                                    >
                                      {ag.name}
                                    </Typography>
                                    {ag.time && (
                                      <Typography
                                        variant="caption"
                                        sx={{
                                          display: "flex",
                                          alignItems: "center",
                                          gap: 0.5,
                                          fontWeight: 700,
                                          opacity: 0.5,
                                          textTransform: "uppercase",
                                        }}
                                      >
                                        <AccessTimeIcon sx={{ fontSize: 14 }} />
                                        {ag.time.slice(0, 5)}
                                      </Typography>
                                    )}
                                  </Box>
                                </Paper>
                              </Grid>
                            ))}
                          </Grid>
                        </Box>
                      ))
                    ) : (
                      <Typography
                        variant="body2"
                        sx={{
                          p: 4,
                          opacity: 0.2,
                          fontStyle: "italic",
                          textAlign: "center",
                          bgcolor: "rgba(255,255,255,0.01)",
                          borderRadius: 4,
                          border: "1px dashed rgba(255,255,255,0.1)",
                        }}
                      >
                        No activities scheduled for this stop.
                      </Typography>
                    )}
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </Box>
      </Box>
    </Container>
  );
}
