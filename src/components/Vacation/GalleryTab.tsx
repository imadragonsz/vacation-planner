import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  Modal,
  TextField,
  Tooltip,
  CircularProgress,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import DeleteIcon from "@mui/icons-material/Delete";
import DownloadIcon from "@mui/icons-material/Download";
import CloseIcon from "@mui/icons-material/Close";
import SecurityIcon from "@mui/icons-material/Security";
import { supabase } from "../../supabaseClient";

type GalleryItem = {
  id: number | string;
  vacation_id: number;
  user_id: string;
  original_url: string;
  large_url: string;
  medium_url: string;
  thumbnail_url: string;
  caption: string;
  created_at: string;
};

interface GalleryTabProps {
  vacationId: number;
  userId: string;
  canEdit: boolean;
  isOwner?: boolean;
  onManagePermissions?: () => void;
}

export const GalleryTab: React.FC<GalleryTabProps> = ({
  vacationId,
  userId,
  canEdit,
  isOwner,
  onManagePermissions,
}) => {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<GalleryItem | null>(null);
  const [caption, setCaption] = useState("");

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));

  const fetchGallery = useCallback(async () => {
    try {
      setLoading(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setLoading(false);
        return;
      }

      const res = await fetch(`/api/gallery/${vacationId}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();
      setItems(data || []);
    } catch (err) {
      console.error("Failed to fetch gallery:", err);
    } finally {
      setLoading(false);
    }
  }, [vacationId]);

  useEffect(() => {
    fetchGallery();
  }, [fetchGallery]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);
    formData.append("vacation_id", vacationId.toString());
    formData.append("user_id", userId);
    formData.append("caption", caption);

    try {
      setUploading(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        alert("You must be logged in to upload photos.");
        return;
      }

      const res = await fetch("/api/gallery/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: formData,
      });
      if (res.ok) {
        setCaption("");
        fetchGallery();
      } else {
        const err = await res.json();
        alert(`Upload failed: ${err.error || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("Failed to upload image.");
    } finally {
      setUploading(false);
      // Clean target to allow same file upload again
      if (e.target) e.target.value = "";
    }
  };

  const handleDelete = async (id: number | string) => {
    if (!window.confirm("Delete this picture?")) return;

    try {
      // Optimistic update: remove from UI immediately
      // Using != to handle string/number comparison for BigInt IDs
      setItems((prev) => prev.filter((item) => String(item.id) !== String(id)));
      if (selectedImage && String(selectedImage.id) === String(id)) {
        setSelectedImage(null);
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        alert("Your session has expired. Please log in again.");
        fetchGallery();
        return;
      }

      const res = await fetch(`/api/gallery/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      if (!res.ok) {
        // If server fails, refresh to get correct state
        fetchGallery();
        alert("Failed to delete image from server.");
      }
    } catch (err) {
      console.error("Delete error:", err);
      fetchGallery(); // Revert on error
    }
  };

  const handleDownload = (item: GalleryItem) => {
    // Extract the filename from the original_url (e.g., "/uploads/original/filename.jpg")
    const filename = item.original_url.split("/").pop();
    if (!filename) return;

    // Use our new dedicated download API endpoint
    // This is more reliable for proxied setups and large files
    const downloadUrl = `/api/gallery/download/${filename}`;

    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const cols = isMobile ? 1 : isTablet ? 2 : 3;

  return (
    <Box sx={{ p: { xs: 2, sm: 4 } }}>
      <Box
        sx={{
          mb: 4,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography
          variant="h5"
          sx={{ fontWeight: 900, letterSpacing: "-1px" }}
        >
          Vacation Gallery
        </Typography>
        {canEdit && (
          <Box
            sx={{
              display: "flex",
              gap: { xs: 1, sm: 2 },
              alignItems: "center",
            }}
          >
            {isOwner && onManagePermissions && (
              <Tooltip title="Manage Gallery Permissions">
                <IconButton
                  onClick={onManagePermissions}
                  color="primary"
                  sx={{
                    bgcolor: (theme) =>
                      theme.palette.mode === "dark"
                        ? "rgba(33, 150, 243, 0.1)"
                        : "rgba(33, 150, 243, 0.05)",
                    "&:hover": {
                      bgcolor: (theme) =>
                        theme.palette.mode === "dark"
                          ? "rgba(33, 150, 243, 0.2)"
                          : "rgba(33, 150, 243, 0.1)",
                    },
                    borderRadius: 3,
                  }}
                >
                  <SecurityIcon />
                </IconButton>
              </Tooltip>
            )}
            <TextField
              size="small"
              placeholder="Add a caption..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              sx={{ display: { xs: "none", sm: "block" } }}
            />
            <Button
              variant="contained"
              component="label"
              startIcon={
                uploading ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <AddPhotoAlternateIcon />
                )
              }
              disabled={uploading}
              sx={{ borderRadius: 3, fontWeight: 800 }}
            >
              {uploading ? "Uploading..." : "Add Photos"}
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={handleFileUpload}
              />
            </Button>
          </Box>
        )}
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
          <CircularProgress />
        </Box>
      ) : items.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            py: 10,
            textAlign: "center",
            bgcolor: "rgba(255,255,255,0.02)",
            borderRadius: 5,
            border: "1px dashed rgba(255,255,255,0.1)",
          }}
        >
          <AddPhotoAlternateIcon sx={{ fontSize: 48, opacity: 0.2, mb: 2 }} />
          <Typography sx={{ opacity: 0.5 }}>
            No photos in this gallery yet.
          </Typography>
        </Paper>
      ) : (
        <ImageList variant="masonry" cols={cols} gap={16}>
          {items.map((item) => (
            <ImageListItem
              key={item.id}
              sx={{
                borderRadius: 4,
                overflow: "hidden",
                cursor: "pointer",
                transition: "transform 0.3s",
                "&:hover": { transform: "scale(1.02)" },
              }}
            >
              <img
                src={item.thumbnail_url}
                srcSet={`${item.thumbnail_url} 480w, ${item.medium_url} 1024w, ${item.large_url} 1920w`}
                sizes="(max-width: 480px) 480px, (max-width: 1024px) 1024px, 1920px"
                alt={item.caption}
                loading="lazy"
                onClick={() => setSelectedImage(item)}
                style={{
                  minHeight: "100px",
                  background: "rgba(255,255,255,0.05)",
                  display: "block",
                  width: "100%",
                }}
                onError={(e) => {
                  // If image fails to load, hide the broken icon but keep the space
                  (e.target as HTMLImageElement).style.opacity = "0";
                }}
              />
              {(item.caption || canEdit) && (
                <ImageListItemBar
                  title={item.caption}
                  sx={{
                    background:
                      "linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 70%, rgba(0,0,0,0) 100%)",
                  }}
                  actionIcon={
                    <Box sx={{ display: "flex" }}>
                      <IconButton
                        sx={{ color: "white" }}
                        onClick={() => handleDownload(item)}
                      >
                        <DownloadIcon />
                      </IconButton>
                      {canEdit && (
                        <IconButton
                          sx={{ color: "rgba(255,100,100,0.8)" }}
                          onClick={() => handleDelete(item.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      )}
                    </Box>
                  }
                />
              )}
            </ImageListItem>
          ))}
        </ImageList>
      )}

      {/* Lightbox Modal */}
      <Modal
        open={!!selectedImage}
        onClose={() => setSelectedImage(null)}
        sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <Box sx={{ position: "relative", maxWidth: "95vw", maxHeight: "95vh" }}>
          <IconButton
            sx={{ position: "absolute", right: -40, top: -40, color: "white" }}
            onClick={() => setSelectedImage(null)}
          >
            <CloseIcon />
          </IconButton>
          {selectedImage && (
            <Box sx={{ textAlign: "center" }}>
              <img
                src={selectedImage.large_url}
                srcSet={`${selectedImage.medium_url} 1024w, ${selectedImage.large_url} 1920w`}
                alt={selectedImage.caption}
                style={{
                  maxWidth: "100%",
                  maxHeight: "80vh",
                  borderRadius: "12px",
                  boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
                }}
              />
              <Typography
                variant="h6"
                sx={{ color: "white", mt: 2, fontWeight: 700 }}
              >
                {selectedImage.caption}
              </Typography>
              <Box
                sx={{
                  mt: 1,
                  display: "flex",
                  gap: 1,
                  justifyContent: "center",
                }}
              >
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={() => handleDownload(selectedImage)}
                  sx={{
                    color: "white",
                    borderColor: "rgba(255,255,255,0.3)",
                  }}
                >
                  Download Original
                </Button>
                {canEdit && (
                  <Button
                    variant="outlined"
                    startIcon={<DeleteIcon />}
                    onClick={() => handleDelete(selectedImage.id)}
                    sx={{
                      color: "#ff8a80",
                      borderColor: "rgba(255,138,128,0.3)",
                      "&:hover": {
                        borderColor: "#ff8a80",
                        bgcolor: "rgba(255,138,128,0.1)",
                      },
                    }}
                  >
                    Delete
                  </Button>
                )}
              </Box>
            </Box>
          )}
        </Box>
      </Modal>
    </Box>
  );
};
