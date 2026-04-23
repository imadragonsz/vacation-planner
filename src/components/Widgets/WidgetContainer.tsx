import React from "react";
import { Box, Paper, Typography, IconButton, useTheme } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";

export interface WidgetProps {
  id: string;
  title: string;
  onRemove?: () => void;
  children: React.ReactNode;
  dragHandleProps?: any;
  settings?: React.ReactNode;
}

export const WidgetContainer: React.FC<WidgetProps> = ({
  title,
  onRemove,
  children,
  dragHandleProps,
  settings,
}) => {
  const theme = useTheme();

  return (
    <Paper
      elevation={0}
      className={onRemove ? "react-grid-item" : ""}
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderRadius: 2,
        overflow: "hidden",
        bgcolor:
          theme.palette.mode === "dark"
            ? "#080809" // Slightly lighter than background for depth
            : "#ffffff",
        border: "1px solid",
        borderColor:
          theme.palette.mode === "dark"
            ? "rgba(255,255,255,0.18)" // Increased contrast
            : "rgba(0,0,0,0.12)",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        boxShadow:
          theme.palette.mode === "dark"
            ? "0 8px 32px rgba(0,0,0,0.85), inset 0 1px 1px rgba(255,255,255,0.06)"
            : "0 8px 32px rgba(0,0,0,0.1)",
        "&:hover": {
          borderColor: onRemove
            ? "rgba(255,255,255,0.35)"
            : "rgba(255,255,255,0.18)",
          transform: onRemove ? "translateY(-4px)" : "none",
          boxShadow:
            theme.palette.mode === "dark"
              ? onRemove
                ? "0 12px 48px rgba(0,0,0,0.95), inset 0 1px 1px rgba(255,255,255,0.12)"
                : "0 8px 32px rgba(0,0,0,0.85), inset 0 1px 1px rgba(255,255,255,0.06)"
              : onRemove
                ? "0 12px 48px rgba(0,0,0,0.15)"
                : "0 8px 32px rgba(0,0,0,0.1)",
        },
      }}
    >
      <Box
        sx={{
          px: 2,
          py: 1.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid",
          borderColor:
            theme.palette.mode === "dark"
              ? "rgba(255,255,255,0.12)"
              : "rgba(0,0,0,0.05)",
          bgcolor:
            theme.palette.mode === "dark"
              ? "rgba(255,255,255,0.03)"
              : "rgba(0,0,0,0.01)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {onRemove && (
            <Box
              {...dragHandleProps}
              sx={{
                cursor: "grab",
                display: "flex",
                opacity: 0.5,
                width: 44,
                height: 44,
                alignItems: "center",
                justifyContent: "center",
                ml: -1,
                "&:active": { cursor: "grabbing" },
              }}
            >
              <DragIndicatorIcon fontSize="small" />
            </Box>
          )}
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            {title}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          {settings}
          {onRemove && (
            <IconButton
              onClick={onRemove}
              sx={{
                width: 44,
                height: 44,
                opacity: 0.5,
                "&:hover": { opacity: 1, color: "error.main" },
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      </Box>
      <Box sx={{ p: 2.5, flex: 1, overflow: "auto" }}>{children}</Box>
    </Paper>
  );
};
