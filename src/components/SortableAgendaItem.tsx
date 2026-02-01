import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Box,
  Paper,
  Typography,
  Divider,
  IconButton,
  Tooltip,
  AvatarGroup,
  Avatar,
  Button,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import { Agenda } from "../hooks/useAgendas";
import { getTravelIcon } from "../utils/icons";
import ConfirmDialog from "../ConfirmDialog";

interface SortableAgendaItemProps {
  ag: Agenda;
  canEdit: boolean;
  user: any;
  participants: any[];
  onEdit: (ag: Agenda) => void;
  onDelete: (id: number) => void;
  onJoin: (id: number, userId: string) => void;
  onLeave: (id: number, userId: string) => void;
  isConfirmingDelete: boolean;
  setConfirmDeleteId: (id: number | null) => void;
}

export const SortableAgendaItem = React.memo(
  ({
    ag,
    canEdit,
    user,
    participants = [],
    onEdit,
    onDelete,
    onJoin,
    onLeave,
    isConfirmingDelete,
    setConfirmDeleteId,
  }: SortableAgendaItemProps) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: ag.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      zIndex: isDragging ? 10 : 1,
      opacity: isDragging ? 0.3 : 1,
    };

    const isJoined = user && participants.some((p) => p.user_id === user.id);

    return (
      <Paper
        ref={setNodeRef}
        style={style}
        elevation={0}
        sx={{
          p: { xs: 2, sm: 2.5 },
          borderRadius: 3,
          bgcolor: (theme) =>
            theme.palette.mode === "dark"
              ? "rgba(255,255,255,0.02)"
              : "rgba(0,0,0,0.01)",
          backdropFilter: "blur(10px)",
          border: (theme) =>
            theme.palette.mode === "dark"
              ? "1px solid rgba(255,255,255,0.05)"
              : "1px solid rgba(0,0,0,0.05)",
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "stretch", sm: "center" },
          gap: { xs: 2, sm: 3 },
          position: "relative",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          mb: 1,
          "&:hover": {
            bgcolor: (theme) =>
              theme.palette.mode === "dark"
                ? "rgba(255,255,255,0.05)"
                : "rgba(0,0,0,0.03)",
            borderColor: "primary.main",
            transform: "translateX(4px)",
            "& .agenda-actions": { opacity: 1, transform: "scale(1)" },
            "& .drag-handle": { opacity: 0.8 },
          },
          ...(isDragging && {
            boxShadow: (theme) =>
              theme.palette.mode === "dark"
                ? "0 12px 48px rgba(0,0,0,0.5)"
                : "0 12px 48px rgba(0,0,0,0.1)",
            borderColor: "primary.main",
            bgcolor: (theme) =>
              theme.palette.mode === "dark"
                ? "rgba(255,255,255,0.1)"
                : "rgba(255,255,255,0.9)",
            zIndex: 999,
          }),
        }}
      >
        {/* Header section with Date, Icon and Text */}
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            gap: { xs: 1.5, sm: 2 },
            flex: 1,
            minWidth: 0,
          }}
        >
          {canEdit && (
            <Box
              className="drag-handle"
              {...attributes}
              {...listeners}
              sx={{
                cursor: "grab",
                opacity: 0.1,
                transition: "opacity 0.2s",
                "&:active": { cursor: "grabbing" },
                display: "flex",
                alignItems: "center",
                mt: 1,
              }}
            >
              <DragIndicatorIcon fontSize="small" />
            </Box>
          )}

          {/* Date Block */}
          <Box sx={{ minWidth: { xs: 45, sm: 60 }, textAlign: "center" }}>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 800,
                color: "primary.main",
                textTransform: "uppercase",
                fontSize: "0.65rem",
                letterSpacing: 1,
              }}
            >
              {new Date(ag.agenda_date).toLocaleDateString(undefined, {
                month: "short",
              })}
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 900, lineHeight: 1 }}>
              {new Date(ag.agenda_date).getDate()}
            </Typography>
            {ag.Time && (
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  fontWeight: 700,
                  mt: 0.5,
                  color: "text.secondary",
                  fontSize: "0.7rem",
                }}
              >
                {ag.Time.slice(0, 5)}
              </Typography>
            )}
          </Box>

          <Divider
            orientation="vertical"
            flexItem
            sx={{
              display: { xs: "none", sm: "block" },
              opacity: (theme) => (theme.palette.mode === "dark" ? 0.1 : 0.4),
            }}
          />

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "flex-start",
                gap: 1,
                mb: 0.5,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 24,
                  height: 24,
                  borderRadius: 1,
                  bgcolor: (theme) =>
                    theme.palette.mode === "dark"
                      ? "rgba(255,255,255,0.03)"
                      : "rgba(0,0,0,0.04)",
                  color: "primary.main",
                  flexShrink: 0,
                  mt: 0.2,
                }}
              >
                {getTravelIcon(ag.type || "activity")}
              </Box>
              <Typography
                sx={{
                  fontWeight: 700,
                  fontSize: "1rem",
                  lineHeight: 1.2,
                  wordBreak: "break-word",
                }}
              >
                {ag.description}
              </Typography>
            </Box>

            {ag.address && (
              <Typography
                variant="caption"
                sx={{
                  color: "text.secondary",
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  mt: 0.2,
                  wordBreak: "break-all",
                }}
              >
                <LocationOnIcon sx={{ fontSize: 13 }} />
                {ag.address}
              </Typography>
            )}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mt: 1.5,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <AvatarGroup
                  max={4}
                  sx={{
                    "& .MuiAvatar-root": {
                      width: 24,
                      height: 24,
                      fontSize: "0.65rem",
                      border: (theme) =>
                        `2px solid ${theme.palette.background.paper}`,
                      bgcolor: (theme) =>
                        theme.palette.mode === "dark"
                          ? "rgba(255,255,255,0.1)"
                          : "rgba(0,0,0,0.05)",
                    },
                  }}
                >
                  {participants.map((p: any) => (
                    <Tooltip key={p.user_id} title={p.display_name}>
                      <Avatar src={p.avatar_url || undefined}>
                        {!p.avatar_url &&
                          p.display_name?.charAt(0).toUpperCase()}
                      </Avatar>
                    </Tooltip>
                  ))}
                </AvatarGroup>
                {participants.length > 0 && (
                  <Typography
                    variant="caption"
                    sx={{ color: "text.secondary", fontWeight: 700 }}
                  >
                    {participants.length} Joining
                  </Typography>
                )}
              </Box>

              {user && canEdit && (
                <Button
                  size="small"
                  variant={isJoined ? "outlined" : "contained"}
                  onClick={() =>
                    isJoined ? onLeave(ag.id, user.id) : onJoin(ag.id, user.id)
                  }
                  sx={{
                    fontSize: "0.65rem",
                    minWidth: "auto",
                    px: 1.5,
                    py: 0.3,
                    borderRadius: 2,
                    fontWeight: 900,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    ...(isJoined
                      ? {
                          borderColor: (theme) =>
                            theme.palette.mode === "dark"
                              ? "rgba(33, 150, 243, 0.2)"
                              : "rgba(33, 150, 243, 0.4)",
                          color: "primary.main",
                          bgcolor: (theme) =>
                            theme.palette.mode === "dark"
                              ? "rgba(33, 150, 243, 0.05)"
                              : "rgba(33, 150, 243, 0.08)",
                        }
                      : {
                          bgcolor: "primary.main",
                          boxShadow: (theme) =>
                            theme.palette.mode === "dark"
                              ? "0 4px 12px rgba(33, 150, 243, 0.3)"
                              : "0 4px 12px rgba(33, 150, 243, 0.2)",
                        }),
                  }}
                >
                  {isJoined ? "Joined" : "Join"}
                </Button>
              )}
            </Box>
          </Box>
        </Box>

        <Box
          className="agenda-actions"
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            opacity: { xs: 1, sm: 0 },
            transform: { xs: "none", sm: "scale(0.9)" },
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            mt: { xs: 1, sm: 0 },
            justifyContent: "flex-end",
          }}
        >
          {ag.address && (
            <Tooltip title="View Route">
              <IconButton
                size="small"
                onClick={() => {
                  const routeUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                    ag.address || "",
                  )}`;
                  window.open(routeUrl, "_blank");
                }}
                sx={{
                  color: "text.secondary",
                  "&:hover": {
                    color: "primary.main",
                    bgcolor: (theme) =>
                      theme.palette.mode === "dark"
                        ? "rgba(33, 150, 243, 0.1)"
                        : "rgba(33, 150, 243, 0.08)",
                  },
                }}
              >
                <LocationOnIcon sx={{ fontSize: "1.1rem" }} />
              </IconButton>
            </Tooltip>
          )}
          {canEdit && (
            <>
              <Tooltip title="Edit">
                <IconButton
                  size="small"
                  onClick={() => onEdit(ag)}
                  sx={{
                    color: "text.secondary",
                    "&:hover": {
                      color: "text.primary",
                      bgcolor: (theme) =>
                        theme.palette.mode === "dark"
                          ? "rgba(255,255,255,0.05)"
                          : "rgba(0,0,0,0.04)",
                    },
                  }}
                >
                  <EditIcon sx={{ fontSize: "1.1rem" }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete">
                <IconButton
                  size="small"
                  onClick={() => setConfirmDeleteId(ag.id)}
                  sx={{
                    color: (theme) =>
                      theme.palette.mode === "dark"
                        ? "rgba(211, 47, 47, 0.6)"
                        : "rgba(211, 47, 47, 0.5)",
                    "&:hover": {
                      color: "error.main",
                      bgcolor: (theme) =>
                        theme.palette.mode === "dark"
                          ? "rgba(211, 47, 47, 0.1)"
                          : "rgba(211, 47, 47, 0.08)",
                    },
                  }}
                >
                  <DeleteIcon sx={{ fontSize: "1.1rem" }} />
                </IconButton>
              </Tooltip>
            </>
          )}
        </Box>
        <ConfirmDialog
          open={isConfirmingDelete}
          message="Delete this agenda item?"
          onConfirm={() => onDelete(ag.id)}
          onCancel={() => setConfirmDeleteId(null)}
        />
      </Paper>
    );
  },
);
