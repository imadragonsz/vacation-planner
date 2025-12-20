import React from "react";

interface ModalOverlayProps {
  onClose: () => void;
  children: React.ReactNode;
  zIndex?: number;
}

const ModalOverlay: React.FC<ModalOverlayProps> = ({
  onClose,
  children,
  zIndex = 2000,
}) => (
  <div
    style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      background: "rgba(0,0,0,0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex,
    }}
    onClick={onClose}
  >
    <div onClick={(e) => e.stopPropagation()}>{children}</div>
  </div>
);

export default ModalOverlay;
