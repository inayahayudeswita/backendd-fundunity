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
// ✅ Webhook Notification (Midtrans) route
app.post(
  "/v1/content/transaction/notification",
  express.raw({ type: "application/json" }),
  (req, res, next) => {
    try {
      req.body = JSON.parse(req.body.toString()); // 💥 Convert raw buffer ke JSON
      next();
    } catch (err) {
      console.error("❌ Failed to parse webhook body:", err);
      res.status(400).send("Invalid JSON");
    }
  },
  transactionController.handleNotification
);


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
