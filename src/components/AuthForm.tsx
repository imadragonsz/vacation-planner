import React, { useEffect, useRef, useState } from "react";
import { supabase } from "../supabaseClient";
import { StyledInput, StyledButton } from "../ui";

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
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const resetEmailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (mode === "reset" && resetEmailRef.current)
      resetEmailRef.current.focus();
    else if (mode === "register" || mode === "login") {
      if (emailRef.current) emailRef.current.focus();
    }
  }, [mode]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      onAuth(error);
    } else if (mode === "register") {
      const { error } = await supabase.auth.signUp({ email, password });
      setMsg(
        error ? error.message : "Check your email for a confirmation link."
      );
    } else if (mode === "reset") {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail);
      setMsg(
        error ? error.message : "Check your email for a password reset link."
      );
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="auth-form-modal-form">
      <h2 className="auth-form-title">
        {mode === "login"
          ? "Sign In"
          : mode === "register"
          ? "Register"
          : "Reset Password"}
      </h2>
      {mode !== "reset" && (
        <StyledInput
          ref={emailRef}
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          themeVars={themeVars}
          className="auth-form-input"
        />
      )}
      {(mode === "login" || mode === "register") && (
        <div className="auth-form-password-row">
          <StyledInput
            ref={passwordRef}
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            themeVars={themeVars}
            className="auth-form-input auth-form-password-input"
          />
          <button
            type="button"
            tabIndex={-1}
            aria-label={showPassword ? "Hide password" : "Show password"}
            onClick={() => setShowPassword((v) => !v)}
            className="auth-form-password-toggle"
          >
            {showPassword ? "🙈" : "👁️"}
          </button>
        </div>
      )}
      {mode === "reset" && (
        <StyledInput
          ref={resetEmailRef}
          type="email"
          placeholder="Email"
          value={resetEmail}
          onChange={(e) => setResetEmail(e.target.value)}
          required
          themeVars={themeVars}
          className="auth-form-input"
        />
      )}
      <StyledButton
        type="submit"
        accent
        themeVars={themeVars}
        disabled={loading}
        className="auth-form-submit"
      >
        {loading
          ? "Loading..."
          : mode === "login"
          ? "Sign In"
          : mode === "register"
          ? "Register"
          : "Send Reset Link"}
      </StyledButton>
      <div className="auth-form-links-row">
        {mode !== "login" && (
          <StyledButton
            type="button"
            style={{
              background: "none",
              border: "none",
              color: themeVars.accent,
              cursor: "pointer",
              textDecoration: "underline",
              fontSize: 14,
            }}
            themeVars={themeVars}
            onClick={() => setMode("login")}
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
                fontSize: 14,
              }}
              themeVars={themeVars}
              onClick={() => setMode("register")}
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
                fontSize: 14,
              }}
              themeVars={themeVars}
              onClick={() => setMode("reset")}
            >
              Forgot Password?
            </StyledButton>
          </>
        )}
      </div>
      {(errorMsg || msg) && (
        <p style={{ color: errorMsg ? "red" : "green", marginTop: 12 }}>
          {errorMsg || msg}
        </p>
      )}
    </form>
  );
}

export default AuthForm;
