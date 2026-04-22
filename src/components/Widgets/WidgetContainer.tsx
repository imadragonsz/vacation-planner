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
}

export const WidgetContainer: React.FC<WidgetProps> = ({
  title,
  onRemove,
  children,
  dragHandleProps,
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
        borderRadius: 4,
        overflow: "hidden",
        bgcolor:
          theme.palette.mode === "dark"
            ? "rgba(255,255,255,0.03)"
            : "rgba(0,0,0,0.02)",
        border: "1px solid rgba(255,255,255,0.05)",
        transition: "transform 0.2s, box-shadow 0.2s",
        "&:hover": {
          borderColor: "primary.main",
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
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          bgcolor: "rgba(0,0,0,0.1)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
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
            }}
          >
            <DragIndicatorIcon fontSize="small" />
          </Box>
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
      <Box sx={{ p: 2.5, flex: 1, overflow: "auto" }}>{children}</Box>
    </Paper>
  );
};
