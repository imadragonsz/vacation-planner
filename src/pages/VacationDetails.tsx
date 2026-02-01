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
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Switch,
  Typography,
  Button,
} from "@mui/material";
import EventNoteIcon from "@mui/icons-material/EventNote";
import TravelExploreIcon from "@mui/icons-material/TravelExplore";
import ShoppingBagIcon from "@mui/icons-material/ShoppingBag";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import ExploreIcon from "@mui/icons-material/Explore";
import CollectionsIcon from "@mui/icons-material/Collections";
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
import { resolveAvatar } from "../utils/avatars";

// Global cache for geocoding results to persist across trip navigation
const sessionGeocodeCache: { [key: string]: { lat: number; lng: number } } = {};

export function VacationDetails({
  vacation,
  user,
  onRefresh,
}: {
  vacation: Vacation;
  user: any;
  onRefresh?: () => void;
}) {
  const [activeTab, setActiveTab] = useState(1); // Default to Destinations

  const isOwner = user && vacation.user_id === user.id;
  const { participants, joinVacation, leaveVacation, updateGalleryAccess } =
    useParticipants(vacation.id);

  const [showPermissions, setShowPermissions] = useState(false);

  const hasGalleryAccess = useMemo(() => {
    if (isOwner) return true;
    const participant = participants.find((p) => p.user_id === user?.id);
    return participant?.allow_gallery ?? false;
  }, [isOwner, participants, user]);

  useEffect(() => {
    if (activeTab === 5 && !hasGalleryAccess) {
      setActiveTab(1); // Fallback to Destinations if access lost
    }
  }, [activeTab, hasGalleryAccess]);

  const {
    participants: locationParticipants,
    joinItem: joinLocation,
    leaveItem: leaveLocation,
    fetchParticipants: fetchLocationParticipants,
  } = useItemParticipants("location");
  const {
    participants: agendaParticipants,
    joinItem: joinAgenda,
    leaveItem: leaveAgenda,
    fetchParticipants: fetchAgendaParticipants,
  } = useItemParticipants("agenda");

  const { locations, addLocation, updateLocation, removeLocation } =
    useLocations(vacation.id);

  const isParticipant = useMemo(
    () => user && participants.some((p) => p.user_id === user.id),
    [user, participants],
  );
  const canEdit = isOwner || isParticipant;

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
      const { error } = await supabase
        .from("vacations")
        .delete()
        .eq("id", vacation.id);
      if (!error && onRefresh) onRefresh();
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
    if (
      selectedLocation &&
      !locations.find((l) => l.id === selectedLocation.id)
    ) {
      setSelectedLocation(null);
    }
  }, [locations, selectedLocation, hasInitialSelect]);

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
    await supabase.from("agendas").delete().eq("id", id);
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
    <Box sx={{ py: 3, px: { xs: 2, sm: 3, md: 6 } }}>
      <Box sx={{ mb: 6 }}>
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
        />

        <Paper
          elevation={0}
          sx={{
            p: 0.8,
            display: "inline-flex",
            borderRadius: 5,
            bgcolor: (theme) =>
              theme.palette.mode === "dark"
                ? "rgba(255,255,255,0.03)"
                : "rgba(0,0,0,0.02)",
            backdropFilter: "blur(20px)",
            border: (theme) =>
              theme.palette.mode === "dark"
                ? "1px solid rgba(255,255,255,0.05)"
                : "1px solid rgba(0,0,0,0.05)",
            mt: 4,
            width: { xs: "100%", sm: "auto" },
            overflowX: "auto",
          }}
        >
          <Tabs
            value={activeTab}
            onChange={(_: React.SyntheticEvent, val: number) =>
              setActiveTab(val)
            }
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{
              minHeight: "auto",
              "& .MuiTabs-indicator": {
                height: "100%",
                borderRadius: 4,
                zIndex: -1,
                bgcolor: (theme) =>
                  theme.palette.mode === "dark"
                    ? "rgba(33, 150, 243, 0.15)"
                    : "rgba(33, 150, 243, 0.08)",
                border: "1px solid rgba(33, 150, 243, 0.3)",
              },
              "& .MuiTab-root": {
                fontWeight: 900,
                fontSize: { xs: "0.75rem", sm: "0.85rem" },
                textTransform: "none",
                minHeight: "auto",
                px: { xs: 2, sm: 3 },
                py: 1.5,
                color: "text.secondary",
                borderRadius: 4,
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                display: "flex",
                flexDirection: "row",
                gap: 1.5,
                minWidth: "auto",
                whiteSpace: "nowrap",
                "&.Mui-selected": {
                  color: "primary.main",
                },
                "&:hover": {
                  color: "text.primary",
                  bgcolor: (theme) =>
                    theme.palette.mode === "dark"
                      ? "rgba(255,255,255,0.02)"
                      : "rgba(0,0,0,0.04)",
                },
              },
            }}
          >
            <Tab
              value={0}
              icon={<ExploreIcon sx={{ fontSize: 20 }} />}
              label="Map Overview"
            />
            <Tab
              value={1}
              icon={<TravelExploreIcon sx={{ fontSize: 20 }} />}
              label="Destinations"
            />
            <Tab
              value={2}
              icon={<EventNoteIcon sx={{ fontSize: 20 }} />}
              label="Itinerary"
            />
            <Tab
              value={3}
              icon={<ShoppingBagIcon sx={{ fontSize: 20 }} />}
              label="Packing"
            />
            <Tab
              value={4}
              icon={<AccountBalanceWalletIcon sx={{ fontSize: 20 }} />}
              label="Finances"
            />
            {hasGalleryAccess && (
              <Tab
                value={5}
                icon={<CollectionsIcon sx={{ fontSize: 20 }} />}
                label="Gallery"
              />
            )}
          </Tabs>
        </Paper>
      </Box>

      <Box sx={{ width: "100%", pb: 10 }}>
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
            confirmDeleteAgendaId={confirmDeleteAgendaId}
            setConfirmDeleteAgendaId={setConfirmDeleteAgendaId}
          />
        )}

        <Box sx={{ display: activeTab !== 3 ? "none" : "block" }}>
          <PackingList vacationId={vacation.id} user={user} canEdit={canEdit} />
        </Box>

        <Box sx={{ display: activeTab !== 4 ? "none" : "block" }}>
          <TripExpenses
            vacationId={vacation.id}
            user={user}
            locationId={selectedLocation?.id}
            canEdit={canEdit}
          />
        </Box>

        <Box
          sx={{
            display: activeTab !== 5 || !hasGalleryAccess ? "none" : "block",
          }}
        >
          <GalleryTab
            vacationId={vacation.id}
            userId={user?.id}
            canEdit={canEdit}
            isOwner={isOwner}
            onManagePermissions={() => setShowPermissions(true)}
          />
        </Box>
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

      {/* Gallery Permissions Dialog */}
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
          Gallery Access Control
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 3, opacity: 0.7 }}>
            Select which participants are allowed to view the vacation gallery.
            The trip owner always has access.
          </Typography>
          {participants.length > 0 ? (
            <List>
              {participants.map((p) => (
                <ListItem
                  key={p.user_id}
                  secondaryAction={
                    <Switch
                      edge="end"
                      checked={p.allow_gallery}
                      onChange={(e) =>
                        updateGalleryAccess(p.user_id, e.target.checked)
                      }
                    />
                  }
                >
                  <ListItemAvatar>
                    <Avatar src={resolveAvatar(p.avatar_url)}>
                      {!p.avatar_url && p.display_name?.charAt(0)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={p.display_name || "Anonymous"}
                    primaryTypographyProps={{ fontWeight: 700 }}
                    secondary={p.allow_gallery ? "Has Access" : "No Access"}
                  />
                </ListItem>
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
