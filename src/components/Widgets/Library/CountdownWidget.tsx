import React, { useState, useEffect } from "react";
import { Box, Typography, Stack } from "@mui/material";
import TimerIcon from "@mui/icons-material/Timer";

interface CountdownWidgetProps {
  startDate: string;
  destination: string;
  onClick?: () => void;
}

const CountdownWidget: React.FC<CountdownWidgetProps> = ({
  startDate,
  destination,
  onClick,
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
      // Use start of day for the start date to ensure full day counting
      const targetDate = new Date(startDate);
      targetDate.setHours(0, 0, 0, 0);
      const difference = +targetDate - +new Date();
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
      <Box
        onClick={onClick}
        sx={{
          p: 2,
          textAlign: "center",
          opacity: 0.5,
          cursor: onClick ? "pointer" : "default",
        }}
      >
        <Typography variant="body2">
          Your trip to {destination} is already here!
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      onClick={onClick}
      sx={{
        cursor: onClick ? "pointer" : "default",
        transition: "all 0.2s",
        "&:hover": onClick
          ? {
              transform: "translateY(-4px)",
              "& .countdown-icon": {
                bgcolor: "rgba(202, 29, 73, 0.25)",
                transform: "scale(1.1)",
              },
            }
          : {},
      }}
    >
      <Stack spacing={1}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            className="countdown-icon"
            sx={{
              p: 1.2,
              borderRadius: "12px",
              bgcolor: "rgba(202, 29, 73, 0.1)",
              color: "#ca1d49",
              display: "flex",
              transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
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
