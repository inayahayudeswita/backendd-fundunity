const express = require("express");
const cors = require("cors");
const { connectDB } = require("./config/db");

// Controllers
const transactionController = require("./controllers/contentController/transactionController");
const authController = require("./controllers/authController/login");
const ourPartnerController = require("./controllers/contentController/ourPartnerController");

// Routes
const aboutusRoutes = require("./routes/aboutusRoutes");
const imagesliderRoutes = require("./routes/imagesliderRoutes");
const programRoutes = require("./routes/programRoutes");
const ourpartnerRoutes = require("./routes/ourpartnerRoutes");

const app = express();
const PORT = process.env.PORT || 4000;

// Allowed origins for CORS
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://landing-page-fundunity.vercel.app",
  "https://fe-admin-dashboard.vercel.app",
];

// CORS middleware
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); // allow Postman / curl / server-side
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        console.warn("❌ CORS blocked for origin:", origin);
        return callback(new Error("Not allowed by CORS"), false);
      }
    },
    credentials: true,
  })
);

// *** FIXED: Body parser ***
app.use(express.json());  // <-- Jangan pakai { type: "*/*" }
app.use(express.urlencoded({ extended: true }));

// Root check
app.get("/", (req, res) => {
  res.json({ message: "Welcome to FundUnity API (Render)" });
});

// Content routes
app.use("/v1/content/aboutus", aboutusRoutes);
app.use("/v1/content/imageslider", imagesliderRoutes);
app.use("/v1/content/program", programRoutes);
app.use("/v1/content/ourpartner", ourpartnerRoutes);

// Auth
app.post("/v1/content/login", authController.loginUser);

// Transactions
app.post("/v1/content/transaction", transactionController.createTransaction);
app.get("/v1/content/transaction", transactionController.getTransactions);
app.post("/v1/content/transaction/notification", transactionController.handleNotification);
app.get("/v1/content/transaction/check-status", transactionController.checkStatus);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Not Found" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.message);
  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({ error: "CORS policy: Access denied" });
  }
  res.status(500).json({ error: "Internal Server Error" });
});

// Start server
const startServer = async () => {
  try {
    await connectDB();
    console.log("✅ Database connected");

    app.listen(PORT, () => {
      console.log(`🚀 API running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
