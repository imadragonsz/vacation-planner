import React, { useState, useEffect } from "react";
import { Box, Typography, Stack } from "@mui/material";
import TimerIcon from "@mui/icons-material/Timer";

interface CountdownWidgetProps {
  startDate: string;
  destination: string;
}

const CountdownWidget: React.FC<CountdownWidgetProps> = ({
  startDate,
  destination,
}) => {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  useEffect(() => {
    if (!startDate) return;

    const calculateTimeLeft = () => {
      const difference = +new Date(startDate) - +new Date();
      let timeLeftValues = null;

      if (difference > 0) {
        timeLeftValues = {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        };
      }
      setTimeLeft(timeLeftValues);
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [startDate]);

  if (!timeLeft) {
    return (
      <Box sx={{ p: 2, textAlign: "center", opacity: 0.5 }}>
        <Typography variant="body2">
          Your trip to {destination} is already here!
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Stack spacing={1}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              p: 1.2,
              borderRadius: "12px",
              bgcolor: "rgba(202, 29, 73, 0.1)",
              color: "#ca1d49",
              display: "flex",
            }}
          >
            <TimerIcon sx={{ fontSize: 20 }} />
          </Box>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
              Countdown
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.6 }}>
              Days until {destination}
            </Typography>
          </Box>
        </Box>

        <Stack
          direction="row"
          spacing={1.5}
          sx={{ mt: 1, justifyContent: "space-between" }}
        >
          <Box sx={{ textAlign: "center", flex: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: 900, color: "#ca1d49" }}>
              {timeLeft.days}
            </Typography>
            <Typography
              variant="caption"
              sx={{ opacity: 0.6, fontSize: "9px" }}
            >
              DAYS
            </Typography>
          </Box>
          <Box sx={{ textAlign: "center", flex: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: 900 }}>
              {timeLeft.hours}
            </Typography>
            <Typography
              variant="caption"
              sx={{ opacity: 0.6, fontSize: "9px" }}
            >
              HOURS
            </Typography>
          </Box>
          <Box sx={{ textAlign: "center", flex: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: 900 }}>
              {timeLeft.minutes}
            </Typography>
            <Typography
              variant="caption"
              sx={{ opacity: 0.6, fontSize: "9px" }}
            >
              MINS
            </Typography>
          </Box>
          <Box sx={{ textAlign: "center", flex: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: 900 }}>
              {timeLeft.seconds}
            </Typography>
            <Typography
              variant="caption"
              sx={{ opacity: 0.6, fontSize: "9px" }}
            >
              SECS
            </Typography>
          </Box>
        </Stack>
      </Stack>
    </Box>
  );
};

export default CountdownWidget;
