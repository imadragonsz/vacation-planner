import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";

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
}

const VacationAddModal: React.FC<VacationAddModalProps> = ({
  open,
  onClose,
  onSubmit,
}) => {
  const [name, setName] = useState("");
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !destination || !startDate || !endDate) {
      alert("All fields are required to add a vacation.");
      return;
    }

    onSubmit({ name, destination, startDate, endDate });
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: "rgba(255, 255, 255, 0.05)",
          backdropFilter: "blur(20px)",
          borderRadius: 6,
          border: "1px solid rgba(255, 255, 255, 0.1)",
          backgroundImage: "none",
          p: 2,
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
                bgcolor: "rgba(0,0,0,0.1)",
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
                bgcolor: "rgba(0,0,0,0.1)",
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
                  bgcolor: "rgba(0,0,0,0.1)",
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
                  bgcolor: "rgba(0,0,0,0.1)",
                  borderRadius: 2.5,
                },
              }}
            />
          </Box>
        </form>
      </DialogContent>
      <DialogActions sx={{ p: 3, pt: 1, gap: 1 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            color: "rgba(255,255,255,0.6)",
            borderColor: "rgba(255,255,255,0.2)",
            borderRadius: 3,
            px: 3,
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
