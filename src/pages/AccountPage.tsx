import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Divider,
  Avatar,
  Grid,
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import SecurityIcon from "@mui/icons-material/Security";
import LogoutIcon from "@mui/icons-material/Logout";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";

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

  return (
    <Box sx={{ py: { xs: 2, md: 4 }, px: { xs: 2, md: 4 } }}>
      <Box
        sx={{
          mb: 6,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 900,
              fontSize: { xs: "1.75rem", md: "2.5rem" },
              letterSpacing: "-0.02em",
              color: "white",
            }}
          >
            Settings
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="error"
          startIcon={<LogoutIcon />}
          onClick={onLogout}
          sx={{
            borderRadius: 1.5,
            px: 3,
            fontWeight: 900,
            bgcolor: "#ca1d49",
            "&:hover": { bgcolor: "#a0173a" },
            textTransform: "none",
          }}
        >
          Logout
        </Button>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "1fr 1.5fr" },
          gap: 4,
        }}
      >
        {/* Profile Card */}
        <Box>
          <Paper
            elevation={0}
            sx={{
              p: 4,
              bgcolor: "#0f0f11",
              borderRadius: 3,
              border: "1px solid rgba(255, 255, 255, 0.05)",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 3, mb: 4 }}>
              <Avatar
                src={resolveAvatar(avatarUrl)}
                sx={{
                  width: 100,
                  height: 100,
                  bgcolor: "#ca1d49",
                  fontSize: 40,
                  fontWeight: 900,
                }}
              >
                {!avatarUrl && user.email?.[0].toUpperCase()}
              </Avatar>
              <Box>
                <Typography
                  variant="h5"
                  sx={{ fontWeight: 900, color: "white" }}
                >
                  {displayName || "Explorer"}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: "rgba(255,255,255,0.4)",
                    fontWeight: 600,
                    mt: 0.5,
                  }}
                >
                  {user.email}
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ mb: 4, borderColor: "rgba(255,255,255,0.05)" }} />

            <Typography
              variant="overline"
              sx={{ color: "#ca1d49", fontWeight: 900, letterSpacing: "0.1em" }}
            >
              Public Profile
            </Typography>

            <Typography
              variant="subtitle2"
              sx={{
                mb: 2,
                mt: 2,
                fontWeight: 800,
                display: "flex",
                alignItems: "center",
                gap: 1,
                color: "white",
                opacity: 0.8,
              }}
            >
              <PhotoCameraIcon fontSize="small" />
              Choose Profile Picture
            </Typography>

            <Box sx={{ mb: 4 }}>
              <Grid container spacing={2}>
                {AVATAR_SLUGS.map((slug: string) => (
                  <Grid key={slug}>
                    <Avatar
                      src={resolveAvatar(slug)}
                      onClick={() => setAvatarUrl(slug)}
                      sx={{
                        width: { xs: 56, md: 48 },
                        height: { xs: 56, md: 48 },
                        cursor: "pointer",
                        border:
                          avatarUrl === slug
                            ? "3px solid #ca1d49"
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
                color: "white",
                opacity: 0.8,
              }}
            >
              <PersonIcon fontSize="small" />
              Information
            </Typography>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <TextField
                fullWidth
                label="Display Name"
                variant="filled"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                sx={{
                  "& .MuiFilledInput-root": {
                    bgcolor: "rgba(255,255,255,0.03)",
                    color: "white",
                  },
                  "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.5)" },
                }}
              />
              <Button
                variant="contained"
                fullWidth
                disabled={isUpdating}
                onClick={handleUpdateProfile}
                sx={{
                  py: 1.5,
                  borderRadius: 1.5,
                  fontWeight: 900,
                  bgcolor: "white",
                  color: "black",
                  "&:hover": { bgcolor: "rgba(255,255,255,0.8)" },
                }}
              >
                {isUpdating ? "Saving..." : "Save Profile Changes"}
              </Button>
            </Box>
          </Paper>
        </Box>

        {/* Security Card */}
        <Box>
          <Paper
            elevation={0}
            sx={{
              p: 4,
              bgcolor: "#0f0f11",
              borderRadius: 3,
              border: "1px solid rgba(255, 255, 255, 0.05)",
            }}
          >
            <Typography
              variant="overline"
              sx={{ color: "#ca1d49", fontWeight: 900, letterSpacing: "0.1em" }}
            >
              Security
            </Typography>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                mt: 1,
                mb: 3,
                color: "white",
              }}
            >
              <SecurityIcon fontSize="small" />
              <Typography variant="h6" sx={{ fontWeight: 900 }}>
                Update Password
              </Typography>
            </Box>

            <form onSubmit={handleUpdatePassword}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <TextField
                  fullWidth
                  label="New Password"
                  type="password"
                  variant="filled"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  sx={{
                    "& .MuiFilledInput-root": {
                      bgcolor: "rgba(255,255,255,0.03)",
                      color: "white",
                    },
                    "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.5)" },
                  }}
                />
                <Button
                  type="submit"
                  variant="outlined"
                  fullWidth
                  disabled={isUpdating}
                  sx={{
                    py: 1.5,
                    borderRadius: 1.5,
                    fontWeight: 900,
                    borderColor: "rgba(255,255,255,0.1)",
                    color: "white",
                    "&:hover": {
                      borderColor: "white",
                      bgcolor: "rgba(255,255,255,0.02)",
                    },
                  }}
                >
                  {isUpdating ? "Updating..." : "Update Password"}
                </Button>
              </Box>
            </form>

            <Divider sx={{ my: 4, borderColor: "rgba(255,255,255,0.05)" }} />

            <Typography
              variant="subtitle2"
              sx={{ mb: 2, fontWeight: 700, color: "#ca1d49" }}
            >
              Danger Zone
            </Typography>
            <Typography
              variant="body2"
              sx={{ mb: 3, color: "rgba(255,255,255,0.4)" }}
            >
              Deleting your account will permanently remove all your data. This
              action cannot be undone.
            </Typography>
            <Button
              variant="contained"
              fullWidth
              sx={{
                py: 1.5,
                fontWeight: 900,
                borderRadius: 1.5,
                bgcolor: "#ca1d49",
                "&:hover": { bgcolor: "#a0173a" },
              }}
            >
              Delete Account
            </Button>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
}
