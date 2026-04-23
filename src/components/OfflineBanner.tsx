import React from "react";
import { Box, Typography, Slide } from "@mui/material";
import WifiOffIcon from "@mui/icons-material/WifiOff";
import { useOnlineStatus } from "../hooks/useOnlineStatus";

export const OfflineBanner: React.FC = () => {
  const isOnline = useOnlineStatus();

  return (
    <Slide direction="down" in={!isOnline} mountOnEnter unmountOnExit>
      <Box
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          bgcolor: "rgba(211, 47, 47, 0.9)",
          backdropFilter: "blur(8px)",
          color: "white",
          py: 1,
          px: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 1,
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        <WifiOffIcon fontSize="small" />
        <Typography variant="body2" fontWeight="medium">
          You are currently viewing offline data. Some features may be limited.
        </Typography>
      </Box>
    </Slide>
  );
};
