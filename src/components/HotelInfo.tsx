import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  Link,
  Stack,
  IconButton,
  TextField,
  Collapse,
  Rating,
  Chip,
  Tooltip,
} from "@mui/material";
import HotelIcon from "@mui/icons-material/Hotel";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import EuroIcon from "@mui/icons-material/Euro";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";
import { Hotel } from "../hooks/useHotels";

interface HotelInfoProps {
  hotels: Hotel[];
  canEdit: boolean;
  onAdd: (name: string, url: string, price?: number, rating?: number) => void;
  onDelete: (id: number) => void;
  onSelect: (id: number | null) => void;
  onUpdate: (id: number, updates: Partial<Hotel>) => void;
}

export const HotelInfo: React.FC<HotelInfoProps> = ({
  hotels,
  canEdit,
  onAdd,
  onDelete,
  onSelect,
  onUpdate,
}) => {
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newRating, setNewRating] = useState<number | null>(3);

  // Edit state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editRating, setEditRating] = useState<number | null>(3);

  const startEditing = (hotel: Hotel) => {
    setEditingId(hotel.id);
    setEditName(hotel.name);
    setEditUrl(hotel.url || "");
    setEditPrice(hotel.price?.toString() || "");
    setEditRating(hotel.rating);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      onUpdate(editingId, {
        name: editName,
        url: editUrl,
        price: editPrice ? parseFloat(editPrice) : null,
        rating: editRating,
      });
      setEditingId(null);
    }
  };

  const getHotelNameFromUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      if (urlObj.hostname.includes("booking.com")) {
        const pathParts = urlObj.pathname.split("/");
        // Look for the part ending in .html which usually contains the slug
        const hotelPart = pathParts.find((part) => part.endsWith(".html"));
        if (hotelPart) {
          const name = hotelPart.split(".")[0];
          return name
            .split("-")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
        }
      }
      return "";
    } catch (e) {
      return "";
    }
  };

  const handleUrlChange = (url: string) => {
    setNewUrl(url);
    if (!newName) {
      const extractedName = getHotelNameFromUrl(url);
      if (extractedName) {
        setNewName(extractedName);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newUrl) {
      // Final attempt to get a name if it's missing
      const finalName =
        newName.trim() || getHotelNameFromUrl(newUrl) || "Hotel Option";

      onAdd(
        finalName,
        newUrl,
        newPrice ? parseFloat(newPrice) : undefined,
        newRating || undefined,
      );
      setNewName("");
      setNewUrl("");
      setNewPrice("");
      setNewRating(3);
      setShowAdd(false);
    }
  };

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 900,
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <HotelIcon color="primary" /> Accommodation Options
        </Typography>
        {canEdit && (
          <Button
            size="small"
            startIcon={
              showAdd ? (
                <ExpandMoreIcon sx={{ transform: "rotate(180deg)" }} />
              ) : (
                <AddIcon />
              )
            }
            onClick={() => setShowAdd(!showAdd)}
            sx={{ fontWeight: 800, borderRadius: 2 }}
          >
            {showAdd ? "Close" : "Add Option"}
          </Button>
        )}
      </Box>

      <Collapse in={showAdd}>
        <Paper
          elevation={0}
          component="form"
          onSubmit={handleSubmit}
          sx={{
            p: 2,
            mb: 3,
            borderRadius: 3,
            bgcolor: (theme) =>
              theme.palette.mode === "dark"
                ? "rgba(255,255,255,0.03)"
                : "rgba(0,0,0,0.02)",
            border: (theme) =>
              `1px dashed ${
                theme.palette.mode === "dark"
                  ? "rgba(255,255,255,0.1)"
                  : "rgba(0,0,0,0.1)"
              }`,
          }}
        >
          <Stack spacing={2}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                gap: 2,
              }}
            >
              <TextField
                label="Hotel Name"
                size="small"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                variant="filled"
              />
              <TextField
                label="Booking Link / URL"
                size="small"
                value={newUrl}
                onChange={(e) => handleUrlChange(e.target.value)}
                required
                variant="filled"
              />
            </Box>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "1fr 1fr",
                  lg: "1fr 1fr auto",
                },
                gap: 2,
                alignItems: "center",
              }}
            >
              <TextField
                label="Price (Total)"
                size="small"
                type="number"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                variant="filled"
                InputProps={{
                  startAdornment: (
                    <EuroIcon
                      sx={{ fontSize: 16, mr: 0.5, color: "text.secondary" }}
                    />
                  ),
                }}
              />
              <Box>
                <Typography
                  variant="caption"
                  sx={{
                    display: "block",
                    color: "text.secondary",
                    fontWeight: 700,
                    mb: 0.5,
                  }}
                >
                  RATING
                </Typography>
                <Rating
                  value={newRating}
                  onChange={(_, val) => setNewRating(val)}
                  size="small"
                />
              </Box>
              <Button
                type="submit"
                variant="contained"
                sx={{ fontWeight: 900, px: 3, borderRadius: 2 }}
              >
                Add
              </Button>
            </Box>
          </Stack>
        </Paper>
      </Collapse>

      <Stack spacing={2}>
        {hotels.length === 0 ? (
          <Box sx={{ py: 3, textAlign: "center", opacity: 0.5 }}>
            <Typography
              variant="body2"
              sx={{ fontWeight: 700, color: "text.secondary" }}
            >
              No hotels added for this destination.
            </Typography>
          </Box>
        ) : (
          hotels.map((hotel) => (
            <Paper
              key={hotel.id}
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 4,
                bgcolor: hotel.is_selected
                  ? (theme) =>
                      theme.palette.mode === "dark"
                        ? "rgba(33, 150, 243, 0.08)"
                        : "rgba(33, 150, 243, 0.05)"
                  : (theme) =>
                      theme.palette.mode === "dark"
                        ? "rgba(255,255,255,0.02)"
                        : "rgba(0,0,0,0.02)",
                border: "1px solid",
                borderColor: hotel.is_selected
                  ? "primary.main"
                  : (theme) =>
                      theme.palette.mode === "dark"
                        ? "rgba(255,255,255,0.05)"
                        : "rgba(0,0,0,0.05)",
                transition: "all 0.2s",
                position: "relative",
                "&:hover": {
                  bgcolor: hotel.is_selected
                    ? (theme) =>
                        theme.palette.mode === "dark"
                          ? "rgba(33, 150, 243, 0.12)"
                          : "rgba(33, 150, 243, 0.08)"
                    : (theme) =>
                        theme.palette.mode === "dark"
                          ? "rgba(255,255,255,0.05)"
                          : "rgba(0,0,0,0.04)",
                },
              }}
            >
              {editingId === hotel.id ? (
                <Box
                  component="form"
                  onSubmit={handleUpdate}
                  sx={{ display: "flex", flexDirection: "column", gap: 2 }}
                >
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                      gap: 2,
                    }}
                  >
                    <TextField
                      label="Hotel Name"
                      size="small"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      variant="filled"
                    />
                    <TextField
                      label="URL"
                      size="small"
                      value={editUrl}
                      onChange={(e) => setEditUrl(e.target.value)}
                      variant="filled"
                    />
                  </Box>
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr auto" },
                      gap: 2,
                      alignItems: "center",
                    }}
                  >
                    <TextField
                      label="Price"
                      size="small"
                      type="number"
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                      variant="filled"
                      InputProps={{
                        startAdornment: (
                          <EuroIcon
                            sx={{
                              fontSize: 16,
                              mr: 0.5,
                              color: "text.secondary",
                            }}
                          />
                        ),
                      }}
                    />
                    <Box>
                      <Rating
                        value={editRating}
                        onChange={(_, val) => setEditRating(val)}
                        size="small"
                      />
                    </Box>
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <IconButton
                        type="submit"
                        color="primary"
                        sx={{ bgcolor: "rgba(33, 150, 243, 0.1)" }}
                      >
                        <SaveIcon />
                      </IconButton>
                      <IconButton onClick={() => setEditingId(null)}>
                        <CloseIcon />
                      </IconButton>
                    </Box>
                  </Box>
                </Box>
              ) : (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 2,
                  }}
                >
                  <Box>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        mb: 0.5,
                      }}
                    >
                      <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>
                        {hotel.name}
                      </Typography>
                      {hotel.is_selected && (
                        <Chip
                          icon={<CheckCircleIcon />}
                          label="Selected"
                          size="small"
                          color="primary"
                          onDelete={canEdit ? () => onSelect(null) : undefined}
                          sx={{
                            fontWeight: 900,
                            height: 20,
                            "& .MuiChip-label": { px: 1 },
                            "& .MuiChip-icon": { fontSize: 14 },
                          }}
                        />
                      )}
                    </Box>
                    <Stack direction="row" spacing={2} alignItems="center">
                      {hotel.rating && (
                        <Rating value={hotel.rating} readOnly size="small" />
                      )}
                      {hotel.price && (
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 800, color: "success.main" }}
                        >
                          €{hotel.price}
                        </Typography>
                      )}
                    </Stack>
                  </Box>
                  <Box sx={{ display: "flex", gap: 0.5 }}>
                    {canEdit && !hotel.is_selected && (
                      <Tooltip title="Select as Confirmed">
                        <IconButton
                          size="small"
                          onClick={() => onSelect(hotel.id)}
                          color="primary"
                          sx={{
                            color: "text.secondary",
                            "& .MuiSvgIcon-root": { opacity: 0.5 },
                            "&:hover": {
                              color: "primary.main",
                              "& .MuiSvgIcon-root": { opacity: 1 },
                            },
                          }}
                        >
                          <CheckCircleIcon sx={{ fontSize: 20 }} />
                        </IconButton>
                      </Tooltip>
                    )}
                    {hotel.url && (
                      <Tooltip title="View Booking">
                        <IconButton
                          size="small"
                          component={Link}
                          href={hotel.url}
                          target="_blank"
                          rel="noopener"
                          sx={{ color: "text.secondary" }}
                        >
                          <OpenInNewIcon sx={{ fontSize: 20 }} />
                        </IconButton>
                      </Tooltip>
                    )}
                    {canEdit && (
                      <>
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => startEditing(hotel)}
                            sx={{ color: "text.secondary" }}
                          >
                            <EditIcon sx={{ fontSize: 20, opacity: 0.8 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            onClick={() => onDelete(hotel.id)}
                            color="error"
                            sx={{ color: "error.main", opacity: 0.8 }}
                          >
                            <DeleteIcon sx={{ fontSize: 20 }} />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                  </Box>
                </Box>
              )}
            </Paper>
          ))
        )}
      </Stack>
    </Box>
  );
};
