import multer from "multer";
import path from "path";
import fs from "fs";
import { Request } from "express";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "uploads";

// Ensure uploads directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    // Unique filename: timestamp + random suffix + original extension
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `salary-slip-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowed = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF, JPG, and PNG files are allowed"));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
});