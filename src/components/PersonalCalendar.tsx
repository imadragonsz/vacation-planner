import React, { useEffect, useState } from "react";
import { Calendar, Event, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useUser } from "../context";
import { fetchPersonalEvents } from "../utils/handlers";

const localizer = momentLocalizer(moment);

interface PersonalCalendarProps {
  events: Event[];
}

export const PersonalCalendar: React.FC<PersonalCalendarProps> = ({
  events,
}) => {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchPersonalEvents(user.id)
        .then((fetchedEvents) => {
          console.log("Fetched events:", fetchedEvents);
          setLoading(false);
        })
        .catch((error) => {
          console.error("Error fetching events:", error);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [user]);

  if (loading) {
    return <div>Loading events...</div>;
  }

  if (events.length === 0) {
    return <div>No events to display.</div>;
  }

  return (
    <div style={{ height: "500px" }}>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 500 }}
      />
    </div>
  );
};

export default PersonalCalendar;
