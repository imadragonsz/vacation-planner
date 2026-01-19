import React, { useState } from "react";
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
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import SecurityIcon from "@mui/icons-material/Security";
import LogoutIcon from "@mui/icons-material/Logout";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SettingsIcon from "@mui/icons-material/Settings";

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
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [displayName, setDisplayName] = useState(
    user?.user_metadata?.display_name || ""
  );

  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdateProfile = async () => {
    setIsUpdating(true);
    try {
      const { error: authError } = await supabase.auth.updateUser({
        data: { display_name: displayName },
      });
      if (authError) throw authError;

      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({ id: user.id, display_name: displayName });
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
    if (!currentPassword || !newPassword) return;
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });
    if (signInError) {
      console.error("Current password is incorrect.");
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) console.error(error.message);
    setCurrentPassword("");
    setNewPassword("");
  }

  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <Box
        sx={{
          mb: 4,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
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
            }}
          >
            <SettingsIcon sx={{ fontSize: 40, opacity: 0.8 }} />
            Account Settings
          </Typography>
        </Box>
        <Button
          variant="outlined"
          color="error"
          startIcon={<LogoutIcon />}
          onClick={onLogout}
          sx={{
            borderRadius: 2,
            borderWidth: 1.5,
            "&:hover": { borderWidth: 1.5 },
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
                sx={{
                  width: 64,
                  height: 64,
                  bgcolor: "primary.main",
                  boxShadow: "0 8px 16px rgba(25, 118, 210, 0.3)",
                }}
              >
                {user.email?.[0].toUpperCase()}
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  {displayName || "No Name"}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.5 }}>
                  {user.email}
                </Typography>
              </Box>
            </Box>

            <Typography
              variant="subtitle2"
              sx={{
                mb: 2,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: 1,
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
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                  gap: 2,
                }}
              >
                <TextField
                  label="Current Password"
                  type="password"
                  fullWidth
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      bgcolor: "rgba(255,255,255,0.02)",
                    },
                  }}
                />
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
              </Box>
              <Typography variant="caption" sx={{ opacity: 0.5 }}>
                Password must be at least 8 characters long and include numbers
                or special symbols.
              </Typography>
              <Button
                variant="outlined"
                color="primary"
                type="submit"
                sx={{
                  py: 1.5,
                  fontWeight: 800,
                  borderRadius: 2,
                  borderWidth: 1.5,
                  "&:hover": { borderWidth: 1.5 },
                }}
              >
                Change Password
              </Button>
            </Box>

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
