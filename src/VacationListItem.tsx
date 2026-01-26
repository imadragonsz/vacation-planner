import React from "react";
import { Vacation } from "./vacation";
import { IconButton, Typography, Box, Tooltip, Chip } from "@mui/material";
import {
  Edit as EditIcon,
  Archive as ArchiveIcon,
  Restore as RestoreIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
} from "@mui/icons-material";
import { supabase } from "./supabaseClient";
import dayjs from "dayjs";

interface VacationListItemProps {
  vacation: Vacation;
  selected: boolean;
  disabled?: boolean;
  user?: any;
  onSelect?: (vac: Vacation) => void;
  onEdit?: (vac: Vacation) => void;
  onDelete?: (id: number) => void;
  onRestore?: (id: number) => void;
  onDeletedPermanently?: () => void;
}

const VacationListItem: React.FC<VacationListItemProps> = ({
  vacation,
  selected,
  disabled = false,
  user,
  onSelect,
  onEdit,
  onDelete,
  onRestore,
  onDeletedPermanently,
}) => {
  const isOwner = user && vacation.user_id === user.id;

  const getCountdown = () => {
    const start = dayjs(vacation.start_date);
    const now = dayjs().startOf("day");
    const diff = start.diff(now, "day");

    if (diff === 0) return { label: "Today!", color: "#4caf50" };
    if (diff === 1) return { label: "Tomorrow", color: "#81c784" };
    if (diff > 0) return { label: `${diff} days left`, color: "#1976d2" };

    // Check if ongoing
    const end = dayjs(vacation.end_date);
    if (now.isBefore(end) || now.isSame(end)) {
      return { label: "Ongoing", color: "#ff9800" };
    }
    return null; // Past
  };

  const countdown = getCountdown();

  const handleDelete = async (id: number) => {
    if (
      window.confirm(
        "Are you sure you want to permanently delete this vacation? This action cannot be undone.",
      )
    ) {
      const { error } = await supabase.from("vacations").delete().eq("id", id);
      if (error) {
        console.error("Error deleting vacation:", error);
      } else {
        onDeletedPermanently?.();
      }
    }
  };

  return (
    <Box
      component="li"
      sx={{
        opacity: disabled ? 0.6 : 1,
        pointerEvents: disabled ? "none" : "auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 16px",
        borderRadius: "12px",
        transition: "all 0.2s",
        mb: 0.5,
        cursor: "pointer",
        position: "relative",
        bgcolor: selected ? "rgba(25, 118, 210, 0.15)" : "transparent",
        "&:hover": {
          bgcolor: selected
            ? "rgba(25, 118, 210, 0.2)"
            : "rgba(255, 255, 255, 0.05)",
          "& .vac-actions": { opacity: 1 },
        },
        "&::before": {
          content: '""',
          position: "absolute",
          left: 0,
          top: "20%",
          bottom: "20%",
          width: 3,
          bgcolor: "primary.main",
          borderRadius: "0 4px 4px 0",
          opacity: selected ? 1 : 0,
          transition: "opacity 0.2s",
        },
      }}
      onClick={() => {
        if (!disabled && onSelect) onSelect(vacation);
      }}
    >
      <Box sx={{ flex: 1, minWidth: 0, mr: 1 }}>
        <Typography
          variant="body1"
          sx={{
            fontWeight: selected ? 800 : 700,
            color: selected ? "primary.main" : "rgba(255,255,255,0.8)",
            fontSize: "0.95rem",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            mb: 0.2,
          }}
        >
          {vacation.name}
        </Typography>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            flexWrap: "wrap",
            rowGap: 0.5,
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: "rgba(255, 255, 255, 0.4)",
              fontWeight: 600,
              display: "block",
              whiteSpace: "nowrap",
            }}
          >
            {new Date(vacation.start_date).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })}
            {" - "}
            {new Date(vacation.end_date).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })}
          </Typography>
          {countdown && (
            <Box
              sx={{
                px: 0.6,
                py: 0.1,
                borderRadius: "4px",
                bgcolor: `${countdown.color}22`,
                border: `1px solid ${countdown.color}44`,
                color: countdown.color,
                fontSize: "0.6rem",
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: 0.5,
                flexShrink: 0,
                whiteSpace: "nowrap",
              }}
            >
              {countdown.label}
            </Box>
          )}
          {vacation.archived && (
            <Chip
              label="ARCHIVED"
              size="small"
              sx={{
                height: 16,
                fontSize: "0.55rem",
                fontWeight: 900,
                bgcolor: "rgba(255, 152, 0, 0.1)",
                color: "#ff9800",
                border: "1px solid rgba(255, 152, 0, 0.2)",
                borderRadius: 1,
                "& .MuiChip-label": { px: 0.5 },
              }}
            />
          )}
          {isOwner && (
            <Chip
              label="YOU"
              size="small"
              sx={{
                height: 16,
                fontSize: "0.6rem",
                fontWeight: 900,
                bgcolor: "primary.main",
                color: "white",
                borderRadius: 1,
                "& .MuiChip-label": { px: 0.5 },
              }}
            />
          )}
          {!isOwner && vacation.user_id && (
            <Tooltip title={`Shared by: ${vacation.owner_name || "Anonymous"}`}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <PersonIcon
                  sx={{ fontSize: 14, color: "rgba(255,255,255,0.4)" }}
                />
                <Typography
                  variant="caption"
                  sx={{ color: "rgba(255,255,255,0.4)", fontWeight: 700 }}
                >
                  {vacation.owner_name || "Anonymous"}
                </Typography>
              </Box>
            </Tooltip>
          )}
        </Box>
      </Box>

      <Box
        className="vac-actions"
        sx={{
          display: isOwner ? "flex" : "none",
          gap: 0.5,
          opacity: selected ? 1 : 0,
          transition: "opacity 0.2s",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <Tooltip title="Edit">
          <IconButton
            size="small"
            onClick={() => onEdit && onEdit(vacation)}
            sx={{
              color: "rgba(255,255,255,0.4)",
              "&:hover": { color: "white" },
            }}
          >
            <EditIcon sx={{ fontSize: "1.1rem" }} />
          </IconButton>
        </Tooltip>

        {vacation.archived ? (
          <>
            <Tooltip title="Restore">
              <IconButton
                size="small"
                onClick={() => onRestore && onRestore(vacation.id)}
                sx={{ color: "#2ecc71", "&:hover": { color: "#45e68d" } }}
              >
                <RestoreIcon sx={{ fontSize: "1.1rem" }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete Permanently">
              <IconButton
                size="small"
                onClick={() => handleDelete(vacation.id)}
                sx={{ color: "#ff4444", "&:hover": { color: "#ff6666" } }}
              >
                <DeleteIcon sx={{ fontSize: "1.1rem" }} />
              </IconButton>
            </Tooltip>
          </>
        ) : (
          <Tooltip title="Archive">
            <IconButton
              size="small"
              onClick={() => onDelete && onDelete(vacation.id)}
              sx={{
                color: "rgba(255,255,255,0.4)",
                "&:hover": { color: "#ff4444" },
              }}
            >
              <ArchiveIcon sx={{ fontSize: "1.1rem" }} />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </Box>
  );
};

export default VacationListItem;
