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
    handleClose();
  };

  return (
    <>
      <IconButton
        onClick={handleClick}
        sx={{
          color: unreadCount > 0 ? "white" : "rgba(255,255,255,0.4)",
          "&:hover": { color: "white" },
        }}
        size="large"
      >
        <Badge
          badgeContent={unreadCount}
          sx={{
            "& .MuiBadge-badge": {
              backgroundColor: "#ca1d49",
              color: "white",
              fontWeight: "bold",
            },
          }}
        >
          <NotificationsIcon />
        </Badge>
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: 380,
            maxHeight: 500,
            borderRadius: 3,
            mt: 1.5,
            bgcolor: "rgba(10, 10, 15, 0.9)",
            backdropFilter: "blur(20px)",
            boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "white",
            overflow: "hidden",
            "& .MuiList-root": {
              padding: 0,
            },
          },
        }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
        <Box
          sx={{
            p: 2.5,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background:
              "linear-gradient(135deg, rgba(202, 29, 73, 0.1) 0%, rgba(10, 10, 15, 0) 100%)",
          }}
        >
          <Typography
            variant="h6"
            sx={{ fontWeight: 900, letterSpacing: "-0.02em" }}
          >
            NOTIFICATIONS
          </Typography>
          {unreadCount > 0 && (
            <Button
              size="small"
              onClick={markAllAsRead}
              sx={{
                fontSize: "0.65rem",
                fontWeight: 800,
                color: "#ca1d49",
                "&:hover": { bgcolor: "rgba(202, 29, 73, 0.1)" },
              }}
            >
              MARK ALL AS READ
            </Button>
          )}
        </Box>
        <Divider sx={{ borderColor: "rgba(255,255,255,0.05)" }} />
        <Box sx={{ overflowY: "auto", maxHeight: 400 }}>
          {loading && notifications.length === 0 ? (
            <Box sx={{ p: 4, textAlign: "center" }}>
              <CircularProgress size={24} sx={{ color: "#ca1d49" }} />
            </Box>
          ) : notifications.length === 0 ? (
            <Box sx={{ p: 6, textAlign: "center", opacity: 0.3 }}>
              <NotificationsIcon sx={{ fontSize: 48, mb: 1, opacity: 0.2 }} />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                System clean. No new alerts.
              </Typography>
            </Box>
          ) : (
            notifications.map((notification) => (
              <MenuItem
                key={notification.id}
                onClick={() => handleNotificationClick(notification.id)}
                sx={{
                  py: 2,
                  px: 2.5,
                  display: "flex",
                  gap: 2,
                  alignItems: "flex-start",
                  borderLeft: notification.is_read
                    ? "3px solid transparent"
                    : "3px solid #ca1d49",
                  bgcolor: notification.is_read
                    ? "transparent"
                    : "rgba(202, 29, 73, 0.03)",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    bgcolor: "rgba(255,255,255,0.05)",
                  },
                }}
              >
                <Avatar
                  src={resolveAvatar(notification.profiles?.avatar_url)}
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 2,
                    bgcolor: "rgba(255,255,255,0.05)",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                  }}
                >
                  {notification.type === "join" ? (
                    <PersonAddIcon sx={{ color: "#ca1d49" }} />
                  ) : (
                    <DirectionsRunIcon sx={{ color: "#ca1d49" }} />
                  )}
                </Avatar>
                <Box sx={{ flex: 1, whiteSpace: "normal" }}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: notification.is_read ? 500 : 700,
                      color: notification.is_read
                        ? "rgba(255,255,255,0.7)"
                        : "white",
                      lineHeight: 1.4,
                    }}
                  >
                    {notification.message}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      mt: 0.5,
                      display: "block",
                      color: "rgba(202, 29, 73, 0.6)",
                      fontWeight: 800,
                      fontSize: "0.65rem",
                      textTransform: "uppercase",
                    }}
                  >
                    {new Date(notification.created_at).toLocaleDateString()} •{" "}
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
