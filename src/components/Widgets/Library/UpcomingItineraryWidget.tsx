import React from "react";
import { Box, Stack, Typography } from "@mui/material";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";

interface UpcomingItineraryWidgetProps {
  events: any[];
  loading?: boolean;
}

const UpcomingItineraryWidget: React.FC<UpcomingItineraryWidgetProps> = ({
  events,
  loading = false,
}) => {
  return (
    <Box sx={{ p: 0 }}>
      <Stack spacing={2}>
        {loading ? (
          Array.from(new Array(3)).map((_, i) => (
            <Box
              key={i}
              sx={{
                height: 60,
                bgcolor: "rgba(255,255,255,0.02)",
                borderRadius: 2,
                animation: "pulse 1.5s infinite ease-in-out",
              }}
            />
          ))
        ) : events.length > 0 ? (
          events.map((event) => (
            <Box
              key={event.id}
              sx={{
                p: 1.5,
                borderRadius: 3,
                bgcolor: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.05)",
                display: "flex",
                alignItems: "center",
                gap: 2,
              }}
            >
              <Box
                sx={{
                  width: 45,
                  height: 45,
                  borderRadius: 2,
                  bgcolor: "rgba(202, 29, 73, 0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ca1d49",
                }}
              >
                <EventAvailableIcon fontSize="small" />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="subtitle2" noWrap sx={{ fontWeight: 800 }}>
                  {event.description}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ opacity: 0.5, display: "block" }}
                >
                  {new Date(event.agenda_date).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}{" "}
                  • {event.locations?.name}
                </Typography>
              </Box>
            </Box>
          ))
        ) : (
          <Box sx={{ py: 4, textAlign: "center", opacity: 0.5 }}>
            <Typography variant="body2">No upcoming activities</Typography>
          </Box>
        )}
      </Stack>
    </Box>
  );
};

export default UpcomingItineraryWidget;
