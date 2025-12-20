import React, { useEffect } from "react";

function Toast({
  message,
  onClose,
  type = "info",
}: {
  message: string;
  onClose: () => void;
  type?: "info" | "success" | "error";
}) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        bottom: 32,
        left: "50%",
        transform: "translateX(-50%)",
        background:
          type === "error"
            ? "#e74c3c"
            : type === "success"
            ? "#27ae60"
            : "#222",
        color: "#fff",
        padding: "14px 32px",
        borderRadius: 8,
        fontSize: 18,
        fontWeight: 600,
        boxShadow: "0 4px 24px #0005",
        zIndex: 2000,
        minWidth: 220,
        textAlign: "center",
      }}
    >
      {message}
    </div>
  );
}

export default Toast;
