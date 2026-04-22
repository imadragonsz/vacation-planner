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
        gap: 2,
        overflowX: "auto",
        pb: 2,
        px: 1,
        mx: -1,
        width: "calc(100% + 16px)",
        "&::-webkit-scrollbar": { height: 6 },
        "&::-webkit-scrollbar-thumb": {
          bgcolor: "rgba(255,255,255,0.1)",
          borderRadius: 10,
        },
      }}
    >
      {vacations.length > 0 ? (
        vacations.slice(0, 5).map((vac: any) => (
          <Box
            key={vac.id}
            onClick={() => onSelectVacation(vac)}
            sx={{
              minWidth: 220,
              p: 2.5,
              borderRadius: 4,
              bgcolor: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.05)",
              cursor: "pointer",
              transition: "all 0.2s",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              "&:hover": {
                bgcolor: "rgba(255,255,255,0.08)",
                borderColor: "#ca1d49",
                transform: "translateY(-2px)",
              },
            }}
          >
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 800, mb: 0.5, lineHeight: 1.2 }}
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
