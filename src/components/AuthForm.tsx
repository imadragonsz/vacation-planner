import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { TextField, Button, IconButton, Typography, Box } from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

interface AuthFormProps {
  open: boolean;
  onClose: () => void;
  onAuth: (err: any) => void;
  mode: "login" | "register" | "reset";
  setMode: (mode: "login" | "register" | "reset") => void;
  errorMsg: string | null;
}

function AuthForm({
  open,
  onClose,
  onAuth,
  mode,
  setMode,
  errorMsg,
}: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!open) {
      setEmail("");
      setPassword("");
      setDisplayName("");
      setMsg(null);
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password;

    try {
      const actions = {
        login: async () =>
          supabase.auth.signInWithPassword({
            email: normalizedEmail,
            password: normalizedPassword,
          }),
        register: async () => {
          const { data, error } = await supabase.auth.signUp({
            email: normalizedEmail,
            password: normalizedPassword,
            options: { data: { display_name: displayName } },
          });
          if (!error && data.user) {
            await supabase
              .from("profiles")
              .insert([{ id: data.user.id, display_name: displayName }]);
          }
          return { data, error };
        },
      };

      const { error } = await (actions as any)[mode]();

      if (error) {
        const prettyMessage =
          error.message === "Invalid login credentials"
            ? "Invalid email or password. Please verify your credentials."
            : error.message;

        setMsg(prettyMessage);
        onAuth(error);
      } else {
        setMsg(
          mode === "register"
            ? "Check your email for a confirmation link."
            : null,
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
    }
  }, [mode]);

  return (
    <Box
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "rgba(0,0,0,0.8)",
        backdropFilter: "blur(10px)",
      }}
      onClick={onClose}
    >
      <Box
        component="form"
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
          gap: 3,
          p: { xs: 4, md: 6 },
          width: "100%",
          maxWidth: 420,
          backgroundColor: (theme) =>
            theme.palette.mode === "dark"
              ? "rgba(15, 17, 21, 0.95)"
              : "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(20px)",
          borderRadius: { xs: "24px 24px 0 0", md: 6 },
          border: (theme) =>
            `1px solid ${
              theme.palette.mode === "dark"
                ? "rgba(255, 255, 255, 0.1)"
                : "rgba(0, 0, 0, 0.1)"
            }`,
          boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
          color: "text.primary",
          mx: "auto",
          position: "relative",
          maxHeight: { xs: "90vh", md: "80vh" },
          overflowY: "auto",
        }}
      >
        {/* Mobile Grabber */}
        <Box
          sx={{
            width: 40,
            height: 4,
            bgcolor: "text.disabled",
            opacity: 0.3,
            borderRadius: 2,
            mx: "auto",
            mb: 1,
            display: { xs: "block", md: "none" },
          }}
        />

        <Box sx={{ mb: 2, textAlign: "center" }}>
          <Typography
            variant="h4"
            component="h2"
            sx={{ fontWeight: 900, mb: 1 }}
          >
            {mode === "login" ? "Welcome Back" : "Create Account"}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.6 }}>
            {mode === "login"
              ? "Please enter your details to sign in"
              : "Sign up to start planning your trips"}
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
          {(mode === "login" || mode === "register") && (
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
                    sx={{ color: "text.secondary" }}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                ),
              }}
            />
          )}
        </Box>

        {(msg || errorMsg) && (
          <Typography
            variant="body2"
            sx={{
              color: (msg || errorMsg)?.includes("Check your email")
                ? "success.light"
                : "error.light",
              bgcolor: (theme) =>
                theme.palette.mode === "dark"
                  ? "rgba(0,0,0,0.3)"
                  : "rgba(0,0,0,0.05)",
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
            boxShadow: (theme) =>
              `0 10px 20px ${
                theme.palette.mode === "dark"
                  ? "rgba(0,0,0,0.5)"
                  : "rgba(25, 118, 210, 0.2)"
              }`,
          }}
        >
          {loading
            ? "Processing..."
            : mode === "login"
              ? "Sign In"
              : "Create Account"}
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
                sx={{ color: "text.secondary", textTransform: "none" }}
                onClick={() => setMode("register")}
              >
                Don't have an account? <strong>Sign Up</strong>
              </Button>
              <Typography
                variant="caption"
                sx={{
                  color: "text.disabled",
                  fontSize: "0.75rem",
                  textAlign: "center",
                  mt: 1,
                  opacity: 0.8,
                }}
              >
                Forgot Password? Contact the admin for a manual reset.
              </Typography>
            </>
          )}
          {mode === "register" && (
            <Button
              variant="text"
              sx={{ color: "text.secondary", textTransform: "none" }}
              onClick={() => setMode("login")}
            >
              Already have an account? <strong>Sign In</strong>
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  );
}

export default AuthForm;
