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
}

export default function PackingList({ vacationId, user }: PackingListProps) {
  const [items, setItems] = useState<PackingItem[]>([]);
  const [newItemName, setNewItemName] = useState("");

  const fetchItems = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("packing_items")
        .select("*, profiles(display_name)") // Standard join, simplified
        .eq("vacation_id", vacationId)
        .order("created_at", { ascending: true });

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
        }
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

  async function togglePacked(item: PackingItem) {
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
  }

  async function deleteItem(id: number) {
    const { error } = await supabase
      .from("packing_items")
      .delete()
      .eq("id", id);

    if (!error) {
      fetchItems();
    }
  }

  const packedCount = items.filter((i) => i.is_packed).length;
  const progress = items.length > 0 ? (packedCount / items.length) * 100 : 0;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 4,
        bgcolor: "rgba(255,255,255,0.03)",
        backdropFilter: "blur(15px)",
        border: "1px solid rgba(255,255,255,0.05)",
        minHeight: 450,
        maxHeight: 600,
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
      }}
    >
      <Box sx={{ mb: 3 }}>
        <Box sx={{ mb: 1.5, display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              p: 1,
              borderRadius: 2,
              bgcolor: "primary.main",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(25, 118, 210, 0.3)",
            }}
          >
            <InventoryIcon sx={{ color: "#fff", fontSize: 20 }} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="h6"
              sx={{ fontWeight: 800, fontSize: { xs: "1rem", md: "1.25rem" } }}
            >
              Packing Checklist
            </Typography>
            <Typography
              variant="caption"
              sx={{
                opacity: 0.5,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              {packedCount} of {items.length} items ready
            </Typography>
          </Box>
        </Box>
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            height: 6,
            borderRadius: 3,
            bgcolor: "rgba(255,255,255,0.05)",
            "& .MuiLinearProgress-bar": {
              borderRadius: 3,
              bgcolor: "primary.main",
              boxShadow: "0 0 10px rgba(25, 118, 210, 0.5)",
            },
          }}
        />
      </Box>

      <Box
        component="form"
        onSubmit={handleAddItem}
        sx={{
          display: "flex",
          gap: 1.5,
          mb: 3,
          p: 0.5,
          borderRadius: 3,
          bgcolor: "rgba(0,0,0,0.2)",
        }}
      >
        <TextField
          size="small"
          placeholder="What do you need to pack?"
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          fullWidth
          variant="standard"
          autoComplete="off"
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
          disabled={!newItemName.trim()}
          sx={{
            bgcolor: "primary.main",
            color: "#fff",
            "&:hover": { bgcolor: "primary.dark" },
            borderRadius: 2.5,
            width: 40,
            height: 40,
            transition: "all 0.2s",
            transform: newItemName.trim() ? "scale(1)" : "scale(0.9)",
            opacity: newItemName.trim() ? 1 : 0.5,
          }}
        >
          <AddIcon />
        </IconButton>
      </Box>

      <List
        sx={{
          flex: 1,
          overflowY: "auto",
          pr: 1,
          "&::-webkit-scrollbar": { width: 4 },
          "&::-webkit-scrollbar-thumb": {
            bgcolor: "rgba(255,255,255,0.05)",
            borderRadius: 10,
          },
        }}
      >
        {items.length === 0 ? (
          <Box sx={{ py: 6, textAlign: "center", px: 2 }}>
            <InventoryIcon sx={{ fontSize: 40, opacity: 0.05, mb: 1 }} />
            <Typography variant="body2" sx={{ opacity: 0.3, fontWeight: 600 }}>
              The checklist is empty
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.15 }}>
              Add items you'll need for this trip
            </Typography>
          </Box>
        ) : (
          items.map((item) => (
            <ListItem
              key={item.id}
              disablePadding
              sx={{
                mb: 1,
                borderRadius: 2.5,
                bgcolor: item.is_packed
                  ? "rgba(25, 118, 210, 0.03)"
                  : "rgba(255,255,255,0.02)",
                border: "1px solid",
                borderColor: item.is_packed
                  ? "rgba(25, 118, 210, 0.1)"
                  : "rgba(255,255,255,0.03)",
                transition: "all 0.2s",
                "&:hover": {
                  bgcolor: "rgba(255,255,255,0.04)",
                  borderColor: "rgba(255,255,255,0.08)",
                  "& .item-delete": { opacity: 0.6 },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 48, justifyContent: "center" }}>
                <Checkbox
                  edge="start"
                  checked={item.is_packed}
                  onChange={() => togglePacked(item)}
                  icon={
                    <RadioButtonUncheckedIcon
                      sx={{ fontSize: 22, opacity: 0.2 }}
                    />
                  }
                  checkedIcon={
                    <CheckCircleIcon
                      sx={{ fontSize: 22, color: "primary.main" }}
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
                    textDecoration: item.is_packed ? "line-through" : "none",
                    opacity: item.is_packed ? 0.3 : 1,
                    transition: "all 0.2s",
                  },
                }}
              />
              <ListItemSecondaryAction
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                {item.is_packed && item.packed_by_profile && (
                  <Tooltip
                    title={`Packed by ${item.packed_by_profile.display_name}`}
                  >
                    <Avatar
                      sx={{
                        width: 20,
                        height: 20,
                        fontSize: "0.6rem",
                        bgcolor: "primary.main",
                        fontWeight: 900,
                      }}
                    >
                      {item.packed_by_profile.display_name.charAt(0)}
                    </Avatar>
                  </Tooltip>
                )}
                <IconButton
                  className="item-delete"
                  size="small"
                  onClick={() => deleteItem(item.id)}
                  sx={{
                    color: "error.main",
                    opacity: 0,
                    transition: "opacity 0.2s",
                    "&:hover": { opacity: "1 !important" },
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))
        )}
      </List>
    </Paper>
  );
}
