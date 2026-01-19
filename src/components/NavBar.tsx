import React from "react";
import { AppBar, Toolbar, Button, Typography } from "@mui/material";

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
  return (
    <AppBar
      position="sticky"
      sx={{
        backgroundColor: "rgba(15, 17, 21, 0.8)",
        backdropFilter: "blur(10px)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
        boxShadow: "none",
        mb: 4,
      }}
    >
      <Toolbar style={{ display: "flex", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          <Typography
            variant="h6"
            component="div"
            sx={{ fontWeight: 800, letterSpacing: -0.5, mr: 2 }}
          >
            Vacation Planner
          </Typography>
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
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {user ? (
            <Button
              color="inherit"
              onClick={handleLogout}
              sx={{ fontWeight: 600 }}
            >
              Log Out
            </Button>
          ) : (
            <Button
              color="inherit"
              onClick={() => setShowAuthModal && setShowAuthModal(true)}
              sx={{ fontWeight: 600 }}
            >
              Login/Register
            </Button>
          )}
          <Button
            variant="outlined"
            size="small"
            color="inherit"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            sx={{ fontWeight: 600, ml: 1, borderRadius: 2 }}
          >
            {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
          </Button>
        </div>
      </Toolbar>
    </AppBar>
  );
};

export default NavBar;
