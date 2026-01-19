import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { TextField, Button, IconButton, Typography, Box } from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

interface AuthFormProps {
  onAuth: (err: any) => void;
  mode: "login" | "register" | "reset";
  setMode: (mode: "login" | "register" | "reset") => void;
  errorMsg: string | null;
}

function AuthForm({ onAuth, mode, setMode, errorMsg }: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    try {
      const actions = {
        login: async () =>
          supabase.auth.signInWithPassword({ email, password }),
        register: async () => {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { display_name: displayName } },
          });
          if (!error && data.user) {
            await supabase
              .from("profiles")
              .insert([{ id: data.user.id, display_name: displayName }]);
          }
          return { data, error };
        },
        reset: async () => supabase.auth.resetPasswordForEmail(resetEmail),
      };

      const { error, data } = await actions[mode]();
      console.log(`${mode} response:`, { error, data });

      if (error) {
        setMsg(error.message);
        onAuth(error);
      } else {
        setMsg(
          mode === "register"
            ? "Check your email for a confirmation link."
            : mode === "reset"
            ? "Check your email for a password reset link."
            : null
        );
        onAuth(null);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      setMsg("An unexpected error occurred. Please try again later.");
      onAuth(err);
    } finally {
      setLoading(false);
    }
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
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        gap: 3,
        p: 6,
        width: "100%",
        maxWidth: 420,
        backgroundColor: "rgba(255, 255, 255, 0.05)",
        backdropFilter: "blur(15px)",
        borderRadius: 6,
        border: "1px solid rgba(255, 255, 255, 0.1)",
        boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
        color: "#fff",
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      }}
    >
      <Box sx={{ mb: 2, textAlign: "center" }}>
        <Typography variant="h4" component="h2" sx={{ fontWeight: 900, mb: 1 }}>
          {mode === "login"
            ? "Welcome Back"
            : mode === "register"
            ? "Create Account"
            : "Reset Password"}
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.6 }}>
          {mode === "login"
            ? "Please enter your details to sign in"
            : mode === "register"
            ? "Sign up to start planning your trips"
            : "Enter your email to receive a reset link"}
        </Typography>
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
        {mode === "register" && (
          <TextField
            label="Display Name"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            fullWidth
            size="medium"
          />
        )}
        {mode !== "reset" && (
          <TextField
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            fullWidth
            size="medium"
          />
        )}
        {(mode === "login" || mode === "register") && (
          <TextField
            label="Password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            fullWidth
            size="medium"
            InputProps={{
              endAdornment: (
                <IconButton
                  onClick={() => setShowPassword(!showPassword)}
                  edge="end"
                  sx={{ color: "rgba(255,255,255,0.5)" }}
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              ),
            }}
          />
        )}
        {mode === "reset" && (
          <TextField
            label="Email Address"
            type="email"
            value={resetEmail}
            onChange={(e) => setResetEmail(e.target.value)}
            required
            fullWidth
            size="medium"
          />
        )}
      </Box>

      {(msg || errorMsg) && (
        <Typography
          variant="body2"
          sx={{
            color: (msg || errorMsg)?.includes("Check your email")
              ? "#4ade80"
              : "#ff4d4d",
            bgcolor: "rgba(0,0,0,0.2)",
            p: 1.5,
            borderRadius: 2,
            textAlign: "center",
            fontSize: "0.85rem",
            fontWeight: 600,
          }}
        >
          {msg || errorMsg}
        </Typography>
      )}

      <Button
        type="submit"
        variant="contained"
        color="primary"
        fullWidth
        disabled={loading}
        sx={{
          py: 1.8,
          fontSize: "1rem",
          fontWeight: 800,
          textTransform: "none",
          borderRadius: 3,
          boxShadow: "0 10px 20px rgba(25, 118, 210, 0.3)",
        }}
      >
        {loading
          ? "Processing..."
          : mode === "login"
          ? "Sign In"
          : mode === "register"
          ? "Create Account"
          : "Send Reset Link"}
      </Button>

      <Box
        sx={{
          mt: 1,
          display: "flex",
          flexDirection: "column",
          gap: 1,
          alignItems: "center",
        }}
      >
        {mode === "login" && (
          <>
            <Button
              variant="text"
              sx={{ color: "rgba(255,255,255,0.6)", textTransform: "none" }}
              onClick={() => setMode("register")}
            >
              Don't have an account? <strong>Sign Up</strong>
            </Button>
            <Button
              variant="text"
              sx={{
                color: "rgba(255,255,255,0.4)",
                fontSize: "0.75rem",
                textTransform: "none",
              }}
              onClick={() => setMode("reset")}
            >
              Forgot Password?
            </Button>
          </>
        )}
        {mode === "register" && (
          <Button
            variant="text"
            sx={{ color: "rgba(255,255,255,0.6)", textTransform: "none" }}
            onClick={() => setMode("login")}
          >
            Already have an account? <strong>Sign In</strong>
          </Button>
        )}
        {mode === "reset" && (
          <Button
            variant="text"
            sx={{ color: "rgba(255,255,255,0.6)", textTransform: "none" }}
            onClick={() => setMode("login")}
          >
            Back to <strong>Sign In</strong>
          </Button>
        )}
      </Box>
    </Box>
  );
}

export default AuthForm;
