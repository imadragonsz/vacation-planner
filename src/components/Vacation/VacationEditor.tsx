import React, { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Paper,
  IconButton,
  Button,
  Divider,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";
import { TEXT_LIMITS } from "../../utils/textLimits";
import { Vacation } from "../../vacation";
import { supabase } from "../../supabaseClient";

interface VacationEditorProps {
  vacation: Vacation;
  onRefresh?: () => void;
  onVacationUpdated?: () => void;
  user?: any;
  canEdit?: boolean;
  [key: string]: any;
}

export const VacationEditor: React.FC<
  VacationEditorProps & { minimalistMode?: boolean }
> = ({
  vacation,
  onRefresh,
  onVacationUpdated,
  minimalistMode = false,
  user,
  canEdit = false,
  joinVacation,
  leaveVacation,
  participants = [],
}) => {
  const [editing, setEditing] = useState(false);
  const [membershipLoading, setMembershipLoading] = useState(false);
  const [name, setName] = useState(vacation.name);
  const [destination, setDestination] = useState(vacation.destination);
  const [startDate, setStartDate] = useState(vacation.start_date || "");
  const [endDate, setEndDate] = useState(vacation.end_date || "");

  const isOwner = Boolean(user && vacation.user_id === user.id);
  const isParticipant = Boolean(
    user && participants.some((p: any) => p.user_id === user.id),
  );

  const handleJoin = async () => {
    if (!user || !joinVacation || membershipLoading) return;
    setMembershipLoading(true);
    await joinVacation(user.id);
    if (onRefresh) onRefresh();
    if (onVacationUpdated) onVacationUpdated();
    setMembershipLoading(false);
  };

  const handleLeave = async () => {
    if (!user || !leaveVacation || membershipLoading) return;
    setMembershipLoading(true);
    await leaveVacation(user.id);
    if (onRefresh) onRefresh();
    if (onVacationUpdated) onVacationUpdated();
    setMembershipLoading(false);
  };

  const handleSave = async () => {
    const { error } = await supabase
      .from("vacations")
      .update({
        name,
        destination,
        start_date: startDate,
        end_date: endDate,
      })
      .eq("id", vacation.id);

    if (!error) {
      setEditing(false);
      if (onRefresh) onRefresh();
      if (onVacationUpdated) onVacationUpdated();
    }
  };
  if (minimalistMode && !editing) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 2,
          bgcolor: "rgba(255,255,255,0.03)",
          borderRadius: 4,
          border: "1px solid rgba(255,255,255,0.05)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Box sx={{ display: "flex", gap: 3 }}>
          <Box>
            <Typography
              variant="caption"
              sx={{ opacity: 0.5, fontWeight: 700 }}
            >
              DATES
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 800 }}>
              {vacation.start_date
                ? `${new Date(vacation.start_date).toLocaleDateString()} - ${new Date(
                    vacation.end_date || "",
                  ).toLocaleDateString()}`
                : "No dates set"}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          {!isOwner && !isParticipant && (
            <Button
              size="small"
              variant="contained"
              onClick={handleJoin}
              disabled={membershipLoading}
              sx={{ fontWeight: 800, borderRadius: 2 }}
            >
              Join Vacation
            </Button>
          )}
          {!isOwner && isParticipant && (
            <Button
              size="small"
              variant="outlined"
              color="warning"
              onClick={handleLeave}
              disabled={membershipLoading}
              sx={{ fontWeight: 800, borderRadius: 2 }}
            >
              Leave
            </Button>
          )}
          {canEdit && (
            <Button
              size="small"
              startIcon={<EditIcon sx={{ fontSize: 16 }} />}
              onClick={() => setEditing(true)}
              sx={{
                fontWeight: 700,
                color: "text.secondary",
                "&:hover": { color: "primary.main" },
              }}
            >
              Edit Details
            </Button>
          )}
        </Box>
      </Paper>
    );
  }

  return (
    <Paper
      sx={{
        p: 4,
        bgcolor: "rgba(255,255,255,0.04)",
        borderRadius: 4,
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="h6">Trip Details</Typography>
        {!editing && canEdit ? (
          <IconButton
            onClick={() => setEditing(true)}
            size="small"
            sx={{ color: "primary.main" }}
          >
            <EditIcon />
          </IconButton>
        ) : editing && canEdit ? (
          <Box>
            <IconButton
              onClick={handleSave}
              size="small"
              sx={{ color: "success.main", mr: 1 }}
            >
              <SaveIcon />
            </IconButton>
            <IconButton
              onClick={() => setEditing(false)}
              size="small"
              sx={{ color: "error.main" }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        ) : null}
        {!canEdit && !isOwner && !isParticipant && (
          <Button
            size="small"
            variant="contained"
            onClick={handleJoin}
            disabled={membershipLoading}
            sx={{ fontWeight: 800, borderRadius: 2 }}
          >
            Join Vacation
          </Button>
        )}
        {!canEdit && !isOwner && isParticipant && (
          <Button
            size="small"
            variant="outlined"
            color="warning"
            onClick={handleLeave}
            disabled={membershipLoading}
            sx={{ fontWeight: 800, borderRadius: 2 }}
          >
            Leave
          </Button>
        )}
      </Box>
      <Divider sx={{ mb: 3 }} />
      <Box sx={{ flexGrow: 1 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Trip Name"
              disabled={!editing}
              value={name}
              onChange={(e) => setName(e.target.value)}
              inputProps={{ maxLength: TEXT_LIMITS.SHORT }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Destination"
              disabled={!editing}
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              inputProps={{ maxLength: TEXT_LIMITS.MEDIUM }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              type="date"
              label="Start Date"
              InputLabelProps={{ shrink: true }}
              disabled={!editing}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              type="date"
              label="End Date"
              InputLabelProps={{ shrink: true }}
              disabled={!editing}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
};
