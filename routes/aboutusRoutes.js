// backend/routes/aboutUsRoutes.js
const express = require("express");
const aboutUsController = require("../controllers/contentController/aboutusController");
const { verifyToken } = require("../middlewares/auth");
const upload = require("../middlewares/uploadMiddleware");

const router = express.Router();

// Public routes
router.get("/", aboutUsController.getAllAboutUs.bind(aboutUsController));
router.get("/:id", aboutUsController.getAboutUsById.bind(aboutUsController));

// Protected routes - require authentication
router.post(
  "/",
  verifyToken,
  upload.single("image"), // Changed from "video" to "image"
  aboutUsController.createAboutUs.bind(aboutUsController)
);
router.put(
  "/:id",
  verifyToken,
  upload.single("image"), // Changed from "video" to "image"
  aboutUsController.updateAboutUs.bind(aboutUsController)
);
router.delete(
  "/:id",
  verifyToken,
  aboutUsController.deleteAboutUs.bind(aboutUsController)
);

module.exports = router;
