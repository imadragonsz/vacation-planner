import React, { useContext, useEffect, useState } from "react";
import { PersonalCalendar } from "../components/PersonalCalendar";
import { Event } from "react-big-calendar";
import NavBar from "../components/NavBar";
import { ThemeContext, UserContext } from "../context";

// Define the expected shape of the user object
interface User {
  id: string;
  [key: string]: any; // Add other properties as needed
}

// Define the UserContextType
interface UserContextType<T> {
  user: T | null;
  [key: string]: any; // Add other properties as needed
}

export function PersonalCalendarPage() {
  const { themeVars, theme, setTheme } = useContext(ThemeContext);
  const { user } = useContext<UserContextType<User>>(UserContext);
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    async function fetchPersonalCalendar() {
      console.log("Fetching personal calendar data...");
      try {
        if (!user || !user.id) {
          console.error("User not authenticated");
          return;
        }

        const response = await fetch(`/api/personal-calendar`);
        const contentType = response.headers.get("content-type");

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("Invalid response format: Expected JSON");
        }

        const data = await response.json();
        console.log("Personal calendar data:", data);
        const formattedEvents = data.map((entry: any) => ({
          title: entry.vacation.name,
          start: new Date(entry.vacation.start_date),
          end: new Date(entry.vacation.end_date),
        }));
        setEvents(formattedEvents);
        console.log("Events state updated:", formattedEvents);
      } catch (error) {
        console.error("Error fetching personal calendar:", error);
      }
    }

    fetchPersonalCalendar();
  }, [user]);

  const typedTheme = theme as "light" | "dark"; // Explicitly cast theme to the correct type

  return (
    <>
      <NavBar
        themeVars={themeVars}
        theme={typedTheme} // Use the explicitly typed theme
        setTheme={setTheme}
        user={user}
        setShowAccount={() => console.log("Show Account clicked")}
        setShowCalendar={() => console.log("Show Calendar clicked")}
        handleLogout={async () => {
          console.log("Logout clicked");
          return Promise.resolve();
        }}
        setShowAuthModal={(show) => console.log("Show Auth Modal:", show)}
        onCalendarToggle={() => console.log("Calendar toggled")}
      />
      <PersonalCalendar events={events} />
    </>
  );
}

export default PersonalCalendarPage;
