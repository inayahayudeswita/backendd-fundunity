const express = require("express");
const cors = require("cors");

const transactionController = require("./controllers/contentController/transactionController");
const authController = require("./controllers/authController/login");
const aboutusRoutes = require("./routes/aboutusRoutes");
const imagesliderRoutes = require("./routes/imagesliderRoutes");
const programRoutes = require("./routes/programRoutes");
const ourpartnerRoutes = require("./routes/ourpartnerRoutes");
const { connectDB } = require("./config/db");

const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://landing-page-fundunity.vercel.app",
  "https://fe-admin-dashboard.vercel.app",
];

// ✅ CORS
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, origin);
      } else {
        return callback(new Error("Not allowed by CORS"));
      }
    },
  })
);

// ✅ Parsers
app.use(express.json({ type: "*/*" }));
app.use(express.urlencoded({ extended: true }));

// ✅ Base route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to FundUnity API" });
});

// ✅ Group all routes under /api/v1/content
app.use("/api/v1/content/aboutus", aboutusRoutes);
app.use("/api/v1/content/imageslider", imagesliderRoutes);
app.use("/api/v1/content/program", programRoutes);
app.use("/api/v1/content/ourpartner", ourpartnerRoutes);

// ✅ Login
app.post("/api/v1/content/login", authController.loginUser);

// ✅ Transaction routes
app.post("/api/v1/content/transaction", transactionController.createTransaction);
app.get("/api/v1/content/transaction", transactionController.getTransactions);

// ✅ Midtrans Notification (Webhook)
app.post(
  "/api/v1/content/transaction/notification",
  transactionController.handleNotification
);

// ✅ Transaction Status Check
app.get(
  "/api/v1/content/transaction/check-status",
  transactionController.checkStatus
);

// ❌ 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Not Found" });
});

// ❌ Error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.message);
  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({ error: "CORS policy: Access denied" });
  }
  res.status(500).json({ error: "Internal Server Error" });
});

const startServer = async () => {
  try {
    await connectDB();
    console.log("✅ Database connected");

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
