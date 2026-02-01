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
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import PublicIcon from "@mui/icons-material/Public";

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
          bgcolor: (theme) =>
            theme.palette.mode === "dark"
              ? "rgba(15, 20, 25, 0.95)"
              : "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(20px)",
          borderRadius: isMobile ? 0 : 6,
          border: (theme) =>
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
      <DialogTitle sx={{ fontWeight: 900, fontSize: "1.75rem", pb: 1 }}>
        Add Vacation
      </DialogTitle>
      <DialogContent sx={{ mt: 2 }}>
        <form
          onSubmit={handleSubmit}
          id="vacation-add-form"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            paddingTop: "4px",
          }}
        >
          <TextField
            label="Trip Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            fullWidth
            placeholder="e.g. Summer in Italy"
            sx={{
              "& .MuiOutlinedInput-root": {
                bgcolor: (theme) =>
                  theme.palette.mode === "dark"
                    ? "rgba(0,0,0,0.1)"
                    : "rgba(0,0,0,0.03)",
                borderRadius: 2.5,
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
            sx={{
              "& .MuiOutlinedInput-root": {
                bgcolor: (theme) =>
                  theme.palette.mode === "dark"
                    ? "rgba(0,0,0,0.1)"
                    : "rgba(0,0,0,0.03)",
                borderRadius: 2.5,
              },
            }}
          />
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              gap: 2,
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
                  bgcolor: (theme) =>
                    theme.palette.mode === "dark"
                      ? "rgba(0,0,0,0.1)"
                      : "rgba(0,0,0,0.03)",
                  borderRadius: 2.5,
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
                  bgcolor: (theme) =>
                    theme.palette.mode === "dark"
                      ? "rgba(0,0,0,0.1)"
                      : "rgba(0,0,0,0.03)",
                  borderRadius: 2.5,
                },
              }}
            />
          </Box>
          <Box
            sx={{
              mt: 1,
              p: 2,
              borderRadius: 3,
              bgcolor: (theme) =>
                theme.palette.mode === "dark"
                  ? "rgba(255,255,255,0.03)"
                  : "rgba(0,0,0,0.02)",
              border: (theme) =>
                `1px solid ${
                  theme.palette.mode === "dark"
                    ? "rgba(255,255,255,0.05)"
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
                <Box>
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 800, display: "flex", gap: 1 }}
                  >
                    <PublicIcon fontSize="small" color="primary" /> Public Trip
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.6 }}>
                    Allow other travelers to see this trip in the Explore tab.
                  </Typography>
                </Box>
              }
            />
          </Box>
        </form>
      </DialogContent>
      <DialogActions sx={{ p: 3, pt: 1, gap: 1 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            color: "text.secondary",
            borderColor: (theme) =>
              theme.palette.mode === "dark"
                ? "rgba(255,255,255,0.2)"
                : "rgba(0,0,0,0.2)",
            borderRadius: 3,
            px: 3,
            fontWeight: 800,
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          sx={{ fontWeight: 800, borderRadius: 3, px: 4, py: 1 }}
        >
          Create Trip
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default VacationAddModal;
