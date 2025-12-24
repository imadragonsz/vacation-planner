import React, { useEffect, useRef, useState } from "react";
import { supabase } from "../supabaseClient";
import { StyledButton } from "../ui";

interface AuthFormProps {
  themeVars: any;
  onAuth: (err: any) => void;
  mode: "login" | "register" | "reset";
  setMode: (mode: "login" | "register" | "reset") => void;
  errorMsg: string | null;
}

function AuthForm({
  themeVars,
  onAuth,
  mode,
  setMode,
  errorMsg,
}: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null!);
  const passwordRef = useRef<HTMLInputElement>(null!);
  const resetEmailRef = useRef<HTMLInputElement>(null!);

  useEffect(() => {
    if (mode === "reset" && resetEmailRef.current) {
      resetEmailRef.current.focus();
    } else if (emailRef.current) {
      emailRef.current.focus();
    }
  }, [mode]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    const actions = {
      login: async () => supabase.auth.signInWithPassword({ email, password }),
      register: async () => supabase.auth.signUp({ email, password }),
      reset: async () => supabase.auth.resetPasswordForEmail(resetEmail),
    };

    const { error, data } = await actions[mode]();
    console.log(`${mode} response:`, { error, data });

    if (mode === "register" || mode === "reset") {
      setMsg(
        error
          ? error.message
          : mode === "register"
          ? "Check your email for a confirmation link."
          : "Check your email for a password reset link."
      );
    }

    if (mode === "login") {
      onAuth(error);
    }

    setLoading(false);
  }

  useEffect(() => {
    // Reset input values when mode changes
    if (mode === "login" || mode === "register") {
      setEmail("");
      setPassword("");
    } else if (mode === "reset") {
      setResetEmail("");
    }
  }, [mode]);

  return (
    <form
      key={mode} // Force remount on mode change
      onSubmit={handleSubmit}
      className="auth-form-modal-form"
      style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "20px",
        padding: "32px",
        width: "100%",
        maxWidth: "420px",
        backgroundColor: themeVars.card,
        borderRadius: "16px",
        boxShadow: "0px 8px 32px rgba(0, 0, 0, 0.2)",
        color: themeVars.text,
        zIndex: 1000,
      }}
    >
      <h2
        className="auth-form-title"
        style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "10px" }}
      >
        {mode === "login"
          ? "Sign In"
          : mode === "register"
          ? "Register"
          : "Reset Password"}
      </h2>
      {mode !== "reset" && (
        <input
          ref={emailRef}
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: "10px",
            border: "1px solid #ccc",
            fontSize: "16px",
          }}
        />
      )}
      {(mode === "login" || mode === "register") && (
        <div
          className="auth-form-password-row"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            width: "100%",
          }}
        >
          <input
            ref={passwordRef}
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: "10px",
              border: "1px solid #ccc",
              fontSize: "16px",
            }}
          />
          <button
            type="button"
            tabIndex={-1}
            aria-label={showPassword ? "Hide password" : "Show password"}
            onClick={() => setShowPassword((v) => !v)}
            className="auth-form-password-toggle"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: themeVars.text,
              fontSize: "18px",
            }}
          >
            {showPassword ? "🙈" : "👁️"}
          </button>
        </div>
      )}
      {mode === "reset" && (
        <input
          ref={resetEmailRef}
          type="email"
          placeholder="Email"
          value={resetEmail}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setResetEmail(e.target.value)
          }
          required
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: "10px",
            border: "1px solid #ccc",
            fontSize: "16px",
          }}
        />
      )}
      <StyledButton
        type="submit"
        accent
        themeVars={themeVars}
        disabled={loading}
        className="auth-form-submit"
        style={{
          width: "100%",
          padding: "14px",
          borderRadius: "10px",
          fontSize: "18px",
          backgroundColor: themeVars.accent,
          color: themeVars.text,
          fontWeight: "bold",
        }}
      >
        {loading
          ? "Loading..."
          : mode === "login"
          ? "Sign In"
          : mode === "register"
          ? "Register"
          : "Send Reset Link"}
      </StyledButton>
      <div
        className="auth-form-links-row"
        style={{
          display: "flex",
          justifyContent: "space-between",
          width: "100%",
          fontSize: "16px",
        }}
      >
        {mode !== "login" && (
          <StyledButton
            type="button"
            style={{
              background: "none",
              border: "none",
              color: themeVars.accent,
              cursor: "pointer",
              textDecoration: "underline",
              fontSize: "14px",
            }}
            themeVars={themeVars}
            onClick={() => {
              setMode("login");
              setEmail("");
              setPassword("");
              setResetEmail("");
            }}
          >
            Back to Login
          </StyledButton>
        )}
        {mode === "login" && (
          <>
            <StyledButton
              type="button"
              style={{
                background: "none",
                border: "none",
                color: themeVars.accent,
                cursor: "pointer",
                textDecoration: "underline",
                fontSize: "14px",
              }}
              themeVars={themeVars}
              onClick={() => {
                setMode("register");
                setEmail("");
                setPassword("");
              }}
            >
              Register
            </StyledButton>
            <StyledButton
              type="button"
              style={{
                background: "none",
                border: "none",
                color: themeVars.accent,
                cursor: "pointer",
                textDecoration: "underline",
                fontSize: "14px",
              }}
              themeVars={themeVars}
              onClick={() => {
                setMode("reset");
                setResetEmail("");
              }}
            >
              Forgot Password?
            </StyledButton>
          </>
        )}
      </div>
      {(errorMsg || msg) && (
        <p style={{ color: errorMsg ? "red" : "green", marginTop: "12px" }}>
          {errorMsg || msg}
        </p>
      )}
    </form>
  );
}

export default AuthForm;
