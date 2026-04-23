import React from "react";
import { Box, Typography, Stack, Avatar } from "@mui/material";
import { formatDistanceToNow } from "date-fns";

interface NotificationWidgetProps {
  notifications: any[];
}

const NotificationWidget: React.FC<NotificationWidgetProps> = ({
  notifications,
}) => {
  const latestNotifications = notifications.slice(0, 4);

  if (latestNotifications.length === 0) {
    return (
      <Box sx={{ p: 2, textAlign: "center", opacity: 0.5 }}>
        <Typography variant="body2">No recent activity.</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Stack spacing={1.5}>
        {latestNotifications.map((n) => (
          <Box
            key={n.id}
            sx={{
              display: "flex",
              gap: 1.5,
              alignItems: "flex-start",
              pb: 1,
              borderBottom: "1px solid rgba(255,255,255,0.03)",
              "&:last-child": { borderBottom: "none" },
            }}
          >
            <Avatar
              src={n.profiles?.avatar_url}
              sx={{
                width: 28,
                height: 28,
                border: n.is_read ? "none" : "2px solid #ca1d49",
              }}
            />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="body2"
                noWrap
                sx={{
                  fontSize: "0.75rem",
                  lineHeight: 1.2,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                <span style={{ fontWeight: 800 }}>
                  {n.profiles?.display_name || "Someone"}
                </span>{" "}
                {n.message}
              </Typography>
              <Typography
                variant="caption"
                noWrap
                sx={{
                  opacity: 0.4,
                  fontSize: "0.65rem",
                  display: "block",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {formatDistanceToNow(new Date(n.created_at), {
                  addSuffix: true,
                })}
              </Typography>
            </Box>
          </Box>
        ))}
      </Stack>
    </Box>
  );
};

export default NotificationWidget;
