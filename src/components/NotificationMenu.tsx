import React, { useState } from "react";
import {
  Badge,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  Box,
  Avatar,
  Divider,
  Button,
  CircularProgress,
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import { useNotifications } from "../hooks/useNotifications";
import { resolveAvatar } from "../utils/avatars";
import DirectionsRunIcon from "@mui/icons-material/DirectionsRun";
import PersonAddIcon from "@mui/icons-material/PersonAdd";

interface NotificationMenuProps {
  userId: string | undefined;
}

export const NotificationMenu: React.FC<NotificationMenuProps> = ({
  userId,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { notifications, unreadCount, markAsRead, markAllAsRead, loading } =
    useNotifications(userId);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = (id: number) => {
    markAsRead(id);
    // Optionally: Route to the trip
    handleClose();
  };

  return (
    <>
      <IconButton color="inherit" onClick={handleClick} size="large">
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: 320,
            maxHeight: 400,
            borderRadius: 3,
            mt: 1.5,
            bgcolor: (theme) =>
              theme.palette.mode === "dark" ? "rgba(30, 30, 35, 0.95)" : "#fff",
            backdropFilter: "blur(10px)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
            border: (theme) =>
              `1px solid ${theme.palette.mode === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
          },
        }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
        <Box
          sx={{
            p: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            Notifications
          </Typography>
          {unreadCount > 0 && (
            <Button
              size="small"
              onClick={markAllAsRead}
              sx={{ fontSize: "0.7rem" }}
            >
              Mark all as read
            </Button>
          )}
        </Box>
        <Divider />
        <Box sx={{ overflowY: "auto", maxHeight: 320 }}>
          {loading && notifications.length === 0 ? (
            <Box sx={{ p: 4, textAlign: "center" }}>
              <CircularProgress size={24} />
            </Box>
          ) : notifications.length === 0 ? (
            <Box sx={{ p: 4, textAlign: "center", opacity: 0.5 }}>
              <Typography variant="body2">No notifications yet</Typography>
            </Box>
          ) : (
            notifications.map((notification) => (
              <MenuItem
                key={notification.id}
                onClick={() => handleNotificationClick(notification.id)}
                sx={{
                  py: 1.5,
                  px: 2,
                  display: "flex",
                  gap: 2,
                  bgcolor: notification.is_read
                    ? "transparent"
                    : "rgba(25, 118, 210, 0.05)",
                  "&:hover": {
                    bgcolor: (theme) =>
                      theme.palette.mode === "dark"
                        ? "rgba(255,255,255,0.05)"
                        : "rgba(0,0,0,0.02)",
                  },
                }}
              >
                <Avatar
                  src={resolveAvatar(notification.profiles?.avatar_url)}
                  sx={{ width: 40, height: 40 }}
                >
                  {notification.type === "join" ? (
                    <PersonAddIcon />
                  ) : (
                    <DirectionsRunIcon />
                  )}
                </Avatar>
                <Box sx={{ flex: 1, whiteSpace: "normal" }}>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: notification.is_read ? 500 : 800 }}
                  >
                    {notification.message}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.5 }}>
                    {new Date(notification.created_at).toLocaleDateString()} at{" "}
                    {new Date(notification.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Typography>
                </Box>
              </MenuItem>
            ))
          )}
        </Box>
      </Menu>
    </>
  );
};
