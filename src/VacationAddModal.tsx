import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  useTheme,
  useMediaQuery,
  FormControlLabel,
  Checkbox,
  Typography,
  Stack,
  Theme,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import PublicIcon from "@mui/icons-material/Public";
import { TEXT_LIMITS } from "./utils/textLimits";

interface VacationAddModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: VacationData) => void;
}

interface VacationData {
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  isPublic: boolean;
}

const VacationAddModal: React.FC<VacationAddModalProps> = ({
  open,
  onClose,
  onSubmit,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [name, setName] = useState("");
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isPublic, setIsPublic] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !destination || !startDate || !endDate) {
      alert("All fields are required to add a vacation.");
      return;
    }

    onSubmit({ name, destination, startDate, endDate, isPublic });
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          bgcolor: (theme: Theme) =>
            theme.palette.mode === "dark"
              ? "rgba(15, 20, 25, 0.95)"
              : "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(20px)",
          borderRadius: isMobile ? 0 : 4, // 16px as requested (4 * 4px)
          border: (theme: Theme) =>
            isMobile
              ? "none"
              : `1px solid ${
                  theme.palette.mode === "dark"
                    ? "rgba(255, 255, 255, 0.1)"
                    : "rgba(0, 0, 0, 0.1)"
                }`,
          backgroundImage: "none",
          p: isMobile ? 1 : 2,
        },
      }}
    >
      <DialogTitle
        sx={{
          fontWeight: 950,
          fontSize: "2.25rem",
          pb: 1,
          letterSpacing: "-0.04em",
        }}
      >
        New Adventure
      </DialogTitle>
      <DialogContent sx={{ mt: 2 }}>
        <Typography
          variant="body2"
          sx={{ opacity: 0.6, mb: 4, fontWeight: 500 }}
        >
          Fill in the details below to start planning your next great getaway.
        </Typography>
        <form
          onSubmit={handleSubmit}
          id="vacation-add-form"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "28px",
            paddingTop: "4px",
          }}
        >
          <Box>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 900,
                color: "#ca1d49",
                mb: 1.5,
                display: "block",
                letterSpacing: 1.5,
              }}
            >
              TRIP DETAILS
            </Typography>
            <Stack spacing={2.5}>
              <TextField
                label="Trip Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                fullWidth
                autoFocus
                placeholder="e.g. Summer in Italy"
                inputProps={{ maxLength: TEXT_LIMITS.SHORT }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    bgcolor: (theme: Theme) =>
                      theme.palette.mode === "dark"
                        ? "rgba(0,0,0,0.2)"
                        : "rgba(0,0,0,0.03)",
                    borderRadius: 4,
                  },
                }}
              />
              <TextField
                label="Destination"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                required
                fullWidth
                placeholder="e.g. Rome, Amalfi Coast"
                inputProps={{ maxLength: TEXT_LIMITS.MEDIUM }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    bgcolor: (theme: Theme) =>
                      theme.palette.mode === "dark"
                        ? "rgba(0,0,0,0.2)"
                        : "rgba(0,0,0,0.03)",
                    borderRadius: 4,
                  },
                }}
              />
            </Stack>
          </Box>

          <Box>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 900,
                color: "#ca1d49",
                mb: 1.5,
                display: "block",
                letterSpacing: 1.5,
              }}
            >
              DATES & VISIBILITY
            </Typography>
            <Stack spacing={2.5}>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: { xs: "column", sm: "row" },
                  gap: 2.5,
                }}
              >
                <DatePicker
                  label="Start Date"
                  value={startDate ? dayjs(startDate) : null}
                  onChange={(newValue) =>
                    setStartDate(newValue ? newValue.format("YYYY-MM-DD") : "")
                  }
                  sx={{
                    flex: 1,
                    "& .MuiOutlinedInput-root": {
                      bgcolor: (theme: Theme) =>
                        theme.palette.mode === "dark"
                          ? "rgba(0,0,0,0.2)"
                          : "rgba(0,0,0,0.03)",
                      borderRadius: 4,
                    },
                  }}
                />
                <DatePicker
                  label="End Date"
                  value={endDate ? dayjs(endDate) : null}
                  onChange={(newValue) =>
                    setEndDate(newValue ? newValue.format("YYYY-MM-DD") : "")
                  }
                  sx={{
                    flex: 1,
                    "& .MuiOutlinedInput-root": {
                      bgcolor: (theme: Theme) =>
                        theme.palette.mode === "dark"
                          ? "rgba(0,0,0,0.2)"
                          : "rgba(0,0,0,0.03)",
                      borderRadius: 4,
                    },
                  }}
                />
              </Box>

              <Box
                sx={{
                  p: 2.5,
                  borderRadius: 4,
                  bgcolor: (theme: Theme) =>
                    theme.palette.mode === "dark"
                      ? "rgba(255,255,255,0.03)"
                      : "rgba(0,0,0,0.02)",
                  border: (theme: Theme) =>
                    `1px solid ${
                      theme.palette.mode === "dark"
                        ? "rgba(255,255,255,0.08)"
                        : "rgba(0,0,0,0.05)"
                    }`,
                }}
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={isPublic}
                      onChange={(e) => setIsPublic(e.target.checked)}
                      color="primary"
                    />
                  }
                  label={
                    <Box sx={{ ml: 1 }}>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          fontWeight: 900,
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                        }}
                      >
                        <PublicIcon fontSize="small" color="primary" /> Public
                        Trip
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ opacity: 0.6, display: "block" }}
                      >
                        Allow other travelers to see this trip in the Explore
                        tab.
                      </Typography>
                    </Box>
                  }
                />
              </Box>
            </Stack>
          </Box>
        </form>
      </DialogContent>
      <DialogActions sx={{ p: isMobile ? 3 : 5, pt: 1, gap: 2 }}>
        <Button
          onClick={onClose}
          sx={{
            fontWeight: 900,
            color: "text.secondary",
            px: 4,
            height: 48,
            borderRadius: 4,
            "&:hover": { bgcolor: "transparent", color: "text.primary" },
          }}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          form="vacation-add-form"
          variant="contained"
          className="interactive-element"
          sx={{
            fontWeight: 950,
            borderRadius: 4,
            bgcolor: "#ca1d49",
            px: 6,
            height: 48,
            py: 1.5,
            fontSize: "1rem",
            boxShadow: "0 10px 30px rgba(202, 29, 73, 0.4)",
            "&:hover": { bgcolor: "#e02154" },
          }}
        >
          Create Trip
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default VacationAddModal;
