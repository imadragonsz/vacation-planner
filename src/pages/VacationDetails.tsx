import React, { useState, useEffect, useMemo } from "react";
import { useLocations, VacationLocation } from "../hooks/useLocations";
import { addToGeocodeQueue } from "../utils/geocoder";
import { useAgendas } from "../hooks/useAgendas";
import { useParticipants } from "../hooks/useParticipants";
import { useItemParticipants } from "../hooks/useItemParticipants";
import { supabase } from "../supabaseClient";
import { Vacation } from "../vacation";
import ConfirmDialog from "../ConfirmDialog";
import {
  Box,
  Paper,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  Avatar,
  Switch,
  Typography,
  Button,
  Chip,
  Stack,
  Skeleton,
  Grid,
  Breadcrumbs,
  Link,
  Tooltip,
  IconButton,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import ArchiveIcon from "@mui/icons-material/Archive";
import UnarchiveIcon from "@mui/icons-material/Unarchive";
import ShareIcon from "@mui/icons-material/Share";
import LockIcon from "@mui/icons-material/Lock";
import EventNoteIcon from "@mui/icons-material/EventNote";
import TravelExploreIcon from "@mui/icons-material/TravelExplore";
import ShoppingBagIcon from "@mui/icons-material/ShoppingBag";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import ExploreIcon from "@mui/icons-material/Explore";
import CollectionsIcon from "@mui/icons-material/Collections";
import DescriptionIcon from "@mui/icons-material/Description";
import GroupIcon from "@mui/icons-material/Group";
import { DragEndEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import PackingList from "../components/PackingList";
import TripExpenses from "../components/TripExpenses";

import { handleArchiveVacation, handleArchiveRestore } from "../utils/handlers";
import { generateICal } from "../utils/ical";

import { MapTab } from "../components/Vacation/MapTab";
import { DestinationsTab } from "../components/Vacation/DestinationsTab";
import { ItineraryTab } from "../components/Vacation/ItineraryTab";
import { VacationEditor } from "../components/Vacation/VacationEditor";
import { GalleryTab } from "../components/Vacation/GalleryTab";
import DocumentsTab from "../components/Vacation/DocumentsTab";
import { resolveAvatar } from "../utils/avatars";

// Global cache for geocoding results to persist across trip navigation
const sessionGeocodeCache: { [key: string]: { lat: number; lng: number } } = {};

export function VacationDetails({
  vacation,
  user,
  onRefresh,
  onBack,
}: {
  vacation: Vacation;
  user: any;
  onRefresh?: () => void;
  onBack?: () => void;
}) {
  const [activeTab, setActiveTab] = useState(() => {
    const saved = localStorage.getItem(`vacationTab_${vacation.id}`);
    return saved ? parseInt(saved) : 1; // Default to Destinations
  });

  const isOwner = user && vacation.user_id === user.id;
  const {
    participants,
    joinVacation,
    leaveVacation,
    updateGalleryAccess,
    updateEditAccess,
    loading: participantsLoading,
  } = useParticipants(vacation.id);

  const [showPermissions, setShowPermissions] = useState(false);

  const hasGalleryAccess = useMemo(() => {
    if (isOwner) return true;
    const participant = participants.find((p) => p.user_id === user?.id);
    return participant?.allow_gallery ?? false;
  }, [isOwner, participants, user]);

  useEffect(() => {
    if ((activeTab === 6 || activeTab === 5) && !hasGalleryAccess) {
      setActiveTab(1); // Fallback to Destinations if access lost
    }
    localStorage.setItem(`vacationTab_${vacation.id}`, activeTab.toString());
  }, [activeTab, hasGalleryAccess, vacation.id]);

  const {
    participants: locationParticipants,
    joinItem: internalJoinLoc,
    leaveItem: internalLeaveLoc,
    fetchParticipants: fetchLocationParticipants,
    loading: locationPartsLoading,
  } = useItemParticipants("location");
  const {
    participants: agendaParticipants,
    joinItem: internalJoinAgenda,
    leaveItem: internalLeaveAgenda,
    fetchParticipants: fetchAgendaParticipants,
    loading: agendaPartsLoading,
  } = useItemParticipants("agenda");
  const {
    participants: agendaVotes,
    joinItem: internalJoinVote,
    leaveItem: internalLeaveVote,
  } = useItemParticipants("vote");

  const joinLocation = internalJoinLoc;

  const leaveLocation = async (locId: number, userId: string) => {
    const success = await internalLeaveLoc(locId, userId);
    if (success) {
      // Cleanup: leave all activities in this location
      const { data: locAgendas } = await supabase
        .from("agendas")
        .select("id")
        .eq("location_id", locId);

      if (locAgendas && locAgendas.length > 0) {
        const ids = locAgendas.map((a) => a.id);
        await supabase
          .from("agenda_participants")
          .delete()
          .in("agenda_id", ids)
          .eq("profile_id", userId);
        fetchAgendaParticipants(ids);
      }
    }
    return success;
  };

  const joinAgenda = async (agendaId: number, userId: string) => {
    const { data: agenda } = await supabase
      .from("agendas")
      .select("location_id")
      .eq("id", agendaId)
      .single();

    if (agenda) {
      const locId = agenda.location_id;
      const isLocJoined = locationParticipants[locId]?.some(
        (p) => p.user_id === userId,
      );
      if (!isLocJoined) {
        alert("Join this destination first to participate in its activities!");
        return false;
      }
    }
    return internalJoinAgenda(agendaId, userId);
  };

  const leaveAgenda = internalLeaveAgenda;

  const joinVote = internalJoinVote;
  const leaveVote = internalLeaveVote;

  const {
    locations,
    addLocation,
    updateLocation,
    removeLocation,
    loading: locationsLoading,
  } = useLocations(vacation.id);

  const detailsLoading =
    participantsLoading ||
    locationsLoading ||
    locationPartsLoading ||
    agendaPartsLoading;

  const isParticipant = useMemo(
    () => user && participants.some((p) => p.user_id === user.id),
    [user, participants],
  );

  const canEdit = useMemo(() => {
    if (isOwner) return true;
    const participant = participants.find((p) => p.user_id === user?.id);
    return participant?.allow_edit ?? false;
  }, [isOwner, participants, user]);

  const handleArchive = async () => {
    await handleArchiveVacation(
      vacation,
      () => {},
      onRefresh || (() => {}),
      () => {},
    );
  };

  const handleRestore = async () => {
    await handleArchiveRestore(vacation, onRefresh || (() => {}), () => {});
  };

  const handleExportICal = async () => {
    try {
      const { data: allAgendas, error } = await supabase
        .from("agendas")
        .select(
          `
          description,
          agenda_date,
          Time,
          address,
          locations!inner(vacation_id)
        `,
        )
        .eq("locations.vacation_id", vacation.id);

      if (error) throw error;

      if (allAgendas && allAgendas.length > 0) {
        const events = allAgendas.map((a: any) => ({
          title: a.description,
          start: `${a.agenda_date}T${a.Time || "00:00:00"}`,
          location: a.address,
        }));
        generateICal(events);
      } else {
        alert("No itinerary items found to export!");
      }
    } catch (err) {
      console.error("Export failed:", err);
      alert("Failed to export iCal.");
    }
  };

  const handleDeletePermanently = async () => {
    if (
      window.confirm(
        "Are you sure you want to permanently delete this vacation? This action cannot be undone.",
      )
    ) {
      const vacationId = vacation.id;

      // Manually delete child records to handle FK constraints
      const tablesToClean = [
        "agendas",
        "locations",
        "activity_suggestions",
        "housing",
        "participants",
        "expenses",
        "documents",
        "gallery",
      ];

      for (const table of tablesToClean) {
        try {
          await supabase.from(table).delete().eq("vacation_id", vacationId);
        } catch (e) {
          console.warn(`Could not clean ${table} table:`, e);
        }
      }

      const { error } = await supabase
        .from("vacations")
        .delete()
        .eq("id", vacationId);

      if (error) {
        console.error("Error deleting vacation:", error);
        window.dispatchEvent(
          new CustomEvent("show-toast", {
            detail: {
              message: "Failed to delete vacation.",
              type: "error",
            },
          }),
        );
      } else {
        window.dispatchEvent(
          new CustomEvent("show-toast", {
            detail: {
              message: "Vacation deleted permanently.",
              type: "success",
            },
          }),
        );
        if (onRefresh) onRefresh();
      }
    }
  };

  // Geocode locations for map pins with rate limiting and local caching
  const [geoLocations, setGeoLocations] = useState<any[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function geocodeAll() {
      // Step 1: Immediate synchronous check of the session cache
      const initialResults = locations.map((loc) => {
        const query = loc.address || loc.name;
        if (loc.lat && loc.lng) return { ...loc };
        if (query && sessionGeocodeCache[query]) {
          return { ...loc, ...sessionGeocodeCache[query] };
        }
        return { ...loc };
      });

      if (!cancelled) {
        setGeoLocations(initialResults);
      }

      const currentResults = [...initialResults];

      // Step 2: Async geocoding for anything still missing coordinates
      for (let i = 0; i < locations.length; i++) {
        if (cancelled) break;
        const loc = locations[i];

        if (currentResults[i].lat && currentResults[i].lng) continue;

        let query = loc.address || loc.name;

        if (
          loc.address &&
          (loc.address.startsWith("http") ||
            loc.address.includes("google.com/maps") ||
            loc.address.includes("maps.app.goo.gl"))
        ) {
          const coordMatch = loc.address.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
          if (coordMatch) {
            const coords = {
              lat: parseFloat(coordMatch[1]),
              lng: parseFloat(coordMatch[2]),
            };
            currentResults[i] = { ...loc, ...coords };
            sessionGeocodeCache[loc.address] = coords;
            if (!cancelled) setGeoLocations([...currentResults]);
            continue;
          }

          if (loc.name && !loc.name.startsWith("http")) {
            query = loc.name;
          }
        }

        // Clean query if it's falling back to name
        if (!loc.address && query) {
          // Remove common trip suffixes like "Leg 1", "Stay", "Arrival", etc.
          query = query
            .replace(/\s+(-|leg|stay|arrival|departure|final|part)\s*.*/gi, "")
            .trim();
        }

        if (!query) continue;

        const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(
          query,
        )}`;

        try {
          const data = await addToGeocodeQueue(url);
          if (!cancelled && data && data.length > 0) {
            const coords = {
              lat: parseFloat(data[0].lat),
              lng: parseFloat(data[0].lon),
            };
            sessionGeocodeCache[query] = coords;
            currentResults[i] = { ...loc, ...coords };
            if (!cancelled) setGeoLocations([...currentResults]);
          }
        } catch (error) {
          console.error("Error fetching geocode data:", error, query);
        }
      }
    }
    geocodeAll();
    return () => {
      cancelled = true;
    };
  }, [locations]);

  const [newLocName, setNewLocName] = useState("");
  const [newLocAddr, setNewLocAddr] = useState("");
  const [newLocStart, setNewLocStart] = useState("");
  const [newLocEnd, setNewLocEnd] = useState("");
  const [selectedLocation, setSelectedLocation] =
    useState<VacationLocation | null>(null);
  const [hasInitialSelect, setHasInitialSelect] = useState(false);

  useEffect(() => {
    if (!hasInitialSelect && locations.length > 0) {
      setSelectedLocation(locations[0]);
      setHasInitialSelect(true);
    }
  }, [locations, hasInitialSelect]);

  // Handle outside changes to selectedLocation (e.g. from DestinationsTab)
  useEffect(() => {
    if (
      selectedLocation &&
      !locations.find((l) => l.id === selectedLocation.id)
    ) {
      setSelectedLocation(null);
    }
  }, [locations, selectedLocation]);

  const [confirmDeleteLocId, setConfirmDeleteLocId] = useState<number | null>(
    null,
  );
  const [editingLocId, setEditingLocId] = useState<number | null>(null);
  const [editLocName, setEditLocName] = useState("");
  const [editLocAddr, setEditLocAddr] = useState("");
  const [editLocStart, setEditLocStart] = useState("");
  const [editLocEnd, setEditLocEnd] = useState("");

  // Agenda state
  const [editingAgendaId, setEditingAgendaId] = useState<number | null>(null);
  const [editAgendaDate, setEditAgendaDate] = useState("");
  const [editAgendaTime, setEditAgendaTime] = useState("");
  const [editAgendaDesc, setEditAgendaDesc] = useState("");
  const [editAgendaType, setEditAgendaType] = useState<string>("activity");
  const [agendaAddr, setAgendaAddr] = useState("");
  const [agendaPrice, setAgendaPrice] = useState("");
  const [confirmDeleteAgendaId, setConfirmDeleteAgendaId] = useState<
    number | null
  >(null);

  // Agendas for selected location
  const locationId = selectedLocation?.id ?? 0;
  const { agendas, addAgenda, updateAgenda, updateAgendasOrder } =
    useAgendas(locationId);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = agendas.findIndex((a) => a.id === active.id);
      const newIndex = agendas.findIndex((a) => a.id === over.id);
      const newOrder = arrayMove(agendas, oldIndex, newIndex);
      await updateAgendasOrder(newOrder);
    }
  };

  const selectedGeoLocation = geoLocations.find(
    (g) => g.id === selectedLocation?.id,
  );

  useEffect(() => {
    if (locations.length > 0)
      fetchLocationParticipants(locations.map((l) => l.id));
  }, [locations, fetchLocationParticipants]);

  useEffect(() => {
    if (agendas.length > 0) fetchAgendaParticipants(agendas.map((a) => a.id));
  }, [agendas, fetchAgendaParticipants]);

  async function handleAddLocation(e: React.FormEvent) {
    e.preventDefault();
    if (newLocName.trim()) {
      await addLocation(newLocName, newLocAddr, newLocStart, newLocEnd);
      setNewLocName("");
      setNewLocAddr("");
      setNewLocStart("");
      setNewLocEnd("");
    }
  }

  async function handleUpdateLocation(e: React.FormEvent) {
    e.preventDefault();
    if (editingLocId && editLocName.trim()) {
      await updateLocation(
        editingLocId,
        editLocName,
        editLocAddr,
        editLocStart,
        editLocEnd,
      );
      setEditingLocId(null);
      setEditLocName("");
      setEditLocAddr("");
      setEditLocStart("");
      setEditLocEnd("");
    }
  }

  async function handleAddAgenda(e: React.FormEvent) {
    e.preventDefault();
    if (editAgendaDate && editAgendaDesc) {
      const priceNum = agendaPrice ? parseFloat(agendaPrice) : undefined;
      if (editingAgendaId) {
        await updateAgenda(
          editingAgendaId,
          editAgendaDate,
          editAgendaDesc,
          agendaAddr,
          editAgendaTime,
          editAgendaType,
          priceNum,
        );
      } else {
        await addAgenda(
          editAgendaDate,
          editAgendaDesc,
          agendaAddr,
          editAgendaTime,
          editAgendaType,
          priceNum,
        );
      }
      setEditAgendaDate("");
      setEditAgendaTime("");
      setEditAgendaDesc("");
      setEditAgendaType("activity");
      setAgendaAddr("");
      setAgendaPrice("");
      setEditingAgendaId(null);
    }
  }

  async function handleDeleteAgenda(id: number) {
    try {
      // Manual cleanup of linked tables
      await Promise.all([
        supabase.from("agenda_participants").delete().eq("agenda_id", id),
        supabase.from("agenda_votes").delete().eq("agenda_id", id),
      ]);

      const { error } = await supabase.from("agendas").delete().eq("id", id);
      if (error) throw error;

      window.dispatchEvent(
        new CustomEvent("show-toast", {
          detail: {
            message: "Item removed from itinerary.",
            type: "success",
          },
        }),
      );
    } catch (error) {
      console.error("Error deleting agenda item:", error);
      window.dispatchEvent(
        new CustomEvent("show-toast", {
          detail: {
            message: "Failed to remove item.",
            type: "error",
          },
        }),
      );
    }
    setConfirmDeleteAgendaId(null);
  }

  const handleCancelAgendaEdit = () => {
    setEditAgendaDate("");
    setEditAgendaTime("");
    setEditAgendaDesc("");
    setEditAgendaType("activity");
    setAgendaAddr("");
    setAgendaPrice("");
    setEditingAgendaId(null);
  };

  return (
    <Box sx={{ py: { xs: 1, md: 3 }, px: { xs: 1, sm: 3, md: 4 } }}>
      <Box
        sx={{
          mb: 4,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 2,
          position: "relative",
        }}
      >
        <Box sx={{ width: "100%" }}>
          <Breadcrumbs
            sx={{
              mb: 1,
              "& .MuiBreadcrumbs-separator": { color: "text.secondary" },
            }}
          >
            <Link
              underline="hover"
              color="inherit"
              onClick={onBack}
              sx={{
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "0.85rem",
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                opacity: 0.6,
                "&:hover": { opacity: 1 },
              }}
            >
              <ArrowBackIcon sx={{ fontSize: 16 }} />
              DASHBOARD
            </Link>
            <Typography
              variant="caption"
              sx={{
                color: "primary.main",
                fontWeight: 900,
                fontSize: "0.85rem",
              }}
            >
              {vacation.name.toUpperCase()}
            </Typography>
          </Breadcrumbs>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 950,
              fontSize: { xs: "1.85rem", sm: "2.25rem", md: "2.75rem" },
              letterSpacing: "-0.04em",
              lineHeight: 1.1,
              mb: 0.5,
              wordBreak: "break-word",
            }}
          >
            {vacation.name}
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: "text.secondary",
              display: "flex",
              alignItems: "center",
              gap: 1,
              fontSize: { xs: "0.9rem", sm: "1rem" },
            }}
          >
            <ExploreIcon sx={{ fontSize: 18, color: "primary.main" }} />
            {vacation.destination}
            {vacation.archived && (
              <Chip
                label="ARCHIVED"
                size="small"
                sx={{
                  height: 20,
                  fontSize: "0.6rem",
                  fontWeight: 900,
                  bgcolor: "rgba(255,255,255,0.1)",
                }}
              />
            )}
          </Typography>
        </Box>

        <Stack
          direction="row"
          spacing={1}
          sx={{
            alignSelf: "stretch",
            overflowX: "auto",
            pb: 0.5,
            "&::-webkit-scrollbar": { display: "none" },
            msOverflowStyle: "none",
            scrollbarWidth: "none",
          }}
        >
          <Tooltip title="Export Itinerary">
            <Button
              variant="outlined"
              size="small"
              onClick={handleExportICal}
              startIcon={<FileDownloadIcon />}
              sx={{
                borderRadius: 2,
                fontWeight: 700,
                borderColor: "rgba(255,255,255,0.1)",
                whiteSpace: "nowrap",
                minWidth: "fit-content",
              }}
            >
              Export
            </Button>
          </Tooltip>

          {isOwner && (
            <Tooltip title="Manage Access">
              <IconButton
                onClick={() => setShowPermissions(true)}
                sx={{
                  bgcolor: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 2,
                  minWidth: 40,
                }}
              >
                <LockIcon sx={{ fontSize: 20 }} />
              </IconButton>
            </Tooltip>
          )}

          {isOwner && (
            <Tooltip
              title={vacation.archived ? "Restore Trip" : "Archive Trip"}
            >
              <IconButton
                onClick={vacation.archived ? handleRestore : handleArchive}
                sx={{
                  bgcolor: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 2,
                  minWidth: 40,
                }}
              >
                {vacation.archived ? (
                  <UnarchiveIcon sx={{ fontSize: 20 }} />
                ) : (
                  <ArchiveIcon sx={{ fontSize: 20 }} />
                )}
              </IconButton>
            </Tooltip>
          )}

          <Tooltip title="Copy Link">
            <Button
              variant="contained"
              size="small"
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
              }}
              startIcon={<ShareIcon />}
              sx={{
                borderRadius: 2,
                fontWeight: 900,
                bgcolor: "#ca1d49",
                px: 3,
                whiteSpace: "nowrap",
                minWidth: "fit-content",
                "&:hover": { bgcolor: "#e02154" },
              }}
            >
              Share
            </Button>
          </Tooltip>
        </Stack>
      </Box>

      <Box sx={{ mb: { xs: 3, md: 4 } }}>
        <VacationEditor
          vacation={vacation}
          onVacationUpdated={onRefresh || (() => {})}
          user={user}
          canEdit={canEdit}
          joinVacation={joinVacation}
          leaveVacation={leaveVacation}
          updateGalleryAccess={updateGalleryAccess}
          participants={participants}
          onArchive={handleArchive}
          onRestore={handleRestore}
          onDeletePermanently={handleDeletePermanently}
          onExportICal={handleExportICal}
          onManagePermissions={() => setShowPermissions(true)}
          minimalistMode // Suggesting a minimalist mode for the editor to avoid redundancy
        />

        <Paper
          elevation={0}
          sx={{
            p: 0.5,
            display: "inline-flex",
            borderRadius: 3,
            bgcolor: (theme) =>
              theme.palette.mode === "dark" ? "#0f0f11" : "#f5f5f7",
            border: (theme) =>
              `1px solid ${
                theme.palette.mode === "dark"
                  ? "rgba(255,255,255,0.05)"
                  : "rgba(0,0,0,0.05)"
              }`,
            mt: { xs: 2.5, sm: 3 },
            width: "100%",
            maxWidth: { xs: "none", sm: "fit-content" },
            overflowX: "auto",
            "&::-webkit-scrollbar": { display: "none" },
            msOverflowStyle: "none",
            scrollbarWidth: "none",
          }}
        >
          <Tabs
            value={activeTab}
            onChange={(_: React.SyntheticEvent, val: number) =>
              setActiveTab(val)
            }
            variant="scrollable"
            scrollButtons={false}
            allowScrollButtonsMobile
            sx={{
              minHeight: "auto",
              "& .MuiTabs-indicator": {
                height: "100%",
                borderRadius: 2.5,
                zIndex: 0,
                bgcolor: (theme) =>
                  theme.palette.mode === "dark"
                    ? "rgba(139, 92, 246, 0.15)"
                    : "rgba(139, 92, 246, 0.08)",
                border: "1px solid rgba(139, 92, 246, 0.3)",
              },
              "& .MuiTab-root": {
                fontWeight: 900,
                fontSize: "0.75rem",
                letterSpacing: "0.05em",
                py: 1,
                px: 2,
                borderRadius: 2.5,
                color: "text.secondary",
                textTransform: "uppercase",
                minHeight: "auto",
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                minWidth: "auto",
                flex: { xs: 1, sm: "none" },
                zIndex: 1,
                "&.Mui-selected": {
                  color: "#8B5CF6",
                },
                "& .MuiTab-iconWrapper": {
                  fontSize: "1.1rem",
                  marginBottom: "0 !important",
                  marginRight: 1,
                },
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
              },
            }}
          >
            <Tab icon={<ExploreIcon />} label="Map" id="tab-0" />
            <Tab icon={<TravelExploreIcon />} label="Stops" id="tab-1" />
            <Tab icon={<EventNoteIcon />} label="Agenda" id="tab-2" />
            <Tab icon={<ShoppingBagIcon />} label="Packing" id="tab-3" />
            <Tab icon={<AccountBalanceWalletIcon />} label="Split" id="tab-4" />
            {hasGalleryAccess && (
              <Tab icon={<DescriptionIcon />} label="Docs" id="tab-5" />
            )}
            {hasGalleryAccess && (
              <Tab icon={<CollectionsIcon />} label="Gallery" id="tab-6" />
            )}
          </Tabs>
        </Paper>
      </Box>

      <Box sx={{ width: "100%", pb: 10 }}>
        {detailsLoading && !selectedLocation ? (
          <Box sx={{ mt: 4 }}>
            <Grid container spacing={4}>
              <Grid size={{ xs: 12, md: 8 }}>
                <Skeleton
                  variant="rectangular"
                  height={400}
                  sx={{ borderRadius: 6, mb: 4 }}
                />
                <Skeleton
                  variant="rectangular"
                  height={200}
                  sx={{ borderRadius: 6 }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Skeleton
                  variant="rectangular"
                  height={600}
                  sx={{ borderRadius: 6 }}
                />
              </Grid>
            </Grid>
          </Box>
        ) : (
          <>
            {activeTab === 0 && (
              <MapTab
                locations={locations}
                geoLocations={geoLocations}
                selectedLocation={selectedLocation}
                setSelectedLocation={setSelectedLocation}
                agendas={agendas}
              />
            )}

            {activeTab === 1 && (
              <DestinationsTab
                locations={locations}
                canEdit={canEdit}
                isParticipant={isParticipant}
                tripStart={vacation.start_date}
                tripEnd={vacation.end_date}
                user={user}
                locationParticipants={locationParticipants}
                editingLocId={editingLocId}
                setEditingLocId={setEditingLocId}
                editLocName={editLocName}
                setEditLocName={setEditLocName}
                editLocAddr={editLocAddr}
                setEditLocAddr={setEditLocAddr}
                editLocStart={editLocStart}
                setEditLocStart={setEditLocStart}
                editLocEnd={editLocEnd}
                setEditLocEnd={setEditLocEnd}
                handleUpdateLocation={handleUpdateLocation}
                setConfirmDeleteLocId={setConfirmDeleteLocId}
                setSelectedLocation={setSelectedLocation}
                setActiveTab={setActiveTab}
                leaveLocation={leaveLocation}
                joinLocation={joinLocation}
                newLocName={newLocName}
                setNewLocName={setNewLocName}
                newLocAddr={newLocAddr}
                setNewLocAddr={setNewLocAddr}
                newLocStart={newLocStart}
                setNewLocStart={setNewLocStart}
                newLocEnd={newLocEnd}
                setNewLocEnd={setNewLocEnd}
                handleAddLocation={handleAddLocation}
              />
            )}

            {activeTab === 2 && (
              <ItineraryTab
                locations={locations}
                agendas={agendas}
                canEdit={canEdit}
                isParticipant={isParticipant}
                tripStart={vacation.start_date}
                tripEnd={vacation.end_date}
                selectedLocation={selectedLocation}
                setSelectedLocation={setSelectedLocation}
                selectedGeoLocation={selectedGeoLocation}
                newItemTitle={editAgendaDesc}
                setNewItemTitle={setEditAgendaDesc}
                newItemDate={editAgendaDate}
                setNewItemDate={setEditAgendaDate}
                newItemStartTime={editAgendaTime}
                setNewItemStartTime={setEditAgendaTime}
                newItemEndTime={""}
                setNewItemEndTime={() => {}}
                newItemAddr={agendaAddr}
                setNewItemAddr={setAgendaAddr}
                newItemType={editAgendaType}
                setNewItemType={setEditAgendaType}
                newItemPrice={agendaPrice}
                setNewItemPrice={setAgendaPrice}
                isEditing={!!editingAgendaId}
                onCancelEdit={handleCancelAgendaEdit}
                handleAddItem={handleAddAgenda}
                handleDragEnd={handleDragEnd}
                handleDeleteItem={handleDeleteAgenda}
                user={user}
                agendaParticipants={agendaParticipants}
                onEditAgenda={(item) => {
                  setEditingAgendaId(item.id);
                  setEditAgendaDate(item.agenda_date);
                  setEditAgendaTime(item.Time || "");
                  setEditAgendaDesc(item.description);
                  setEditAgendaType(item.type || "activity");
                  setAgendaAddr(item.address || "");
                  setAgendaPrice(item.price ? item.price.toString() : "");
                }}
                joinAgenda={joinAgenda}
                leaveAgenda={leaveAgenda}
                agendaVotes={agendaVotes}
                joinVote={joinVote}
                leaveVote={leaveVote}
                confirmDeleteAgendaId={confirmDeleteAgendaId}
                setConfirmDeleteAgendaId={setConfirmDeleteAgendaId}
              />
            )}

            <Box sx={{ display: activeTab !== 3 ? "none" : "block" }}>
              <PackingList
                vacationId={vacation.id}
                user={user}
                canEdit={canEdit}
              />
            </Box>

            <Box sx={{ display: activeTab !== 4 ? "none" : "block" }}>
              <TripExpenses
                vacationId={vacation.id}
                user={user}
                participants={participants}
                locationId={selectedLocation?.id}
                canEdit={canEdit}
              />
            </Box>

            <Box
              sx={{
                display:
                  activeTab !== 5 || !hasGalleryAccess ? "none" : "block",
              }}
            >
              <DocumentsTab
                vacationId={vacation.id}
                user={user}
                canEdit={canEdit}
              />
            </Box>

            <Box
              sx={{
                display:
                  activeTab !== 6 || !hasGalleryAccess ? "none" : "block",
              }}
            >
              <GalleryTab
                vacationId={vacation.id}
                userId={user?.id}
                canEdit={canEdit}
                isOwner={isOwner}
              />
            </Box>
          </>
        )}
      </Box>

      {locations.map((loc) => (
        <ConfirmDialog
          key={`confirm-loc-${loc.id}`}
          open={confirmDeleteLocId === loc.id}
          message={`Are you sure you want to delete "${loc.name}"?`}
          onConfirm={async () => {
            await removeLocation(loc.id);
            setConfirmDeleteLocId(null);
            if (selectedLocation?.id === loc.id) setSelectedLocation(null);
          }}
          onCancel={() => setConfirmDeleteLocId(null)}
        />
      ))}

      {/* Trip Permissions Dialog */}
      <Dialog
        open={showPermissions}
        onClose={() => setShowPermissions(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 5,
            bgcolor: (theme) =>
              theme.palette.mode === "dark" ? "#1a1a1a" : "#fff",
            backgroundImage: "none",
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 900, pb: 1 }}>
          Trip Access Control
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 3, opacity: 0.7 }}>
            Select which participants are allowed to view the documents and
            gallery or edit trip details. The trip owner always has full access.
          </Typography>
          {participants.length > 0 ? (
            <List>
              {participants.map((p) => (
                <Box
                  key={p.user_id}
                  sx={{
                    mb: 2,
                    p: 2,
                    borderRadius: 3,
                    bgcolor: (theme) =>
                      theme.palette.mode === "dark"
                        ? "rgba(255,255,255,0.03)"
                        : "rgba(0,0,0,0.02)",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      mb: 2,
                    }}
                  >
                    <Avatar
                      src={resolveAvatar(p.avatar_url)}
                      sx={{ width: 32, height: 32, mr: 1.5 }}
                    >
                      {!p.avatar_url && p.display_name?.charAt(0)}
                    </Avatar>
                    <Typography fontWeight={700}>
                      {p.display_name || "Anonymous"}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 1,
                    }}
                  >
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      Docs and Gallery Access
                    </Typography>
                    <Switch
                      size="small"
                      checked={p.allow_gallery}
                      disabled={!isOwner}
                      onChange={(e) =>
                        updateGalleryAccess(p.user_id, e.target.checked)
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
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      Editing Permissions
                    </Typography>
                    <Switch
                      size="small"
                      checked={p.allow_edit}
                      disabled={!isOwner}
                      onChange={(e) =>
                        updateEditAccess(p.user_id, e.target.checked)
                      }
                    />
                  </Box>
                </Box>
              ))}
            </List>
          ) : (
            <Box sx={{ py: 4, textAlign: "center", opacity: 0.5 }}>
              <GroupIcon sx={{ fontSize: 48, mb: 1 }} />
              <Typography variant="body2" fontWeight={700}>
                No participants yet
              </Typography>
              <Typography variant="caption">
                Invite others to the trip to manage their permissions.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button
            fullWidth
            variant="contained"
            onClick={() => setShowPermissions(false)}
            sx={{ borderRadius: 3, fontWeight: 900, py: 1.5 }}
          >
            Done
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
