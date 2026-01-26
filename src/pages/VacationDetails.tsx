import React, { useState, useEffect, Suspense } from "react";
import { useLocations, VacationLocation } from "../hooks/useLocations";
import { addToGeocodeQueue } from "../utils/geocoder";
import { useAgendas } from "../hooks/useAgendas";
import { useParticipants, Participant } from "../hooks/useParticipants";
import { useItemParticipants } from "../hooks/useItemParticipants";
import { supabase } from "../supabaseClient";
import { Vacation } from "../vacation";
import ConfirmDialog from "../ConfirmDialog";
import {
  Box,
  Button,
  TextField,
  Typography,
  IconButton,
  Paper,
  Divider,
  Chip,
  Fade,
  Avatar,
  AvatarGroup,
  Tooltip,
  ToggleButton,
  ToggleButtonGroup,
  Tabs,
  Tab,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import EventNoteIcon from "@mui/icons-material/EventNote";
import MapIcon from "@mui/icons-material/Map";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import PersonIcon from "@mui/icons-material/Person";
import GroupIcon from "@mui/icons-material/Group";
import FlightIcon from "@mui/icons-material/Flight";
import TrainIcon from "@mui/icons-material/Train";
import DirectionsBusIcon from "@mui/icons-material/DirectionsBus";
import HotelIcon from "@mui/icons-material/Hotel";
import NoteIcon from "@mui/icons-material/Note";
import ArchiveIcon from "@mui/icons-material/Archive";
import RestoreIcon from "@mui/icons-material/Restore";
import { DatePicker, TimePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { SortableAgendaItem } from "../components/SortableAgendaItem";
import WeatherForecast from "../components/WeatherForecast";
import PackingList from "../components/PackingList";
import TripExpenses from "../components/TripExpenses";
import ChecklistIcon from "@mui/icons-material/Checklist";
import PaidIcon from "@mui/icons-material/Paid";

import { handleArchiveVacation, handleArchiveRestore } from "../utils/handlers";

const VacationMap = React.lazy(() => import("../VacationMap"));

export function VacationDetails({
  vacation,
  user,
  onRefresh,
}: {
  vacation: Vacation;
  user: any;
  onRefresh?: () => void;
}) {
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down("md"));
  const [mobileTab, setMobileTab] = useState(0);

  const isOwner = user && vacation.user_id === user.id;
  const { participants, joinVacation, leaveVacation } = useParticipants(
    vacation.id,
  );
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

  const isParticipant = user && participants.some((p) => p.user_id === user.id);
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

  const vacationId = vacation.id;
  const { locations, addLocation, updateLocation, removeLocation } =
    useLocations(vacationId);

  // Geocode locations for map pins with rate limiting
  const [geoLocations, setGeoLocations] = useState<any[]>([]);
  React.useEffect(() => {
    let cancelled = false;
    async function geocodeAll() {
      const results: any[] = [];
      for (const loc of locations) {
        if (cancelled) break;

        const query = loc.address || loc.name;
        if (!query) {
          results.push({ ...loc });
          if (!cancelled) setGeoLocations([...results]);
          continue;
        }

        if (loc.lat && loc.lng) {
          results.push({ ...loc });
          if (!cancelled) setGeoLocations([...results]);
          continue;
        }

        const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(
          query,
        )}`;

        try {
          const data = await addToGeocodeQueue(url);
          if (data && data.length > 0) {
            results.push({
              ...loc,
              lat: parseFloat(data[0].lat),
              lng: parseFloat(data[0].lon),
            });
          } else {
            results.push({ ...loc });
          }
        } catch (error) {
          console.error("Error fetching geocode data:", error, query);
          results.push({ ...loc });
        }

        if (!cancelled) setGeoLocations([...results]);
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

  React.useEffect(() => {
    if (!selectedLocation && locations.length > 0) {
      setSelectedLocation(locations[0]);
    }
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
  const [locationSearch, setLocationSearch] = useState(""); // eslint-disable-line @typescript-eslint/no-unused-vars

  // Agenda state
  const [editingAgendaId, setEditingAgendaId] = useState<number | null>(null);
  const [editAgendaDate, setEditAgendaDate] = useState("");
  const [editAgendaTime, setEditAgendaTime] = useState("");
  const [editAgendaDesc, setEditAgendaDesc] = useState("");
  const [editAgendaType, setEditAgendaType] = useState<string>("activity");
  const [agendaAddr, setAgendaAddr] = useState("");
  const [confirmDeleteAgendaId, setConfirmDeleteAgendaId] = useState<
    number | null
  >(null);

  // Agendas for selected location
  const locationId = selectedLocation?.id ?? 0;
  const { agendas, addAgenda, updateAgenda, updateAgendasOrder } =
    useAgendas(locationId);

  // Drag & Drop Sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

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

  // Fetch participants for items
  useEffect(() => {
    if (locations.length > 0)
      fetchLocationParticipants(locations.map((l) => l.id));
  }, [locations, fetchLocationParticipants]);

  useEffect(() => {
    if (agendas.length > 0) fetchAgendaParticipants(agendas.map((a) => a.id));
  }, [agendas, fetchAgendaParticipants]);

  // Add location handler
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

  // Update location handler
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

  // Add agenda handler
  async function handleAddAgenda(e: React.FormEvent) {
    e.preventDefault();
    if (editAgendaDate && editAgendaDesc) {
      if (editingAgendaId) {
        // Update existing agenda
        await updateAgenda(
          editingAgendaId,
          editAgendaDate,
          editAgendaDesc,
          agendaAddr,
          editAgendaTime,
          editAgendaType,
        );
      } else {
        // Add new agenda
        await addAgenda(
          editAgendaDate,
          editAgendaDesc,
          agendaAddr,
          editAgendaTime,
          editAgendaType,
        );
      }
      // Clear form fields after submission
      setEditAgendaDate("");
      setEditAgendaTime("");
      setEditAgendaDesc("");
      setEditAgendaType("activity");
      setAgendaAddr("");
      setEditingAgendaId(null);
    }
  }

  // Delete agenda handler
  async function handleDeleteAgenda(id: number) {
    await supabase.from("agendas").delete().eq("id", id);
    setConfirmDeleteAgendaId(null);
  }

  return (
    <Box sx={{ py: 2, px: { xs: 1, sm: 2, md: 4 } }}>
      <VacationEditor
        vacation={vacation}
        onVacationUpdated={onRefresh || (() => {})}
        user={user}
        canEdit={canEdit}
        joinVacation={joinVacation}
        leaveVacation={leaveVacation}
        participants={participants}
        onArchive={handleArchive}
        onRestore={handleRestore}
        onDeletePermanently={handleDeletePermanently}
      />

      {isMobile && (
        <Tabs
          value={mobileTab}
          onChange={(_: React.SyntheticEvent, val: number) => setMobileTab(val)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            mb: 3,
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            "& .MuiTab-root": {
              fontWeight: 800,
              fontSize: "0.8rem",
              minWidth: "auto",
              px: 3,
            },
          }}
        >
          <Tab icon={<MapIcon fontSize="small" />} label="Plan" />
          <Tab icon={<EventNoteIcon fontSize="small" />} label="Agenda" />
          <Tab icon={<ChecklistIcon fontSize="small" />} label="Packing" />
          <Tab icon={<PaidIcon fontSize="small" />} label="Expenses" />
        </Tabs>
      )}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "1fr 340px" },
          gap: 3,
          alignItems: "start",
        }}
      >
        {/* Left Column: Map and Agendas */}
        <Box
          sx={{
            display: isMobile && mobileTab > 1 ? "none" : "flex",
            flexDirection: "column",
            gap: { xs: 2, md: 4 },
            minWidth: 0,
          }}
        >
          {/* Map Section */}
          <Paper
            elevation={0}
            sx={{
              display: isMobile && mobileTab !== 0 ? "none" : "block",
              p: 2,
              borderRadius: 4,
              bgcolor: "rgba(255,255,255,0.03)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255,255,255,0.05)",
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                mb: 2,
                display: "flex",
                alignItems: "center",
                gap: 1,
                px: 1,
              }}
            >
              <MapIcon color="primary" />
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                Trip Map
              </Typography>
            </Box>
            <Box
              sx={{
                height: { xs: 300, md: 500 },
                borderRadius: 3,
                overflow: "hidden",
                bgcolor: "rgba(0,0,0,0.2)",
              }}
            >
              <Suspense
                fallback={
                  <Box
                    sx={{
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Typography sx={{ opacity: 0.5 }}>
                      Loading map...
                    </Typography>
                  </Box>
                }
              >
                <VacationMap locations={geoLocations} agendas={agendas} />
              </Suspense>
            </Box>
          </Paper>

          {/* Agendas Section */}
          <Box sx={{ display: isMobile && mobileTab !== 1 ? "none" : "block" }}>
            <Fade in={!!selectedLocation}>
              <Box>
                {selectedLocation && (
                  <Paper
                    elevation={0}
                    sx={{
                      p: { xs: 1.5, sm: 2, md: 4 },
                      borderRadius: 4,
                      bgcolor: "rgba(255,255,255,0.03)",
                      backdropFilter: "blur(10px)",
                      border: "1px solid rgba(255,255,255,0.05)",
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        flexDirection: { xs: "column", sm: "row" },
                        gap: 2,
                        mb: 4,
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 2,
                          flex: 1,
                          minWidth: 0,
                        }}
                      >
                        <EventNoteIcon color="primary" sx={{ fontSize: 32 }} />
                        <Typography
                          variant="h5"
                          sx={{
                            fontWeight: 900,
                            wordBreak: "break-word",
                          }}
                        >
                          Agendas for {selectedLocation.name}
                        </Typography>
                        {selectedGeoLocation?.lat &&
                          selectedGeoLocation?.lng && (
                            <Box sx={{ flexShrink: 0 }}>
                              <WeatherForecast
                                lat={selectedGeoLocation.lat}
                                lng={selectedGeoLocation.lng}
                              />
                            </Box>
                          )}
                      </Box>
                      <Button
                        variant="text"
                        size="small"
                        onClick={() => setSelectedLocation(null)}
                        sx={{
                          color: "rgba(255,255,255,0.4)",
                          alignSelf: { xs: "flex-end", sm: "center" },
                        }}
                      >
                        Deselect
                      </Button>
                    </Box>

                    {/* Add Agenda Form */}
                    {canEdit && (
                      <Box
                        component="form"
                        onSubmit={handleAddAgenda}
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 2.5,
                          mb: 4,
                          p: { xs: 2, sm: 3 },
                          borderRadius: 4,
                          bgcolor: "rgba(255,255,255,0.03)",
                          border: "1px solid rgba(255,255,255,0.05)",
                        }}
                      >
                        <Box
                          sx={{
                            display: "grid",
                            gridTemplateColumns: {
                              xs: "1fr",
                              sm: "1fr 1fr",
                            },
                            gap: 2,
                          }}
                        >
                          <Box sx={{ gridColumn: "1 / -1" }}>
                            <Typography
                              variant="caption"
                              sx={{
                                opacity: 0.5,
                                fontWeight: 800,
                                textTransform: "uppercase",
                                mb: 1,
                                display: "block",
                              }}
                            >
                              Activity Type
                            </Typography>
                            <ToggleButtonGroup
                              value={editAgendaType}
                              exclusive
                              onChange={(_, val) =>
                                val && setEditAgendaType(val)
                              }
                              size="small"
                              fullWidth
                              sx={{
                                bgcolor: "rgba(255,255,255,0.02)",
                                "& .MuiToggleButton-root": {
                                  borderRadius: 2,
                                  border:
                                    "1px solid rgba(255,255,255,0.05) !important",
                                  color: "rgba(255,255,255,0.4)",
                                  "&.Mui-selected": {
                                    bgcolor: "primary.main",
                                    color: "#fff",
                                    "&:hover": { bgcolor: "primary.dark" },
                                  },
                                },
                              }}
                            >
                              <ToggleButton value="activity">
                                <Tooltip title="Activity">
                                  <EventNoteIcon fontSize="small" />
                                </Tooltip>
                              </ToggleButton>
                              <ToggleButton value="flight">
                                <Tooltip title="Flight">
                                  <FlightIcon fontSize="small" />
                                </Tooltip>
                              </ToggleButton>
                              <ToggleButton value="train">
                                <Tooltip title="Train">
                                  <TrainIcon fontSize="small" />
                                </Tooltip>
                              </ToggleButton>
                              <ToggleButton value="bus">
                                <Tooltip title="Bus">
                                  <DirectionsBusIcon fontSize="small" />
                                </Tooltip>
                              </ToggleButton>
                              <ToggleButton value="hotel">
                                <Tooltip title="Accommodation">
                                  <HotelIcon fontSize="small" />
                                </Tooltip>
                              </ToggleButton>
                              <ToggleButton value="note">
                                <Tooltip title="Note">
                                  <NoteIcon fontSize="small" />
                                </Tooltip>
                              </ToggleButton>
                            </ToggleButtonGroup>
                          </Box>
                          <DatePicker
                            label="Date"
                            value={
                              editAgendaDate ? dayjs(editAgendaDate) : null
                            }
                            onChange={(newValue) =>
                              setEditAgendaDate(
                                newValue ? newValue.format("YYYY-MM-DD") : "",
                              )
                            }
                            minDate={
                              selectedLocation?.start_date
                                ? dayjs(selectedLocation.start_date)
                                : undefined
                            }
                            maxDate={
                              selectedLocation?.end_date
                                ? dayjs(selectedLocation.end_date)
                                : undefined
                            }
                            sx={{
                              "& .MuiOutlinedInput-root": {
                                bgcolor: "rgba(0,0,0,0.1)",
                                borderRadius: 2.5,
                              },
                            }}
                          />
                          <TimePicker
                            label="Time"
                            value={
                              editAgendaTime
                                ? dayjs(`2000-01-01T${editAgendaTime}`)
                                : null
                            }
                            onChange={(newValue) =>
                              setEditAgendaTime(
                                newValue ? newValue.format("HH:mm:ss") : "",
                              )
                            }
                            sx={{
                              "& .MuiOutlinedInput-root": {
                                bgcolor: "rgba(0,0,0,0.1)",
                                borderRadius: 2.5,
                              },
                            }}
                          />
                        </Box>

                        <TextField
                          label="Description"
                          placeholder="e.g. Visit Akihabara"
                          size="medium"
                          fullWidth
                          value={editAgendaDesc}
                          onChange={(e) => setEditAgendaDesc(e.target.value)}
                          required
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              bgcolor: "rgba(0,0,0,0.1)",
                              borderRadius: 2.5,
                            },
                          }}
                        />

                        <Box
                          sx={{
                            display: "flex",
                            gap: 2,
                            alignItems: { xs: "stretch", sm: "center" },
                            flexDirection: { xs: "column", sm: "row" },
                          }}
                        >
                          <TextField
                            label="Address (optional)"
                            placeholder="Google Maps link or address"
                            size="medium"
                            fullWidth
                            value={agendaAddr}
                            onChange={(e) => setAgendaAddr(e.target.value)}
                            sx={{
                              "& .MuiOutlinedInput-root": {
                                bgcolor: "rgba(0,0,0,0.1)",
                                borderRadius: 2.5,
                              },
                            }}
                          />
                          <Box
                            sx={{
                              display: "flex",
                              gap: 1,
                              justifyContent: {
                                xs: "flex-end",
                                sm: "flex-start",
                              },
                            }}
                          >
                            <Button
                              type="submit"
                              variant="contained"
                              fullWidth={isMobile}
                              sx={{
                                fontWeight: 800,
                                borderRadius: 2.5,
                                px: 3,
                                height: 56, // Match medium TextField height
                                minWidth: 100,
                              }}
                            >
                              {editingAgendaId ? "Update" : "Add"}
                            </Button>
                            {editingAgendaId && (
                              <IconButton
                                onClick={() => {
                                  setEditingAgendaId(null);
                                  setEditAgendaDate("");
                                  setEditAgendaTime("");
                                  setEditAgendaDesc("");
                                  setAgendaAddr("");
                                }}
                                sx={{
                                  bgcolor: "rgba(255,255,255,0.05)",
                                  borderRadius: 2.5,
                                  width: 56,
                                  height: 56,
                                }}
                              >
                                <DeleteIcon />
                              </IconButton>
                            )}
                          </Box>
                        </Box>
                      </Box>
                    )}

                    <Box
                      sx={{ display: "flex", flexDirection: "column", gap: 2 }}
                    >
                      {agendas.length === 0 ? (
                        <Box sx={{ textAlign: "center", py: 8, px: 2 }}>
                          <EventNoteIcon
                            sx={{
                              fontSize: 48,
                              mb: 1,
                              color: "secondary.main",
                              opacity: 0.2,
                            }}
                          />
                          <Typography
                            variant="body1"
                            sx={{ opacity: 0.4, fontWeight: 700 }}
                          >
                            Fresh start!
                          </Typography>
                          <Typography variant="body2" sx={{ opacity: 0.2 }}>
                            {canEdit
                              ? "Add your first activity or event for this destination above."
                              : "No activities have been scheduled here yet."}
                          </Typography>
                        </Box>
                      ) : (
                        <DndContext
                          sensors={sensors}
                          collisionDetection={closestCenter}
                          onDragEnd={handleDragEnd}
                          modifiers={[restrictToVerticalAxis]}
                        >
                          <SortableContext
                            items={agendas.map((a) => a.id)}
                            strategy={verticalListSortingStrategy}
                          >
                            {agendas.map((ag) => (
                              <SortableAgendaItem
                                key={ag.id}
                                ag={ag}
                                canEdit={canEdit}
                                user={user}
                                participants={agendaParticipants[ag.id] || []}
                                onEdit={(item) => {
                                  setEditingAgendaId(item.id);
                                  setEditAgendaDate(item.agenda_date);
                                  setEditAgendaTime(item.Time || "");
                                  setEditAgendaDesc(item.description);
                                  setEditAgendaType(item.type || "activity");
                                  setAgendaAddr(item.address || "");
                                }}
                                onDelete={handleDeleteAgenda}
                                onJoin={joinAgenda}
                                onLeave={leaveAgenda}
                                isConfirmingDelete={
                                  confirmDeleteAgendaId === ag.id
                                }
                                setConfirmDeleteId={setConfirmDeleteAgendaId}
                              />
                            ))}
                          </SortableContext>
                        </DndContext>
                      )}
                    </Box>
                  </Paper>
                )}
              </Box>
            </Fade>
            {!selectedLocation && isMobile && mobileTab === 1 && (
              <Box sx={{ p: 4, textAlign: "center", opacity: 0.5 }}>
                <EventNoteIcon sx={{ fontSize: 64, mb: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  Agenda Details
                </Typography>
                <Typography>
                  Select a destination in the "Plan" tab to view its activities.
                </Typography>
              </Box>
            )}
          </Box>
        </Box>

        {/* Right Column: Locations List */}
        <Box
          sx={{
            display: isMobile && mobileTab === 1 ? "none" : "flex",
            flexDirection: "column",
            gap: 4,
            position: { lg: "sticky" },
            top: { lg: 32 },
            minWidth: 0,
          }}
        >
          <Box
            sx={{
              display: isMobile && mobileTab !== 0 ? "none" : "block",
            }}
          >
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2, md: 3 },
                borderRadius: 4,
                bgcolor: "rgba(255,255,255,0.03)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mb: 3,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <LocationOnIcon color="primary" />
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>
                    Destinations
                  </Typography>
                </Box>
                <Chip
                  label={locations.length}
                  size="small"
                  sx={{ bgcolor: "rgba(255,255,255,0.1)", fontWeight: 800 }}
                />
              </Box>

              {/* Add Location Form */}
              {canEdit && (
                <Box
                  component="form"
                  onSubmit={handleAddLocation}
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                    mb: 4,
                    p: { xs: 1.5, sm: 2 },
                    borderRadius: 3,
                    bgcolor: "rgba(0,0,0,0.1)",
                  }}
                >
                  <TextField
                    label="Location Name"
                    placeholder="e.g. Tokyo"
                    size="medium"
                    fullWidth
                    value={newLocName}
                    onChange={(e) => setNewLocName(e.target.value)}
                    required
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                      },
                    }}
                  />
                  <TextField
                    label="Address (optional)"
                    placeholder="City, Country"
                    size="medium"
                    fullWidth
                    value={newLocAddr}
                    onChange={(e) => setNewLocAddr(e.target.value)}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                      },
                    }}
                  />
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 2,
                    }}
                  >
                    <DatePicker
                      label="Start Date"
                      value={newLocStart ? dayjs(newLocStart) : null}
                      onChange={(val) =>
                        setNewLocStart(val ? val.format("YYYY-MM-DD") : "")
                      }
                      minDate={dayjs(vacation.start_date)}
                      maxDate={dayjs(vacation.end_date)}
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                    />
                    <DatePicker
                      label="End Date"
                      value={newLocEnd ? dayjs(newLocEnd) : null}
                      onChange={(val) =>
                        setNewLocEnd(val ? val.format("YYYY-MM-DD") : "")
                      }
                      minDate={dayjs(vacation.start_date)}
                      maxDate={dayjs(vacation.end_date)}
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                    />
                  </Box>
                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    startIcon={<AddIcon />}
                    disabled={!newLocName.trim()}
                    sx={{ py: 1.5, fontWeight: 800, borderRadius: 2 }}
                  >
                    Add Location
                  </Button>
                </Box>
              )}

              <Divider sx={{ mb: 3, opacity: 0.1 }} />

              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 1.5,
                  maxHeight: "calc(100vh - 500px)",
                  overflowY: "auto",
                  pr: 1,
                }}
              >
                {locations.length === 0 ? (
                  <Typography
                    sx={{
                      opacity: 0.3,
                      fontStyle: "italic",
                      textAlign: "center",
                      py: 4,
                    }}
                  >
                    No destinations added.
                  </Typography>
                ) : (
                  locations.map((loc) =>
                    editingLocId === loc.id ? (
                      <Box
                        key={loc.id}
                        component="form"
                        onSubmit={handleUpdateLocation}
                        sx={{
                          p: 2,
                          borderRadius: 3,
                          bgcolor: "rgba(25, 118, 210, 0.08)",
                          border: "1px solid",
                          borderColor: "primary.main",
                          display: "flex",
                          flexDirection: "column",
                          gap: 1.5,
                        }}
                      >
                        <TextField
                          label="Location Name"
                          size="small"
                          fullWidth
                          value={editLocName}
                          onChange={(e) => setEditLocName(e.target.value)}
                          required
                          autoFocus
                        />
                        <TextField
                          label="Address"
                          size="small"
                          fullWidth
                          value={editLocAddr}
                          onChange={(e) => setEditLocAddr(e.target.value)}
                        />
                        <Box sx={{ display: "flex", gap: 1 }}>
                          <DatePicker
                            label="Start Date"
                            value={editLocStart ? dayjs(editLocStart) : null}
                            onChange={(val) =>
                              setEditLocStart(
                                val ? val.format("YYYY-MM-DD") : "",
                              )
                            }
                            minDate={dayjs(vacation.start_date)}
                            maxDate={dayjs(vacation.end_date)}
                            slotProps={{
                              textField: { size: "small", fullWidth: true },
                            }}
                          />
                          <DatePicker
                            label="End Date"
                            value={editLocEnd ? dayjs(editLocEnd) : null}
                            onChange={(val) =>
                              setEditLocEnd(val ? val.format("YYYY-MM-DD") : "")
                            }
                            minDate={dayjs(vacation.start_date)}
                            maxDate={dayjs(vacation.end_date)}
                            slotProps={{
                              textField: { size: "small", fullWidth: true },
                            }}
                          />
                        </Box>
                        <Box sx={{ display: "flex", gap: 1 }}>
                          <Button
                            type="submit"
                            variant="contained"
                            size="small"
                            fullWidth
                            sx={{ fontWeight: 800 }}
                          >
                            Save
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            fullWidth
                            onClick={() => setEditingLocId(null)}
                            sx={{ fontWeight: 800 }}
                          >
                            Cancel
                          </Button>
                        </Box>
                      </Box>
                    ) : (
                      <Box
                        key={loc.id}
                        onClick={() => {
                          setSelectedLocation(loc);
                          if (isMobile) setMobileTab(1);
                        }}
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          bgcolor:
                            selectedLocation?.id === loc.id
                              ? "rgba(25, 118, 210, 0.1)"
                              : "transparent",
                          border: "1px solid",
                          borderColor:
                            selectedLocation?.id === loc.id
                              ? "rgba(25, 118, 210, 0.3)"
                              : "transparent",
                          transition: "all 0.2s",
                          "&:hover": {
                            bgcolor: "rgba(255, 255, 255, 0.03)",
                            "& .loc-actions": { opacity: 1 },
                          },
                        }}
                      >
                        <Box sx={{ flex: 1, minWidth: 0, mr: 1 }}>
                          <Typography
                            sx={{
                              fontWeight:
                                selectedLocation?.id === loc.id ? 800 : 700,
                              fontSize: "0.9rem",
                              color:
                                selectedLocation?.id === loc.id
                                  ? "primary.main"
                                  : "white",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {loc.name}
                          </Typography>
                          {(loc.start_date || loc.end_date) && (
                            <Typography
                              variant="caption"
                              sx={{
                                color: "secondary.main",
                                fontWeight: 800,
                                fontSize: "0.65rem",
                                display: "block",
                                mt: -0.5,
                                mb: 0.5,
                              }}
                            >
                              {loc.start_date
                                ? new Date(loc.start_date).toLocaleDateString(
                                    undefined,
                                    { month: "short", day: "numeric" },
                                  )
                                : "???"}{" "}
                              -{" "}
                              {loc.end_date
                                ? new Date(loc.end_date).toLocaleDateString(
                                    undefined,
                                    { month: "short", day: "numeric" },
                                  )
                                : "???"}
                            </Typography>
                          )}
                          {loc.address && (
                            <Typography
                              variant="caption"
                              sx={{
                                opacity: 0.4,
                                display: "block",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {loc.address}
                            </Typography>
                          )}
                          {/* Location Participants */}
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              mt: 0.5,
                            }}
                          >
                            <AvatarGroup
                              max={3}
                              sx={{
                                "& .MuiAvatar-root": {
                                  width: 22,
                                  height: 22,
                                  fontSize: "0.6rem",
                                },
                              }}
                            >
                              {(locationParticipants[loc.id] || []).map((p) => (
                                <Tooltip key={p.user_id} title={p.display_name}>
                                  <Avatar>{p.display_name?.charAt(0)}</Avatar>
                                </Tooltip>
                              ))}
                            </AvatarGroup>
                          </Box>
                        </Box>
                        <Box
                          className="loc-actions"
                          sx={{
                            display: canEdit ? "flex" : "none",
                            alignItems: "center",
                            gap: 0.5,
                            opacity: isMobile ? 1 : 0,
                            transition: "opacity 0.2s",
                          }}
                        >
                          {user && canEdit && (
                            <Button
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                const isJoined = locationParticipants[
                                  loc.id
                                ]?.some((p) => p.user_id === user.id);
                                if (isJoined) leaveLocation(loc.id, user.id);
                                else joinLocation(loc.id, user.id);
                              }}
                              sx={{
                                fontSize: "0.65rem",
                                minWidth: "auto",
                                px: 1,
                                py: 0.2,
                                fontWeight: 800,
                                borderRadius: 1,
                                color: locationParticipants[loc.id]?.some(
                                  (p) => p.user_id === user.id,
                                )
                                  ? "secondary.main"
                                  : "primary.main",
                              }}
                            >
                              {locationParticipants[loc.id]?.some(
                                (p) => p.user_id === user.id,
                              )
                                ? "Leave"
                                : "Join"}
                            </Button>
                          )}
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingLocId(loc.id);
                              setEditLocName(loc.name);
                              setEditLocAddr(loc.address || "");
                              setEditLocStart(loc.start_date || "");
                              setEditLocEnd(loc.end_date || "");
                            }}
                            sx={{
                              color: "rgba(255,255,255,0.4)",
                              "&:hover": { color: "primary.main" },
                            }}
                          >
                            <EditIcon sx={{ fontSize: "1rem" }} />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDeleteLocId(loc.id);
                            }}
                            sx={{
                              color: "rgba(255,255,255,0.4)",
                              "&:hover": { color: "error.main" },
                            }}
                          >
                            <DeleteIcon sx={{ fontSize: "1rem" }} />
                          </IconButton>
                        </Box>
                      </Box>
                    ),
                  )
                )}
              </Box>
            </Paper>
          </Box>

          {/* Packing List Section */}
          <Box
            sx={{
              flex: 1,
              display:
                isMobile && mobileTab !== 2 && isMobile ? "none" : "block",
            }}
          >
            <PackingList vacationId={vacation.id} user={user} />
          </Box>

          {/* Expenses Section */}
          <Box
            sx={{
              flex: 1,
              display:
                isMobile && mobileTab !== 3 && isMobile ? "none" : "block",
            }}
          >
            <TripExpenses vacationId={vacation.id} user={user} />
          </Box>
        </Box>
      </Box>

      {/* Confirm Dialogs */}
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
    </Box>
  );
}

// Optionally, export VacationEditor if needed elsewhere
type VacationEditorProps = {
  vacation: Vacation;
  onVacationUpdated: () => void;
  user: any;
  canEdit: boolean;
  joinVacation: (userId: string) => Promise<boolean>;
  leaveVacation: (userId: string) => Promise<boolean>;
  participants: Participant[];
  onArchive?: () => void;
  onRestore?: () => void;
  onDeletePermanently?: () => void;
};

export function VacationEditor({
  vacation,
  onVacationUpdated,
  user,
  canEdit,
  joinVacation,
  leaveVacation,
  participants,
  onArchive,
  onRestore,
  onDeletePermanently,
}: VacationEditorProps) {
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down("sm"));
  const [editing, setEditing] = useState(false);
  const [ownerProfile, setOwnerProfile] = useState<any>(null);

  useEffect(() => {
    async function fetchOwnerProfile() {
      if (vacation.user_id) {
        const { data } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("id", vacation.user_id)
          .single();
        if (data) setOwnerProfile(data);
      }
    }
    fetchOwnerProfile();
  }, [vacation.user_id]);

  const [name, setName] = useState(vacation.name);
  const [startDate, setStartDate] = useState(vacation.start_date);
  const [endDate, setEndDate] = useState(vacation.end_date);

  const countdown = (() => {
    const start = dayjs(vacation.start_date);
    const now = dayjs().startOf("day");
    const diff = start.diff(now, "day");

    if (diff === 0) return { label: "Starts Today!", color: "#4caf50" };
    if (diff === 1) return { label: "Starts Tomorrow", color: "#81c784" };
    if (diff > 0)
      return { label: `${diff} days until kickoff`, color: "#1976d2" };

    const end = dayjs(vacation.end_date);
    if (now.isBefore(end) || now.isSame(end)) {
      return { label: "Ongoing Trip", color: "#ff9800" };
    }
    return { label: "Completed Trip", color: "rgba(255,255,255,0.3)" };
  })();

  async function handleUpdateVacation() {
    const { error } = await supabase
      .from("vacations")
      .update({ name, start_date: startDate, end_date: endDate })
      .eq("id", vacation.id);

    if (!error) {
      setEditing(false);
      onVacationUpdated();
    }
  }

  return (
    <Box sx={{ px: { xs: 0, sm: 2, md: 4, lg: 6 }, mb: 6 }}>
      {editing ? (
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 3,
            bgcolor: "rgba(255, 255, 255, 0.05)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "2fr 1fr 1fr auto" },
              gap: 2,
              alignItems: "end",
              maxWidth: "100%",
            }}
          >
            <TextField
              label="Vacation Name"
              size="small"
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
              sx={{ maxWidth: { md: "none" } }}
            />
            <TextField
              label="Start Date"
              type="date"
              size="small"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              label="End Date"
              type="date"
              size="small"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                onClick={handleUpdateVacation}
                variant="contained"
                sx={{ px: 3, fontWeight: 800, borderRadius: 2 }}
              >
                Save
              </Button>
              <Button
                onClick={() => setEditing(false)}
                variant="outlined"
                sx={{ px: 2, borderRadius: 2 }}
              >
                Cancel
              </Button>
            </Box>
          </Box>
        </Paper>
      ) : (
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", md: "center" },
            gap: 2,
          }}
        >
          <Box>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 900,
                letterSpacing: "-1.5px",
                mb: 0.5,
                fontSize: { xs: "2rem", md: "3rem" },
                wordBreak: "break-word",
                background:
                  "linear-gradient(90deg, #fff 0%, rgba(255,255,255,0.7) 100%)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {vacation.name}
            </Typography>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                flexWrap: "wrap",
              }}
            >
              <Typography
                variant="overline"
                sx={{
                  fontWeight: 800,
                  letterSpacing: 1.5,
                  color: "primary.main",
                }}
              >
                {new Date(vacation.start_date).toLocaleDateString(undefined, {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </Typography>
              <Typography
                variant="overline"
                sx={{ opacity: 0.3, fontWeight: 800 }}
              >
                —
              </Typography>
              <Typography
                variant="overline"
                sx={{
                  fontWeight: 800,
                  letterSpacing: 1.5,
                  color: "primary.main",
                }}
              >
                {new Date(vacation.end_date).toLocaleDateString(undefined, {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </Typography>
              <Box
                sx={{
                  ml: 1,
                  px: 1.5,
                  py: 0.5,
                  borderRadius: "20px",
                  bgcolor:
                    countdown.color === "rgba(255,255,255,0.3)"
                      ? "rgba(255,255,255,0.05)"
                      : `${countdown.color}22`,
                  border: "1px solid",
                  borderColor:
                    countdown.color === "rgba(255,255,255,0.3)"
                      ? "rgba(255,255,255,0.1)"
                      : `${countdown.color}44`,
                  color: countdown.color,
                  fontSize: "0.7rem",
                  fontWeight: 900,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                {countdown.label}
              </Box>
            </Box>

            {/* Participants View */}
            {/* Participants View */}
            <Box sx={{ display: "flex", alignItems: "center", mt: 2, gap: 2 }}>
              <AvatarGroup
                max={5}
                sx={{
                  "& .MuiAvatar-root": {
                    width: 32,
                    height: 32,
                    fontSize: "0.8rem",
                    border: "2px solid #1a1d23",
                  },
                }}
              >
                {/* Owner */}
                <Tooltip
                  title={`Owner: ${ownerProfile?.display_name || "Anonymous"}`}
                >
                  <Avatar sx={{ bgcolor: "primary.main" }}>
                    {ownerProfile?.display_name?.charAt(0) || (
                      <PersonIcon sx={{ fontSize: 18 }} />
                    )}
                  </Avatar>
                </Tooltip>
                {/* Participants */}
                {participants.map((p, idx) => (
                  <Tooltip
                    key={p.user_id}
                    title={`Participant: ${p.display_name || "Anonymous"}`}
                  >
                    <Avatar sx={{ bgcolor: "rgba(255,255,255,0.1)" }}>
                      {p.display_name?.charAt(0) || (
                        <GroupIcon sx={{ fontSize: 16 }} />
                      )}
                    </Avatar>
                  </Tooltip>
                ))}
              </AvatarGroup>
              <Typography
                variant="caption"
                sx={{ color: "rgba(255,255,255,0.4)", fontWeight: 700 }}
              >
                {1 + participants.length}{" "}
                {1 + participants.length === 1 ? "Person" : "People"} Planning
              </Typography>
            </Box>

            {!canEdit && (
              <Chip
                label="READ ONLY - SHARED TRIP"
                size="small"
                sx={{
                  mt: 2,
                  bgcolor: "rgba(255,152,0,0.1)",
                  color: "#ff9800",
                  fontWeight: 900,
                  borderRadius: 2,
                  fontSize: "0.7rem",
                  letterSpacing: 1,
                  border: "1px solid rgba(255,152,0,0.2)",
                  mr: 2,
                }}
              />
            )}
            {user && !canEdit && (
              <Button
                onClick={async () => {
                  const isJoined = participants.some(
                    (p) => p.user_id === user.id,
                  );
                  const success = isJoined
                    ? await leaveVacation(user.id)
                    : await joinVacation(user.id);
                  if (success) onVacationUpdated();
                }}
                variant={
                  participants.some((p) => p.user_id === user.id)
                    ? "outlined"
                    : "contained"
                }
                size="small"
                startIcon={
                  participants.some((p) => p.user_id === user.id) ? (
                    <AddIcon sx={{ transform: "rotate(45deg)" }} />
                  ) : (
                    <AddIcon />
                  )
                }
                sx={{
                  mt: 2,
                  fontWeight: 800,
                  borderRadius: 2,
                }}
              >
                {participants.some((p) => p.user_id === user.id)
                  ? "Leave Trip"
                  : "Join Trip"}
              </Button>
            )}
          </Box>
          {canEdit && (
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                gap: 1,
                alignItems: "center",
                width: { xs: "100%", md: "auto" },
              }}
            >
              <Button
                onClick={() => setEditing(true)}
                variant="outlined"
                fullWidth={isMobile}
                startIcon={<EditIcon sx={{ fontSize: "1rem" }} />}
                sx={{
                  color: "rgba(255,255,255,0.6)",
                  borderColor: "rgba(255,255,255,0.1)",
                  "&:hover": {
                    bgcolor: "rgba(255,255,255,0.05)",
                    borderColor: "rgba(255,255,255,0.2)",
                  },
                  borderRadius: 2,
                  px: 2.5,
                  py: 1,
                  fontWeight: 700,
                  maxWidth: { xs: "none", md: "none" },
                }}
              >
                Edit
              </Button>
              {vacation.archived ? (
                <>
                  <Button
                    onClick={onRestore}
                    variant="outlined"
                    color="success"
                    startIcon={<RestoreIcon />}
                    sx={{ borderRadius: 2, fontWeight: 700, px: 2 }}
                    fullWidth={isMobile}
                  >
                    Restore
                  </Button>
                  <Button
                    onClick={onDeletePermanently}
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteIcon />}
                    sx={{ borderRadius: 2, fontWeight: 700, px: 2 }}
                    fullWidth={isMobile}
                  >
                    Delete
                  </Button>
                </>
              ) : (
                <Button
                  onClick={onArchive}
                  variant="outlined"
                  color="warning"
                  startIcon={<ArchiveIcon />}
                  sx={{ borderRadius: 2, fontWeight: 700, px: 2 }}
                  fullWidth={isMobile}
                >
                  Archive
                </Button>
              )}
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}
