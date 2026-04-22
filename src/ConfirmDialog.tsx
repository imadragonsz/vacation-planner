import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from "@mui/material";

interface ConfirmDialogProps {
  open: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  message,
  onConfirm,
  onCancel,
  confirmText = "Confirm",
  cancelText = "Cancel",
}) => {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: (theme) =>
            theme.palette.mode === "dark"
              ? "rgba(30,30,40,0.95)"
              : "rgba(255,255,255,0.95)",
          backdropFilter: "blur(20px)",
          borderRadius: 5,
          border: (theme) =>
            theme.palette.mode === "dark"
              ? "1px solid rgba(255, 255, 255, 0.1)"
              : "1px solid rgba(0,0,0,0.1)",
          backgroundImage: "none",
          p: 1,
          margin: 2, // Ensure it doesn't touch screen edges on very small tablets
        },
      }}
    >
      <DialogTitle sx={{ fontWeight: 800, fontSize: "1.25rem" }}>
        Confirmation
      </DialogTitle>
      <DialogContent sx={{ pb: 1 }}>
        <Typography sx={{ opacity: 0.9 }}>{message}</Typography>
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button
          onClick={onCancel}
          variant="outlined"
          sx={{
            color: "rgba(255,255,255,0.6)",
            borderColor: "rgba(255,255,255,0.2)",
            borderRadius: 2,
          }}
        >
          {cancelText}
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color="error"
          sx={{ fontWeight: 700, borderRadius: 2 }}
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDialog;
