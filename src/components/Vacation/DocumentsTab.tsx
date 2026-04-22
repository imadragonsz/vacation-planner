import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import DescriptionIcon from "@mui/icons-material/Description";
import DownloadIcon from "@mui/icons-material/Download";
import DeleteIcon from "@mui/icons-material/Delete";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import SummarizeIcon from "@mui/icons-material/Summarize";
import { supabase } from "../../supabaseClient";

interface VacationDocument {
  id: number;
  name: string;
  file_path: string;
  file_type: string;
  uploaded_by: string;
  created_at: string;
  profiles?: {
    display_name: string;
  };
}

interface DocumentsTabProps {
  vacationId: number;
  user: any;
  canEdit: boolean;
}

export default function DocumentsTab({
  vacationId,
  user,
  canEdit,
}: DocumentsTabProps) {
  const [docs, setDocs] = useState<VacationDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("vacation_documents")
      .select("*, profiles!uploaded_by(display_name)")
      .eq("vacation_id", vacationId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setDocs(data as VacationDocument[]);
    }
    setLoading(false);
  }, [vacationId]);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("vacation_id", vacationId.toString());
      formData.append("user_id", user.id);

      const {
        data: { session },
      } = await supabase.auth.getSession();
      const response = await fetch("/api/documents/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Upload failed");
      }

      fetchDocs();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Error uploading document");
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (doc: VacationDocument) => {
    // We can use the static file path directly
    const url = `/uploads/${doc.file_path}`;
    const a = document.createElement("a");
    a.href = url;
    a.download = doc.name;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDelete = async (doc: VacationDocument) => {
    if (!window.confirm(`Delete ${doc.name}?`)) return;

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const response = await fetch(`/api/documents/${doc.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Delete failed");
      }

      fetchDocs();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Error deleting document");
    }
  };

  const getFileIcon = (type: string) => {
    if (type.includes("pdf"))
      return <PictureAsPdfIcon sx={{ color: "#f44336" }} />;
    if (type.includes("text") || type.includes("doc"))
      return <SummarizeIcon sx={{ color: "#2196f3" }} />;
    return <DescriptionIcon sx={{ color: "#9e9e9e" }} />;
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box
        sx={{
          mb: 4,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900, mb: 1 }}>
            Documents
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.6 }}>
            Essential bookings, tickets, and travel info.
          </Typography>
        </Box>
        <Button
          variant="contained"
          component="label"
          startIcon={
            uploading ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              <FileUploadIcon />
            )
          }
          disabled={uploading || !canEdit}
          sx={{ borderRadius: 3, fontWeight: 900 }}
        >
          {uploading ? "Uploading..." : "Upload File"}
          <input type="file" hidden onChange={handleUpload} />
        </Button>
      </Box>

      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 6,
          bgcolor: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.05)",
          backdropFilter: "blur(10px)",
        }}
      >
        {docs.length === 0 ? (
          <Box sx={{ py: 10, textAlign: "center", opacity: 0.3 }}>
            <DescriptionIcon sx={{ fontSize: 80, mb: 2 }} />
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              No documents yet
            </Typography>
            <Typography variant="body2">
              Keep your group organized by uploading tickets or reservations.
            </Typography>
          </Box>
        ) : (
          <List>
            {docs.map((doc) => (
              <ListItem
                key={doc.id}
                sx={{
                  mb: 1,
                  borderRadius: 3,
                  bgcolor: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.05)",
                  "&:hover": { bgcolor: "rgba(255,255,255,0.04)" },
                }}
              >
                <ListItemIcon>{getFileIcon(doc.file_type)}</ListItemIcon>
                <ListItemText
                  primary={doc.name}
                  secondary={`Uploaded by ${doc.profiles?.display_name || "Unknown"} on ${new Date(doc.created_at).toLocaleDateString()}`}
                  primaryTypographyProps={{ fontWeight: 700 }}
                />
                <ListItemSecondaryAction>
                  <Tooltip title="Download">
                    <IconButton
                      onClick={() => handleDownload(doc)}
                      color="primary"
                    >
                      <DownloadIcon />
                    </IconButton>
                  </Tooltip>
                  {canEdit && doc.uploaded_by === user?.id && (
                    <Tooltip title="Delete">
                      <IconButton
                        onClick={() => handleDelete(doc)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        )}
      </Paper>
    </Box>
  );
}
