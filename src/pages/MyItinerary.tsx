import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Paper,
  Stack,
  IconButton,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import TripOriginIcon from "@mui/icons-material/TripOrigin";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import dayjs from "dayjs";
import { supabase } from "../supabaseClient";
import { Agenda } from "../hooks/useAgendas";

interface MyItineraryProps {
  user: any;
  onHome: () => void;
}

const MyItinerary: React.FC<MyItineraryProps> = ({ user, onHome }) => {
  const [agendas, setAgendas] = useState<Agenda[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchMyAgendas = async () => {
      if (!user) return;
      setLoading(true);

      // 1. Get IDs of agenda items where the user is a participant
      const { data: participations, error: partError } = await supabase
        .from("agenda_participants")
        .select("agenda_id")
        .eq("profile_id", user.id);

      if (partError) {
        console.error("Error fetching participations:", partError);
        setLoading(false);
        return;
      }

      const joinedAgendaIds = participations?.map((p) => p.agenda_id) || [];

      if (joinedAgendaIds.length === 0) {
        setAgendas([]);
        setLoading(false);
        return;
      }

      // 2. Fetch those agenda items
      const { data, error } = await supabase
        .from("agendas")
        .select("*")
        .in("id", joinedAgendaIds)
        .order("agenda_date", { ascending: true });

      if (error) {
        console.error("Error fetching agendas:", error);
      } else if (data) {
        setAgendas(data);
      }
      setLoading(false);
    };
    fetchMyAgendas();
  }, [user]);

  const filtered = agendas.filter(
    (item) =>
      item.description?.toLowerCase().includes(search.toLowerCase()) ||
      item.address?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Box sx={{ maxWidth: 1000, mx: "auto", p: { xs: 2, md: 0 } }}>
      <Stack direction="row" alignItems="center" spacing={2} mb={4}>
        <IconButton
          onClick={onHome}
          sx={{
            color: "primary.main",
            width: 44,
            height: 44,
            bgcolor: "rgba(255,255,255,0.05)",
          }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography
          variant="h4"
          sx={{ fontWeight: 800, fontSize: { xs: "1.75rem", md: "2.125rem" } }}
        >
          Personal Itinerary
        </Typography>
      </Stack>

      <Paper
        sx={{
          p: 0.5,
          mb: 4,
          bgcolor: "rgba(255,255,255,0.05)",
          borderRadius: 4,
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <Stack direction="row" alignItems="center" px={2}>
          <SearchIcon sx={{ color: "primary.main", mr: 1 }} />
          <TextField
            fullWidth
            variant="standard"
            placeholder="Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              disableUnderline: true,
              sx: { height: { xs: 52, md: 44 }, fontSize: "1rem" },
            }}
          />
        </Stack>
      </Paper>

      {loading ? (
        <Box sx={{ textAlign: "center", py: 4 }}>
          <Typography>Loading...</Typography>
        </Box>
      ) : (
        <Stack spacing={2}>
          {filtered.length === 0 ? (
            <Typography sx={{ textAlign: "center", opacity: 0.5, py: 4 }}>
              No items found.
            </Typography>
          ) : (
            filtered.map((item) => (
              <Paper
                key={item.id}
                elevation={0}
                sx={{
                  p: { xs: 2.5, md: 3 },
                  bgcolor: "#0f0f11",
                  borderLeft: "4px solid",
                  borderColor: "primary.main",
                  borderRadius: 2,
                  transition: "transform 0.2s",
                  "&:active": { transform: "scale(0.98)" },
                }}
              >
                <Stack direction="row" spacing={2} alignItems="center">
                  <TripOriginIcon
                    sx={{ color: "primary.main", fontSize: 14 }}
                  />
                  <Box>
                    <Typography
                      variant="h6"
                      sx={{
                        fontSize: { xs: "1.1rem", md: "1.25rem" },
                        fontWeight: 700,
                      }}
                    >
                      {item.description}
                    </Typography>
                    <Typography variant="caption" color="rgba(255,255,255,0.6)">
                      {item.address} •{" "}
                      {item.agenda_date
                        ? dayjs(item.agenda_date).format("MMM DD")
                        : "TBD"}{" "}
                      {item.Time}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            ))
          )}
        </Stack>
      )}
    </Box>
  );
};

export default MyItinerary;
