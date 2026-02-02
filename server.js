const express = require("express");
const path = require("path");
const multer = require("multer");
const sharp = require("sharp");
const fs = require("fs");
const cors = require("cors");
const dotenv = require("dotenv");
const { createClient } = require("@supabase/supabase-js");

// Load .env explicitly from current directory
const envPath = path.join(__dirname, ".env");
console.log("[Server] Loading .env from:", envPath);
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error("[Server] Error loading .env file:", result.error);
}

console.log("[Server] Checking environment variables:");
console.log(
  "- REACT_APP_SUPABASE_URL:",
  process.env.REACT_APP_SUPABASE_URL ? "FOUND" : "MISSING",
);
console.log("- BACKEND_PORT:", process.env.BACKEND_PORT || "5001 (default)");

if (!process.env.REACT_APP_SUPABASE_URL) {
  console.error(
    "FATAL: REACT_APP_SUPABASE_URL is missing! Supabase cannot initialize.",
  );
  // Don't exit yet, let's see if we can provide a dummy client or handle it
}

const app = express();
// Use 5001 for backend to avoid conflict with React dev server on 5454
const PORT = process.env.BACKEND_PORT || 5001;

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.REACT_APP_SUPABASE_ANON_KEY;

if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.log("[Server] Ready with Service Role Key (Admin Access)");
} else {
  console.warn(
    "[Server] Warning: Using Anon Key. Deletions might fail if RLS is strict.",
  );
}

let supabase;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
} else {
  console.error(
    "CRITICAL: Supabase credentials missing. Client not initialized.",
  );
}

app.use(cors());
app.use(express.json());

// Ensure upload directories exist
const uploadDirs = ["original", "large", "medium", "thumbnail"];
uploadDirs.forEach((dir) => {
  const fullPath = path.join(__dirname, "uploads", dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

// Serve uploads folder
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const buildPath = path.join(__dirname, "build");
app.use(express.static(buildPath));

// Multer setup - Limit to 25MB for high-res travel photos
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit
});

app.delete("/api/admin/vacations/:id", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Missing token" });

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);
    if (authError || !user)
      return res.status(401).json({ error: "Unauthorized" });

    if (user.id !== process.env.REACT_APP_ADMIN_UUID) {
      return res.status(403).json({ error: "Forbidden: Not an admin" });
    }

    const { error } = await supabase
      .from("vacations")
      .delete()
      .eq("id", req.params.id);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error("Admin delete failed:", err);
    res.status(500).json({ error: err.message });
  }
});

app.patch("/api/admin/vacations/:id", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Missing token" });

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);
    if (authError || !user)
      return res.status(401).json({ error: "Unauthorized" });

    if (user.id !== process.env.REACT_APP_ADMIN_UUID) {
      return res.status(403).json({ error: "Forbidden: Not an admin" });
    }

    const { error } = await supabase
      .from("vacations")
      .update(req.body)
      .eq("id", req.params.id);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error("Admin update failed:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/gallery/upload", upload.single("image"), async (req, res) => {
  try {
    console.log("[Upload] Received request:", req.body);
    const { vacation_id, user_id, caption } = req.body;
    const file = req.file;
    const authHeader = req.headers.authorization;

    if (!file) {
      console.error("[Upload] No file in request");
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Verify User strictly for uploads
    if (!authHeader) {
      console.warn("[Upload] Missing Authorization header");
      return res.status(401).json({ error: "Missing token" });
    }

    const token = authHeader.replace("Bearer ", "");
    if (!token) {
      console.warn("[Upload] Token is empty");
      return res.status(401).json({ error: "Empty token" });
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user || user.id !== user_id) {
      console.error(
        "[Upload] Auth error or user mismatch:",
        authError?.message,
      );
      return res.status(401).json({ error: "Unauthorized upload" });
    }

    if (!process.env.REACT_APP_SUPABASE_URL) {
      console.error("[Upload] Supabase URL missing in environment");
      return res
        .status(500)
        .json({ error: "Server config error: Supabase URL missing" });
    }

    const filename = `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`;
    const baseFilename = path.parse(filename).name;

    console.log("[Upload] Processing file:", filename);

    // Save original
    const originalDir = path.join(__dirname, "uploads", "original");
    if (!fs.existsSync(originalDir))
      fs.mkdirSync(originalDir, { recursive: true });

    const originalPath = path.join(originalDir, filename);
    fs.writeFileSync(originalPath, file.buffer);

    // Process resolutions
    const sizes = [
      { name: "large", width: 1920 },
      { name: "medium", width: 1024 },
      { name: "thumbnail", width: 480 },
    ];

    const paths = {
      original: `/uploads/original/${filename}`,
    };

    for (const size of sizes) {
      try {
        const sizeDir = path.join(__dirname, "uploads", size.name);
        if (!fs.existsSync(sizeDir)) fs.mkdirSync(sizeDir, { recursive: true });

        const outputPath = path.join(sizeDir, `${baseFilename}.webp`);

        await sharp(file.buffer)
          .rotate() // Automatically rotate based on EXIF orientation
          .resize(size.width, null, { withoutEnlargement: true })
          .webp({ quality: size.name === "large" ? 85 : 80 })
          .toFile(outputPath);

        paths[size.name] = `/uploads/${size.name}/${baseFilename}.webp`;
      } catch (sharpErr) {
        console.error(`[Upload] Sharp error (${size.name}):`, sharpErr);
      }
    }

    // Save to database
    console.log("[Upload] Saving to DB...");
    const { data, error } = await supabase
      .from("vacation_gallery")
      .insert([
        {
          vacation_id: parseInt(vacation_id),
          user_id,
          original_url: paths.original,
          large_url: paths.large,
          medium_url: paths.medium,
          thumbnail_url: paths.thumbnail,
          caption: caption || "",
        },
      ])
      .select();

    if (error) {
      console.error("[Upload] DB Error:", error);
      throw error;
    }

    console.log("[Upload] Success!");
    res.json({ success: true, data: data[0] });
  } catch (err) {
    console.error("[Upload] Global Catch:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/gallery/:vacationId", async (req, res) => {
  try {
    const { vacationId } = req.params;
    const authHeader = req.headers.authorization;

    if (!supabase) {
      throw new Error("Supabase client not initialized. Check your .env file.");
    }

    // 1. Check if vacation is public
    const { data: vacation } = await supabase
      .from("vacations")
      .select("is_public, user_id")
      .eq("id", vacationId)
      .single();

    if (!vacation) {
      return res.status(404).json({ error: "Vacation not found" });
    }

    let isAuthorized = vacation.is_public || false;

    // 2. If not public, verify the User's JWT token
    if (!isAuthorized && authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(token);

      if (!error && user) {
        // User is logged in, check if they are the owner or a participant
        if (user.id === vacation.user_id) {
          isAuthorized = true;
        } else {
          const { data: participant } = await supabase
            .from("vacation_participants")
            .select("allow_gallery")
            .eq("vacation_id", vacationId)
            .eq("user_id", user.id)
            .maybeSingle();

          if (participant?.allow_gallery) {
            isAuthorized = true;
          }
        }
      }
    }

    if (!isAuthorized) {
      console.warn(
        `[Gallery] Unauthorized access attempt to trip ${vacationId}`,
      );
      return res.status(403).json({ error: "Unauthorized access" });
    }

    console.log(`[Gallery] Fetching items for vacation: ${vacationId}`);

    const { data, error } = await supabase
      .from("vacation_gallery")
      .select("*")
      .eq("vacation_id", vacationId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[Gallery] Supabase Query Error:", error);
      return res.status(500).json({ error: error.message, details: error });
    }

    console.log(
      `[Gallery] Found ${data?.length || 0} items for vacation ${vacationId}`,
    );
    res.json(data || []);
  } catch (err) {
    console.error("[Gallery] Server Catch Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Dedicated endpoint for downloading original files to ensure correct headers
app.get("/api/gallery/download/:filename", (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, "uploads", "original", filename);

    console.log(`[Download] Requested: ${filename}`);

    if (!fs.existsSync(filePath)) {
      console.error(`[Download] File not found: ${filePath}`);
      return res.status(404).send("File not found");
    }

    res.download(filePath, filename);
  } catch (err) {
    console.error("[Download] Error:", err);
    res.status(500).send("Server error during download");
  }
});

app.delete("/api/gallery/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const authHeader = req.headers.authorization;
    console.log(`[Delete] Request for ID: ${id}`);

    if (!authHeader) {
      console.warn("[Delete] Missing Authorization header");
      return res.status(401).json({ error: "Missing token" });
    }

    const token = authHeader.replace("Bearer ", "");
    if (!token) {
      console.warn("[Delete] Token is empty");
      return res.status(401).json({ error: "Empty token" });
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error("[Delete] Auth error:", authError?.message || "No user");
      return res.status(401).json({ error: "Invalid token" });
    }

    console.log(`[Delete] User ${user.id} attempting to delete item ${id}`);

    // 1. Check if user is allowed to delete this (Original uploader OR Trip Owner)
    const { data: item } = await supabase
      .from("vacation_gallery")
      .select("*, vacations(user_id)")
      .eq("id", id)
      .single();

    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }

    const isOwner = item.user_id === user.id;
    const isTripOwner = item.vacations?.user_id === user.id;

    if (!isOwner && !isTripOwner) {
      console.warn(
        `[Delete] User ${user.id} not authorized to delete item ${id}`,
      );
      return res.status(403).json({ error: "Unauthorized deletion" });
    }

    // 2. Delete from Database
    const { data, error: deleteError } = await supabase
      .from("vacation_gallery")
      .delete()
      .eq("id", id)
      .select()
      .maybeSingle();

    if (deleteError) {
      console.error("[Delete] Supabase Database Error:", deleteError);
      return res.status(500).json({
        error: "Database error during deletion.",
        details: deleteError.message,
      });
    }

    if (!data) {
      console.log(
        "[Delete] No rows were affected. This usually means the RLS policy blocked the delete or the ID is wrong.",
      );
      return res.status(403).json({
        error: "Permission denied or item not found.",
        help: "Check if the Service Role Key is correctly set in your .env file.",
      });
    }

    console.log("[Delete] Row removed from DB. Cleaning up files...");

    // 2. Delete files from disk SECOND
    const filesToDelete = [
      data.original_url,
      data.large_url,
      data.medium_url,
      data.thumbnail_url,
    ];

    filesToDelete.forEach((f) => {
      if (!f) return;
      const relativePath = f.startsWith("/") ? f.substring(1) : f;
      const fullPath = path.join(__dirname, relativePath);

      try {
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
          console.log(`[Delete] Disk file removed: ${fullPath}`);
        }
      } catch (fileErr) {
        console.error(`[Delete] File Cleanup Error:`, fileErr);
      }
    });

    res.json({ success: true, deleted_id: data.id });
  } catch (err) {
    console.error("[Delete] Fatal Catch:", err);
    res.status(500).json({ error: err.message });
  }
});

// Serve the React app for all unmatched routes
app.get(/.*/, (req, res) => {
  if (req.path.startsWith("/api")) {
    return res.status(404).json({ error: `API route not found: ${req.path}` });
  }
  res.sendFile(path.join(buildPath, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
