import React, { useState, useEffect } from "react";
import { supabase } from "../../src/supabaseClient";
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Divider,
  Container,
  Avatar,
  IconButton,
  Grid,
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import SecurityIcon from "@mui/icons-material/Security";
import LogoutIcon from "@mui/icons-material/Logout";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SettingsIcon from "@mui/icons-material/Settings";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import MailOutlineIcon from "@mui/icons-material/MailOutline";

import { AVATAR_SLUGS, resolveAvatar } from "../utils/avatars";

type AccountPageProps = {
  user: any;
  onLogout: () => void;
  onHome: () => void;
};

export default function AccountPage({
  user,
  onLogout,
  onHome,
}: AccountPageProps) {
  const [newPassword, setNewPassword] = useState("");
  const [displayName, setDisplayName] = useState(
    user?.user_metadata?.display_name || "",
  );
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("id", user.id)
        .maybeSingle();

      if (!error && data) {
        setDisplayName(data.display_name || "");
        setAvatarUrl(data.avatar_url || "");
      }
    }
    if (user?.id) fetchProfile();
  }, [user.id]);

  const handleUpdateProfile = async () => {
    setIsUpdating(true);
    try {
      const { error: authError } = await supabase.auth.updateUser({
        data: { display_name: displayName, avatar_url: avatarUrl },
      });
      if (authError) throw authError;

      const { error: profileError } = await supabase.from("profiles").upsert({
        id: user.id,
        display_name: displayName,
        avatar_url: avatarUrl,
      });
      if (profileError) throw profileError;

      alert("Profile updated successfully!");
    } catch (error: any) {
      alert(error.message || "Error updating profile");
    } finally {
      setIsUpdating(false);
    }
  };

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!newPassword) return;

    setIsUpdating(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
      alert("Password updated successfully!");
      setNewPassword("");
    } catch (error: any) {
      alert(error.message || "Error updating password");
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleSendResetEmail() {
    setIsUpdating(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/`,
      });
      if (error) throw error;
      alert("Password recovery email sent successfully!");
    } catch (error: any) {
      alert(error.message || "Error sending recovery email");
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <Container
      maxWidth="xl"
      sx={{ py: { xs: 2, md: 8 }, px: { xs: 2, md: 4 } }}
    >
      <Box
        sx={{
          mb: 4,
          display: "flex",
          alignItems: { xs: "flex-start", sm: "center" },
          justifyContent: "space-between",
          flexDirection: { xs: "column", sm: "row" },
          gap: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <IconButton onClick={onHome} sx={{ color: "rgba(255,255,255,0.6)" }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 900,
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              fontSize: { xs: "1.5rem", md: "2.125rem" },
            }}
          >
            <SettingsIcon sx={{ fontSize: { xs: 30, md: 40 }, opacity: 0.8 }} />
            Account Settings
          </Typography>
        </Box>
        <Button
          variant="outlined"
          color="error"
          startIcon={<LogoutIcon />}
          onClick={onLogout}
          fullWidth={false}
          sx={{
            borderRadius: 2,
            px: 3,
            fontWeight: 700,
            alignSelf: { xs: "stretch", sm: "auto" },
          }}
        >
          Logout
        </Button>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1.5fr" },
          gap: 4,
          alignItems: "stretch",
        }}
      >
        {/* Profile Section */}
        <Box sx={{ height: "100%" }}>
          <Paper
            elevation={0}
            sx={{
              p: 4,
              height: "100%",
              bgcolor: "rgba(255, 255, 255, 0.03)",
              backdropFilter: "blur(10px)",
              borderRadius: 4,
              border: "1px solid rgba(255, 255, 255, 0.05)",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 4 }}>
              <Avatar
                src={resolveAvatar(avatarUrl)}
                sx={{
                  width: 80,
                  height: 80,
                  bgcolor: "primary.main",
                  boxShadow: "0 8px 16px rgba(25, 118, 210, 0.3)",
                  fontSize: 32,
                  fontWeight: 800,
                }}
              >
                {!avatarUrl && user.email?.[0].toUpperCase()}
              </Avatar>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 900, mb: 0.5 }}>
                  {displayName || "Explorer"}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ opacity: 0.6, fontWeight: 500 }}
                >
                  {user.email}
                </Typography>
              </Box>
            </Box>

            <Typography
              variant="subtitle2"
              sx={{
                mb: 2,
                fontWeight: 800,
                display: "flex",
                alignItems: "center",
                gap: 1,
                color: "primary.light",
              }}
            >
              <PhotoCameraIcon fontSize="small" />
              Choose Profile Picture
            </Typography>

            <Box sx={{ mb: 4 }}>
              <Grid container spacing={1.5}>
                {AVATAR_SLUGS.map((slug) => (
                  <Grid key={slug} size="auto">
                    <Avatar
                      src={resolveAvatar(slug)}
                      onClick={() => setAvatarUrl(slug)}
                      sx={{
                        width: 52,
                        height: 52,
                        cursor: "pointer",
                        border:
                          avatarUrl === slug
                            ? "3px solid #1976d2"
                            : "2px solid transparent",
                        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                        transform: avatarUrl === slug ? "scale(1.1)" : "none",
                        "&:hover": {
                          transform: "scale(1.15)",
                          zIndex: 1,
                        },
                      }}
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>

            <Typography
              variant="subtitle2"
              sx={{
                mb: 2,
                fontWeight: 800,
                display: "flex",
                alignItems: "center",
                gap: 1,
                color: "primary.light",
              }}
            >
              <PersonIcon fontSize="small" />
              Profile Information
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
              <TextField
                label="Display Name"
                fullWidth
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    bgcolor: "rgba(255,255,255,0.02)",
                  },
                }}
              />
              <Button
                variant="contained"
                fullWidth
                onClick={handleUpdateProfile}
                disabled={isUpdating}
                sx={{ py: 1.5, fontWeight: 800, borderRadius: 2 }}
              >
                {isUpdating ? "Updating..." : "Update Profile"}
              </Button>
            </Box>
          </Paper>
        </Box>

        {/* Security Section */}
        <Box sx={{ height: "100%" }}>
          <Paper
            elevation={0}
            sx={{
              p: 4,
              height: "100%",
              bgcolor: "rgba(255, 255, 255, 0.03)",
              backdropFilter: "blur(10px)",
              borderRadius: 4,
              border: "1px solid rgba(255, 255, 255, 0.05)",
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{
                mb: 3,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <SecurityIcon fontSize="small" />
              Security Settings
            </Typography>
            <Box
              component="form"
              onSubmit={handleUpdatePassword}
              sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}
            >
              <TextField
                label="New Password"
                type="password"
                fullWidth
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    bgcolor: "rgba(255,255,255,0.02)",
                  },
                }}
              />
              <Typography variant="caption" sx={{ opacity: 0.5 }}>
                Password must be at least 8 characters long and include numbers
                or special symbols.
              </Typography>
              <Button
                variant="outlined"
                color="primary"
                type="submit"
                disabled={isUpdating}
                sx={{
                  py: 1.5,
                  fontWeight: 800,
                  borderRadius: 2,
                  borderWidth: 1.5,
                  "&:hover": { borderWidth: 1.5 },
                }}
              >
                {isUpdating ? "Updating..." : "Change Password"}
              </Button>
            </Box>

            <Divider sx={{ my: 4, opacity: 0.1 }} />

            <Typography
              variant="subtitle2"
              sx={{
                mb: 1,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              Reset Password
            </Typography>
            <Typography variant="body2" sx={{ mb: 3, opacity: 0.6 }}>
              Send a password recovery email to your inbox to securely reset
              your password.
            </Typography>
            <Button
              variant="outlined"
              color="inherit"
              fullWidth
              disabled={isUpdating}
              onClick={handleSendResetEmail}
              startIcon={<MailOutlineIcon />}
              sx={{
                py: 1.5,
                fontWeight: 800,
                borderRadius: 2,
                borderWidth: 1.5,
                borderColor: "rgba(255,255,255,0.1)",
                "&:hover": {
                  borderWidth: 1.5,
                  bgcolor: "rgba(255,255,255,0.05)",
                  borderColor: "rgba(255,255,255,0.2)",
                },
              }}
            >
              Send password recovery
            </Button>

            <Divider sx={{ my: 4, opacity: 0.1 }} />

            <Typography
              variant="subtitle2"
              sx={{ mb: 2, fontWeight: 700, color: "#ff5252" }}
            >
              Danger Zone
            </Typography>
            <Typography variant="body2" sx={{ mb: 3, opacity: 0.6 }}>
              Deleting your account will permanently remove all your vacations,
              agendas, and locations. This action cannot be undone.
            </Typography>
            <Button
              variant="contained"
              color="error"
              sx={{
                py: 1.5,
                fontWeight: 800,
                borderRadius: 2,
                bgcolor: "#ff5252",
              }}
            >
              Delete Account
            </Button>
          </Paper>
        </Box>
      </Box>
    </Container>
  );
}
