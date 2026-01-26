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

export function SortableAgendaItem({
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
}: SortableAgendaItemProps) {
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
        p: { xs: 1.5, sm: 2 },
        borderRadius: 2,
        bgcolor: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.05)",
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        alignItems: { xs: "stretch", sm: "center" },
        gap: { xs: 1, sm: 2 },
        position: "relative",
        transition: "all 0.2s",
        "&:hover": {
          bgcolor: "rgba(255,255,255,0.04)",
          borderColor: "rgba(255,255,255,0.1)",
          "& .agenda-actions": { opacity: 1 },
          "& .drag-handle": { opacity: 0.8 },
        },
        ...(isDragging && {
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          borderColor: "primary.main",
          bgcolor: "rgba(255,255,255,0.08)",
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
                opacity: 0.7,
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
          sx={{ opacity: 0.1, display: { xs: "none", sm: "block" } }}
        />

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box
            sx={{ display: "flex", alignItems: "flex-start", gap: 1, mb: 0.5 }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 24,
                height: 24,
                borderRadius: 1,
                bgcolor: "rgba(255,255,255,0.03)",
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
                opacity: 0.4,
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
          <Box sx={{ display: "flex", alignItems: "center", mt: 0.5 }}>
            <AvatarGroup
              max={3}
              sx={{
                "& .MuiAvatar-root": {
                  width: 20,
                  height: 20,
                  fontSize: "0.55rem",
                },
              }}
            >
              {participants.map((p: any) => (
                <Tooltip key={p.user_id} title={p.display_name}>
                  <Avatar>{p.display_name?.charAt(0)}</Avatar>
                </Tooltip>
              ))}
            </AvatarGroup>
          </Box>
        </Box>
      </Box>

      <Box
        className="agenda-actions"
        sx={{
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 0.5,
          opacity: { xs: 1, sm: 0.6 },
          transition: "opacity 0.2s",
          mt: { xs: 1, sm: 0 },
          justifyContent: { xs: "flex-end", sm: "flex-start" },
          borderTop: { xs: "1px solid rgba(255,255,255,0.05)", sm: "none" },
          pt: { xs: 1, sm: 0 },
        }}
      >
        {user && canEdit && (
          <Button
            size="small"
            onClick={() =>
              isJoined ? onLeave(ag.id, user.id) : onJoin(ag.id, user.id)
            }
            sx={{
              fontSize: "0.6rem",
              minWidth: "auto",
              px: 1,
              py: 0.1,
              borderRadius: 1,
              fontWeight: 800,
              color: isJoined ? "secondary.main" : "primary.main",
            }}
          >
            {isJoined ? "Leave" : "Join"}
          </Button>
        )}
        {ag.address && (
          <Button
            size="small"
            variant="text"
            onClick={() => {
              const routeUrl = `https://www.openstreetmap.org/directions?route=;${encodeURIComponent(
                ag.address || "",
              )}`;
              window.open(routeUrl, "_blank");
            }}
            sx={{
              borderRadius: 1,
              fontSize: "0.7rem",
              py: 0.2,
              color: "primary.main",
              textTransform: "none",
              fontWeight: 700,
            }}
          >
            Route
          </Button>
        )}
        {canEdit && (
          <>
            <IconButton
              size="small"
              onClick={() => onEdit(ag)}
              sx={{
                color: "rgba(255,255,255,0.4)",
                "&:hover": { color: "white" },
              }}
            >
              <EditIcon sx={{ fontSize: "1.1rem" }} />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => setConfirmDeleteId(ag.id)}
              sx={{
                color: "rgba(255,20,20,0.3)",
                "&:hover": { color: "error.main" },
              }}
            >
              <DeleteIcon sx={{ fontSize: "1.1rem" }} />
            </IconButton>
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
}
