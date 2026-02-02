import React from "react";
import {
  Box,
  Typography,
  Paper,
  Chip,
  Avatar,
  AvatarGroup,
  Tooltip,
  IconButton,
  Button,
  TextField,
} from "@mui/material";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import EventNoteIcon from "@mui/icons-material/EventNote";
import AddIcon from "@mui/icons-material/Add";
import { DatePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import { VacationLocation } from "../../hooks/useLocations";
import { ItemParticipant } from "../../hooks/useItemParticipants";
import { resolveAvatar } from "../../utils/avatars";

interface DestinationsTabProps {
  locations: VacationLocation[];
  canEdit: boolean;
  user: any;
  locationParticipants: Record<number, ItemParticipant[]>;
  editingLocId: number | null;
  setEditingLocId: (id: number | null) => void;
  editLocName: string;
  setEditLocName: (val: string) => void;
  editLocAddr: string;
  setEditLocAddr: (val: string) => void;
  editLocStart: string;
  setEditLocStart: (val: string) => void;
  editLocEnd: string;
  setEditLocEnd: (val: string) => void;
  handleUpdateLocation: (e: React.FormEvent) => void;
  setConfirmDeleteLocId: (id: number | null) => void;
  setSelectedLocation: (loc: VacationLocation) => void;
  setActiveTab: (tab: number) => void;
  leaveLocation: (locId: number, userId: string) => void;
  joinLocation: (locId: number, userId: string) => void;
  // Add Location Form Props
  newLocName: string;
  setNewLocName: (val: string) => void;
  newLocAddr: string;
  setNewLocAddr: (val: string) => void;
  newLocStart: string;
  setNewLocStart: (val: string) => void;
  newLocEnd: string;
  setNewLocEnd: (val: string) => void;
  handleAddLocation: (e: React.FormEvent) => void;
}

export const DestinationsTab: React.FC<DestinationsTabProps> = ({
  locations,
  canEdit,
  user,
  locationParticipants,
  editingLocId,
  setEditingLocId,
  editLocName,
  setEditLocName,
  editLocAddr,
  setEditLocAddr,
  editLocStart,
  setEditLocStart,
  editLocEnd,
  setEditLocEnd,
  handleUpdateLocation,
  setConfirmDeleteLocId,
  setSelectedLocation,
  setActiveTab,
  leaveLocation,
  joinLocation,
  newLocName,
  setNewLocName,
  newLocAddr,
  setNewLocAddr,
  newLocStart,
  setNewLocStart,
  newLocEnd,
  setNewLocEnd,
  handleAddLocation,
}) => {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          lg: canEdit ? "1fr 400px" : "1fr",
        },
        gap: { xs: 2.5, lg: 4 },
      }}
    >
      <Box>
        <Box sx={{ mb: 3, display: "flex", alignItems: "center", gap: 1.5 }}>
          <LocationOnIcon color="primary" sx={{ fontSize: 32 }} />
          <Typography variant="h5" sx={{ fontWeight: 900 }}>
            My Destinations
          </Typography>
          <Chip
            label={`${locations.length} stops`}
            size="small"
            sx={{
              bgcolor: (theme) =>
                theme.palette.mode === "dark"
                  ? "rgba(255,255,255,0.05)"
                  : "rgba(0,0,0,0.05)",
              fontWeight: 800,
            }}
          />
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "1fr 1fr",
              xl: "1fr 1fr 1fr",
            },
            gap: 3,
          }}
        >
          {locations.length === 0 ? (
            <Box
              sx={{
                gridColumn: "1 / -1",
                py: 10,
                textAlign: "center",
                bgcolor: (theme) =>
                  theme.palette.mode === "dark"
                    ? "rgba(255,255,255,0.02)"
                    : "rgba(0,0,0,0.02)",
                borderRadius: 4,
                border: (theme) =>
                  `1px dashed ${
                    theme.palette.mode === "dark"
                      ? "rgba(255,255,255,0.1)"
                      : "rgba(0,0,0,0.1)"
                  }`,
              }}
            >
              <LocationOnIcon sx={{ fontSize: 48, opacity: 0.1, mb: 2 }} />
              <Typography
                sx={{
                  color: "text.secondary",
                  fontWeight: 700,
                }}
              >
                No stops planned yet.
              </Typography>
            </Box>
          ) : (
            locations.map((loc) => (
              <Paper
                key={loc.id}
                elevation={0}
                onClick={() => {
                  if (editingLocId !== loc.id) {
                    setSelectedLocation(loc);
                    setActiveTab(2);
                  }
                }}
                sx={{
                  p: 3,
                  borderRadius: 4,
                  cursor: editingLocId === loc.id ? "default" : "pointer",
                  bgcolor: (theme) =>
                    theme.palette.mode === "dark"
                      ? "rgba(255,255,255,0.03)"
                      : "rgba(0,0,0,0.02)",
                  backdropFilter: "blur(10px)",
                  border: (theme) =>
                    theme.palette.mode === "dark"
                      ? "1px solid rgba(255,255,255,0.05)"
                      : "1px solid rgba(0,0,0,0.05)",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  position: "relative",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  minHeight: 220,
                  "&:hover": {
                    bgcolor: (theme) =>
                      theme.palette.mode === "dark"
                        ? "rgba(255,255,255,0.08)"
                        : "rgba(0,0,0,0.04)",
                    transform:
                      editingLocId === loc.id ? "none" : "translateY(-6px)",
                    borderColor: "primary.main",
                    boxShadow: (theme) =>
                      theme.palette.mode === "dark"
                        ? "0 12px 40px rgba(0,0,0,0.3)"
                        : "0 12px 40px rgba(0,0,0,0.08)",
                    "& .loc-actions": {
                      opacity: 1,
                      transform: "translateX(0)",
                    },
                  },
                }}
              >
                {editingLocId === loc.id ? (
                  <Box
                    component="form"
                    onClick={(e) => e.stopPropagation()}
                    onSubmit={handleUpdateLocation}
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 1.5,
                      height: "100%",
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: 900,
                        mb: 1,
                        color: "primary.main",
                        textTransform: "uppercase",
                        letterSpacing: 1,
                      }}
                    >
                      Editing Stop
                    </Typography>
                    <TextField
                      label="Name"
                      size="small"
                      fullWidth
                      value={editLocName}
                      onChange={(e) => setEditLocName(e.target.value)}
                      required
                      variant="filled"
                      sx={{
                        "& .MuiFilledInput-root": {
                          bgcolor: (theme) =>
                            theme.palette.mode === "dark"
                              ? "rgba(255,255,255,0.05)"
                              : "rgba(0,0,0,0.03)",
                        },
                      }}
                    />
                    <TextField
                      label="Address"
                      size="small"
                      fullWidth
                      value={editLocAddr}
                      onChange={(e) => setEditLocAddr(e.target.value)}
                      variant="filled"
                      sx={{
                        "& .MuiFilledInput-root": {
                          bgcolor: (theme) =>
                            theme.palette.mode === "dark"
                              ? "rgba(255,255,255,0.05)"
                              : "rgba(0,0,0,0.03)",
                        },
                      }}
                    />
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <DatePicker
                        label="Arrival"
                        value={editLocStart ? dayjs(editLocStart) : null}
                        onChange={(v) =>
                          setEditLocStart(v ? v.format("YYYY-MM-DD") : "")
                        }
                        slotProps={{
                          textField: {
                            size: "small",
                            variant: "filled",
                            sx: {
                              "& .MuiFilledInput-root": {
                                bgcolor: (theme) =>
                                  theme.palette.mode === "dark"
                                    ? "rgba(255,255,255,0.05)"
                                    : "rgba(0,0,0,0.03)",
                              },
                            },
                          },
                        }}
                      />
                      <DatePicker
                        label="Departure"
                        value={editLocEnd ? dayjs(editLocEnd) : null}
                        onChange={(v) =>
                          setEditLocEnd(v ? v.format("YYYY-MM-DD") : "")
                        }
                        slotProps={{
                          textField: {
                            size: "small",
                            variant: "filled",
                            sx: {
                              "& .MuiFilledInput-root": {
                                bgcolor: (theme) =>
                                  theme.palette.mode === "dark"
                                    ? "rgba(255,255,255,0.05)"
                                    : "rgba(0,0,0,0.03)",
                              },
                            },
                          },
                        }}
                      />
                    </Box>
                    <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                      <Button
                        size="small"
                        variant="contained"
                        type="submit"
                        fullWidth
                        sx={{ fontWeight: 800, borderRadius: 2 }}
                      >
                        Save Changes
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => setEditingLocId(null)}
                        fullWidth
                        sx={{
                          fontWeight: 800,
                          borderRadius: 2,
                          color: "text.secondary",
                          borderColor: (theme) =>
                            theme.palette.mode === "dark"
                              ? "rgba(255,255,255,0.1)"
                              : "rgba(0,0,0,0.1)",
                        }}
                      >
                        Cancel
                      </Button>
                    </Box>
                  </Box>
                ) : (
                  <>
                    <Box>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          mb: 2,
                        }}
                      >
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 900,
                            lineHeight: 1.2,
                            flex: 1,
                            mr: 1,
                            fontSize: "1.2rem",
                          }}
                        >
                          {loc.name}
                        </Typography>
                        <Box sx={{ display: "flex", gap: 0.5 }}>
                          {canEdit && (
                            <Box
                              className="loc-actions"
                              sx={{
                                display: "flex",
                                gap: 0.5,
                                opacity: 0,
                                transform: "translateX(10px)",
                                transition:
                                  "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                              }}
                            >
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
                                  bgcolor: (theme) =>
                                    theme.palette.mode === "dark"
                                      ? "rgba(255,255,255,0.05)"
                                      : "rgba(0,0,0,0.03)",
                                  color: "text.secondary",
                                  "&:hover": {
                                    color: "primary.main",
                                    bgcolor: (theme) =>
                                      theme.palette.mode === "dark"
                                        ? "rgba(255,255,255,0.1)"
                                        : "rgba(0,0,0,0.06)",
                                  },
                                }}
                              >
                                <EditIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setConfirmDeleteLocId(loc.id);
                                }}
                                sx={{
                                  bgcolor: "rgba(244, 67, 54, 0.05)",
                                  color: "error.main",
                                  opacity: 0.6,
                                  "&:hover": {
                                    opacity: 1,
                                    bgcolor: "rgba(244, 67, 54, 0.1)",
                                  },
                                }}
                              >
                                <DeleteIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Box>
                          )}
                        </Box>
                      </Box>

                      <Box
                        sx={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 1,
                          px: 1.5,
                          py: 0.8,
                          borderRadius: 2,
                          bgcolor: "rgba(33, 150, 243, 0.1)",
                          border: "1px solid rgba(33, 150, 243, 0.2)",
                          mb: 2,
                        }}
                      >
                        <EventNoteIcon
                          sx={{ fontSize: 14, color: "#2196f3" }}
                        />
                        <Typography
                          variant="caption"
                          sx={{
                            color: "#2196f3",
                            fontWeight: 900,
                            letterSpacing: 0.5,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {loc.start_date
                            ? dayjs(loc.start_date).format("MMM D")
                            : "TBD"}{" "}
                          —{" "}
                          {loc.end_date
                            ? dayjs(loc.end_date).format("MMM D")
                            : "TBD"}
                        </Typography>
                      </Box>

                      {loc.address && (
                        <Typography
                          variant="body2"
                          sx={{
                            color: "text.secondary",
                            fontWeight: 500,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            fontSize: "0.8rem",
                            lineHeight: 1.4,
                          }}
                        >
                          {loc.address}
                        </Typography>
                      )}
                    </Box>

                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mt: "auto",
                        pt: 3,
                      }}
                    >
                      <AvatarGroup
                        max={4}
                        sx={{
                          "& .MuiAvatar-root": {
                            width: 30,
                            height: 30,
                            fontSize: "0.75rem",
                            border: (theme) =>
                              `2px solid ${theme.palette.background.paper}`,
                            bgcolor: (theme) =>
                              theme.palette.mode === "dark"
                                ? "rgba(255,255,255,0.05)"
                                : "rgba(0,0,0,0.05)",
                            color: "text.primary",
                            fontWeight: 800,
                          },
                        }}
                      >
                        {(locationParticipants[loc.id] || []).map((p) => (
                          <Tooltip key={p.user_id} title={p.display_name}>
                            <Avatar src={resolveAvatar(p.avatar_url)}>
                              {!p.avatar_url && p.display_name?.charAt(0)}
                            </Avatar>
                          </Tooltip>
                        ))}
                      </AvatarGroup>

                      {user && canEdit && (
                        <Button
                          size="small"
                          variant={
                            locationParticipants[loc.id]?.some(
                              (p) => p.user_id === user.id,
                            )
                              ? "outlined"
                              : "contained"
                          }
                          onClick={(e) => {
                            e.stopPropagation();
                            const isJoined = locationParticipants[loc.id]?.some(
                              (p) => p.user_id === user.id,
                            );
                            if (isJoined) leaveLocation(loc.id, user.id);
                            else joinLocation(loc.id, user.id);
                          }}
                          sx={{
                            fontSize: "0.7rem",
                            fontWeight: 900,
                            px: 2,
                            height: 32,
                            borderRadius: "16px",
                            textTransform: "none",
                            ...(locationParticipants[loc.id]?.some(
                              (p) => p.user_id === user.id,
                            )
                              ? {
                                  borderColor: (theme) =>
                                    theme.palette.mode === "dark"
                                      ? "rgba(255,255,255,0.1)"
                                      : "rgba(0,0,0,0.1)",
                                  color: "text.secondary",
                                }
                              : {
                                  boxShadow: (theme) =>
                                    theme.palette.mode === "dark"
                                      ? "0 4px 12px rgba(33, 150, 243, 0.3)"
                                      : "0 4px 12px rgba(33, 150, 243, 0.2)",
                                }),
                          }}
                        >
                          {locationParticipants[loc.id]?.some(
                            (p) => p.user_id === user.id,
                          )
                            ? "Following"
                            : "Join"}
                        </Button>
                      )}
                    </Box>
                  </>
                )}
              </Paper>
            ))
          )}
        </Box>
      </Box>

      {canEdit && (
        <Box>
          <Paper
            elevation={0}
            sx={{
              p: 4,
              borderRadius: 4,
              bgcolor: (theme) =>
                theme.palette.mode === "dark"
                  ? "rgba(255,255,255,0.03)"
                  : "rgba(0,0,0,0.02)",
              backdropFilter: "blur(10px)",
              border: (theme) =>
                theme.palette.mode === "dark"
                  ? "1px solid rgba(255,255,255,0.05)"
                  : "1px solid rgba(0,0,0,0.05)",
              position: "sticky",
              top: 24,
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 900, mb: 3 }}>
              Add New Stop
            </Typography>
            <Box
              component="form"
              onSubmit={handleAddLocation}
              sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}
            >
              <TextField
                label="Where to?"
                placeholder="City or Landmark"
                value={newLocName}
                onChange={(e) => setNewLocName(e.target.value)}
                required
                fullWidth
                variant="filled"
                sx={{
                  "& .MuiFilledInput-root": {
                    bgcolor: (theme) =>
                      theme.palette.mode === "dark"
                        ? "rgba(255,255,255,0.05)"
                        : "rgba(0,0,0,0.03)",
                  },
                }}
              />
              <TextField
                label="Full Address (optional)"
                value={newLocAddr}
                onChange={(e) => setNewLocAddr(e.target.value)}
                fullWidth
                variant="filled"
                sx={{
                  "& .MuiFilledInput-root": {
                    bgcolor: (theme) =>
                      theme.palette.mode === "dark"
                        ? "rgba(255,255,255,0.05)"
                        : "rgba(0,0,0,0.03)",
                  },
                }}
              />
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 1.5,
                }}
              >
                <DatePicker
                  label="Arrival"
                  value={newLocStart ? dayjs(newLocStart) : null}
                  onChange={(v) =>
                    setNewLocStart(v ? v.format("YYYY-MM-DD") : "")
                  }
                  slotProps={{
                    textField: {
                      variant: "filled",
                      sx: {
                        "& .MuiFilledInput-root": {
                          bgcolor: (theme) =>
                            theme.palette.mode === "dark"
                              ? "rgba(255,255,255,0.05)"
                              : "rgba(0,0,0,0.03)",
                        },
                      },
                    },
                  }}
                />
                <DatePicker
                  label="Departure"
                  value={newLocEnd ? dayjs(newLocEnd) : null}
                  onChange={(v) =>
                    setNewLocEnd(v ? v.format("YYYY-MM-DD") : "")
                  }
                  slotProps={{
                    textField: {
                      variant: "filled",
                      sx: {
                        "& .MuiFilledInput-root": {
                          bgcolor: (theme) =>
                            theme.palette.mode === "dark"
                              ? "rgba(255,255,255,0.05)"
                              : "rgba(0,0,0,0.03)",
                        },
                      },
                    },
                  }}
                />
              </Box>
              <Button
                type="submit"
                variant="contained"
                disabled={!newLocName.trim()}
                startIcon={<AddIcon />}
                sx={{
                  py: 2,
                  fontWeight: 900,
                  borderRadius: 3,
                  fontSize: "1rem",
                  boxShadow: (theme) =>
                    theme.palette.mode === "dark"
                      ? "0 8px 24px rgba(33, 150, 243, 0.3)"
                      : "0 8px 24px rgba(33, 150, 243, 0.2)",
                }}
              >
                Add Destination
              </Button>
            </Box>
          </Paper>
        </Box>
      )}
    </Box>
  );
};
