import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Paper,
  Stack,
  IconButton,
  Button,
  TextField,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Tooltip,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import ThumbUpOutlinedIcon from "@mui/icons-material/ThumbUpOutlined";
import ThumbDownIcon from "@mui/icons-material/ThumbDown";
import ThumbDownOutlinedIcon from "@mui/icons-material/ThumbDownOutlined";
import AddIcon from "@mui/icons-material/Add";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import { supabase } from "../supabaseClient";
import { useLocations } from "../hooks/useLocations";

interface ActivitySuggestion {
  id: string;
  title: string;
  description: string;
  location: string;
  vacation_id: number;
  created_by: string;
  profile_id: string;
  created_at: string;
  profiles: {
    display_name: string;
    avatar_url: string;
  };
  votes: {
    profile_id: string;
    vote_type: "like" | "dislike";
    profiles: {
      display_name: string;
      avatar_url: string;
    };
  }[];
}

interface ActivitySuggestionsProps {
  user: any;
  onHome: () => void;
  onAdmin?: () => void;
  vacations: any[];
}

const ActivitySuggestions: React.FC<ActivitySuggestionsProps> = ({
  user,
  onHome,
  onAdmin,
  vacations,
}) => {
  const [suggestions, setSuggestions] = useState<ActivitySuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [openAdd, setOpenAdd] = useState(false);
  const [editingActivity, setEditingActivity] =
    useState<ActivitySuggestion | null>(null);
  const [selectedVacationTab, setSelectedVacationTab] = useState<number | null>(
    null,
  );
  const [newActivity, setNewActivity] = useState({
    title: "",
    description: "",
    location: "",
    vacation_id: null as number | null,
  });

  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        setCurrentUserProfile(profile);
      }
    };
    fetchProfile();
  }, [user]);

  const isAdmin = currentUserProfile?.role === "admin";

  const { locations } = useLocations(
    (newActivity.vacation_id || selectedVacationTab || 0) as number,
  );

  useEffect(() => {
    if (vacations && vacations.length > 0 && selectedVacationTab === null) {
      setSelectedVacationTab(vacations[0].id);
    }
  }, [vacations, selectedVacationTab]);

  const fetchSuggestions = useCallback(async () => {
    if (selectedVacationTab === null) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("activity_suggestions")
      .select(
        `
        *,
        profiles:profile_id (display_name, avatar_url),
        votes:suggestion_votes (
          profile_id,
          vote_type,
          profiles:profile_id (display_name, avatar_url)
        )
      `,
      )
      .eq("vacation_id", selectedVacationTab)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching suggestions:", error);
    } else {
      setSuggestions(data || []);
    }
    setLoading(false);
  }, [selectedVacationTab]);

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  const handleVote = async (
    suggestionId: string,
    currentVoteType: "like" | "dislike" | null,
    targetVoteType: "like" | "dislike",
  ) => {
    if (!user) return;

    if (currentVoteType === targetVoteType) {
      // Remove vote
      await supabase
        .from("suggestion_votes")
        .delete()
        .eq("suggestion_id", suggestionId)
        .eq("profile_id", user.id);
    } else {
      // Manual delete then insert to avoid upsert 403/409 issues
      await supabase
        .from("suggestion_votes")
        .delete()
        .eq("suggestion_id", suggestionId)
        .eq("profile_id", user.id);

      await supabase.from("suggestion_votes").insert({
        suggestion_id: suggestionId,
        profile_id: user.id,
        vote_type: targetVoteType,
      });
    }
    fetchSuggestions();
  };

  const handleAddActivity = async () => {
    if (!user || !newActivity.title || !newActivity.vacation_id) return;

    if (editingActivity) {
      const { error } = await supabase
        .from("activity_suggestions")
        .update({
          title: newActivity.title,
          description: newActivity.description,
          location: newActivity.location || null,
          vacation_id: newActivity.vacation_id,
        })
        .eq("id", editingActivity.id);

      if (error) console.error("Error updating suggestion:", error);
    } else {
      const { error } = await supabase.from("activity_suggestions").insert({
        title: newActivity.title,
        description: newActivity.description,
        location: newActivity.location || null,
        vacation_id: newActivity.vacation_id,
        profile_id: user.id,
      });

      if (error) console.error("Error adding suggestion:", error);
    }

    setOpenAdd(false);
    setEditingActivity(null);
    setNewActivity({
      title: "",
      description: "",
      location: "",
      vacation_id: selectedVacationTab as number,
    });
    fetchSuggestions();
  };

  const handleDeleteActivity = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this suggestion?"))
      return;
    const { error } = await supabase
      .from("activity_suggestions")
      .delete()
      .eq("id", id);
    if (error) console.error("Error deleting suggestion:", error);
    else fetchSuggestions();
  };

  const handleEditClick = (activity: ActivitySuggestion) => {
    setEditingActivity(activity);
    setNewActivity({
      title: activity.title,
      description: activity.description,
      location: activity.location || "",
      vacation_id: activity.vacation_id,
    });
    setOpenAdd(true);
  };

  // Group suggestions by location
  const groupedSuggestions = suggestions.reduce(
    (acc: Record<string, ActivitySuggestion[]>, curr) => {
      const loc = curr.location || "Other Locations";
      if (!acc[loc]) acc[loc] = [];
      acc[loc].push(curr);
      return acc;
    },
    {},
  );

  return (
    <Box sx={{ maxWidth: 1000, mx: "auto", p: { xs: 2, sm: 3 } }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "flex-start", sm: "center" }}
        justifyContent="space-between"
        spacing={2}
        mb={3}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <IconButton onClick={onHome} sx={{ color: "primary.main", ml: -1 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography
            variant="h5"
            sx={{ fontWeight: 900, fontSize: { xs: "1.5rem", sm: "2.125rem" } }}
          >
            Activity Suggestions
          </Typography>
        </Stack>
        <Button
          variant="contained"
          fullWidth={{ xs: true, sm: false } as any}
          startIcon={<AddIcon />}
          onClick={() => {
            setNewActivity((prev) => ({
              ...prev,
              vacation_id: selectedVacationTab,
            }));
            setOpenAdd(true);
          }}
          sx={{ borderRadius: 3, px: 3, height: 48 }}
        >
          Suggest Activity
        </Button>
        {isAdmin && onAdmin && (
          <Button
            variant="outlined"
            fullWidth={{ xs: true, sm: false } as any}
            startIcon={<AdminPanelSettingsIcon />}
            onClick={onAdmin}
            sx={{ borderRadius: 3, px: 3, height: 48 }}
          >
            Admin Panel
          </Button>
        )}
      </Stack>

      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        {selectedVacationTab !== null && (
          <Tabs
            value={selectedVacationTab}
            onChange={(_e, newValue) => setSelectedVacationTab(newValue)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              "& .MuiTab-root": {
                fontWeight: 700,
                minWidth: 120,
                color: "rgba(255,255,255,0.4)",
                "&.Mui-selected": { color: "primary.main" },
              },
              "& .MuiTabs-indicator": {
                backgroundColor: "primary.main",
              },
            }}
          >
            {vacations.map((v) => (
              <Tab key={v.id} label={v.name} value={v.id} />
            ))}
          </Tabs>
        )}
      </Box>

      {loading ? (
        <Typography>Loading suggestions...</Typography>
      ) : Object.keys(groupedSuggestions).length === 0 ? (
        <Box sx={{ textAlign: "center", py: 10, opacity: 0.5 }}>
          <Typography>No suggestions yet for this trip.</Typography>
        </Box>
      ) : (
        <Stack spacing={4}>
          {Object.entries(groupedSuggestions).map(([location, items]) => (
            <Box key={location}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 900,
                  mb: 2,
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  opacity: location === "Other Locations" ? 0.6 : 1,
                }}
              >
                {location !== "Other Locations" && (
                  <LocationOnIcon sx={{ color: "primary.main" }} />
                )}
                {location}
              </Typography>
              <Stack spacing={2}>
                {items.map((item) => {
                  const userVote = item.votes?.find(
                    (v) => v.profile_id === user?.id,
                  );
                  const currentVoteType = userVote?.vote_type || null;
                  const likeCount =
                    item.votes?.filter((v) => v.vote_type === "like").length ||
                    0;
                  const dislikeCount =
                    item.votes?.filter((v) => v.vote_type === "dislike")
                      .length || 0;
                  const isCreator = item.profile_id === user?.id;

                  return (
                    <Paper
                      key={item.id}
                      sx={{
                        p: 0,
                        overflow: "hidden",
                        bgcolor: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.05)",
                        transition: "all 0.2s",
                        "&:hover": {
                          borderColor: "rgba(255,255,255,0.1)",
                          bgcolor: "rgba(255,255,255,0.05)",
                          transform: "translateY(-2px)",
                        },
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: { xs: "column", sm: "row" },
                          p: 2,
                          gap: 2,
                        }}
                      >
                        <Box sx={{ flex: 1 }}>
                          <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="flex-start"
                          >
                            <Typography
                              variant="subtitle1"
                              sx={{ fontWeight: 800 }}
                            >
                              {item.title}
                            </Typography>
                          </Stack>
                          <Typography
                            variant="body2"
                            sx={{ opacity: 0.7, mb: 1.5, mt: 0.5 }}
                          >
                            {item.description}
                          </Typography>
                          <Stack
                            direction="row"
                            alignItems="center"
                            justifyContent="space-between"
                          >
                            <Stack
                              direction="row"
                              alignItems="center"
                              spacing={1}
                            >
                              <Avatar
                                src={item.profiles?.avatar_url}
                                sx={{ width: 20, height: 20 }}
                              />
                              <Typography
                                variant="caption"
                                sx={{ opacity: 0.4 }}
                              >
                                Suggested by{" "}
                                {item.profiles?.display_name || "Someone"}
                              </Typography>
                            </Stack>

                            {(isCreator || isAdmin) && (
                              <Stack
                                direction="row"
                                spacing={0.5}
                                sx={{ mr: -1 }}
                              >
                                <IconButton
                                  size="small"
                                  onClick={() => handleEditClick(item)}
                                  sx={{
                                    width: 30,
                                    height: 30,
                                    opacity: 0.3,
                                    bgcolor: "rgba(255,255,255,0.03)",
                                    "&:hover": {
                                      opacity: 1,
                                      bgcolor: "rgba(255,255,255,0.08)",
                                    },
                                  }}
                                >
                                  <EditIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  onClick={() => handleDeleteActivity(item.id)}
                                  sx={{
                                    width: 30,
                                    height: 30,
                                    opacity: 0.3,
                                    bgcolor: "rgba(255,255,255,0.03)",
                                    "&:hover": {
                                      opacity: 1,
                                      color: "error.main",
                                      bgcolor: "rgba(211, 47, 47, 0.08)",
                                    },
                                  }}
                                >
                                  <DeleteIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                              </Stack>
                            )}
                          </Stack>
                        </Box>

                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: { xs: "row", sm: "column" },
                            alignItems: "center",
                            justifyContent: {
                              xs: "space-between",
                              sm: "center",
                            },
                            minWidth: { xs: "100%", sm: 100 },
                            pt: { xs: 1.5, sm: 0 },
                            borderTop: {
                              xs: "1px solid rgba(255,255,255,0.05)",
                              sm: "none",
                            },
                            gap: 1.5,
                          }}
                        >
                          <Stack
                            direction="row"
                            spacing={3}
                            alignItems="flex-start"
                          >
                            {/* Likes Section */}
                            <Stack alignItems="center" spacing={0.5}>
                              <Stack alignItems="center">
                                <IconButton
                                  size="small"
                                  onClick={() =>
                                    handleVote(item.id, currentVoteType, "like")
                                  }
                                  sx={{
                                    color:
                                      currentVoteType === "like"
                                        ? "primary.main"
                                        : "rgba(255,255,255,0.2)",
                                    bgcolor:
                                      currentVoteType === "like"
                                        ? "rgba(202, 29, 73, 0.1)"
                                        : "transparent",
                                  }}
                                >
                                  {currentVoteType === "like" ? (
                                    <ThumbUpIcon fontSize="small" />
                                  ) : (
                                    <ThumbUpOutlinedIcon fontSize="small" />
                                  )}
                                </IconButton>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    fontWeight: 900,
                                    opacity: likeCount > 0 ? 1 : 0.3,
                                  }}
                                >
                                  {likeCount}
                                </Typography>
                              </Stack>

                              {/* Upvoters List */}
                              {item.votes &&
                                item.votes.some(
                                  (v) => v.vote_type === "like",
                                ) && (
                                  <Stack direction="row" spacing={-1}>
                                    {item.votes
                                      .filter((v) => v.vote_type === "like")
                                      .slice(0, 3)
                                      .map((vote) => (
                                        <Tooltip
                                          key={vote.profile_id}
                                          title={
                                            vote.profiles?.display_name ||
                                            "Anonymous"
                                          }
                                        >
                                          <Avatar
                                            src={vote.profiles?.avatar_url}
                                            sx={{
                                              width: 18,
                                              height: 18,
                                              border: "1px solid #121212",
                                              bgcolor: "rgba(255,255,255,0.05)",
                                              fontSize: "0.5rem",
                                            }}
                                          >
                                            {vote.profiles?.display_name?.charAt(
                                              0,
                                            )}
                                          </Avatar>
                                        </Tooltip>
                                      ))}
                                  </Stack>
                                )}
                            </Stack>

                            {/* Dislikes Section */}
                            <Stack alignItems="center" spacing={0.5}>
                              <Stack alignItems="center">
                                <IconButton
                                  size="small"
                                  onClick={() =>
                                    handleVote(
                                      item.id,
                                      currentVoteType,
                                      "dislike",
                                    )
                                  }
                                  sx={{
                                    color:
                                      currentVoteType === "dislike"
                                        ? "#546e7a"
                                        : "rgba(255,255,255,0.2)",
                                    bgcolor:
                                      currentVoteType === "dislike"
                                        ? "rgba(84, 110, 122, 0.1)"
                                        : "transparent",
                                  }}
                                >
                                  {currentVoteType === "dislike" ? (
                                    <ThumbDownIcon fontSize="small" />
                                  ) : (
                                    <ThumbDownOutlinedIcon fontSize="small" />
                                  )}
                                </IconButton>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    fontWeight: 900,
                                    opacity: dislikeCount > 0 ? 1 : 0.3,
                                  }}
                                >
                                  {dislikeCount}
                                </Typography>
                              </Stack>

                              {/* Downvoters List */}
                              {item.votes &&
                                item.votes.some(
                                  (v) => v.vote_type === "dislike",
                                ) && (
                                  <Stack direction="row" spacing={-1}>
                                    {item.votes
                                      .filter((v) => v.vote_type === "dislike")
                                      .slice(0, 3)
                                      .map((vote) => (
                                        <Tooltip
                                          key={vote.profile_id}
                                          title={
                                            vote.profiles?.display_name ||
                                            "Anonymous"
                                          }
                                        >
                                          <Avatar
                                            src={vote.profiles?.avatar_url}
                                            sx={{
                                              width: 18,
                                              height: 18,
                                              border: "1px solid #121212",
                                              bgcolor: "rgba(255,255,255,0.05)",
                                              fontSize: "0.5rem",
                                            }}
                                          >
                                            {vote.profiles?.display_name?.charAt(
                                              0,
                                            )}
                                          </Avatar>
                                        </Tooltip>
                                      ))}
                                  </Stack>
                                )}
                            </Stack>
                          </Stack>
                        </Box>
                      </Box>
                    </Paper>
                  );
                })}
              </Stack>
            </Box>
          ))}
        </Stack>
      )}

      <Dialog
        open={openAdd}
        onClose={() => {
          setOpenAdd(false);
          setEditingActivity(null);
          setNewActivity({
            title: "",
            description: "",
            location: "",
            vacation_id: selectedVacationTab,
          });
        }}
        PaperProps={{
          sx: {
            bgcolor: "#0a0a0a",
            backgroundImage: "none",
            borderRadius: 4,
            width: "100%",
            maxWidth: 500,
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 900 }}>
          {editingActivity ? "Edit Suggestion" : "Suggest Activity"}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <FormControl fullWidth variant="outlined">
              <InputLabel>Associated Trip</InputLabel>
              <Select
                value={newActivity.vacation_id || ""}
                label="Associated Trip"
                onChange={(e) =>
                  setNewActivity({
                    ...newActivity,
                    vacation_id: e.target.value as number,
                  })
                }
              >
                {vacations.map((v) => (
                  <MenuItem key={v.id} value={v.id}>
                    {v.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Title"
              fullWidth
              value={newActivity.title}
              onChange={(e) =>
                setNewActivity({ ...newActivity, title: e.target.value })
              }
            />
            <FormControl fullWidth variant="outlined">
              <InputLabel>Location</InputLabel>
              <Select
                value={newActivity.location}
                label="Location"
                onChange={(e) =>
                  setNewActivity({
                    ...newActivity,
                    location: e.target.value as string,
                  })
                }
              >
                {locations.map((loc) => (
                  <MenuItem key={loc.id} value={loc.name}>
                    {loc.name}
                  </MenuItem>
                ))}
                <MenuItem value="Other Locations">Other</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={4}
              value={newActivity.description}
              onChange={(e) =>
                setNewActivity({ ...newActivity, description: e.target.value })
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={() => {
              setOpenAdd(false);
              setEditingActivity(null);
              setNewActivity({
                title: "",
                description: "",
                location: "",
                vacation_id: selectedVacationTab,
              });
            }}
            sx={{ color: "text.secondary" }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleAddActivity}
            disabled={!newActivity.title || !newActivity.vacation_id}
          >
            {editingActivity ? "Update" : "Submit"} Suggestion
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ActivitySuggestions;
