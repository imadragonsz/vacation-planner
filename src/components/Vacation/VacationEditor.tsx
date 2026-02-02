import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Avatar,
  AvatarGroup,
  Tooltip,
  useTheme,
  useMediaQuery,
  Chip,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import ArchiveIcon from "@mui/icons-material/Archive";
import RestoreIcon from "@mui/icons-material/Restore";
import DeleteIcon from "@mui/icons-material/Delete";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import PersonIcon from "@mui/icons-material/Person";
import GroupIcon from "@mui/icons-material/Group";
import AddIcon from "@mui/icons-material/Add";
import SecurityIcon from "@mui/icons-material/Security";
import dayjs from "dayjs";
import { supabase } from "../../supabaseClient";
import { Vacation } from "../../vacation";
import { Participant } from "../../hooks/useParticipants";
import { resolveAvatar } from "../../utils/avatars";

type VacationEditorProps = {
  vacation: Vacation;
  onVacationUpdated: () => void;
  user: any;
  canEdit: boolean;
  joinVacation: (userId: string) => Promise<boolean>;
  leaveVacation: (userId: string) => Promise<boolean>;
  updateGalleryAccess: (userId: string, allow: boolean) => Promise<boolean>;
  participants: Participant[];
  onArchive?: () => void;
  onRestore?: () => void;
  onDeletePermanently?: () => void;
  onExportICal: () => void;
  onManagePermissions: () => void;
};

export const VacationEditor: React.FC<VacationEditorProps> = ({
  vacation,
  onVacationUpdated,
  user,
  canEdit,
  joinVacation,
  leaveVacation,
  updateGalleryAccess,
  participants,
  onArchive,
  onRestore,
  onDeletePermanently,
  onExportICal,
  onManagePermissions,
}) => {
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down("sm"));
  const [editing, setEditing] = useState(false);
  const [ownerProfile, setOwnerProfile] = useState<any>(null);

  const isOwner = user && vacation.user_id === user.id;

  useEffect(() => {
    async function fetchOwnerProfile() {
      if (vacation.user_id) {
        const { data } = await supabase
          .from("profiles")
          .select("display_name, avatar_url")
          .eq("id", vacation.user_id)
          .single();
        if (data) setOwnerProfile(data);
      }
    }
    fetchOwnerProfile();
  }, [vacation.user_id]);

  const [name, setName] = useState(vacation.name);
  const [startDate, setStartDate] = useState(vacation.start_date);
  const [endDate, setEndDate] = useState(vacation.end_date);

  const countdown = (() => {
    const start = dayjs(vacation.start_date);
    const now = dayjs().startOf("day");
    const diff = start.diff(now, "day");

    if (diff === 0) return { label: "Starts Today!", color: "#4caf50" };
    if (diff === 1) return { label: "Starts Tomorrow", color: "#81c784" };
    if (diff > 0)
      return { label: `${diff} days until kickoff`, color: "#1976d2" };

    const end = dayjs(vacation.end_date);
    if (now.isBefore(end) || now.isSame(end)) {
      return { label: "Ongoing Trip", color: "#ff9800" };
    }
    return { label: "Completed Trip", color: "rgba(255,255,255,0.3)" };
  })();

  async function handleUpdateVacation() {
    const { error } = await supabase
      .from("vacations")
      .update({ name, start_date: startDate, end_date: endDate })
      .eq("id", vacation.id);

    if (!error) {
      setEditing(false);
      onVacationUpdated();
    }
  }

  return (
    <Box sx={{ px: { xs: 0, sm: 2, md: 4, lg: 6 }, mb: 6 }}>
      {editing ? (
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 3,
            bgcolor: (theme) =>
              theme.palette.mode === "dark"
                ? "rgba(255, 255, 255, 0.05)"
                : "rgba(0, 0, 0, 0.02)",
            backdropFilter: "blur(20px)",
            border: (theme) =>
              theme.palette.mode === "dark"
                ? "1px solid rgba(255, 255, 255, 0.1)"
                : "1px solid rgba(0, 0, 0, 0.05)",
          }}
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "2fr 1fr 1fr auto" },
              gap: 2,
              alignItems: "end",
              maxWidth: "100%",
            }}
          >
            <TextField
              label="Vacation Name"
              size="small"
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
              sx={{ maxWidth: { md: "none" } }}
            />
            <TextField
              label="Start Date"
              type="date"
              size="small"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              label="End Date"
              type="date"
              size="small"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                onClick={handleUpdateVacation}
                variant="contained"
                sx={{ px: 3, fontWeight: 800, borderRadius: 2 }}
              >
                Save
              </Button>
              <Button
                onClick={() => setEditing(false)}
                variant="outlined"
                sx={{ px: 2, borderRadius: 2 }}
              >
                Cancel
              </Button>
            </Box>
          </Box>
        </Paper>
      ) : (
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", md: "center" },
            gap: 2,
          }}
        >
          <Box>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 900,
                letterSpacing: "-1.5px",
                mb: 0.5,
                fontSize: { xs: "2rem", md: "3rem" },
                wordBreak: "break-word",
                background: (theme) =>
                  theme.palette.mode === "dark"
                    ? "linear-gradient(90deg, #fff 0%, rgba(255,255,255,0.7) 100%)"
                    : "linear-gradient(90deg, #1a1a1a 0%, #444 100%)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {vacation.name}
            </Typography>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                flexWrap: "wrap",
              }}
            >
              <Typography
                variant="overline"
                sx={{
                  fontWeight: 800,
                  letterSpacing: 1.5,
                  color: "primary.main",
                }}
              >
                {new Date(vacation.start_date).toLocaleDateString(undefined, {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </Typography>
              <Typography
                variant="overline"
                sx={{ opacity: 0.5, fontWeight: 800 }}
              >
                —
              </Typography>
              <Typography
                variant="overline"
                sx={{
                  fontWeight: 800,
                  letterSpacing: 1.5,
                  color: "primary.main",
                }}
              >
                {new Date(vacation.end_date).toLocaleDateString(undefined, {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </Typography>
              <Box
                sx={{
                  ml: 1,
                  px: 1.5,
                  py: 0.5,
                  borderRadius: "20px",
                  bgcolor: (theme) =>
                    countdown.label === "Completed Trip"
                      ? theme.palette.mode === "dark"
                        ? "rgba(255,255,255,0.05)"
                        : "rgba(0,0,0,0.05)"
                      : `${countdown.color}22`,
                  border: "1px solid",
                  borderColor: (theme) =>
                    countdown.label === "Completed Trip"
                      ? theme.palette.mode === "dark"
                        ? "rgba(255,255,255,0.1)"
                        : "rgba(0,0,0,0.1)"
                      : `${countdown.color}44`,
                  color: (theme) =>
                    countdown.label === "Completed Trip" &&
                    theme.palette.mode === "light"
                      ? "text.secondary"
                      : countdown.color,
                  fontSize: "0.7rem",
                  fontWeight: 900,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                {countdown.label}
              </Box>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", mt: 2, gap: 2 }}>
              <AvatarGroup
                max={5}
                sx={{
                  "& .MuiAvatar-root": {
                    width: 32,
                    height: 32,
                    fontSize: "0.8rem",
                    border: (theme) =>
                      `2px solid ${theme.palette.background.default}`,
                  },
                }}
              >
                <Tooltip
                  title={`Owner: ${ownerProfile?.display_name || "Anonymous"}`}
                >
                  <Avatar
                    src={resolveAvatar(ownerProfile?.avatar_url)}
                    sx={{ bgcolor: "primary.main" }}
                  >
                    {!ownerProfile?.avatar_url &&
                      (ownerProfile?.display_name?.charAt(0) || (
                        <PersonIcon sx={{ fontSize: 18 }} />
                      ))}
                  </Avatar>
                </Tooltip>
                {participants.map((p, idx) => (
                  <Tooltip
                    key={p.user_id}
                    title={`Participant: ${p.display_name || "Anonymous"}`}
                  >
                    <Avatar
                      src={resolveAvatar(p.avatar_url)}
                      sx={{
                        bgcolor: (theme) =>
                          theme.palette.mode === "dark"
                            ? "rgba(255,255,255,0.1)"
                            : "rgba(0,0,0,0.08)",
                      }}
                    >
                      {!p.avatar_url &&
                        (p.display_name?.charAt(0) || (
                          <GroupIcon sx={{ fontSize: 16 }} />
                        ))}
                    </Avatar>
                  </Tooltip>
                ))}
              </AvatarGroup>
              <Typography
                variant="caption"
                sx={{ color: "text.secondary", fontWeight: 700 }}
              >
                {1 + participants.length}{" "}
                {1 + participants.length === 1 ? "Person" : "People"} Planning
              </Typography>

              {isOwner && (
                <Tooltip title="Manage Trip Permissions">
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<SecurityIcon />}
                    onClick={onManagePermissions}
                    sx={{
                      ml: 1,
                      borderRadius: "12px",
                      textTransform: "none",
                      fontWeight: 700,
                      borderColor: "rgba(255,255,255,0.1)",
                      color: "text.secondary",
                      "& .MuiButton-startIcon": { mr: { xs: 0, sm: 1 } },
                      "& .MuiButton-endIcon": { display: "none" },
                      px: { xs: 1, sm: 2 },
                      minWidth: { xs: "auto", sm: "none" },
                      "&:hover": {
                        borderColor: "primary.main",
                        color: "primary.main",
                        bgcolor: "rgba(33, 150, 243, 0.05)",
                      },
                    }}
                  >
                    <Box
                      component="span"
                      sx={{ display: { xs: "none", sm: "inline" } }}
                    >
                      Trip Permissions
                    </Box>
                  </Button>
                </Tooltip>
              )}
            </Box>

            {!canEdit && (
              <Chip
                label="READ ONLY - SHARED TRIP"
                size="small"
                sx={{
                  mt: 2,
                  bgcolor: "rgba(255,152,0,0.1)",
                  color: "#ff9800",
                  fontWeight: 900,
                  borderRadius: 2,
                  fontSize: "0.7rem",
                  letterSpacing: 1,
                  border: "1px solid rgba(255,152,0,0.2)",
                  mr: 2,
                }}
              />
            )}
            {user && vacation.user_id !== user.id && (
              <Button
                onClick={async () => {
                  const isJoined = participants.some(
                    (p) => p.user_id === user.id,
                  );
                  const success = isJoined
                    ? await leaveVacation(user.id)
                    : await joinVacation(user.id);
                  if (success) onVacationUpdated();
                }}
                variant={
                  participants.some((p) => p.user_id === user.id)
                    ? "outlined"
                    : "contained"
                }
                size="small"
                startIcon={
                  participants.some((p) => p.user_id === user.id) ? (
                    <AddIcon sx={{ transform: "rotate(45deg)" }} />
                  ) : (
                    <AddIcon />
                  )
                }
                sx={{
                  mt: 2,
                  fontWeight: 800,
                  borderRadius: 2,
                }}
              >
                {participants.some((p) => p.user_id === user.id)
                  ? "Leave Trip"
                  : "Join Trip"}
              </Button>
            )}
          </Box>
          {canEdit && (
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                gap: 1,
                alignItems: "center",
                width: { xs: "100%", md: "auto" },
              }}
            >
              <Button
                onClick={onExportICal}
                variant="outlined"
                startIcon={<FileDownloadIcon />}
                sx={{
                  color: "primary.main",
                  borderColor: "rgba(33, 150, 243, 0.2)",
                  bgcolor: "rgba(33, 150, 243, 0.05)",
                  "&:hover": {
                    bgcolor: "rgba(33, 150, 243, 0.1)",
                    borderColor: "primary.main",
                  },
                  borderRadius: 2,
                  px: 2,
                  py: 1,
                  fontWeight: 700,
                }}
              >
                Export iCal
              </Button>
              <Button
                onClick={() => setEditing(true)}
                variant="outlined"
                fullWidth={isMobile}
                startIcon={<EditIcon sx={{ fontSize: "1rem" }} />}
                sx={{
                  color: "text.secondary",
                  borderColor: (theme) =>
                    theme.palette.mode === "dark"
                      ? "rgba(255,255,255,0.1)"
                      : "rgba(0,0,0,0.1)",
                  "&:hover": {
                    bgcolor: (theme) =>
                      theme.palette.mode === "dark"
                        ? "rgba(255,255,255,0.05)"
                        : "rgba(0,0,0,0.05)",
                    borderColor: (theme) =>
                      theme.palette.mode === "dark"
                        ? "rgba(255,255,255,0.2)"
                        : "rgba(0,0,0,0.2)",
                  },
                  borderRadius: 2,
                  px: 2.5,
                  py: 1,
                  fontWeight: 700,
                  maxWidth: { xs: "none", md: "none" },
                }}
              >
                Edit
              </Button>
              {vacation.archived ? (
                <>
                  <Button
                    onClick={onRestore}
                    variant="outlined"
                    color="success"
                    startIcon={<RestoreIcon />}
                    sx={{ borderRadius: 2, fontWeight: 700, px: 2 }}
                    fullWidth={isMobile}
                  >
                    Restore
                  </Button>
                  <Button
                    onClick={onDeletePermanently}
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteIcon />}
                    sx={{ borderRadius: 2, fontWeight: 700, px: 2 }}
                    fullWidth={isMobile}
                  >
                    Delete
                  </Button>
                </>
              ) : (
                <Button
                  onClick={onArchive}
                  variant="outlined"
                  color="warning"
                  startIcon={<ArchiveIcon />}
                  sx={{ borderRadius: 2, fontWeight: 700, px: 2 }}
                  fullWidth={isMobile}
                >
                  Archive
                </Button>
              )}
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};
