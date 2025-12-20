import React from "react";
import { Vacation } from "./vacation";
import { StyledInput, StyledButton } from "./ui";
import ModalOverlay from "./ModalOverlay";

interface VacationEditModalProps {
  vacation: Vacation | null;
  values: Vacation | null;
  onChange: (values: Vacation) => void;
  onSave: (e: React.FormEvent) => void;
  onClose: () => void;
  themeVars: any;
}

const VacationEditModal: React.FC<VacationEditModalProps> = ({
  vacation,
  values,
  onChange,
  onSave,
  onClose,
  themeVars,
}) => {
  if (!vacation || !values) return null;
  return (
    <ModalOverlay onClose={onClose}>
      <div
        style={{
          background: themeVars.card,
          color: themeVars.text,
          borderRadius: 12,
          padding: 32,
          minWidth: 320,
          maxWidth: 500,
          boxShadow: themeVars.shadow,
        }}
      >
        <h2 style={{ marginTop: 0 }}>Edit Vacation</h2>
        <form onSubmit={onSave}>
          <label style={{ display: "block", marginBottom: 10 }}>
            Name:
            <StyledInput
              type="text"
              value={values.name}
              onChange={(e) => onChange({ ...values, name: e.target.value })}
              required
              themeVars={themeVars}
            />
          </label>
          <label style={{ display: "block", marginBottom: 10 }}>
            Start Date:
            <StyledInput
              type="date"
              value={values.start_date}
              onChange={(e) =>
                onChange({ ...values, start_date: e.target.value })
              }
              required
              themeVars={themeVars}
            />
          </label>
          <label style={{ display: "block", marginBottom: 10 }}>
            End Date:
            <StyledInput
              type="date"
              value={values.end_date}
              onChange={(e) =>
                onChange({ ...values, end_date: e.target.value })
              }
              required
              themeVars={themeVars}
            />
          </label>
          <div style={{ marginTop: 20, textAlign: "right" }}>
            <StyledButton type="submit" accent themeVars={themeVars}>
              Save
            </StyledButton>
            <StyledButton
              type="button"
              danger
              onClick={onClose}
              themeVars={themeVars}
            >
              Cancel
            </StyledButton>
          </div>
        </form>
      </div>
    </ModalOverlay>
  );
};

export default VacationEditModal;
