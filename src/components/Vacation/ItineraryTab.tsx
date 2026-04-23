import React from "react";
import {
  Box,
  Typography,
  Paper,
  Chip,
  Button,
  TextField,
  MenuItem,
  Stack,
} from "@mui/material";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import AddIcon from "@mui/icons-material/Add";
import TravelExploreIcon from "@mui/icons-material/TravelExplore";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EventNoteIcon from "@mui/icons-material/EventNote";
import EditIcon from "@mui/icons-material/Edit";
import { TEXT_LIMITS } from "../../utils/textLimits";
import { DatePicker, TimePicker } from "@mui/x-date-pickers";
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
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import dayjs from "dayjs";
import { VacationLocation } from "../../hooks/useLocations";
import { Agenda } from "../../hooks/useAgendas";
import { SortableAgendaItem } from "../SortableAgendaItem";
import WeatherForecast from "../WeatherForecast";
import { HotelInfo } from "../HotelInfo";
import { useHotels } from "../../hooks/useHotels";

interface ItineraryTabProps {
  locations: VacationLocation[];
  agendas: Agenda[];
  canEdit: boolean;
  isParticipant: boolean;
  tripStart?: string;
  tripEnd?: string;
  selectedLocation: VacationLocation | null;
  setSelectedLocation: (loc: VacationLocation | null) => void;
  selectedGeoLocation?: { lat: number; lng: number };
  // Agenda Form States
  newItemTitle: string;
  setNewItemTitle: (val: string) => void;
  newItemDate: string;
  setNewItemDate: (val: string) => void;
  newItemStartTime: string;
  setNewItemStartTime: (val: string) => void;
  newItemEndTime: string;
  setNewItemEndTime: (val: string) => void;
  newItemAddr: string;
  setNewItemAddr: (val: string) => void;
  newItemType: string;
  setNewItemType: (val: string) => void;
  newItemPrice: string;
  setNewItemPrice: (val: string) => void;
  isEditing: boolean;
  onCancelEdit?: () => void;
  handleAddItem: (e: React.FormEvent) => void;
  handleDragEnd: (event: DragEndEvent) => void;
  handleDeleteItem: (id: number) => void;
  // Participants & Actions
  user: any;
  agendaParticipants: { [key: number]: any[] };
  agendaVotes?: { [key: number]: any[] };
  joinVote?: (id: number, userId: string) => void;
  leaveVote?: (id: number, userId: string) => void;
  onEditAgenda: (ag: any) => void;
  joinAgenda: (id: number, userId: string) => void;
  leaveAgenda: (id: number, userId: string) => void;
  confirmDeleteAgendaId: number | null;
  setConfirmDeleteAgendaId: (id: number | null) => void;
}

export const ItineraryTab: React.FC<ItineraryTabProps> = ({
  locations,
  agendas,
  canEdit,
  isParticipant,
  tripStart,
  tripEnd,
  selectedLocation,
  setSelectedLocation,
  selectedGeoLocation,
  newItemTitle,
  setNewItemTitle,
  newItemDate,
  setNewItemDate,
  newItemStartTime,
  setNewItemStartTime,
  newItemAddr,
  setNewItemAddr,
  newItemType,
  setNewItemType,
  newItemPrice,
  setNewItemPrice,
  isEditing,
  onCancelEdit,
  handleAddItem,
  handleDragEnd,
  handleDeleteItem,
  user,
  agendaParticipants,
  agendaVotes = {},
  joinVote = () => {},
  leaveVote = () => {},
  onEditAgenda,
  joinAgenda,
  leaveAgenda,
  confirmDeleteAgendaId,
  setConfirmDeleteAgendaId,
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 10 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const { hotels, addHotel, deleteHotel, setSelectedHotel, updateHotel } =
    useHotels(selectedLocation?.id || 0);

  const filteredAgendas = agendas || [];

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", lg: "280px 1fr", xl: "320px 1fr" },
        gap: { xs: 2.5, lg: 4 },
        alignItems: "start",
        width: "100%",
        minWidth: 0,
      }}
    >
      {/* Navigation Sidebar */}
      <Box
        sx={{
          position: { lg: "sticky" },
          top: { lg: 24 },
          display: "flex",
          flexDirection: "column",
          gap: 2,
          width: "100%",
          minWidth: 0,
        }}
      >
        <Typography
          variant="overline"
          sx={{
            fontWeight: 900,
            opacity: 0.4,
            letterSpacing: 2,
            px: 1,
            display: { xs: "none", lg: "block" },
          }}
        >
          Trip Stops
        </Typography>

        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "row", lg: "column" },
            gap: 1.5,
            overflowX: { xs: "auto", lg: "visible" },
            pb: { xs: 2, lg: 0 },
            "&::-webkit-scrollbar": { display: "none" },
          }}
        >
          <Button
            onClick={() => setSelectedLocation(null)}
            variant={selectedLocation === null ? "contained" : "text"}
            startIcon={<EventNoteIcon />}
            sx={{
              justifyContent: "flex-start",
              borderRadius: 3,
              py: 1.5,
              px: 2,
              fontWeight: 900,
              textTransform: "none",
              minWidth: { xs: "160px", lg: "auto" },
              bgcolor:
                selectedLocation === null ? "primary.main" : "transparent",
              color:
                selectedLocation === null
                  ? "#fff"
                  : (theme) =>
                      theme.palette.mode === "dark"
                        ? "rgba(255,255,255,0.6)"
                        : "text.secondary",
              "&:hover": {
                bgcolor:
                  selectedLocation === null
                    ? "primary.dark"
                    : (theme) =>
                        theme.palette.mode === "dark"
                          ? "rgba(255,255,255,0.05)"
                          : "rgba(0,0,0,0.04)",
              },
            }}
          >
            Full Trip
          </Button>

          {locations.map((loc) => (
            <Button
              key={loc.id}
              onClick={() => setSelectedLocation(loc)}
              variant={selectedLocation?.id === loc.id ? "contained" : "text"}
              startIcon={
                <LocationOnIcon
                  sx={{
                    color:
                      selectedLocation?.id === loc.id ? "#fff" : "primary.main",
                    opacity: selectedLocation?.id === loc.id ? 1 : 0.6,
                  }}
                />
              }
              sx={{
                justifyContent: "flex-start",
                textAlign: "left",
                borderRadius: 3,
                py: 1.5,
                px: 2,
                fontWeight: 700,
                lineHeight: 1.2,
                textTransform: "none",
                minWidth: { xs: "180px", md: "auto" },
                bgcolor:
                  selectedLocation?.id === loc.id
                    ? "secondary.main"
                    : "transparent",
                color:
                  selectedLocation?.id === loc.id
                    ? "#fff"
                    : (theme) =>
                        theme.palette.mode === "dark"
                          ? "rgba(255,255,255,0.6)"
                          : "text.secondary",
                "&:hover": {
                  bgcolor:
                    selectedLocation?.id === loc.id
                      ? "secondary.dark"
                      : (theme) =>
                          theme.palette.mode === "dark"
                            ? "rgba(255,255,255,0.05)"
                            : "rgba(0,0,0,0.04)",
                },
              }}
            >
              <Box sx={{ ml: 0.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 800 }}>
                  {loc.name}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ opacity: 0.6, fontSize: "0.7rem" }}
                >
                  {dayjs(loc.start_date).format("MMM D")}{" "}
                  {dayjs(loc.end_date).format("MMM D")}
                </Typography>
              </Box>
            </Button>
          ))}
        </Box>
      </Box>

      {/* Main Content Area */}
      <Box>
        {!selectedLocation ? (
          <Box>
            <Box sx={{ mb: 5 }}>
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 900,
                  mb: 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                <TravelExploreIcon
                  sx={{ fontSize: 40, color: "primary.main" }}
                />
                Itinerary Overview
              </Typography>
              <Typography
                variant="body1"
                sx={{ opacity: 0.5, fontWeight: 700 }}
              >
                Select a destination to manage daily activities or see the full
                journey below.
              </Typography>
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(auto-fill, minmax(280px, 1fr))",
                },
                gap: { xs: 2, sm: 3 },
              }}
            >
              {locations.map((loc, idx) => (
                <Paper
                  key={loc.id}
                  onClick={() => setSelectedLocation(loc)}
                  sx={{
                    p: 3,
                    borderRadius: 4,
                    cursor: "pointer",
                    bgcolor: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.05)",
                    transition: "all 0.2s",
                    "&:hover": {
                      bgcolor: "rgba(255,255,255,0.08)",
                      transform: "translateY(-4px)",
                      borderColor: "primary.main",
                    },
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      mb: 2,
                    }}
                  >
                    <Chip
                      label={idx + 1}
                      size="small"
                      color="primary"
                      sx={{ fontWeight: 900 }}
                    />
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 900 }}>
                        {loc.name}
                      </Typography>
                      <Typography variant="caption" sx={{ opacity: 0.5 }}>
                        {dayjs(loc.start_date).format("MMM D")} -{" "}
                        {dayjs(loc.end_date).format("MMM D")}
                      </Typography>
                    </Box>
                  </Box>
                  <Box
                    sx={{
                      mt: "auto",
                      pt: 2,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      borderTop: "1px solid rgba(255,255,255,0.05)",
                    }}
                  >
                    <Typography
                      variant="button"
                      sx={{
                        color: "primary.main",
                        fontSize: "0.7rem",
                        fontWeight: 900,
                      }}
                    >
                      View Plans
                    </Typography>
                    <ArrowBackIcon
                      sx={{
                        fontSize: 16,
                        transform: "rotate(180deg)",
                        opacity: 0.3,
                      }}
                    />
                  </Box>
                </Paper>
              ))}
            </Box>
          </Box>
        ) : (
          <>
            <Box
              sx={{
                mb: 5,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                flexWrap: "wrap",
                gap: 3,
              }}
            >
              <Box>
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 900,
                    mb: 1.5,
                    fontSize: { xs: "1.75rem", md: "3rem" },
                    wordBreak: "break-word",
                  }}
                >
                  {selectedLocation.name}
                </Typography>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Typography
                    variant="body1"
                    sx={{ opacity: 0.5, fontWeight: 700 }}
                  >
                    {dayjs(selectedLocation.start_date).format("MMMM D")}{" "}
                    {dayjs(selectedLocation.end_date).format("MMMM D")}
                  </Typography>
                  {selectedGeoLocation?.lat && (
                    <WeatherForecast
                      lat={selectedGeoLocation.lat}
                      lng={selectedGeoLocation.lng}
                    />
                  )}
                </Stack>
              </Box>
              <Chip
                label={`${filteredAgendas.length} Activities`}
                sx={{
                  bgcolor: (theme) =>
                    theme.palette.mode === "dark"
                      ? "rgba(255,255,255,0.05)"
                      : "rgba(0,0,0,0.05)",
                  fontWeight: 800,
                  px: 1,
                  border: "1px solid",
                  borderColor: (theme) =>
                    theme.palette.mode === "dark"
                      ? "rgba(255,255,255,0.1)"
                      : "rgba(0,0,0,0.1)",
                }}
              />
            </Box>

            <Paper
              elevation={0}
              sx={{
                p: 3,
                mb: 4,
                borderRadius: 4,
                bgcolor: (theme) =>
                  theme.palette.mode === "dark"
                    ? "rgba(255,255,255,0.02)"
                    : "rgba(0,0,0,0.01)",
                border: "1px solid",
                borderColor: (theme) =>
                  theme.palette.mode === "dark"
                    ? "rgba(255,255,255,0.05)"
                    : "rgba(0,0,0,0.05)",
              }}
            >
              <HotelInfo
                hotels={hotels}
                canEdit={canEdit}
                onAdd={addHotel}
                onDelete={deleteHotel}
                onSelect={setSelectedHotel}
                onUpdate={updateHotel}
              />
            </Paper>

            {canEdit && (
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  mb: 4,
                  borderRadius: 4,
                  bgcolor: (theme) =>
                    theme.palette.mode === "dark"
                      ? "rgba(33, 150, 243, 0.05)"
                      : "rgba(33, 150, 243, 0.03)",
                  border: "1px solid",
                  borderColor: (theme) =>
                    theme.palette.mode === "dark"
                      ? "rgba(33, 150, 243, 0.1)"
                      : "rgba(33, 150, 243, 0.1)",
                }}
              >
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: 900, mb: 2.5, px: 0.5 }}
                >
                  Add Activity
                </Typography>
                <Box
                  component="form"
                  onSubmit={handleAddItem}
                  sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}
                >
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr", xl: "1fr 1fr" },
                      gap: 2,
                    }}
                  >
                    <DatePicker
                      label="Date"
                      value={newItemDate ? dayjs(newItemDate) : null}
                      minDate={
                        selectedLocation?.start_date
                          ? dayjs(selectedLocation.start_date)
                          : tripStart
                            ? dayjs(tripStart)
                            : undefined
                      }
                      maxDate={
                        selectedLocation?.end_date
                          ? dayjs(selectedLocation.end_date)
                          : tripEnd
                            ? dayjs(tripEnd)
                            : undefined
                      }
                      onChange={(v) =>
                        setNewItemDate(v ? v.format("YYYY-MM-DD") : "")
                      }
                      slotProps={{
                        textField: {
                          size: "small",
                          required: true,
                          variant: "filled",
                          sx: {
                            "& .MuiFilledInput-root": {
                              bgcolor: (theme) =>
                                theme.palette.mode === "dark"
                                  ? "rgba(255,255,255,0.03)"
                                  : "rgba(0,0,0,0.03)",
                            },
                          },
                        },
                      }}
                    />
                    <TimePicker
                      label="Time"
                      value={
                        newItemStartTime
                          ? dayjs(`2000-01-01T${newItemStartTime}`)
                          : null
                      }
                      onChange={(v) =>
                        setNewItemStartTime(v ? v.format("HH:mm") : "")
                      }
                      slotProps={{
                        textField: {
                          size: "small",
                          variant: "filled",
                          sx: {
                            "& .MuiFilledInput-root": {
                              bgcolor: (theme) =>
                                theme.palette.mode === "dark"
                                  ? "rgba(255,255,255,0.03)"
                                  : "rgba(0,0,0,0.03)",
                            },
                          },
                        },
                      }}
                    />
                  </Box>
                  <TextField
                    label="What are you doing?"
                    size="small"
                    value={newItemTitle}
                    onChange={(e) => setNewItemTitle(e.target.value)}
                    required
                    fullWidth
                    variant="filled"
                    inputProps={{ maxLength: TEXT_LIMITS.SHORT }}
                    sx={{
                      "& .MuiFilledInput-root": {
                        bgcolor: (theme) =>
                          theme.palette.mode === "dark"
                            ? "rgba(255,255,255,0.03)"
                            : "rgba(0,0,0,0.03)",
                      },
                    }}
                  />
                  <TextField
                    label="Address / Location (optional)"
                    size="small"
                    value={newItemAddr}
                    onChange={(e) => setNewItemAddr(e.target.value)}
                    fullWidth
                    variant="filled"
                    inputProps={{ maxLength: TEXT_LIMITS.MEDIUM }}
                    sx={{
                      "& .MuiFilledInput-root": {
                        bgcolor: (theme) =>
                          theme.palette.mode === "dark"
                            ? "rgba(255,255,255,0.03)"
                            : "rgba(0,0,0,0.03)",
                      },
                    }}
                  />
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: {
                        xs: "1fr",
                        xl: isEditing ? "1fr 1fr auto auto" : "1fr 1fr auto",
                      },
                      gap: 2,
                      alignItems: "center",
                    }}
                  >
                    <TextField
                      select
                      fullWidth
                      size="small"
                      label="Category"
                      value={newItemType}
                      onChange={(e) => setNewItemType(e.target.value)}
                      variant="filled"
                      sx={{
                        "& .MuiFilledInput-root": {
                          bgcolor: (theme) =>
                            theme.palette.mode === "dark"
                              ? "rgba(255,255,255,0.03)"
                              : "rgba(0,0,0,0.03)",
                        },
                      }}
                    >
                      <MenuItem value="activity">Activity</MenuItem>
                      <MenuItem value="daytrip">Day Trip</MenuItem>
                      <MenuItem value="food">Dining</MenuItem>
                      <MenuItem value="flight">Travel</MenuItem>
                      <MenuItem value="hotel">Stay</MenuItem>
                      <MenuItem value="note">Note</MenuItem>
                    </TextField>
                    <TextField
                      label="Cost (est.)"
                      size="small"
                      type="number"
                      value={newItemPrice}
                      onChange={(e) => setNewItemPrice(e.target.value)}
                      fullWidth
                      InputProps={{ startAdornment: "$" }}
                      variant="filled"
                      sx={{
                        "& .MuiFilledInput-root": {
                          bgcolor: (theme) =>
                            theme.palette.mode === "dark"
                              ? "rgba(255,255,255,0.03)"
                              : "rgba(0,0,0,0.03)",
                        },
                      }}
                    />
                    <Button
                      type="submit"
                      variant="contained"
                      startIcon={isEditing ? <EditIcon /> : <AddIcon />}
                      sx={{
                        fontWeight: 900,
                        px: 4,
                        height: 48,
                        borderRadius: 2,
                      }}
                    >
                      {isEditing ? "Save Changes" : "Add to Plan"}
                    </Button>
                    {isEditing && (
                      <Button
                        onClick={onCancelEdit}
                        variant="outlined"
                        sx={{
                          fontWeight: 700,
                          px: 3,
                          height: 48,
                          borderRadius: 2,
                        }}
                      >
                        Cancel
                      </Button>
                    )}
                  </Box>
                </Box>
              </Paper>
            )}

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={filteredAgendas.map((a) => a.id)}
                strategy={verticalListSortingStrategy}
              >
                <Stack spacing={2}>
                  {filteredAgendas.length === 0 ? (
                    <Box
                      sx={{
                        py: 8,
                        textAlign: "center",
                        bgcolor: (theme) =>
                          theme.palette.mode === "dark"
                            ? "rgba(255,255,255,0.01)"
                            : "rgba(0,0,0,0.01)",
                        borderRadius: 4,
                        border: (theme) =>
                          `1px dashed ${
                            theme.palette.mode === "dark"
                              ? "rgba(255,255,255,0.1)"
                              : "rgba(0,0,0,0.1)"
                          }`,
                      }}
                    >
                      <CalendarMonthIcon
                        sx={{ fontSize: 48, opacity: 0.1, mb: 2 }}
                      />
                      <Typography
                        sx={{ color: "text.secondary", fontWeight: 700 }}
                      >
                        Nothing planned here yet.
                      </Typography>
                    </Box>
                  ) : (
                    filteredAgendas.map((ag) => (
                      <SortableAgendaItem
                        key={ag.id}
                        ag={ag}
                        canEdit={canEdit}
                        isParticipant={isParticipant}
                        user={user}
                        participants={agendaParticipants[ag.id] || []}
                        onEdit={onEditAgenda}
                        onDelete={handleDeleteItem}
                        onJoin={joinAgenda}
                        onLeave={leaveAgenda}
                        votes={agendaVotes[ag.id] || []}
                        onJoinVote={joinVote}
                        onLeaveVote={leaveVote}
                        lat={selectedGeoLocation?.lat}
                        lng={selectedGeoLocation?.lng}
                        isConfirmingDelete={confirmDeleteAgendaId === ag.id}
                        setConfirmDeleteId={setConfirmDeleteAgendaId}
                      />
                    ))
                  )}
                </Stack>
              </SortableContext>
            </DndContext>
          </>
        )}
      </Box>
    </Box>
  );
};
