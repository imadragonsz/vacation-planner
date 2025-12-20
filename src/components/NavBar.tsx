import React from "react";
import { useNavigate } from "react-router-dom";

export interface NavBarProps {
  themeVars: any;
  theme: "dark" | "light";
  setTheme: (theme: "dark" | "light") => void;
  user: any;
  setShowAccount: (show: boolean) => void;
  setShowCalendar: (show: boolean) => void;
  handleLogout: () => Promise<void>;
  setShowAuthModal?: (show: boolean) => void; // Optional prop for showing auth modal
  onCalendarToggle: () => void; // Prop for toggling the calendar
}

const NavBar: React.FC<NavBarProps> = ({
  themeVars,
  theme,
  setTheme,
  user,
  setShowAccount,
  setShowCalendar,
  handleLogout,
  setShowAuthModal,
  onCalendarToggle,
}) => {
  const navigate = useNavigate();

  return (
    <nav
      className="vp-nav"
      aria-label="Main navigation"
      style={{
        width: "100%",
        background: themeVars.card,
        boxShadow: themeVars.shadow,
        padding: "16px 0",
        marginBottom: 32,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 32,
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      <button
        className="vp-nav-btn"
        aria-label="Go to Home"
        title="Home"
        onClick={() => {
          setShowAccount(false);
          setShowCalendar(false);
        }}
        style={{
          background: "none",
          border: "none",
          color: themeVars.text,
          fontWeight: 700,
          fontSize: 22,
          cursor: "pointer",
          letterSpacing: 1,
          outline: "2px solid transparent",
          outlineOffset: 2,
          minWidth: 44,
          minHeight: 44,
        }}
        tabIndex={0}
      >
        Home
      </button>
      <button
        className="vp-nav-btn"
        aria-label="Show Calendar"
        title="Calendar"
        onClick={() => {
          setShowAccount(false);
          setShowCalendar(true);
        }}
        style={{
          background: "none",
          border: "none",
          color: themeVars.text,
          fontWeight: 700,
          fontSize: 22,
          cursor: "pointer",
          letterSpacing: 1,
          outline: "2px solid transparent",
          outlineOffset: 2,
          minWidth: 44,
          minHeight: 44,
        }}
        tabIndex={0}
      >
        Calendar
      </button>
      <button
        className="vp-nav-btn"
        aria-label="Global Calendar"
        title="Global Calendar"
        onClick={() => navigate("/global-calendar")}
        style={{
          background: "none",
          border: "none",
          color: themeVars.text,
          fontWeight: 700,
          fontSize: 22,
          cursor: "pointer",
          letterSpacing: 1,
          outline: "2px solid transparent",
          outlineOffset: 2,
          minWidth: 44,
          minHeight: 44,
        }}
        tabIndex={0}
      >
        Global Calendar
      </button>
      <button
        className="vp-nav-btn"
        aria-label="Personal Calendar"
        title="Personal Calendar"
        onClick={() => navigate("/personal-calendar")}
        style={{
          background: "none",
          border: "none",
          color: themeVars.text,
          fontWeight: 700,
          fontSize: 22,
          cursor: "pointer",
          letterSpacing: 1,
          outline: "2px solid transparent",
          outlineOffset: 2,
          minWidth: 44,
          minHeight: 44,
        }}
        tabIndex={0}
      >
        Personal Calendar
      </button>
      <button
        className="vp-nav-btn"
        aria-label="Account settings"
        title="Account"
        onClick={() => user && setShowAccount(true)}
        style={{
          background: "none",
          border: "none",
          color: user ? themeVars.text : "#aaa",
          fontWeight: 700,
          fontSize: 22,
          cursor: user ? "pointer" : "not-allowed",
          letterSpacing: 1,
          outline: "2px solid transparent",
          outlineOffset: 2,
          minWidth: 44,
          minHeight: 44,
          opacity: user ? 1 : 0.5,
        }}
        tabIndex={user ? 0 : -1}
        disabled={!user}
      >
        Account
      </button>
      {user ? (
        <button
          className="vp-nav-btn"
          aria-label="Log out"
          title="Log Out"
          onClick={handleLogout}
          style={{
            background: "none",
            border: "none",
            color: themeVars.text,
            fontWeight: 700,
            fontSize: 22,
            cursor: "pointer",
            letterSpacing: 1,
            outline: "2px solid transparent",
            outlineOffset: 2,
            minWidth: 44,
            minHeight: 44,
          }}
          tabIndex={0}
        >
          Log Out
        </button>
      ) : (
        <button
          className="vp-nav-btn"
          aria-label="Login/Register"
          title="Login/Register"
          onClick={() => setShowAuthModal && setShowAuthModal(true)}
          style={{
            background: "none",
            border: "none",
            color: themeVars.text,
            fontWeight: 700,
            fontSize: 22,
            cursor: "pointer",
            letterSpacing: 1,
            outline: "2px solid transparent",
            outlineOffset: 2,
            minWidth: 44,
            minHeight: 44,
          }}
          tabIndex={0}
        >
          Login/Register
        </button>
      )}
      <button
        className="vp-nav-btn"
        aria-label={
          theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
        }
        title={theme === "dark" ? "Light Mode" : "Dark Mode"}
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        style={{
          background: themeVars.accent2,
          color: themeVars.text,
          border: "none",
          borderRadius: 8,
          padding: "10px 18px",
          fontWeight: 600,
          fontSize: 18,
          cursor: "pointer",
          marginLeft: 32,
          outline: "2px solid transparent",
          outlineOffset: 2,
          minWidth: 44,
          minHeight: 44,
        }}
        tabIndex={0}
      >
        {theme === "dark" ? "Light Mode" : "Dark Mode"}
      </button>
      <button
        className="vp-nav-btn"
        aria-label="Toggle Vacation Calendar"
        title="Toggle Vacation Calendar"
        onClick={onCalendarToggle}
        style={{
          background: "none",
          border: "none",
          color: themeVars.text,
          fontWeight: 700,
          fontSize: 22,
          cursor: "pointer",
          letterSpacing: 1,
          outline: "2px solid transparent",
          outlineOffset: 2,
          minWidth: 44,
          minHeight: 44,
        }}
        tabIndex={0}
      >
        Toggle Calendar
      </button>
    </nav>
  );
};

export default NavBar;
