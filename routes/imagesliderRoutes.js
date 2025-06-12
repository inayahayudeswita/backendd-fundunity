// backend/routes/contentEdit/imageSliderRoutes.js
const express = require("express");
const imageSliderController = require("../controllers/contentController/imageSliderController");
const { verifyToken } = require("../middlewares/auth");
const upload = require("../middlewares/uploadMiddleware");

const router = express.Router();

// Public routes
router.get(
  "/",
  imageSliderController.getAllImageSliders.bind(imageSliderController)
);
router.get(
  "/:id",
  imageSliderController.getImageSliderById.bind(imageSliderController)
);

// Protected routes - require authentication
router.post(
  "/",
  verifyToken,
  upload.single("image"), // Middleware untuk mengunggah file (misalnya gambar slider)
  imageSliderController.createImageSlider.bind(imageSliderController)
);
router.put(
  "/:id",
  verifyToken,
  upload.single("image"), // Middleware untuk mengunggah file (misalnya gambar slider)
  imageSliderController.updateImageSlider.bind(imageSliderController)
);
router.delete(
  "/:id",
  verifyToken,
  imageSliderController.deleteImageSlider.bind(imageSliderController)
);

module.exports = router;
