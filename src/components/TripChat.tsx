import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  IconButton,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  CircularProgress,
  Tooltip,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import ChatIcon from "@mui/icons-material/Chat";
import { supabase } from "../supabaseClient";

interface Comment {
  id: number;
  vacation_id: number;
  profile_id: string;
  comment_text: string;
  created_at: string;
  profiles: {
    display_name: string;
  };
}

interface TripChatProps {
  vacationId: number;
  user: any;
}

export default function TripChat({ vacationId, user }: TripChatProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchComments = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("vacation_comments")
        .select("*, profiles!inner(display_name)") // Added !inner to force relation check
        .eq("vacation_id", vacationId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching comments:", error);
        // Fallback: fetch without profile if inner join fails
        const { data: fallbackData } = await supabase
          .from("vacation_comments")
          .select("*")
          .eq("vacation_id", vacationId)
          .order("created_at", { ascending: true });

        if (fallbackData) {
          setComments(
            fallbackData.map((c: any) => ({
              ...c,
              profiles: { display_name: "Anonymous" },
            })) as Comment[]
          );
        }
      } else if (data) {
        setComments(data as Comment[]);
      }
    } catch (err) {
      console.error("Unknown error in fetchComments:", err);
    } finally {
      setLoading(false);
    }
  }, [vacationId]);

  useEffect(() => {
    fetchComments();

    // Subscribe to new comments
    const channel = supabase
      .channel("vacation-comments-channel")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "vacation_comments",
          filter: `vacation_id=eq.${vacationId}`,
        },
        () => {
          fetchComments();
        }
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR") {
          console.error(
            "Realtime subscription failed. Check if Realtime is enabled in Supabase and your key is valid."
          );
        }
        if (status === "TIMED_OUT") {
          console.warn("Realtime subscription timed out. Reconnecting...");
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [vacationId, fetchComments]);

  async function handleSendComment(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    const { error } = await supabase.from("vacation_comments").insert({
      vacation_id: vacationId,
      profile_id: user.id,
      comment_text: newComment.trim(),
    });

    if (!error) {
      setNewComment("");
      fetchComments();
    }
  }

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 4,
        bgcolor: "rgba(255,255,255,0.03)",
        backdropFilter: "blur(15px)",
        border: "1px solid rgba(255,255,255,0.05)",
        height: "500px",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
      }}
    >
      <Box sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1.5 }}>
        <Box
          sx={{
            p: 1,
            borderRadius: 2,
            bgcolor: "secondary.main",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 12px rgba(220, 0, 78, 0.3)",
          }}
        >
          <ChatIcon sx={{ color: "#fff", fontSize: 20 }} />
        </Box>
        <Typography
          variant="h6"
          sx={{ fontWeight: 800, fontSize: { xs: "1rem", md: "1.25rem" } }}
        >
          Trip Chat
        </Typography>
      </Box>

      <Box
        ref={scrollRef}
        sx={{
          flex: 1,
          overflowY: "auto",
          mb: 2,
          pr: 1,
          "&::-webkit-scrollbar": { width: 4 },
          "&::-webkit-scrollbar-thumb": {
            bgcolor: "rgba(255,255,255,0.05)",
            borderRadius: 10,
          },
        }}
      >
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={24} />
          </Box>
        ) : comments.length === 0 ? (
          <Box sx={{ py: 6, textAlign: "center", opacity: 0.2 }}>
            <Typography variant="body2">No messages yet</Typography>
          </Box>
        ) : (
          <List>
            {comments.map((c) => {
              const isMe = user?.id === c.profile_id;
              return (
                <ListItem
                  key={c.id}
                  alignItems="flex-start"
                  sx={{
                    px: 0,
                    flexDirection: isMe ? "row-reverse" : "row",
                  }}
                >
                  <ListItemAvatar
                    sx={{
                      minWidth: 40,
                      ml: isMe ? 1.5 : 0,
                      mr: isMe ? 0 : 1.5,
                    }}
                  >
                    <Tooltip title={c.profiles?.display_name || "Unknown"}>
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          bgcolor: isMe
                            ? "primary.main"
                            : "rgba(255,255,255,0.1)",
                          fontSize: "0.8rem",
                          fontWeight: 800,
                        }}
                      >
                        {(c.profiles?.display_name || "U").charAt(0)}
                      </Avatar>
                    </Tooltip>
                  </ListItemAvatar>
                  <Box
                    sx={{
                      maxWidth: "80%",
                      bgcolor: isMe ? "primary.main" : "rgba(255,255,255,0.05)",
                      p: 1.5,
                      borderRadius: isMe
                        ? "16px 4px 16px 16px"
                        : "4px 16px 16px 16px",
                      color: isMe ? "#fff" : "rgba(255,255,255,0.9)",
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        display: "block",
                        fontWeight: 800,
                        fontSize: "0.65rem",
                        mb: 0.5,
                        opacity: isMe ? 0.8 : 0.6,
                        textAlign: isMe ? "right" : "left",
                      }}
                    >
                      {c.profiles?.display_name} •{" "}
                      {new Date(c.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Typography>
                    <Typography variant="body2" sx={{ lineHeight: 1.4 }}>
                      {c.comment_text}
                    </Typography>
                  </Box>
                </ListItem>
              );
            })}
          </List>
        )}
      </Box>

      <Box
        component="form"
        onSubmit={handleSendComment}
        sx={{
          display: "flex",
          gap: 1.5,
          p: 0.5,
          borderRadius: 3,
          bgcolor: "rgba(0,0,0,0.2)",
        }}
      >
        <TextField
          size="small"
          placeholder="Type a message..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          fullWidth
          variant="standard"
          autoComplete="off"
          disabled={!user}
          InputProps={{
            disableUnderline: true,
            sx: {
              px: 2,
              py: 1,
              color: "#fff",
              fontWeight: 600,
              "&::placeholder": { opacity: 0.4 },
            },
          }}
        />
        <IconButton
          type="submit"
          disabled={!newComment.trim() || !user}
          sx={{
            bgcolor: "secondary.main",
            color: "#fff",
            "&:hover": { bgcolor: "secondary.dark" },
            borderRadius: 2.5,
            width: 40,
            height: 40,
          }}
        >
          <SendIcon fontSize="small" />
        </IconButton>
      </Box>
    </Paper>
  );
}
