import React from "react";

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
}) => {
  return (
    <nav
      className="vp-navbar"
      aria-label="Main navigation"
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 20px",
        backgroundColor: themeVars.navBackground,
        boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.3)",
        borderBottom: `2px solid ${themeVars.border}`,
        borderRadius: "0 0 8px 8px",
        width: "100%",
        marginBottom: 32,
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      <div
        className="vp-navbar-left"
        style={{
          display: "flex",
          gap: "30px",
          fontSize: "18px",
          fontWeight: "bold",
          color: themeVars.text,
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
            cursor: "pointer",
            fontSize: "18px",
            fontWeight: "bold",
            padding: "8px 12px",
            borderRadius: "4px",
            transition: "background-color 0.3s ease",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = themeVars.hoverBackground)
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = "transparent")
          }
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
            cursor: "pointer",
            fontSize: "18px",
            fontWeight: "bold",
            padding: "8px 12px",
            borderRadius: "4px",
            transition: "background-color 0.3s ease",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = themeVars.hoverBackground)
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = "transparent")
          }
          tabIndex={0}
        >
          Calendar
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
            cursor: user ? "pointer" : "not-allowed",
            fontSize: "18px",
            fontWeight: "bold",
            padding: "8px 12px",
            borderRadius: "4px",
            transition: "background-color 0.3s ease",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = themeVars.hoverBackground)
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = "transparent")
          }
          tabIndex={user ? 0 : -1}
          disabled={!user}
        >
          Account
        </button>
      </div>
      <div
        className="vp-navbar-right"
        style={{
          display: "flex",
          gap: "20px",
          fontSize: "18px",
          fontWeight: "bold",
          color: themeVars.text,
        }}
      >
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
              cursor: "pointer",
              fontSize: "18px",
              fontWeight: "bold",
              padding: "8px 12px",
              borderRadius: "4px",
              transition: "background-color 0.3s ease",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor =
                themeVars.hoverBackground)
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "transparent")
            }
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
              cursor: "pointer",
              fontSize: "18px",
              fontWeight: "bold",
              padding: "8px 12px",
              borderRadius: "4px",
              transition: "background-color 0.3s ease",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor =
                themeVars.hoverBackground)
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "transparent")
            }
            tabIndex={0}
          >
            Login/Register
          </button>
        )}
        <button
          className="vp-nav-mode-toggle"
          aria-label={
            theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
          }
          title={theme === "dark" ? "Light Mode" : "Dark Mode"}
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          style={{
            backgroundColor: themeVars.accent,
            color: themeVars.text,
            fontSize: "16px",
            fontWeight: "bold",
            padding: "8px 16px",
            borderRadius: "4px",
            border: "none",
            cursor: "pointer",
            transition: "background-color 0.3s ease",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = themeVars.hoverAccent)
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = themeVars.accent)
          }
          tabIndex={0}
        >
          {theme === "dark" ? "Light Mode" : "Dark Mode"}
        </button>
      </div>
    </nav>
  );
};

export default NavBar;
