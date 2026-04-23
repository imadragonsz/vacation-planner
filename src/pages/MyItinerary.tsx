import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Paper,
  Stack,
  IconButton,
  FormControl,
  Select,
  MenuItem,
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
  const [vacations, setVacations] = useState<any[]>([]);
  const [selectedVacationId, setSelectedVacationId] = useState<string>("all");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchVacations = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("vacations")
        .select("id, name")
        .eq("user_id", user.id);
      if (data) setVacations(data);
    };
    fetchVacations();
  }, [user]);

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
        .select("*, locations(name, vacation_id)")
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

  const filtered = agendas.filter((item) => {
    const matchesSearch =
      item.description?.toLowerCase().includes(search.toLowerCase()) ||
      item.address?.toLowerCase().includes(search.toLowerCase());

    const matchesVacation =
      selectedVacationId === "all" ||
      (item as any).locations?.vacation_id === selectedVacationId;

    return matchesSearch && matchesVacation;
  });

  return (
    <Box sx={{ maxWidth: 1000, mx: "auto", p: { xs: 2, md: 0 } }}>
      <Stack direction="row" alignItems="center" spacing={2} mb={4}>
        <IconButton
          onClick={onHome}
          sx={{
            color: "primary.main",
            width: 44,
            height: 44,
            bgcolor: (theme) =>
              theme.palette.mode === "dark"
                ? "rgba(255,255,255,0.05)"
                : "rgba(0,0,0,0.05)",
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
          p: 1,
          bgcolor: (theme) =>
            theme.palette.mode === "dark"
              ? "rgba(255,255,255,0.06)"
              : "rgba(0,0,0,0.03)",
          borderRadius: 4,
          border: (theme) =>
            `1px solid ${
              theme.palette.mode === "dark"
                ? "rgba(255,255,255,0.1)"
                : "rgba(0,0,0,0.08)"
            }`,
        }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          alignItems="center"
          px={2}
          spacing={1}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              flex: 1,
              width: "100%",
              minHeight: 52,
            }}
          >
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
          </Box>
          <FormControl
            size="small"
            sx={{
              minWidth: { xs: "100%", md: 200 },
              mb: { xs: 1, md: 0 },
            }}
          >
            <Select
              value={selectedVacationId}
              onChange={(e) => setSelectedVacationId(e.target.value)}
              sx={{
                height: 44,
                bgcolor: (theme) =>
                  theme.palette.mode === "dark"
                    ? "rgba(255,255,255,0.05)"
                    : "rgba(0,0,0,0.04)",
                borderRadius: 2,
                px: 2,
                fontSize: "0.9rem",
                fontWeight: 600,
                color: "text.primary",
                "& .MuiSelect-select": {
                  display: "flex",
                  alignItems: "center",
                },
              }}
            >
              <MenuItem value="all">
                <em>All Trips</em>
              </MenuItem>
              {vacations.map((v) => (
                <MenuItem key={v.id} value={v.id}>
                  {v.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </Paper>

      <Box sx={{ mb: 6 }} />

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
                  p: { xs: 2, md: 2.5 },
                  bgcolor: (theme) =>
                    theme.palette.mode === "dark"
                      ? "rgba(255,255,255,0.04)"
                      : "#ffffff",
                  border: (theme) =>
                    `1px solid ${
                      theme.palette.mode === "dark"
                        ? "rgba(255,255,255,0.08)"
                        : "rgba(0,0,0,0.08)"
                    }`,
                  borderLeft: "6px solid",
                  borderColor: "primary.main",
                  borderRadius: 3,
                  transition: "all 0.2s ease-in-out",
                  "&:hover": {
                    bgcolor: (theme) =>
                      theme.palette.mode === "dark"
                        ? "rgba(255,255,255,0.07)"
                        : "#ffffff",
                    transform: "translateX(4px)",
                    boxShadow: (theme) =>
                      theme.palette.mode === "dark"
                        ? "0 4px 20px rgba(0,0,0,0.6)"
                        : "0 4px 20px rgba(0,0,0,0.05)",
                  },
                }}
              >
                <Stack direction="row" spacing={3} alignItems="center">
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: "rgba(227, 27, 77, 0.1)",
                      flexShrink: 0,
                    }}
                  >
                    <TripOriginIcon
                      sx={{ color: "primary.main", fontSize: 16 }}
                    />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="h6"
                      noWrap
                      sx={{
                        fontSize: { xs: "1rem", md: "1.15rem" },
                        fontWeight: 800,
                        color: "text.primary",
                        mb: 0.5,
                      }}
                    >
                      {item.description}
                    </Typography>
                    <Typography
                      variant="caption"
                      noWrap
                      display="block"
                      sx={{
                        fontSize: "0.85rem",
                        color: "text.secondary",
                        opacity: 0.8,
                      }}
                    >
                      {item.address && `${item.address} • `}
                      {item.agenda_date
                        ? dayjs(item.agenda_date).format("MMM DD, YYYY")
                        : "TBD"}
                      {item.Time && ` • ${item.Time.slice(0, 5)}`}
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
