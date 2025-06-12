const express = require("express");
const ourPartnerController = require("../controllers/contentController/ourPartnerController");
const { verifyToken } = require("../middlewares/auth");
const upload = require("../middlewares/uploadMiddleware");

const router = express.Router();

// Public routes
router.get(
  "/",
  ourPartnerController.getAllOurPartners.bind(ourPartnerController)
);
router.get(
  "/:id",
  ourPartnerController.getOurPartnerById.bind(ourPartnerController)
);

// Protected routes - require authentication
router.post(
  "/",
  verifyToken,
  upload.single("image"), // Middleware untuk mengunggah file (misalnya logo partner)
  ourPartnerController.createOurPartner.bind(ourPartnerController)
);
router.put(
  "/:id",
  verifyToken,
  upload.single("image"), // Middleware untuk mengunggah file (misalnya logo partner)
  ourPartnerController.updateOurPartner.bind(ourPartnerController)
);
router.delete(
  "/:id",
  verifyToken,
  ourPartnerController.deleteOurPartner.bind(ourPartnerController)
);

module.exports = router;
