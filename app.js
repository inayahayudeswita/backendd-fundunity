const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const transactionController = require("./controllers/contentController/transactionController");
const authController = require("./controllers/authController/login"); // ✅ Import authController
const aboutusRoutes = require("./routes/aboutusRoutes");
const imagesliderRoutes = require("./routes/imagesliderRoutes");
const programRoutes = require("./routes/programRoutes");
const ourpartnerRoutes = require("./routes/ourpartnerRoutes");

const midtransPolling = require("./midtransPolling");
const { connectDB } = require("./config/db");

const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://landing-page-fundunity.vercel.app"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // Allow Postman or curl
    if (allowedOrigins.includes(origin)) {
      return callback(null, origin);
    } else {
      return callback(new Error("Not allowed by CORS"));
    }
  }
}));

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
app.post(
  "/v1/content/transaction/notification",
  bodyParser.raw({ type: "application/json" }),
  transactionController.handleNotification
);

// ❌ 404 handler (jika route tidak ditemukan)
app.use((req, res, next) => {
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

// ✅ Start server
const startServer = async () => {
  try {
    await connectDB();
    console.log("✅ Database connected");

    midtransPolling.start();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
