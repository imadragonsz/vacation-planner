import React from "react";
import { Box, Typography, Stack, Avatar, AvatarGroup } from "@mui/material";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";

interface ActivityVotingWidgetProps {
  suggestions: any[];
  onNavigate?: (id: string) => void;
}

const ActivityVotingWidget: React.FC<ActivityVotingWidgetProps> = ({
  suggestions,
  onNavigate,
}) => {
  // Sort suggestions by vote count
  const topSuggestions = [...suggestions]
    .sort((a, b) => (b.votes?.length || 0) - (a.votes?.length || 0))
    .slice(0, 3);

  if (topSuggestions.length === 0) {
    return (
      <Box sx={{ p: 2, textAlign: "center", opacity: 0.5 }}>
        <Typography variant="body2">No suggestions yet.</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Stack spacing={2}>
        {topSuggestions.map((s) => (
          <Box
            key={s.id}
            onClick={() => onNavigate?.(s.id)}
            sx={{
              p: 1.5,
              borderRadius: 3,
              bgcolor: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.05)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: onNavigate ? "pointer" : "default",
              transition: "all 0.2s",
              "&:hover": onNavigate
                ? {
                    bgcolor: "rgba(255,255,255,0.06)",
                    borderColor: "#ca1d49",
                    transform: "translateX(4px)",
                  }
                : {},
            }}
          >
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="subtitle2"
                noWrap
                sx={{
                  fontWeight: 800,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {s.title}
              </Typography>
              <Typography
                variant="caption"
                noWrap
                sx={{
                  opacity: 0.5,
                  display: "block",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {s.location}
              </Typography>
            </Box>

            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{ flexShrink: 0, ml: 1 }}
            >
              <AvatarGroup
                max={3}
                sx={{
                  "& .MuiAvatar-root": { width: 20, height: 20, fontSize: 10 },
                }}
              >
                {s.votes?.map((v: any, idx: number) => (
                  <Avatar key={idx} src={v.profiles?.avatar_url} />
                ))}
              </AvatarGroup>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  color: "#ca1d49",
                }}
              >
                <ThumbUpIcon sx={{ fontSize: 14 }} />
                <Typography variant="caption" sx={{ fontWeight: 900 }}>
                  {s.votes?.length || 0}
                </Typography>
              </Box>
            </Stack>
          </Box>
        ))}
      </Stack>
    </Box>
  );
};

export default ActivityVotingWidget;
