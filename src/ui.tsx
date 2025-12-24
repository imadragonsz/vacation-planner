import React from "react";

interface StyledInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  style?: React.CSSProperties;
  themeVars: any;
}

const StyledInput = React.forwardRef<HTMLInputElement, StyledInputProps>(
  ({ themeVars, style, ...props }, ref) => (
    <input
      ref={ref}
      {...props}
      style={{
        width: "100%",
        padding: 10,
        borderRadius: 8,
        border: `1px solid ${themeVars.border}`,
        marginTop: 5,
        marginBottom: 10,
        ...style,
      }}
    />
  )
);
StyledInput.displayName = "StyledInput";

interface StyledButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  accent?: boolean;
  danger?: boolean;
  themeVars: any;
  style?: React.CSSProperties;
}

const StyledButton: React.FC<StyledButtonProps> = ({
  accent,
  danger,
  themeVars,
  style,
  ...props
}) => (
  <button
    {...props}
    style={{
      background: danger
        ? "#e74c3c"
        : accent
        ? themeVars.accent
        : themeVars.accent2,
      color: danger ? "#fff" : themeVars.text,
      border: "none",
      borderRadius: 8,
      padding: "10px 20px",
      cursor: "pointer",
      fontWeight: 600,
      fontSize: 15,
      marginRight: accent || danger ? 10 : 0,
      ...style,
    }}
  />
);

export { StyledInput, StyledButton };
