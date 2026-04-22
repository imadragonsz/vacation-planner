import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  Tooltip,
  Avatar,
  Chip,
  Grid,
  InputAdornment,
  FormControlLabel,
  Checkbox,
  Switch,
  Tabs,
  Tab,
  CircularProgress,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import ExploreIcon from "@mui/icons-material/Explore";
import ArchiveIcon from "@mui/icons-material/Archive";
import UnarchiveIcon from "@mui/icons-material/Unarchive";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityIcon from "@mui/icons-material/Visibility";
import PeopleIcon from "@mui/icons-material/People";
import PersonRemoveIcon from "@mui/icons-material/PersonRemove";
import PhotoLibraryIcon from "@mui/icons-material/PhotoLibrary";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import SecurityIcon from "@mui/icons-material/Security";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import SettingsIcon from "@mui/icons-material/Settings";
import ShoppingBagIcon from "@mui/icons-material/ShoppingBag";
import HotelIcon from "@mui/icons-material/Hotel";
import EventIcon from "@mui/icons-material/Event";
import { supabase } from "../supabaseClient";
import { Vacation } from "../vacation";
import { resolveAvatar } from "../utils/avatars";

const CURRENCIES = [
  { code: "EUR", symbol: "€" },
  { code: "USD", symbol: "$" },
  { code: "GBP", symbol: "£" },
  { code: "JPY", symbol: "¥" },
  { code: "CHF", symbol: "Fr." },
  { code: "HUF", symbol: "Ft" },
];

interface AdminPanelProps {
  onViewTrip?: (trip: Vacation) => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onViewTrip }) => {
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
  const [vacations, setVacations] = useState<Vacation[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [images, setImages] = useState<any[]>([]);
  const [allAgendas, setAllAgendas] = useState<any[]>([]);
  const [allHotels, setAllHotels] = useState<any[]>([]);
  const [allExpenses, setAllExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState(0);
  const [rates, setRates] = useState<{ [key: string]: number }>({ EUR: 1 });
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [managingParticipants, setManagingParticipants] =
    useState<Vacation | null>(null);
  const [resettingUser, setResettingUser] = useState<any | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [newTrip, setNewTrip] = useState({
    name: "",
    destination: "",
    start_date: new Date().toISOString().split("T")[0],
    end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    user_id: process.env.REACT_APP_ADMIN_UUID || "",
    is_public: false,
  });

  const handleResetPassword = async () => {
    if (!resettingUser || !newPassword) return;

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const response = await fetch("/api/admin/reset-user-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          user_id: resettingUser.id,
          new_password: newPassword,
        }),
      });

      if (response.ok) {
        alert(`Successfully reset password for ${resettingUser.display_name}`);
        setResettingUser(null);
        setNewPassword("");
      } else {
        const err = await response.json();
        alert("Error resetting password: " + err.error);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const fetchAllData = async () => {
    // Basic auth check
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      setLoading(false);
      return;
    }

    // Fetch the user's role from the profiles table
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    const isAdmin = profile?.role === "admin";
    setCurrentUserProfile(profile);

    if (!isAdmin) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Fetch rates first via proxy to avoid CORS
      fetch("/api/currency")
        .then((res) => res.json())
        .then((data) => {
          if (data.rates) setRates({ EUR: 1, ...data.rates });
        })
        .catch((err) => console.error("Rates fetch error:", err));

      // Fetch common data
      const [
        vacResult,
        profResult,
        imgResult,
        agendaResult,
        hotelResult,
        expenseResult,
      ] = await Promise.all([
        supabase
          .from("vacations")
          .select(
            `
          *,
          profiles!user_id (display_name, avatar_url),
          vacation_participants (
            user_id, 
            allow_gallery, 
            allow_edit, 
            profiles:user_id (display_name, avatar_url)
          )
        `,
          )
          .order("created_at", { ascending: false }),
        supabase.from("profiles").select("*"),
        supabase
          .from("vacation_gallery")
          .select("*, vacations(name)")
          .order("id", { ascending: false }),
        supabase
          .from("agendas")
          .select("*, locations(vacations(name))")
          .order("agenda_date", { ascending: true }),
        supabase
          .from("hotels")
          .select("*, locations(name, vacations(name))")
          .order("id", { ascending: true }),
        supabase
          .from("trip_expenses")
          .select(
            `
            *, 
            vacations(name),
            profiles:profile_id(display_name, avatar_url),
            trip_expense_participants(
              profile_id,
              custom_amount,
              profiles:profile_id(display_name)
            )
          `,
          )
          .order("id", { ascending: false }),
      ]);

      if (vacResult.data) setVacations(vacResult.data);
      if (profResult.data) setProfiles(profResult.data);
      if (imgResult.data) setImages(imgResult.data);
      if (agendaResult.data) setAllAgendas(agendaResult.data);
      if (hotelResult.data) setAllHotels(hotelResult.data);
      if (expenseResult.data) setAllExpenses(expenseResult.data);
    } catch (err) {
      console.error("Error fetching admin data:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const isAdmin = currentUserProfile?.role === "admin";

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isAdmin) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "70vh",
          textAlign: "center",
          px: 3,
        }}
      >
        <Avatar
          sx={{
            width: 80,
            height: 80,
            bgcolor: "rgba(202, 29, 73, 0.1)",
            color: "#ca1d49",
            mb: 3,
          }}
        >
          <SecurityIcon sx={{ fontSize: 40 }} />
        </Avatar>
        <Typography variant="h4" sx={{ fontWeight: 900, mb: 2 }}>
          Access Denied
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.6, maxWidth: 400 }}>
          The Admin Dashboard is restricted to authorized personnel only. Please
          log in with an administrator account to access platform controls.
        </Typography>
      </Box>
    );
  }

  const handleTabChange = (_: any, newValue: number) => {
    setActiveTab(newValue);
  };

  const filteredVacations = vacations.filter((v) => {
    const query = search.toLowerCase();
    return (
      v.name.toLowerCase().includes(query) ||
      v.destination.toLowerCase().includes(query) ||
      v.user_id?.toLowerCase().includes(query) ||
      (v as any).profiles?.display_name?.toLowerCase().includes(query)
    );
  });

  const stats = {
    total: vacations.length,
    active: vacations.filter((v) => !v.archived).length,
    archived: vacations.filter((v) => v.archived).length,
    public: vacations.filter((v) => v.is_public).length,
  };

  const handleDelete = async (id: number) => {
    if (
      window.confirm("Are you sure you want to delete this trip permanently?")
    ) {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const response = await fetch(`/api/admin/vacations/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (response.ok) {
        setVacations(vacations.filter((v) => v.id !== id));
      } else {
        const err = await response.json();
        alert("Error deleting trip: " + err.error);
      }
    }
  };

  const handleToggleArchive = async (vacation: Vacation) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const response = await fetch(`/api/admin/vacations/${vacation.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ archived: !vacation.archived }),
    });

    if (response.ok) {
      setVacations(
        vacations.map((v) =>
          v.id === vacation.id ? { ...v, archived: !v.archived } : v,
        ),
      );
    } else {
      const err = await response.json();
      alert("Error updating trip: " + err.error);
    }
  };
  const handleRemoveParticipant = async (
    vacationId: number,
    userId: string,
  ) => {
    if (window.confirm("Remove this participant from the trip?")) {
      const { error } = await supabase
        .from("vacation_participants")
        .delete()
        .eq("vacation_id", vacationId)
        .eq("user_id", userId);

      if (!error) {
        // Refresh local state
        setVacations((prev) =>
          prev.map((v) => {
            if (v.id === vacationId) {
              return {
                ...v,
                vacation_participants: v.vacation_participants?.filter(
                  (p: any) => p.user_id !== userId,
                ),
              };
            }
            return v;
          }),
        );

        // Update managing modal if open
        if (managingParticipants?.id === vacationId) {
          setManagingParticipants((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              vacation_participants: prev.vacation_participants?.filter(
                (p: any) => p.user_id !== userId,
              ),
            };
          });
        }
      } else {
        alert("Error removing participant: " + error.message);
      }
    }
  };

  const handleUpdateTripField = async (
    vacationId: number,
    field: string,
    value: any,
  ) => {
    try {
      const { error } = await supabase
        .from("vacations")
        .update({ [field]: value })
        .eq("id", vacationId);

      if (!error) {
        setVacations((prev) =>
          prev.map((v) => (v.id === vacationId ? { ...v, [field]: value } : v)),
        );
        if (managingParticipants?.id === vacationId) {
          setManagingParticipants((prev) =>
            prev ? { ...prev, [field]: value } : null,
          );
        }
      } else {
        alert("Error updating trip: " + error.message);
      }
    } catch (err) {
      console.error("Error updating trip:", err);
    }
  };

  const handleUpdatePermission = async (
    vacationId: number,
    userId: string,
    field: "allow_gallery" | "allow_edit",
    value: boolean,
  ) => {
    try {
      const { error } = await supabase
        .from("vacation_participants")
        .update({ [field]: value })
        .eq("vacation_id", vacationId)
        .eq("user_id", userId);

      if (!error) {
        // Refresh local state
        setVacations((prev) =>
          prev.map((v) => {
            if (v.id === vacationId) {
              return {
                ...v,
                vacation_participants: v.vacation_participants?.map((p: any) =>
                  p.user_id === userId ? { ...p, [field]: value } : p,
                ),
              };
            }
            return v;
          }),
        );

        // Update managing modal if open
        if (managingParticipants?.id === vacationId) {
          setManagingParticipants((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              vacation_participants: prev.vacation_participants?.map(
                (p: any) =>
                  p.user_id === userId ? { ...p, [field]: value } : p,
              ),
            };
          });
        }
      } else {
        alert("Error updating permission: " + error.message);
      }
    } catch (err) {
      console.error("Error updating permission:", err);
    }
  };
  const handleCreateTrip = async () => {
    const { error } = await supabase.from("vacations").insert([newTrip]);
    if (!error) {
      setIsAddModalOpen(false);
      fetchAllData();
      setNewTrip({
        name: "",
        destination: "",
        start_date: new Date().toISOString().split("T")[0],
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        user_id: process.env.REACT_APP_ADMIN_UUID || "",
        is_public: false,
      });
    } else {
      alert("Error creating trip: " + error.message);
    }
  };

  const deletePhoto = async (photoId: number) => {
    if (window.confirm("Delete this photo permanently?")) {
      const { error } = await supabase
        .from("vacation_gallery")
        .delete()
        .eq("id", photoId);
      if (!error) {
        setImages(images.filter((img) => img.id !== photoId));
      }
    }
  };

  const deleteExpense = async (expenseId: number) => {
    if (window.confirm("Delete this expense record?")) {
      const { error } = await supabase
        .from("trip_expenses")
        .delete()
        .eq("id", expenseId);
      if (!error) {
        setAllExpenses(allExpenses.filter((exp) => exp.id !== expenseId));
      }
    }
  };

  const convertToEur = (amt: number, curr: string) => {
    const rate = rates[curr] || 1;
    return amt / rate;
  };

  const systemStats = {
    totalImages: images.length,
    totals: Array.from(
      new Set(allExpenses.map((e) => e.currency || "USD")),
    ).map((curr) => ({
      currency: curr,
      total: allExpenses
        .filter((e) => (e.currency || "USD") === curr)
        .reduce((sum, exp) => sum + (exp.amount || 0), 0)
        .toFixed(2),
    })),
    avgTripCostEur:
      vacations.length > 0
        ? (
            allExpenses.reduce(
              (sum, exp) =>
                sum + convertToEur(exp.amount || 0, exp.currency || "USD"),
              0,
            ) / vacations.length
          ).toFixed(2)
        : 0,
    dbStatus: "Healthy",
  };

  const filteredProfiles = profiles.filter(
    (p) =>
      p.display_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.id?.toLowerCase().includes(search.toLowerCase()),
  );

  const filteredImages = images.filter(
    (img) =>
      img.vacations?.name?.toLowerCase().includes(search.toLowerCase()) ||
      img.caption?.toLowerCase().includes(search.toLowerCase()),
  );

  const renderTripsTab = () => (
    <>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          { label: "Total Trips", value: stats.total, color: "primary.main" },
          { label: "Active", value: stats.active, color: "success.main" },
          { label: "Archived", value: stats.archived, color: "warning.main" },
          { label: "Public", value: stats.public, color: "info.main" },
        ].map((stat) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={stat.label}>
            <Paper
              sx={{
                p: 2,
                textAlign: "center",
                borderRadius: 3,
                border: "1px solid rgba(255,255,255,0.05)",
                bgcolor: "rgba(255,255,255,0.02)",
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  opacity: 0.6,
                  fontWeight: 700,
                  textTransform: "uppercase",
                }}
              >
                {stat.label}
              </Typography>
              <Typography
                variant="h4"
                sx={{ fontWeight: 900, color: stat.color }}
              >
                {stat.value}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <TableContainer
        component={Paper}
        sx={{
          borderRadius: 3,
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <Table>
          <TableHead sx={{ bgcolor: "rgba(255,255,255,0.03)" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 800 }}>Trip Details</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Owner</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Dates</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 800 }} align="right">
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredVacations.map((vac) => (
              <TableRow
                key={vac.id}
                hover
                sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
              >
                <TableCell>
                  <Box>
                    <Typography sx={{ fontWeight: 700 }}>{vac.name}</Typography>
                    <Typography variant="caption" sx={{ opacity: 0.5 }}>
                      {vac.destination} • ID: {vac.id}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Avatar
                      src={resolveAvatar(
                        (Array.isArray((vac as any).profiles)
                          ? (vac as any).profiles[0]
                          : (vac as any).profiles
                        )?.avatar_url,
                      )}
                      sx={{
                        width: 32,
                        height: 32,
                        border: "1px solid rgba(255,255,255,0.1)",
                      }}
                    />
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {(Array.isArray((vac as any).profiles)
                          ? (vac as any).profiles[0]
                          : (vac as any).profiles
                        )?.display_name || "Unknown User"}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ opacity: 0.4, fontFamily: "monospace" }}
                      >
                        {vac.user_id?.substring(0, 8)}...
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {new Date(vac.start_date).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.5 }}>
                    to{" "}
                    {new Date(vac.end_date).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: "flex", gap: 1 }}>
                    {vac.archived ? (
                      <Chip
                        label="Archived"
                        size="small"
                        color="warning"
                        variant="outlined"
                        sx={{ fontWeight: 700 }}
                      />
                    ) : (
                      <Chip
                        label="Active"
                        size="small"
                        color="success"
                        variant="outlined"
                        sx={{ fontWeight: 700 }}
                      />
                    )}
                    {vac.is_public && (
                      <Chip
                        label="Public"
                        size="small"
                        color="info"
                        variant="outlined"
                        sx={{ fontWeight: 700 }}
                      />
                    )}
                  </Box>
                </TableCell>
                <TableCell align="right">
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "flex-end",
                      gap: 0.5,
                    }}
                  >
                    {onViewTrip && (
                      <Tooltip title="View Trip">
                        <IconButton
                          onClick={() => onViewTrip(vac)}
                          size="small"
                          color="primary"
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Trip Permissions & Participants">
                      <IconButton
                        onClick={() => setManagingParticipants(vac)}
                        size="small"
                        color="secondary"
                        sx={{
                          bgcolor: "rgba(156, 39, 176, 0.1)",
                          "&:hover": { bgcolor: "rgba(156, 39, 176, 0.2)" },
                        }}
                      >
                        <SecurityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={vac.archived ? "Restore" : "Archive"}>
                      <IconButton
                        onClick={() => handleToggleArchive(vac)}
                        size="small"
                      >
                        {vac.archived ? (
                          <UnarchiveIcon fontSize="small" />
                        ) : (
                          <ArchiveIcon fontSize="small" />
                        )}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Permanently">
                      <IconButton
                        onClick={() => handleDelete(vac.id)}
                        color="error"
                        size="small"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
            {filteredVacations.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                  <Typography sx={{ opacity: 0.5 }}>
                    No matching trips found.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );

  const renderUsersTab = () => (
    <TableContainer
      component={Paper}
      sx={{ borderRadius: 3, border: "1px solid rgba(255,255,255,0.05)" }}
    >
      <Table>
        <TableHead sx={{ bgcolor: "rgba(255,255,255,0.03)" }}>
          <TableRow>
            <TableCell sx={{ fontWeight: 800 }}>User</TableCell>
            <TableCell sx={{ fontWeight: 800 }}>User ID</TableCell>
            <TableCell sx={{ fontWeight: 800 }}>Joined</TableCell>
            <TableCell sx={{ fontWeight: 800 }}>Trips Owned</TableCell>
            <TableCell sx={{ fontWeight: 800 }} align="right">
              Actions
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredProfiles.map((prof) => (
            <TableRow key={prof.id} hover>
              <TableCell>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Avatar src={resolveAvatar(prof.avatar_url)} />
                  <Typography sx={{ fontWeight: 600 }}>
                    {prof.display_name || "New Traveler"}
                  </Typography>
                </Box>
              </TableCell>
              <TableCell sx={{ fontFamily: "monospace", fontSize: "0.8rem" }}>
                {prof.id}
              </TableCell>
              <TableCell>
                {prof.created_at
                  ? new Date(prof.created_at).toLocaleDateString()
                  : "N/A"}
              </TableCell>
              <TableCell>
                {vacations.filter((v) => v.user_id === prof.id).length} Trips
              </TableCell>
              <TableCell align="right">
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<SecurityIcon />}
                  onClick={() => setResettingUser(prof)}
                  sx={{ borderRadius: 2, textTransform: "none" }}
                >
                  Reset Password
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderGalleryTab = () => (
    <Grid container spacing={2}>
      {filteredImages.map((img) => (
        <Grid size={{ xs: 6, sm: 4, md: 3, lg: 2 }} key={img.id}>
          <Paper
            sx={{ position: "relative", overflow: "hidden", borderRadius: 2 }}
          >
            <img
              src={img.thumbnail_url || img.large_url || img.original_url}
              alt={img.caption}
              style={{ width: "100%", aspectRatio: "1/1", objectFit: "cover" }}
            />
            <Box
              sx={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                p: 1,
                bgcolor: "rgba(0,0,0,0.7)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  color: "white",
                  display: "block",
                  textOverflow: "ellipsis",
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                }}
              >
                {img.vacations?.name || "Trip"}
              </Typography>
              <IconButton
                size="small"
                color="error"
                onClick={() => deletePhoto(img.id)}
              >
                <DeleteIcon fontSize="inherit" />
              </IconButton>
            </Box>
          </Paper>
        </Grid>
      ))}
      {filteredImages.length === 0 && (
        <Grid
          size={{ xs: 12 }}
          sx={{ textAlign: "center", py: 8, opacity: 0.5 }}
        >
          <Typography>No photos found in gallery moderation.</Typography>
        </Grid>
      )}
    </Grid>
  );

  const getSymbol = (code: string) =>
    CURRENCIES.find((c) => c.code === (code || "USD"))?.symbol || "$";

  const renderExpensesTab = () => (
    <TableContainer
      component={Paper}
      sx={{ borderRadius: 3, border: "1px solid rgba(255,255,255,0.05)" }}
    >
      <Table>
        <TableHead sx={{ bgcolor: "rgba(255,255,255,0.03)" }}>
          <TableRow>
            <TableCell sx={{ fontWeight: 800 }}>Payer</TableCell>
            <TableCell sx={{ fontWeight: 800 }}>Description</TableCell>
            <TableCell sx={{ fontWeight: 800 }}>Trip</TableCell>
            <TableCell sx={{ fontWeight: 800 }}>Split With</TableCell>
            <TableCell sx={{ fontWeight: 800 }}>Amount</TableCell>
            <TableCell sx={{ fontWeight: 800 }} align="right">
              Actions
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {allExpenses.map((exp) => (
            <TableRow key={exp.id} hover>
              <TableCell>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Avatar
                    src={resolveAvatar(
                      (Array.isArray(exp.profiles)
                        ? exp.profiles[0]
                        : exp.profiles
                      )?.avatar_url,
                    )}
                    sx={{ width: 24, height: 24 }}
                  />
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {(Array.isArray(exp.profiles)
                      ? exp.profiles[0]
                      : exp.profiles
                    )?.display_name || "Unknown"}
                  </Typography>
                </Box>
              </TableCell>
              <TableCell>
                <Box>
                  <Typography variant="body2">{exp.description}</Typography>
                  <Chip
                    label={exp.currency || "USD"}
                    size="small"
                    variant="outlined"
                    sx={{ height: 16, fontSize: "0.6rem", mt: 0.5 }}
                  />
                </Box>
              </TableCell>
              <TableCell>
                <Typography variant="body2" sx={{ opacity: 0.7 }}>
                  {exp.vacations?.name}
                </Typography>
              </TableCell>
              <TableCell>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                  {exp.trip_expense_participants?.map((p: any) => (
                    <Tooltip
                      key={p.profile_id}
                      title={
                        p.custom_amount
                          ? `Custom: ${p.custom_amount} ${exp.currency}`
                          : "Equal Split"
                      }
                    >
                      <Chip
                        label={
                          (Array.isArray(p.profiles)
                            ? p.profiles[0]
                            : p.profiles
                          )?.display_name || "???"
                        }
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: "0.7rem",
                          bgcolor: p.custom_amount
                            ? "rgba(156, 39, 176, 0.1)"
                            : "rgba(255,255,255,0.05)",
                          border: p.custom_amount
                            ? "1px solid rgba(156, 39, 176, 0.2)"
                            : "none",
                        }}
                      />
                    </Tooltip>
                  ))}
                  {(!exp.trip_expense_participants ||
                    exp.trip_expense_participants.length === 0) && (
                    <Typography variant="caption" sx={{ opacity: 0.4 }}>
                      No splits
                    </Typography>
                  )}
                </Box>
              </TableCell>
              <TableCell sx={{ fontWeight: 700 }}>
                {getSymbol(exp.currency)}
                {exp.amount?.toFixed(2)}
              </TableCell>
              <TableCell align="right">
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => deleteExpense(exp.id)}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
          <TableRow sx={{ bgcolor: "rgba(25, 118, 210, 0.05)" }}>
            <TableCell colSpan={4} sx={{ fontWeight: 800 }}>
              PLATFORM TOTALS (PER CURRENCY)
            </TableCell>
            <TableCell
              colSpan={2}
              sx={{ fontWeight: 800, color: "primary.main" }}
            >
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                {Array.from(
                  new Set(allExpenses.map((e) => e.currency || "USD")),
                )
                  .sort()
                  .map((curr) => {
                    const total = allExpenses
                      .filter((e) => (e.currency || "USD") === curr)
                      .reduce((sum, e) => sum + (e.amount || 0), 0);
                    return (
                      <Typography
                        key={curr}
                        variant="caption"
                        sx={{ fontWeight: 900 }}
                      >
                        {getSymbol(curr)}
                        {total.toFixed(2)} ({curr})
                      </Typography>
                    );
                  })}
              </Box>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderLogisticsTab = () => (
    <Grid container spacing={4}>
      <Grid size={{ xs: 12, md: 6 }}>
        <Typography
          variant="h6"
          sx={{
            mb: 2,
            fontWeight: 800,
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <EventIcon color="primary" /> Upcoming Events/Agendas
        </Typography>
        <TableContainer
          component={Paper}
          sx={{ borderRadius: 3, border: "1px solid rgba(255,255,255,0.05)" }}
        >
          <Table size="small">
            <TableHead sx={{ bgcolor: "rgba(255,255,255,0.03)" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Activity</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Trip</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {allAgendas.slice(0, 15).map((ag) => (
                <TableRow key={ag.id} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {ag.description || ag.title}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" sx={{ opacity: 0.7 }}>
                      {(ag as any).locations?.vacations?.name || "N/A"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" sx={{ fontWeight: 500 }}>
                      {ag.agenda_date || ag.start_time
                        ? new Date(
                            ag.agenda_date || ag.start_time,
                          ).toLocaleDateString()
                        : "N/A"}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <Typography
          variant="h6"
          sx={{
            mb: 2,
            fontWeight: 800,
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <HotelIcon sx={{ color: "#FFD700" }} /> Hotel Bookings
        </Typography>
        <TableContainer
          component={Paper}
          sx={{ borderRadius: 3, border: "1px solid rgba(255,255,255,0.05)" }}
        >
          <Table size="small">
            <TableHead sx={{ bgcolor: "rgba(255,255,255,0.03)" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Hotel</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Trip</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Location Info</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {allHotels.slice(0, 15).map((ht) => (
                <TableRow
                  key={ht.id}
                  hover
                  sx={{ bgcolor: "rgba(255, 215, 0, 0.02)" }}
                >
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <HotelIcon
                        sx={{ fontSize: 16, color: "#FFD700", opacity: 0.8 }}
                      />
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {ht.name}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>
                      {(ht as any).locations?.vacations?.name || "N/A"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="caption"
                      sx={{
                        opacity: 0.7,
                        display: "block",
                        maxWidth: 150,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {(ht as any).locations?.name || "N/A"}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Grid>
    </Grid>
  );

  const renderSystemTab = () => (
    <Grid container spacing={3}>
      {[
        {
          label: "Storage Used (Photos)",
          value: `${systemStats.totalImages} Files`,
          icon: <PhotoLibraryIcon />,
        },
        {
          label: "Platform Spend (By Currency)",
          value: systemStats.totals
            .map((t) => `${getSymbol(t.currency)}${t.total}`)
            .join(" / "),
          icon: <AttachMoneyIcon />,
        },
        {
          label: "Avg. Budget per Trip",
          value: `€${systemStats.avgTripCostEur}`,
          icon: <ShoppingBagIcon />,
        },
        {
          label: "Database Connection",
          value: systemStats.dbStatus,
          icon: <SettingsIcon />,
          color: "success.main",
        },
      ].map((stat) => (
        <Grid size={{ xs: 12, sm: 6 }} key={stat.label}>
          <Paper
            sx={{
              p: 3,
              display: "flex",
              alignItems: "center",
              gap: 2,
              borderRadius: 3,
              bgcolor: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <Avatar
              sx={{
                bgcolor: stat.color
                  ? "rgba(76, 175, 80, 0.1)"
                  : "rgba(25, 118, 210, 0.1)",
                color: stat.color || "primary.main",
              }}
            >
              {stat.icon}
            </Avatar>
            <Box>
              <Typography
                variant="caption"
                sx={{ opacity: 0.6, fontWeight: 700 }}
              >
                {stat.label}
              </Typography>
              <Typography
                variant="h5"
                sx={{ fontWeight: 900, color: stat.color }}
              >
                {stat.value}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
          flexDirection: { xs: "column", sm: "row" },
          gap: 2,
        }}
      >
        <Typography
          variant="h4"
          sx={{ fontWeight: 900, fontSize: { xs: "1.75rem", md: "2.125rem" } }}
        >
          Admin Dashboard
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setIsAddModalOpen(true)}
          sx={{
            borderRadius: 2,
            fontWeight: 700,
            width: { xs: "100%", sm: "auto" },
          }}
        >
          Add New Trip
        </Button>
      </Box>

      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        sx={{ mb: 4, borderBottom: 1, borderColor: "divider" }}
        variant="scrollable"
        scrollButtons="auto"
      >
        <Tab label="Trips" icon={<ExploreIcon />} iconPosition="start" />
        <Tab label="Users" icon={<PeopleIcon />} iconPosition="start" />
        <Tab label="Gallery" icon={<PhotoLibraryIcon />} iconPosition="start" />
        <Tab label="Expenses" icon={<AttachMoneyIcon />} iconPosition="start" />
        <Tab
          label="Logistics"
          icon={<LocalShippingIcon />}
          iconPosition="start"
        />
        <Tab label="System" icon={<SettingsIcon />} iconPosition="start" />
      </Tabs>

      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Filter results..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          variant="outlined"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ opacity: 0.5 }} />
              </InputAdornment>
            ),
            sx: { borderRadius: 3, bgcolor: "rgba(255,255,255,0.03)" },
          }}
        />
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box>
          {activeTab === 0 && renderTripsTab()}
          {activeTab === 1 && renderUsersTab()}
          {activeTab === 2 && renderGalleryTab()}
          {activeTab === 3 && renderExpensesTab()}
          {activeTab === 4 && renderLogisticsTab()}
          {activeTab === 5 && renderSystemTab()}
        </Box>
      )}

      <Dialog
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 800 }}>
          Create New Trip (Admin)
        </DialogTitle>
        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}
        >
          <TextField
            label="Trip Name"
            fullWidth
            value={newTrip.name}
            onChange={(e) => setNewTrip({ ...newTrip, name: e.target.value })}
          />
          <TextField
            label="Destination"
            fullWidth
            value={newTrip.destination}
            onChange={(e) =>
              setNewTrip({ ...newTrip, destination: e.target.value })
            }
          />
          <Box sx={{ display: "flex", gap: 2 }}>
            <TextField
              label="Start Date"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={newTrip.start_date}
              onChange={(e) =>
                setNewTrip({ ...newTrip, start_date: e.target.value })
              }
            />
            <TextField
              label="End Date"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={newTrip.end_date}
              onChange={(e) =>
                setNewTrip({ ...newTrip, end_date: e.target.value })
              }
            />
          </Box>
          <TextField
            label="Owner User ID"
            fullWidth
            helperText="UUID of the user who should own this trip"
            value={newTrip.user_id}
            onChange={(e) =>
              setNewTrip({ ...newTrip, user_id: e.target.value })
            }
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={newTrip.is_public}
                onChange={(e) =>
                  setNewTrip({ ...newTrip, is_public: e.target.checked })
                }
              />
            }
            label="Make Trip Public"
          />
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreateTrip}
            disabled={!newTrip.name || !newTrip.destination}
          >
            Create Trip
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={!!managingParticipants}
        onClose={() => setManagingParticipants(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 800 }}>
          Trip Permissions & Participants
          <Typography variant="body2" sx={{ opacity: 0.6 }}>
            {managingParticipants?.name}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            <Box
              sx={{
                p: 2,
                mb: 1,
                borderRadius: 3,
                bgcolor: (theme) =>
                  theme.palette.mode === "dark"
                    ? "rgba(33, 150, 243, 0.1)"
                    : "rgba(33, 150, 243, 0.05)",
                border: "1px solid rgba(33, 150, 243, 0.2)",
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
                Global Trip Privacy
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography variant="body2">Publicly Visible</Typography>
                <Switch
                  size="small"
                  checked={!!managingParticipants?.is_public}
                  onChange={(e) =>
                    managingParticipants &&
                    handleUpdateTripField(
                      managingParticipants.id,
                      "is_public",
                      e.target.checked,
                    )
                  }
                />
              </Box>
            </Box>

            <Typography variant="subtitle2" sx={{ fontWeight: 800, px: 1 }}>
              Trip Owner
            </Typography>

            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                p: 2,
                borderRadius: 3,
                bgcolor: "rgba(255, 193, 7, 0.1)",
                border: "1px solid rgba(255, 193, 7, 0.2)",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Avatar
                    src={resolveAvatar(
                      (Array.isArray((managingParticipants as any)?.profiles)
                        ? (managingParticipants as any)?.profiles[0]
                        : (managingParticipants as any)?.profiles
                      )?.avatar_url,
                    )}
                    sx={{ width: 32, height: 32 }}
                  />
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {(Array.isArray((managingParticipants as any)?.profiles)
                        ? (managingParticipants as any)?.profiles[0]
                        : (managingParticipants as any)?.profiles
                      )?.display_name || "Unknown Owner"}
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.6 }}>
                      Primary Administrator
                    </Typography>
                  </Box>
                </Box>
                <Chip
                  label="OWNER"
                  size="small"
                  color="warning"
                  sx={{ fontWeight: 800, height: 20, fontSize: "0.6rem" }}
                />
              </Box>
            </Box>

            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 800, px: 1, mt: 1 }}
            >
              Participant Permissions
            </Typography>

            {managingParticipants?.vacation_participants &&
            managingParticipants.vacation_participants.length > 0 ? (
              managingParticipants.vacation_participants.map((p: any) => (
                <Box
                  key={p.user_id}
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    p: 2,
                    borderRadius: 3,
                    bgcolor: (theme) =>
                      theme.palette.mode === "dark"
                        ? "rgba(255,255,255,0.03)"
                        : "rgba(0,0,0,0.02)",
                    border: (theme) =>
                      theme.palette.mode === "dark"
                        ? "1px solid rgba(255,255,255,0.05)"
                        : "1px solid rgba(0,0,0,0.05)",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      mb: 2,
                    }}
                  >
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
                    >
                      <Avatar
                        src={resolveAvatar(p.profiles?.avatar_url)}
                        sx={{ width: 32, height: 32 }}
                      />
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {p.profiles?.display_name || "Unknown User"}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ opacity: 0.5, fontFamily: "monospace" }}
                        >
                          {p.user_id.substring(0, 8)}...
                        </Typography>
                      </Box>
                    </Box>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() =>
                        managingParticipants &&
                        handleRemoveParticipant(
                          managingParticipants.id,
                          p.user_id,
                        )
                      }
                      sx={{
                        bgcolor: "rgba(244, 67, 54, 0.1)",
                        "&:hover": { bgcolor: "rgba(244, 67, 54, 0.2)" },
                      }}
                    >
                      <PersonRemoveIcon fontSize="small" />
                    </IconButton>
                  </Box>

                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Typography variant="caption" fontWeight={600}>
                        Docs and Gallery Access
                      </Typography>
                      <Switch
                        size="small"
                        checked={p.allow_gallery}
                        onChange={(e) =>
                          managingParticipants &&
                          handleUpdatePermission(
                            managingParticipants.id,
                            p.user_id,
                            "allow_gallery",
                            e.target.checked,
                          )
                        }
                      />
                    </Box>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Typography variant="caption" fontWeight={600}>
                        Editing Permission
                      </Typography>
                      <Switch
                        size="small"
                        checked={p.allow_edit}
                        onChange={(e) =>
                          managingParticipants &&
                          handleUpdatePermission(
                            managingParticipants.id,
                            p.user_id,
                            "allow_edit",
                            e.target.checked,
                          )
                        }
                      />
                    </Box>
                  </Box>
                </Box>
              ))
            ) : (
              <Box sx={{ py: 4, textAlign: "center" }}>
                <Typography sx={{ opacity: 0.5 }}>
                  No participants found.
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setManagingParticipants(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Password Reset Dialog */}
      <Dialog
        open={resettingUser !== null}
        onClose={() => setResettingUser(null)}
      >
        <DialogTitle>Reset Password</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Set a new password for{" "}
            <strong>{resettingUser?.display_name}</strong>. The user will be
            able to log in with this password immediately.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="New Password"
            type="password"
            fullWidth
            variant="outlined"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResettingUser(null)}>Cancel</Button>
          <Button
            onClick={handleResetPassword}
            variant="contained"
            color="primary"
            disabled={!newPassword || newPassword.length < 6}
          >
            Reset Password
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminPanel;
