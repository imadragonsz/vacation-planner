export function generateICal(
  events: {
    title: string;
    start: string;
    description?: string;
    location?: string;
  }[]
) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  };

  let icalContent =
    "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Vacation Planner//NONSGML v1.0//EN\n";

  events.forEach((event) => {
    icalContent += "BEGIN:VEVENT\n";
    icalContent += `SUMMARY:${event.title}\n`;
    icalContent += `DTSTART:${formatDate(event.start)}\n`;
    if (event.description) icalContent += `DESCRIPTION:${event.description}\n`;
    if (event.location) icalContent += `LOCATION:${event.location}\n`;
    icalContent += "END:VEVENT\n";
  });

  icalContent += "END:VCALENDAR";

  const blob = new Blob([icalContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "my_itinerary.ics");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
