import React from "react";
import {
  AppBar,
  Toolbar,
  Button,
  Typography,
  Box,
  IconButton,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

export interface NavBarProps {
  theme: "dark" | "light";
  setTheme: (theme: "dark" | "light") => void;
  user: any;
  setShowAccount: (show: boolean) => void;
  setShowItinerary?: (show: boolean) => void;
  setShowCalendar: (show: boolean) => void;
  handleLogout: () => Promise<void>;
  setShowAuthModal?: (show: boolean) => void;
  onCalendarToggle: () => void;
  onBackToTrips?: () => void;
}

const NavBar: React.FC<NavBarProps> = ({
  theme,
  setTheme,
  user,
  setShowAccount,
  setShowItinerary,
  setShowCalendar,
  handleLogout,
  setShowAuthModal,
  onBackToTrips,
}) => {
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down("md"));

  return (
    <AppBar
      position="sticky"
      sx={{
        backgroundColor: "rgba(15, 17, 21, 0.8)",
        backdropFilter: "blur(10px)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
        boxShadow: "none",
        mb: { xs: 1, md: 4 },
      }}
    >
      <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: { xs: "8px", md: "16px" },
          }}
        >
          {isMobile && onBackToTrips && (
            <IconButton
              color="inherit"
              onClick={onBackToTrips}
              size="small"
              sx={{ mr: 0.5 }}
            >
              <ArrowBackIcon fontSize="small" />
            </IconButton>
          )}
          <Typography
            variant="h6"
            component="div"
            sx={{
              fontWeight: 800,
              letterSpacing: -0.5,
              fontSize: { xs: "1.1rem", md: "1.25rem" },
            }}
          >
            Vacation Planner
          </Typography>

          {!isMobile && (
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                color="inherit"
                onClick={() => {
                  if (onBackToTrips) {
                    onBackToTrips();
                  } else {
                    setShowAccount(false);
                    setShowCalendar(false);
                    if (setShowItinerary) setShowItinerary(false);
                  }
                }}
                sx={{ fontWeight: 600 }}
              >
                Home
              </Button>
              <Button
                color="inherit"
                onClick={() => {
                  setShowAccount(false);
                  setShowCalendar(false);
                  if (setShowItinerary) setShowItinerary(true);
                }}
                disabled={!user}
                sx={{ fontWeight: 600 }}
              >
                My Plan
              </Button>
              <Button
                color="inherit"
                onClick={() => {
                  setShowAccount(false);
                  setShowCalendar(true);
                  if (setShowItinerary) setShowItinerary(false);
                }}
                sx={{ fontWeight: 600 }}
              >
                Calendar
              </Button>
              <Button
                color="inherit"
                onClick={() => user && setShowAccount(true)}
                disabled={!user}
                sx={{ fontWeight: 600 }}
              >
                Account
              </Button>
            </Box>
          )}
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {user ? (
            isMobile ? (
              <IconButton color="inherit" onClick={handleLogout} size="small">
                <LogoutIcon fontSize="small" />
              </IconButton>
            ) : (
              <Button
                color="inherit"
                onClick={handleLogout}
                sx={{ fontWeight: 600 }}
              >
                Log Out
              </Button>
            )
          ) : (
            <Button
              color="inherit"
              onClick={() => setShowAuthModal && setShowAuthModal(true)}
              sx={{
                fontWeight: 600,
                fontSize: isMobile ? "0.8rem" : "0.875rem",
              }}
            >
              Login
            </Button>
          )}

          <IconButton
            size="small"
            color="inherit"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            sx={{ ml: 0.5 }}
          >
            {theme === "dark" ? (
              <LightModeIcon fontSize="small" />
            ) : (
              <DarkModeIcon fontSize="small" />
            )}
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default NavBar;
