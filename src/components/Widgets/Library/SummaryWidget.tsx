import React from "react";
import { Box, Stack, Avatar, Typography } from "@mui/material";
import BeachAccessIcon from "@mui/icons-material/BeachAccess";

interface SummaryWidgetProps {
  activeTripsCount: number;
  destinationsCount: number;
}

const SummaryWidget: React.FC<SummaryWidgetProps> = ({
  activeTripsCount,
  destinationsCount,
}) => {
  return (
    <Box sx={{ p: 0 }}>
      <Stack spacing={2} direction="row" alignItems="center" sx={{ mb: 2.5 }}>
        <Avatar sx={{ bgcolor: "#ca1d49", width: 42, height: 42 }}>
          <BeachAccessIcon fontSize="small" />
        </Avatar>
        <Typography variant="h6" sx={{ fontWeight: 900, letterSpacing: -0.5 }}>
          Trip Stats
        </Typography>
      </Stack>
      <Typography variant="body2" sx={{ opacity: 0.5, mb: 4, fontWeight: 500 }}>
        Your global footprint.
      </Typography>
      <Stack spacing={2.5}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 700, opacity: 0.9 }}>
            Active Trips
          </Typography>
          <Typography
            variant="h5"
            sx={{ fontWeight: 1000, color: "#ca1d49", lineHeight: 1 }}
          >
            {activeTripsCount}
          </Typography>
        </Box>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 700, opacity: 0.9 }}>
            Destinations
          </Typography>
          <Typography
            variant="h5"
            sx={{ fontWeight: 1000, color: "#ca1d49", lineHeight: 1 }}
          >
            {destinationsCount}
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
};

export default SummaryWidget;
