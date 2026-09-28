const multer = require("multer");
const path = require("path");
const fs = require("fs");
const ValidationError = require("../errors/ValidationError");

// Ensure upload directory exists
const uploadDir = path.join(__dirname, "../../../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate secure unique filename: timestamp + random characters + ext
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname.replace(/\s+/g, "_"));
  },
});

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "text/plain",
  "text/csv",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/zip",
]);

const blockedExtensions = new Set([
  ".bat",
  ".cmd",
  ".com",
  ".exe",
  ".js",
  ".jse",
  ".msi",
  ".ps1",
  ".scr",
  ".sh",
  ".vbs",
  ".wsf",
]);

// 10MB limit
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();

    if (blockedExtensions.has(ext) || !allowedMimeTypes.has(file.mimetype)) {
      cb(new ValidationError("Unsupported or unsafe file type"));
      return;
    }

    cb(null, true);
  },
});

module.exports = upload;
