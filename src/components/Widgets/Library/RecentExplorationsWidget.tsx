import React from "react";
import { Box, Typography } from "@mui/material";
import LocationOnIcon from "@mui/icons-material/LocationOn";

interface RecentExplorationsWidgetProps {
  vacations: any[];
  onSelectVacation: (vac: any) => void;
}

const RecentExplorationsWidget: React.FC<RecentExplorationsWidgetProps> = ({
  vacations,
  onSelectVacation,
}) => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 1.5,
      }}
    >
      {vacations.length > 0 ? (
        vacations
          .filter((v: any) => !v.archived)
          .slice(0, 5)
          .map((vac: any) => (
            <Box
              key={vac.id}
              onClick={() => onSelectVacation(vac)}
              sx={{
                p: 2,
                borderRadius: 1.5,
                bgcolor: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.06)",
                cursor: "pointer",
                transition: "all 0.2s",
                display: "flex",
                flexDirection: "column",
                "&:hover": {
                  bgcolor: "rgba(255,255,255,0.05)",
                  borderColor: "#ca1d49",
                  transform: "translateX(4px)",
                },
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 800,
                  mb: 0.5,
                  lineHeight: 1.2,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {vac.name}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  opacity: 0.6,
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                <LocationOnIcon sx={{ fontSize: 14, color: "#ca1d49" }} />{" "}
                {vac.destination}
              </Typography>
            </Box>
          ))
      ) : (
        <Box sx={{ py: 4, textAlign: "center", width: "100%", opacity: 0.5 }}>
          <Typography variant="body2">No recent trips found</Typography>
        </Box>
      )}
    </Box>
  );
};

export default RecentExplorationsWidget;
