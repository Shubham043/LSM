import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { connectDB } from "./config/db";

// Routes
import authRoutes from "./routes/auth.routes";
import borrowerRoutes from "./routes/borrower.route";
import dashboardRoutes from "./routes/dashboard.routes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// ── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded salary slips statically
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

// ── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/borrower", borrowerRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Health check
app.get("/", (_req, res) => {
  res.json({ success: true, message: "CreditSea API is running" });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Global error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Unhandled error:", err);

  // Multer file size error
  if (err.code === "LIMIT_FILE_SIZE") {
    res.status(400).json({ success: false, message: "File size must be under 5 MB" });
    return;
  }

  // Multer file type error
  if (err.message?.includes("Only PDF")) {
    res.status(400).json({ success: false, message: err.message });
    return;
  }

  res.status(500).json({ success: false, message: "Internal server error" });
});

// ── Start ────────────────────────────────────────────────────────────────────
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📁 Environment: ${process.env.NODE_ENV || "development"}`);
  });
});