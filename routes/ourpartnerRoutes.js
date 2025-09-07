const express = require("express");
const ourPartnerController = require("../controllers/contentController/ourPartnerController");
const { verifyToken } = require("../middlewares/auth");
const upload = require("../middlewares/uploadMiddleware");

const router = express.Router();

// Public routes
router.get("/", ourPartnerController.getAllOurPartners);
router.get("/:id", ourPartnerController.getOurPartnerById);

// Protected routes
router.post("/", verifyToken, upload.single("image"), ourPartnerController.createOurPartner);
router.put("/:id", verifyToken, upload.single("image"), ourPartnerController.updateOurPartner);
router.delete("/:id", verifyToken, ourPartnerController.deleteOurPartner);

module.exports = router;
