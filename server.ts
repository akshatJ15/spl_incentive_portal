import express from "express";
import path from "path";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import adminRouter from "./routes/admin.js";
import publicRouter from "./routes/public.js";
import clientRouter from "./routes/client.js";
import adminDashboardRouter from "./routes/adminDashboard.js";

// Load environment variables from .env file

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Initialize CORS with exact methods and options
  app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE'] }));
  app.use(express.json());

  // Connect to MongoDB with strict logging
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (mongoUri) {
    const fs = await import('fs');
    const logStatus = (status: string, extra: Record<string, unknown> = {}) => {
      try {
        fs.writeFileSync('db_connection_log.json', JSON.stringify({
          time: new Date().toISOString(),
          status,
          mongoUriPresent: true,
          readyState: mongoose.connection.readyState,
          ...extra
        }, null, 2));
      } catch (err) {
        console.error("Failed to write connection log:", err);
      }
    };

    logStatus("connecting");

    mongoose.connect(mongoUri)
      .then(() => {
        console.log("✅ MONGODB CONNECTED SUCCESSFULLY");
        logStatus("connected");
      })
      .catch(err => {
        console.error("❌ MONGODB CONNECTION FAILED:", err);
        logStatus("failed", { error: err.message, stack: err.stack });
      });
  } else {
    console.log("[STORAGE WARNING]: MONGO_URI or MONGODB_URI is not declared in environment secrets. Gracefully falling back to high-fidelity transient local memory storage.");
    try {
      const fs = await import('fs');
      fs.writeFileSync('db_connection_log.json', JSON.stringify({
        time: new Date().toISOString(),
        status: "no_uri",
        mongoUriPresent: false,
        readyState: mongoose.connection.readyState
      }, null, 2));
    } catch (_) {}
  }

  // Mount backend routes
  // Dynamic robots.txt to strictly disallow search bot crawls on all claim and administrative routes, guaranteeing zero SEO token leaks
  app.get("/robots.txt", (req, res) => {
    res.type("text/plain");
    res.send("User-agent: *\nDisallow: /\n");
  });

  // Automatic Google Search Console Dynamic HTML Verification
  // Responds perfectly to any Google search console HTML verification challenge (e.g. google1234abcd5678.html)
  app.get("/google:id.html", (req, res) => {
    const id = req.params.id;
    res.type("text/html");
    res.send(`google-site-verification: google${id}.html`);
  });

  // Dedicated lightweight API health check endpoint for UptimeRobot monitoring
  app.get("/api/health", (req, res) => {
    res.json({
      status: "up",
      timestamp: new Date().toISOString(),
      database: mongoose.connection.readyState === 1 ? "connected" : "disconnected"
    });
  });

  app.use("/api/admin", adminRouter);
  app.use("/api/admin", adminDashboardRouter);
  app.use("/api/public", publicRouter);
  app.use("/api/client", clientRouter);

  // Mock API for claims to support full-circle claim tracking in-browser
  app.post("/api/claim", async (req, res) => {
    try {
      const { token } = req.body;
      if (!token) {
        return res.status(400).json({ success: false, error: "Token is required for claiming." });
      }

      // Lazy import QrToken to follow safety rules
      const QrTokenModule = await import("./models/QrToken.js");
      const QrToken = QrTokenModule.default;

      // Check if token exists
      const qrToken = await QrToken.findOne({ id: token });
      if (!qrToken) {
        return res.status(404).json({ success: false, error: "The provided token was not found or has expired." });
      }

      // Check if already claimed
      if (qrToken.used) {
        return res.status(400).json({ success: false, error: "This unique QR code has already been scanned and claimed." });
      }

      // Mark as claimed
      qrToken.used = true;
      await qrToken.save();

      return res.json({
        success: true,
        message: `Success! You have claimed ${qrToken.points} incentive points!`,
        points: qrToken.points
      });
    } catch (err) {
      console.error('Claim error:', err);
      const details = err instanceof Error ? err.message : "Unknown error";
      return res.status(500).json({ success: false, error: 'Database capture failed.', details });
    }
  });

  // Vite integration middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Full-stack server booting on port ${PORT}`);
  });
}

startServer();
