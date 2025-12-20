import React, { useContext, useEffect, useState } from "react";
import { Calendar, momentLocalizer, Event } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import NavBar from "../components/NavBar";
import { ThemeContext, UserContext } from "../context";

const localizer = momentLocalizer(moment);

export function GlobalCalendarPage() {
  const { themeVars, theme, setTheme } = useContext(ThemeContext);
  const { user } = useContext(UserContext);
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    async function fetchGlobalCalendar() {
      console.log("Fetching global calendar data...");
      try {
        const response = await fetch("/api/global-calendar");
        const contentType = response.headers.get("content-type");

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("Invalid response format: Expected JSON");
        }

        const data = await response.json();
        console.log("Global calendar data:", data);
        setEvents(
          data.map((vacation: any) => ({
            title: vacation.name,
            start: new Date(vacation.start_date),
            end: new Date(vacation.end_date),
          }))
        );
        console.log("Events state updated:", events);
      } catch (error) {
        console.error("Error fetching global calendar data:", error);
      }
    }
    fetchGlobalCalendar();
  }, [events]); // Added 'events' to the dependency array to fix the React Hook warning

  // Ensure `theme` is explicitly typed as "light" | "dark"
  const typedTheme = theme as "light" | "dark";

  async function handleLogout() {
    console.log("User logged out");
    // Add any asynchronous logout logic here, such as API calls
  }

  console.log("Theme:", theme);
  console.log("User:", user);

  return (
    <>
      <NavBar
        themeVars={themeVars}
        theme={typedTheme}
        setTheme={setTheme}
        user={user}
        setShowAccount={(show) => console.log("Show Account:", show)}
        setShowCalendar={(show) => console.log("Show Calendar:", show)}
        handleLogout={handleLogout}
        setShowAuthModal={(show) => console.log("Show Auth Modal:", show)}
        onCalendarToggle={() => console.log("Calendar toggled")}
      />
      <div style={{ height: 500 }}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: "100%" }}
        />
      </div>
    </>
  );
}

export default GlobalCalendarPage;
