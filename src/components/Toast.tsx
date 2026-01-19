import React from "react";
import { Snackbar, Alert } from "@mui/material";

function Toast({
  message,
  onClose,
  type = "info",
}: {
  message: string;
  onClose: () => void;
  type?: "info" | "success" | "error";
}) {
  return (
    <Snackbar
      open={!!message}
      autoHideDuration={3000}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
    >
      <Alert onClose={onClose} severity={type} sx={{ width: "100%" }}>
        {message}
      </Alert>
    </Snackbar>
  );
}

export default Toast;
