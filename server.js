const express = require("express");
const path = require("path");
const multer = require("multer");
const sharp = require("sharp");
const fs = require("fs");
const fetch = require("node-fetch");

// Optimize sharp for large images
sharp.cache(false);
sharp.concurrency(1); // Reduce memory pressure by processing one image at a time

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

// Trust the first proxy (Nginx)
app.set("trust proxy", 1);

const rateLimit = require("express-rate-limit");
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Apply rate limiting to all API calls
app.use("/api/", apiLimiter);

const compression = require("compression");
app.use(compression());

const helmet = require("helmet");
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://apis.google.com"],
        scriptSrcAttr: ["'unsafe-inline'", "'unsafe-hashes'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: [
          "'self'",
          "data:",
          "blob:",
          "https://*.supabase.co",
          "https://*.openstreetmap.org",
          "https://*.cartocdn.com",
          "https://cdn.jsdelivr.net",
          "https://raw.githubusercontent.com",
        ],
        connectSrc: ["*"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    permissionsPolicy: {
      features: {
        geolocation: ["'self'"],
      },
    },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  }),
);

// Add security headers to prevent sniffing and framing
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  next();
});

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

// Read allowed CORS origins from .env (comma-separated, required)
if (!process.env.CORS_ORIGINS) {
  console.error(
    "FATAL: CORS_ORIGINS is not set in .env. Server will not start.",
  );
  process.exit(1);
}
const corsOrigins = process.env.CORS_ORIGINS.split(",").map((o) => o.trim());
app.use(
  cors({
    origin: corsOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);
app.use(express.json());

// Ensure upload directories exist
const uploadDirs = ["original", "large", "medium", "thumbnail", "documents"];
uploadDirs.forEach((dir) => {
  const fullPath = path.join(__dirname, "uploads", dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

// Serve uploads folder
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const buildPath = path.join(__dirname, "build");
const hasBuild = fs.existsSync(buildPath);
const hasBuildIndex = fs.existsSync(path.join(buildPath, "index.html"));
const hasServiceWorker = fs.existsSync(
  path.join(buildPath, "service-worker.js"),
);

if (hasBuild) {
  // Serve static folder with explicit caching logic if needed,
  // but most importantly ensuring it's before the SPA fallback
  app.use(
    "/static",
    express.static(path.join(buildPath, "static"), {
      immutable: true,
      maxAge: "1y",
      etag: true,
      lastModified: true,
    }),
  );

  // Serve build output for root files with caching
  app.use(
    express.static(buildPath, {
      maxAge: "1d",
      etag: true,
      lastModified: true,
      setHeaders: (res, path) => {
        if (path.endsWith(".html")) {
          res.setHeader("Cache-Control", "no-cache");
        }
      },
    }),
  );

  app.get("/service-worker.js", (req, res) => {
    const swPath = path.join(buildPath, "service-worker.js");
    if (!fs.existsSync(swPath)) {
      return res.status(404).json({ error: "service-worker.js not found" });
    }
    res.sendFile(swPath);
  });
}

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
    res.status(500).json({ error: "An internal server error occurred." });
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
    res.status(500).json({ error: "An internal server error occurred." });
  }
});

// Proxy for Currency API to bypass CORS
app.get("/api/currency", async (req, res) => {
  try {
    const response = await fetch("https://api.frankfurter.app/latest?from=EUR");
    if (!response.ok) {
      throw new Error(`Frankfurter API error: ${response.status}`);
    }
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("[Currency] Proxy failed:", err);
    res
      .status(502)
      .json({ error: "Failed to fetch currency rates from upstream" });
  }
});

app.post("/api/gallery/upload", upload.array("images"), async (req, res) => {
  try {
    console.log("[Upload] Received request:", req.body);
    const { vacation_id, user_id, captions } = req.body;
    const files = req.files;
    const authHeader = req.headers.authorization;

    if (!files || files.length === 0) {
      console.error("[Upload] No files in request");
      return res.status(400).json({ error: "No files uploaded" });
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

    const captionList = JSON.parse(captions || "[]");
    const results = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const filename = `${Date.now()}-${i}-${file.originalname.replace(
        /\s+/g,
        "_",
      )}`;
      const baseFilename = path.parse(filename).name;

      console.log(
        `[Upload] Processing file ${i + 1}/${files.length}:`,
        filename,
      );

      // Save original
      const originalDir = path.join(__dirname, "uploads", "original");
      if (!fs.existsSync(originalDir))
        fs.mkdirSync(originalDir, { recursive: true });

      const originalPath = path.join(originalDir, filename);
      fs.writeFileSync(originalPath, file.buffer);

      // Process resolutions with failOn: 'none' to handle slightly corrupt JPEGs (common in mobile uploads)
      const imageInstance = sharp(file.buffer, { failOn: "none" }).rotate();
      const metadata = await imageInstance.metadata();
      console.log(
        `[Upload] Processing ${i + 1}/${files.length}: ${metadata.width}x${
          metadata.height
        } (${file.size} bytes)`,
      );

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
          if (!fs.existsSync(sizeDir))
            fs.mkdirSync(sizeDir, { recursive: true });

          const outputPath = path.join(sizeDir, `${baseFilename}.webp`);

          // Only resize if the original is actually wider than the target
          const resizeWidth = Math.min(
            size.width,
            metadata.width || size.width,
          );

          await imageInstance
            .clone()
            .resize(resizeWidth, null, { withoutEnlargement: true })
            .webp({ quality: 80, effort: 6 }) // effort 6 for better compression/speed balance
            .toFile(outputPath);

          paths[size.name] = `/uploads/${size.name}/${baseFilename}.webp`;
          console.log(`[Upload] Generated ${size.name} resolution`);
        } catch (sharpErr) {
          console.error(`[Upload] Sharp error (${size.name}):`, sharpErr);
          // If a resized version fails, fallback to the original for now
          // so the user at least sees something (even if slow)
          paths[size.name] = paths.original;
        }
      }

      // Save to database
      console.log(`[Upload] Saving ${i + 1} to DB...`);
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
            caption: captionList[i] || "",
          },
        ])
        .select();

      if (error) {
        console.error("[Upload] DB Error:", error);
        throw error;
      }
      results.push(data[0]);
    }

    console.log("[Upload] Success: Uploaded", results.length, "images");
    res.json({ success: true, count: results.length });
  } catch (err) {
    console.error("[Upload] Error:", err);
    res.status(500).json({ error: "An error occurred during file upload." });
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
      return res
        .status(500)
        .json({ error: "Failed to retrieve gallery items." });
    }

    console.log(
      `[Gallery] Found ${data?.length || 0} items for vacation ${vacationId}`,
    );
    res.json(data || []);
  } catch (err) {
    console.error("[Gallery] Server Catch Error:", err);
    res.status(500).json({ error: "An internal server error occurred." });
  }
});

// Dedicated endpoint for downloading original files to ensure correct headers
app.get("/api/gallery/download/:filename", (req, res) => {
  try {
    const { filename } = req.params;
    const safeFilename = path.basename(filename); // Strips directory paths to prevent Path Traversal
    const filePath = path.join(__dirname, "uploads", "original", safeFilename);

    console.log(`[Download] Requested: ${filename} -> Safe: ${safeFilename}`);

    if (!fs.existsSync(filePath)) {
      console.error(`[Download] File not found: ${filePath}`);
      return res.status(404).send("File not found");
    }

    res.download(filePath, safeFilename);
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
    res.status(500).json({ error: "An internal server error occurred." });
  }
});

app.post("/api/documents/upload", upload.single("file"), async (req, res) => {
  try {
    const { vacation_id, user_id } = req.body;
    const file = req.file;
    const authHeader = req.headers.authorization;

    if (!file) return res.status(400).json({ error: "No file uploaded" });
    if (!authHeader) return res.status(401).json({ error: "Missing token" });

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user || user.id !== user_id) {
      return res.status(401).json({ error: "Unauthorized upload" });
    }

    const filename = `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`;
    const filePath = path.join(__dirname, "uploads", "documents", filename);

    // Ensure directory exists (just in case)
    const docsDir = path.join(__dirname, "uploads", "documents");
    if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true });

    fs.writeFileSync(filePath, file.buffer);

    const relativePath = `documents/${filename}`;

    const { data, error } = await supabase
      .from("vacation_documents")
      .insert({
        vacation_id: parseInt(vacation_id),
        name: file.originalname,
        file_path: relativePath,
        file_type: file.mimetype,
        uploaded_by: user.id,
      })
      .select("*, profiles!uploaded_by(display_name)")
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error("[Docs Upload] Error:", err);
    res
      .status(500)
      .json({ error: "An error occurred during document upload." });
  }
});

app.delete("/api/documents/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const authHeader = req.headers.authorization;

    if (!authHeader) return res.status(401).json({ error: "Missing token" });

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user)
      return res.status(401).json({ error: "Unauthorized" });

    // Check permissions (Uploader or Trip Owner)
    const { data: doc } = await supabase
      .from("vacation_documents")
      .select("*, vacations(user_id)")
      .eq("id", id)
      .single();

    if (!doc) return res.status(404).json({ error: "Document not found" });

    const isOwner = doc.uploaded_by === user.id;
    const isTripOwner = doc.vacations?.user_id === user.id;

    if (!isOwner && !isTripOwner) {
      return res.status(403).json({ error: "Unauthorized deletion" });
    }

    // Delete from DB
    const { error: dbError } = await supabase
      .from("vacation_documents")
      .delete()
      .eq("id", id);

    if (dbError) throw dbError;

    // Delete from disk
    const fullPath = path.join(__dirname, "uploads", doc.file_path);
    try {
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    } catch (err) {
      console.error("[Docs Delete] File system error:", err);
    }

    res.json({ success: true });
  } catch (err) {
    console.error("[Docs Delete] Error:", err);
    res.status(500).json({ error: "An internal server error occurred." });
  }
});

// Admin endpoint to manually reset a user's password (bypasses SMTP)
app.post("/api/admin/reset-user-password", async (req, res) => {
  try {
    const { user_id, new_password } = req.body;
    const authHeader = req.headers.authorization;

    if (!authHeader) return res.status(401).json({ error: "Missing token" });
    if (!user_id || !new_password)
      return res.status(400).json({ error: "Missing parameters" });

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user: adminUser },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !adminUser)
      return res.status(401).json({ error: "Unauthorized" });

    // Verify requesting user is the Admin
    if (adminUser.id !== process.env.REACT_APP_ADMIN_UUID) {
      return res.status(403).json({ error: "Forbidden: Not an admin" });
    }

    const { data, error } = await supabase.auth.admin.updateUserById(user_id, {
      password: new_password,
    });

    if (error) throw error;
    res.json({ success: true, user: data.user.email });
  } catch (err) {
    console.error("[Admin Reset] Error:", err);
    res.status(500).json({ error: "An internal server error occurred." });
  }
});

// Serve the React app for all unmatched routes
app.get("*", (req, res) => {
  // If we are looking for a static asset (like a chunk.js) but it's not found,
  // do NOT serve index.html. Serve a 404.
  if (req.path.includes("/static/")) {
    // Log the missing static file for debugging
    console.warn(`[Static] Missing file requested: ${req.path}`);
    return res.status(404).send("Not found");
  }

  if (req.path.startsWith("/api")) {
    return res.status(404).json({ error: `API route not found: ${req.path}` });
  }
  if (!hasBuildIndex) {
    return res.status(503).json({
      error:
        "Frontend build not found. Start the React dev server with npm start.",
    });
  }
  res.sendFile(path.join(buildPath, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
