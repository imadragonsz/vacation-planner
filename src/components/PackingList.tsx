import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  IconButton,
  Checkbox,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  LinearProgress,
  Tooltip,
  Avatar,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import InventoryIcon from "@mui/icons-material/Inventory";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import { supabase } from "../supabaseClient";

interface PackingItem {
  id: number;
  item_name: string;
  is_packed: boolean;
  packed_by: string | null;
  packed_by_profile?: { display_name: string };
}

interface PackingListProps {
  vacationId: number;
  user: any;
  canEdit?: boolean;
}

export default function PackingList({
  vacationId,
  user,
  canEdit = true,
}: PackingListProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [items, setItems] = useState<PackingItem[]>([]);
  const [newItemName, setNewItemName] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("packing_items")
        .select("*, profiles!packed_by(display_name)") // Standard join, simplified
        .eq("vacation_id", vacationId)
        .order("id", { ascending: true });

      if (error) {
        console.error("Error fetching packing items:", error);
        // Fallback fetch
        const { data: fallback } = await supabase
          .from("packing_items")
          .select("*")
          .eq("vacation_id", vacationId);
        if (fallback) setItems(fallback as PackingItem[]);
      } else if (data) {
        setItems(data as PackingItem[]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [vacationId]);

  useEffect(() => {
    fetchItems();

    // Subscribe to real-time changes
    const channel = supabase
      .channel(`packing-${vacationId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "packing_items",
          filter: `vacation_id=eq.${vacationId}`,
        },
        () => {
          fetchItems();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchItems, vacationId]);

  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault();
    if (!newItemName.trim() || !user) return;

    const { error } = await supabase.from("packing_items").insert({
      vacation_id: vacationId,
      item_name: newItemName.trim(),
    });

    if (!error) {
      setNewItemName("");
      fetchItems();
    }
  }

  const togglePacked = useCallback(
    async (item: PackingItem) => {
      if (!user) return;

      const { error } = await supabase
        .from("packing_items")
        .update({
          is_packed: !item.is_packed,
          packed_by: !item.is_packed ? user.id : null,
        })
        .eq("id", item.id);

      if (!error) {
        fetchItems();
      }
    },
    [user, fetchItems],
  );

  const deleteItem = useCallback(
    async (id: number) => {
      const { error } = await supabase
        .from("packing_items")
        .delete()
        .eq("id", id);

      if (!error) {
        fetchItems();
      }
    },
    [fetchItems],
  );

  const packedCount = items.filter((i) => i.is_packed).length;
  const progress = React.useMemo(
    () => (items.length > 0 ? (packedCount / items.length) * 100 : 0),
    [items.length, packedCount],
  );

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Box
        sx={{
          mb: 4,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          px: 1,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 900,
              mb: 1,
              background:
                "linear-gradient(45deg, #fff 30%, rgba(255,255,255,0.5) 90%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Packing List
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.6, fontWeight: 500 }}>
            {items.length === 0
              ? "Your group checklist is empty."
              : `${packedCount} of ${items.length} items collected.`}
          </Typography>
        </Box>
        {items.length > 0 && (
          <Box sx={{ textAlign: "right", minWidth: { md: 240, xs: 120 } }}>
            <Typography
              variant="h6"
              sx={{ fontWeight: 900, color: "primary.main", mb: 0.5 }}
            >
              {Math.round(progress)}%
            </Typography>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                height: 10,
                borderRadius: 5,
                bgcolor: "rgba(255,255,255,0.05)",
                "& .MuiLinearProgress-bar": {
                  borderRadius: 5,
                  bgcolor: "primary.main",
                  boxShadow: "0 0 15px rgba(25, 118, 210, 0.4)",
                },
              }}
            />
          </Box>
        )}
      </Box>

      <Paper
        elevation={0}
        sx={{
          flex: 1,
          p: { md: 4, xs: 2 },
          borderRadius: 6,
          bgcolor: "rgba(255,255,255,0.03)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.05)",
          display: "flex",
          flexDirection: "column",
          gap: 3,
          minHeight: 0,
        }}
      >
        <Box
          component="form"
          onSubmit={handleAddItem}
          sx={{
            display: "flex",
            gap: 2,
            p: 1,
            borderRadius: 3.5,
            bgcolor: "rgba(0,0,0,0.2)",
            border: "1px solid rgba(255,255,255,0.05)",
            transition: "all 0.2s",
            "&:focus-within": {
              borderColor: "primary.main",
              bgcolor: "rgba(0,0,0,0.3)",
            },
          }}
        >
          <TextField
            fullWidth
            size="small"
            placeholder={
              canEdit
                ? "Add an item for the group..."
                : "Join trip to add items"
            }
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            variant="standard"
            autoComplete="off"
            disabled={loading || !canEdit}
            InputProps={{
              disableUnderline: true,
              sx: {
                px: 2,
                color: "#fff",
                fontWeight: 600,
                fontSize: "1rem",
                opacity: canEdit ? 1 : 0.5,
              },
            }}
          />
          <IconButton
            type="submit"
            disabled={!newItemName.trim() || loading || !canEdit}
            sx={{
              bgcolor: "primary.main",
              color: "#fff",
              borderRadius: 2.5,
              width: 44,
              height: 44,
              boxShadow: "0 4px 12px rgba(25, 118, 210, 0.3)",
              "&:hover": {
                bgcolor: "primary.dark",
                transform: "translateY(-1px)",
              },
              "&.Mui-disabled": {
                bgcolor: "rgba(255,255,255,0.05)",
                opacity: 0.5,
              },
            }}
          >
            <AddIcon />
          </IconButton>
        </Box>

        <Box
          sx={{
            flex: 1,
            overflowY: "auto",
            pr: 1,
            "&::-webkit-scrollbar": { width: 6 },
            "&::-webkit-scrollbar-thumb": {
              bgcolor: "rgba(255,255,255,0.1)",
              borderRadius: 10,
            },
          }}
        >
          {items.length === 0 ? (
            <Box
              sx={{
                py: 12,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                opacity: 0.2,
              }}
            >
              <InventoryIcon sx={{ fontSize: 80, mb: 2 }} />
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                Inventory Empty
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Start planning your essentials.
              </Typography>
            </Box>
          ) : (
            <List
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xl: "1fr 1fr 1fr",
                  lg: "1fr 1fr",
                  xs: "1fr",
                },
                gap: 2,
              }}
            >
              {items.map((item) => (
                <ListItem
                  key={item.id}
                  disablePadding
                  sx={{
                    borderRadius: 4,
                    bgcolor: item.is_packed
                      ? "rgba(76, 175, 80, 0.05)"
                      : "rgba(255,255,255,0.02)",
                    border: "1px solid",
                    borderColor: item.is_packed
                      ? "rgba(76, 175, 80, 0.15)"
                      : "rgba(255,255,255,0.05)",
                    p: 1.5,
                    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                    "&:hover": {
                      bgcolor: "rgba(255,255,255,0.05)",
                      transform: "translateY(-2px)",
                      boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                      "& .item-delete": { opacity: 1 },
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 48, justifyContent: "center" }}>
                    <Checkbox
                      edge="start"
                      checked={item.is_packed}
                      onChange={() => togglePacked(item)}
                      disabled={!canEdit}
                      icon={
                        <RadioButtonUncheckedIcon
                          sx={{ fontSize: 26, opacity: 0.2 }}
                        />
                      }
                      checkedIcon={
                        <CheckCircleIcon
                          sx={{ fontSize: 26, color: "success.main" }}
                        />
                      }
                      sx={{ p: 1 }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={item.item_name}
                    sx={{
                      m: 0,
                      "& .MuiTypography-root": {
                        fontWeight: 700,
                        fontSize: "0.95rem",
                        textDecoration: item.is_packed
                          ? "line-through"
                          : "none",
                        opacity: item.is_packed ? 0.3 : 0.9,
                        transition: "all 0.2s",
                        wordBreak: "break-word",
                      },
                    }}
                  />
                  <ListItemSecondaryAction
                    sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
                  >
                    {item.is_packed && item.packed_by_profile && (
                      <Tooltip
                        title={`Packed by ${item.packed_by_profile.display_name}`}
                      >
                        <Avatar
                          sx={{
                            width: 28,
                            height: 28,
                            fontSize: "0.75rem",
                            bgcolor: "success.main",
                            fontWeight: 900,
                            boxShadow: "0 2px 8px rgba(76, 175, 80, 0.4)",
                          }}
                        >
                          {item.packed_by_profile.display_name
                            .charAt(0)
                            .toUpperCase()}
                        </Avatar>
                      </Tooltip>
                    )}
                    {canEdit && (
                      <IconButton
                        className="item-delete"
                        size="small"
                        onClick={() => deleteItem(item.id)}
                        sx={{
                          color: "error.main",
                          opacity: isMobile ? 0.6 : 0,
                          transition: "opacity 0.2s",
                          "&:hover": {
                            opacity: "1 !important",
                            bgcolor: "rgba(211, 47, 47, 0.1)",
                          },
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      </Paper>
    </Box>
  );
}
