import React, { useState, useEffect } from "react";
import { Vacation } from "./vacation";
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

interface VacationEditModalProps {
  open: boolean;
  vacation: Vacation;
  onClose: () => void;
  onSave: (updatedVacation: Vacation) => void;
}

const VacationEditModal: React.FC<VacationEditModalProps> = ({
  open,
  vacation,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState(vacation.name);
  const [destination, setDestination] = useState(vacation.destination);
  const [startDate, setStartDate] = useState(vacation.start_date);
  const [endDate, setEndDate] = useState(vacation.end_date);

  useEffect(() => {
    setName(vacation.name);
    setDestination(vacation.destination);
    setStartDate(vacation.start_date);
    setEndDate(vacation.end_date);
  }, [vacation]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...vacation,
      name,
      destination,
      start_date: startDate,
      end_date: endDate,
    });
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
        Edit Vacation
      </DialogTitle>
      <DialogContent sx={{ mt: 2 }}>
        <form
          onSubmit={handleSubmit}
          id="vacation-edit-form"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            paddingTop: "4px",
          }}
        >
          <TextField
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            fullWidth
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
          type="submit"
          form="vacation-edit-form"
          sx={{ fontWeight: 800, borderRadius: 3, px: 4, py: 1 }}
        >
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default VacationEditModal;
