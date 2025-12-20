import React from "react";
import ModalOverlay from "./ModalOverlay";
import { StyledButton } from "./ui";

interface ConfirmDialogProps {
  open: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  themeVars: any;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  message,
  onConfirm,
  onCancel,
  confirmText = "Yes",
  cancelText = "No",
  themeVars,
}) => {
  if (!open) return null;
  return (
    <ModalOverlay onClose={onCancel}>
      <div
        style={{
          background: themeVars.card,
          color: themeVars.text,
          borderRadius: 12,
          boxShadow: themeVars.shadow,
          padding: 32,
          minWidth: 280,
          maxWidth: 400,
        }}
      >
        <div style={{ marginBottom: 20 }}>{message}</div>
        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
          <StyledButton onClick={onConfirm} accent themeVars={themeVars}>
            {confirmText}
          </StyledButton>
          <StyledButton onClick={onCancel} danger themeVars={themeVars}>
            {cancelText}
          </StyledButton>
        </div>
      </div>
    </ModalOverlay>
  );
};

export default ConfirmDialog;
