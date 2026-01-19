import React, { useState } from "react";
import { Vacation } from "../../src/vacation";
import {
  Box,
  Button,
  Checkbox,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
} from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import CloseIcon from "@mui/icons-material/Close";

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getMonthName(month: number) {
  return new Date(2000, month, 1).toLocaleString("default", { month: "long" });
}

interface VacationCalendarProps {
  vacations: Vacation[];
  open: boolean;
  onClose: () => void;
  onVacationClick?: (vac: Vacation) => void;
}

export function VacationCalendar({
  vacations,
  open,
  onClose,
  onVacationClick,
}: VacationCalendarProps) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [showArchived, setShowArchived] = useState(false);
  const daysInMonth = getDaysInMonth(year, month);

  const filteredVacations = vacations.filter(
    (vac) => showArchived || !vac.archived
  );

  const dayVacations: { [day: number]: Vacation[] } = {};
  for (let d = 1; d <= daysInMonth; d++) dayVacations[d] = [];
  filteredVacations.forEach((vac) => {
    const start = new Date(vac.start_date);
    const end = new Date(vac.end_date);
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      // Strip time for accurate comparison
      const checkDate = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
      );
      const startDate = new Date(
        start.getFullYear(),
        start.getMonth(),
        start.getDate()
      );
      const endDate = new Date(
        end.getFullYear(),
        end.getMonth(),
        end.getDate()
      );

      if (checkDate >= startDate && checkDate <= endDate) {
        dayVacations[d].push(vac);
      }
    }
  });

  function prevMonth() {
    setMonth((m) => {
      if (m === 0) {
        setYear((y) => y - 1);
        return 11;
      }
      return m - 1;
    });
  }

  function nextMonth() {
    setMonth((m) => {
      if (m === 11) {
        setYear((y) => y + 1);
        return 0;
      }
      return m + 1;
    });
  }

  const firstDay = new Date(year, month, 1).getDay();
  const weeks: number[][] = [];
  let week: number[] = [];
  for (let i = 0; i < firstDay; i++) week.push(0);
  for (let d = 1; d <= daysInMonth; d++) {
    week.push(d);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length) {
    while (week.length < 7) week.push(0);
    weeks.push(week);
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="lg"
      PaperProps={{
        sx: {
          bgcolor: "rgba(15, 20, 25, 0.9)",
          backdropFilter: "blur(20px)",
          borderRadius: 4,
          border: "1px solid rgba(255, 255, 255, 0.1)",
          backgroundImage: "none",
          color: "#fff",
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          p: 3,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            Vacation Calendar
          </Typography>
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
                sx={{ color: "rgba(255,255,255,0.5)" }}
              />
            }
            label={
              <Typography variant="body2" sx={{ opacity: 0.7 }}>
                Show Archived
              </Typography>
            }
          />
        </Box>
        <IconButton onClick={onClose} sx={{ color: "rgba(255,255,255,0.5)" }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
            mb: 4,
          }}
        >
          <IconButton
            onClick={prevMonth}
            sx={{ color: "#fff", bgcolor: "rgba(255,255,255,0.05)" }}
          >
            <ArrowBackIosNewIcon />
          </IconButton>
          <Typography
            variant="h4"
            sx={{ fontWeight: 700, minWidth: 250, textAlign: "center" }}
          >
            {getMonthName(month)} {year}
          </Typography>
          <IconButton
            onClick={nextMonth}
            sx={{ color: "#fff", bgcolor: "rgba(255,255,255,0.05)" }}
          >
            <ArrowForwardIosIcon />
          </IconButton>
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: 1,
          }}
        >
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <Typography
              key={d}
              align="center"
              sx={{ fontWeight: 700, opacity: 0.5, mb: 1 }}
            >
              {d}
            </Typography>
          ))}
          {weeks.map((week, wi) =>
            week.map((day, di) => (
              <Box
                key={`${wi}-${di}`}
                sx={{
                  minHeight: 120,
                  bgcolor:
                    day === 0 ? "transparent" : "rgba(255, 255, 255, 0.03)",
                  borderRadius: 2,
                  p: 1,
                  border: "1px solid",
                  borderColor:
                    day === 0 ? "transparent" : "rgba(255, 255, 255, 0.05)",
                  position: "relative",
                  transition: "all 0.2s ease-in-out",
                  "&:hover":
                    day !== 0
                      ? {
                          bgcolor: "rgba(255, 255, 255, 0.05)",
                          transform: "translateY(-2px)",
                        }
                      : {},
                }}
              >
                {day !== 0 && (
                  <>
                    <Typography
                      sx={{
                        fontWeight: 600,
                        opacity: 0.8,
                        mb: 1,
                        color:
                          today.getDate() === day &&
                          today.getMonth() === month &&
                          today.getFullYear() === year
                            ? "#1da1f2"
                            : "inherit",
                      }}
                    >
                      {day}
                    </Typography>
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 0.5,
                      }}
                    >
                      {dayVacations[day].map((vac) => (
                        <Box
                          key={vac.id}
                          onClick={() => {
                            onVacationClick && onVacationClick(vac);
                            onClose();
                          }}
                          sx={{
                            p: 0.5,
                            pl: 1,
                            borderRadius: 1,
                            fontSize: "0.7rem",
                            fontWeight: 700,
                            bgcolor: vac.archived
                              ? "rgba(255, 255, 255, 0.1)"
                              : "rgba(29, 161, 242, 0.2)",
                            color: vac.archived
                              ? "rgba(255,255,255,0.5)"
                              : "#8ecdf8",
                            borderLeft: "3px solid",
                            borderColor: vac.archived
                              ? "rgba(255,255,255,0.2)"
                              : "#1da1f2",
                            cursor: "pointer",
                            overflow: "hidden",
                            whiteSpace: "nowrap",
                            textOverflow: "ellipsis",
                            "&:hover": {
                              bgcolor: "rgba(255, 255, 255, 0.2)",
                            },
                          }}
                        >
                          {vac.name}
                        </Box>
                      ))}
                    </Box>
                  </>
                )}
              </Box>
            ))
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 3 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{ borderColor: "rgba(255,255,255,0.2)", color: "#fff" }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
