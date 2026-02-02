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
import { NotificationMenu } from "./NotificationMenu";

export interface NavBarProps {
  theme: "dark" | "light";
  setTheme: (theme: "dark" | "light") => void;
  user: any;
  showAccount: boolean;
  showAdminPanel: boolean;
  showItinerary: boolean;
  setShowAccount: (show: boolean) => void;
  setShowAdminPanel?: (show: boolean) => void;
  setShowItinerary?: (show: boolean) => void;
  handleLogout: () => Promise<void>;
  setShowAuthModal?: (show: boolean) => void;
  onBackToTrips?: () => void;
}

const ADMIN_UUID = process.env.REACT_APP_ADMIN_UUID;

const NavBar: React.FC<NavBarProps> = React.memo(
  ({
    theme,
    setTheme,
    user,
    showAccount,
    showAdminPanel,
    showItinerary,
    setShowAccount,
    setShowAdminPanel,
    setShowItinerary,
    handleLogout,
    setShowAuthModal,
    onBackToTrips,
  }) => {
    const muiTheme = useTheme();
    const isMobile = useMediaQuery(muiTheme.breakpoints.down("sm"));

    return (
      <AppBar
        position="sticky"
        sx={{
          backgroundColor: (theme) =>
            theme.palette.mode === "dark"
              ? "rgba(18, 18, 18, 0.7)"
              : "rgba(255, 255, 255, 0.8)",
          backdropFilter: "blur(20px)",
          borderBottom: (theme) =>
            `1px solid ${
              theme.palette.mode === "dark"
                ? "rgba(255, 255, 255, 0.08)"
                : "rgba(0, 0, 0, 0.05)"
            }`,
          boxShadow: "none",
          mb: { xs: 0, sm: 2, md: 4 },
          color: "text.primary",
          zIndex: 1100,
        }}
      >
        <Toolbar
          sx={{
            display: "flex",
            justifyContent: "space-between",
            minHeight: { xs: 60, md: 72 },
            px: { xs: 1.5, sm: 3 },
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: { xs: 1, md: 2 },
            }}
          >
            {onBackToTrips && (
              <IconButton
                color="inherit"
                onClick={onBackToTrips}
                size="small"
                sx={{
                  mr: 0.5,
                  bgcolor: (theme) =>
                    theme.palette.mode === "dark"
                      ? "rgba(255,255,255,0.05)"
                      : "rgba(0,0,0,0.03)",
                }}
              >
                <ArrowBackIcon fontSize="small" />
              </IconButton>
            )}
            <Typography
              variant="h6"
              component="div"
              sx={{
                fontWeight: 950,
                letterSpacing: "-0.03em",
                fontSize: { xs: "1.2rem", md: "1.5rem" },
                background: (theme) =>
                  theme.palette.mode === "dark"
                    ? "linear-gradient(90deg, #fff 0%, rgba(255,255,255,0.5) 100%)"
                    : "linear-gradient(90deg, #1976d2 0%, #1565c0 100%)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Vacation
            </Typography>

            {!isMobile && user && (
              <Box
                sx={{
                  ml: { md: 6, sm: 3 },
                  display: "flex",
                  gap: { md: 4, sm: 2 },
                }}
              >
                <Button
                  color="inherit"
                  size="small"
                  onClick={() => {
                    setShowAccount(false);
                    setShowAdminPanel?.(false);
                    setShowItinerary?.(false);
                    onBackToTrips?.();
                  }}
                  sx={{
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    letterSpacing: "0.05em",
                    position: "relative",
                    opacity:
                      !showAccount && !showAdminPanel && !showItinerary
                        ? 1
                        : 0.6,
                    px: 1,
                    minWidth: "auto",
                    transition: "all 0.2s ease",
                    "&:after": {
                      content: '""',
                      position: "absolute",
                      bottom: -4,
                      left: 0,
                      width: "100%",
                      height: "2px",
                      background: muiTheme.palette.primary.main,
                      transform:
                        !showAccount && !showAdminPanel && !showItinerary
                          ? "scaleX(1)"
                          : "scaleX(0)",
                      transition: "transform 0.2s ease",
                    },
                    "&:hover": { opacity: 1, background: "transparent" },
                  }}
                >
                  DASHBOARD
                </Button>
                <Button
                  color="inherit"
                  size="small"
                  onClick={() => {
                    setShowAccount(false);
                    setShowAdminPanel?.(false);
                    setShowItinerary?.(true);
                  }}
                  sx={{
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    letterSpacing: "0.05em",
                    position: "relative",
                    opacity: showItinerary ? 1 : 0.6,
                    px: 1,
                    minWidth: "auto",
                    transition: "all 0.2s ease",
                    "&:after": {
                      content: '""',
                      position: "absolute",
                      bottom: -4,
                      left: 0,
                      width: "100%",
                      height: "2px",
                      background: muiTheme.palette.primary.main,
                      transform: showItinerary ? "scaleX(1)" : "scaleX(0)",
                      transition: "transform 0.2s ease",
                    },
                    "&:hover": { opacity: 1, background: "transparent" },
                  }}
                >
                  MY PLAN
                </Button>
                <Button
                  color="inherit"
                  size="small"
                  onClick={() => {
                    setShowAccount(true);
                    setShowAdminPanel?.(false);
                    setShowItinerary?.(false);
                  }}
                  sx={{
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    letterSpacing: "0.05em",
                    position: "relative",
                    opacity: showAccount ? 1 : 0.6,
                    px: 1,
                    minWidth: "auto",
                    transition: "all 0.2s ease",
                    "&:after": {
                      content: '""',
                      position: "absolute",
                      bottom: -4,
                      left: 0,
                      width: "100%",
                      height: "2px",
                      background: muiTheme.palette.primary.main,
                      transform: showAccount ? "scaleX(1)" : "scaleX(0)",
                      transition: "transform 0.2s ease",
                    },
                    "&:hover": { opacity: 1, background: "transparent" },
                  }}
                >
                  ACCOUNT
                </Button>
                {user.id === ADMIN_UUID && (
                  <Button
                    color="inherit"
                    size="small"
                    onClick={() => {
                      setShowAccount(false);
                      setShowAdminPanel?.(true);
                      setShowItinerary?.(false);
                    }}
                    sx={{
                      fontWeight: 700,
                      fontSize: "0.85rem",
                      letterSpacing: "0.05em",
                      position: "relative",
                      opacity: showAdminPanel ? 1 : 0.6,
                      px: 1,
                      minWidth: "auto",
                      transition: "all 0.2s ease",
                      "&:after": {
                        content: '""',
                        position: "absolute",
                        bottom: -4,
                        left: 0,
                        width: "100%",
                        height: "2px",
                        background: muiTheme.palette.primary.main,
                        transform: showAdminPanel ? "scaleX(1)" : "scaleX(0)",
                        transition: "transform 0.2s ease",
                      },
                      "&:hover": { opacity: 1, background: "transparent" },
                    }}
                  >
                    ADMIN
                  </Button>
                )}
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

            {user && <NotificationMenu userId={user.id} />}

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
  },
);

export default NavBar;
