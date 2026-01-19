import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Container,
  IconButton,
  Button,
} from "@mui/material";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import EventNoteIcon from "@mui/icons-material/EventNote";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import { supabase } from "../supabaseClient";
import { generateICal } from "../utils/ical";

type MyItineraryProps = {
  user: any;
  onHome: () => void;
};

export default function MyItinerary({ user, onHome }: MyItineraryProps) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMyItinerary() {
      if (!user) {
        console.log("[MyItinerary] No user found, skipping fetch");
        return;
      }
      setLoading(true);

      const userId = user.id;
      console.log("[MyItinerary] Fetching for userId:", userId);

      try {
        // Step 1: Fetch joined location IDs
        const { data: lpData, error: lpError } = await supabase
          .from("location_participants")
          .select("location_id")
          .eq("profile_id", userId);

        if (lpError) {
          console.error(
            "[MyItinerary] Error fetching location_participants:",
            lpError
          );
        }

        const joinedLocIds = lpData?.map((lp) => lp.location_id) || [];
        console.log("[MyItinerary] Joined Location IDs:", joinedLocIds);

        // Step 2: Fetch joined agenda IDs
        const { data: apData, error: apError } = await supabase
          .from("agenda_participants")
          .select("agenda_id")
          .eq("profile_id", userId);

        if (apError) {
          console.error(
            "[MyItinerary] Error fetching agenda_participants:",
            apError
          );
        }

        const joinedAgIds = apData?.map((ap) => ap.agenda_id) || [];
        console.log("[MyItinerary] Joined Activity IDs:", joinedAgIds);

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
                vacation: (loc.vacations as any)?.name || "Shared Trip",
                type: "Destination",
                activities: [],
              };

              // Fetch all activities for this joined destination
              const { data: locAgendas } = await supabase
                .from("agendas")
                .select("*")
                .eq("location_id", loc.id);

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
          (id) => !seenAgendaIds.has(id)
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

        // Sort groups by their earliest activity date
        processedGroups.sort((a, b) => {
          if (!a.earliestDate && !b.earliestDate) return 0;
          if (!a.earliestDate) return 1;
          if (!b.earliestDate) return -1;
          return (
            new Date(a.earliestDate).getTime() -
            new Date(b.earliestDate).getTime()
          );
        });

        console.log("[MyItinerary] Processed groups:", processedGroups);
        setItems(processedGroups);
      } catch (err) {
        console.error("[MyItinerary] Critical error:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchMyItinerary();
  }, [user]);

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
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Box
        sx={{
          mb: 4,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <IconButton onClick={onHome} sx={{ color: "rgba(255,255,255,0.6)" }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" sx={{ fontWeight: 900 }}>
            My Itinerary
          </Typography>
        </Box>
        {items.length > 0 && (
          <Button
            variant="outlined"
            size="small"
            startIcon={<CalendarTodayIcon />}
            onClick={handleExportCalendar}
            sx={{
              borderRadius: 2,
              borderColor: "rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.7)",
              "&:hover": {
                borderColor: "primary.main",
                bgcolor: "rgba(25, 118, 210, 0.05)",
              },
            }}
          >
            Export to Calendar
          </Button>
        )}
      </Box>

      {loading ? (
        <Typography sx={{ opacity: 0.5 }}>Loading your plan...</Typography>
      ) : items.length === 0 ? (
        <Paper
          sx={{
            p: 6,
            textAlign: "center",
            bgcolor: "rgba(255,255,255,0.02)",
            borderRadius: 4,
          }}
        >
          <EventNoteIcon sx={{ fontSize: 64, opacity: 0.1, mb: 2 }} />
          <Typography variant="h6" sx={{ opacity: 0.5 }}>
            You haven't joined any activities yet.
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.3 }}>
            Go to a trip and click "Join" on specific destinations or agenda
            items!
          </Typography>
        </Paper>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {items.map((group) => (
            <Paper
              key={`group-${group.id}`}
              elevation={0}
              sx={{
                p: 0,
                borderRadius: 4,
                bgcolor: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.05)",
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  p: 3,
                  bgcolor: "rgba(25, 118, 210, 0.05)",
                  borderBottom: "1px solid rgba(255,255,255,0.05)",
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                <LocationOnIcon color="primary" />
                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 800,
                      opacity: 0.4,
                      textTransform: "uppercase",
                      letterSpacing: 1,
                    }}
                  >
                    {group.vacation}
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>
                    {group.name}
                  </Typography>
                </Box>
              </Box>

              <Box
                sx={{ p: 2, display: "flex", flexDirection: "column", gap: 2 }}
              >
                {Object.keys(group.dailyActivities).length > 0 ? (
                  (
                    Object.entries(group.dailyActivities) as [string, any[]][]
                  ).map(([date, activities]) => (
                    <Box
                      key={date}
                      sx={{ display: "flex", flexDirection: "column", gap: 1 }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          px: 1,
                          fontWeight: 900,
                          color: "secondary.main",
                          opacity: 0.8,
                          textTransform: "uppercase",
                          letterSpacing: 0.5,
                        }}
                      >
                        {date !== "Unscheduled"
                          ? new Date(date).toLocaleDateString(undefined, {
                              weekday: "long",
                              month: "short",
                              day: "numeric",
                            })
                          : "Unscheduled Activities"}
                      </Typography>
                      {activities.map((ag: any) => (
                        <Box
                          key={`ag-${ag.id}`}
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            bgcolor: "rgba(255,255,255,0.02)",
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                            "&:hover": { bgcolor: "rgba(255,255,255,0.04)" },
                          }}
                        >
                          <EventNoteIcon
                            sx={{ fontSize: 20, color: "secondary.main" }}
                          />
                          <Box sx={{ flex: 1 }}>
                            <Typography
                              variant="body1"
                              sx={{ fontWeight: 700 }}
                            >
                              {ag.name}
                            </Typography>
                          </Box>
                          {ag.time && (
                            <Box sx={{ textAlign: "right" }}>
                              <Typography
                                variant="caption"
                                sx={{ fontWeight: 800, opacity: 0.6 }}
                              >
                                {ag.time.slice(0, 5)}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      ))}
                    </Box>
                  ))
                ) : (
                  <Typography
                    variant="body2"
                    sx={{ p: 2, opacity: 0.3, fontStyle: "italic" }}
                  >
                    No scheduled activities for this destination.
                  </Typography>
                )}
              </Box>
            </Paper>
          ))}
        </Box>
      )}
    </Container>
  );
}
