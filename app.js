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
];

// ✅ Middleware CORS
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

// ✅ Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Register route modular files
app.use("/v1/content/aboutus", aboutusRoutes);
app.use("/v1/content/imageslider", imagesliderRoutes);
app.use("/v1/content/program", programRoutes);
app.use("/v1/content/ourpartner", ourpartnerRoutes);

// ✅ Base API route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to DonateBank API" });
});

// ✅ LOGIN route
app.post("/v1/content/login", authController.loginUser);

// ✅ Transaction routes
app.post("/v1/content/transaction", transactionController.createTransaction);
app.get("/v1/content/transaction", transactionController.getTransactions);

// ✅ Webhook Notification (Midtrans) FIX
app.post(
  "/v1/content/transaction/notification",
  transactionController.handleNotification
);

// ✅ Transaction Check Status (for EasyCron / manual check)
app.get("/v1/content/transaction/check-status", transactionController.checkStatus);

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
