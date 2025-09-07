const express = require("express");
const multer = require("multer");
const router = express.Router();
const ourPartnerController = require("../controllers/contentController/ourPartnerController");

const upload = multer(); // simpan file di memory (jika pakai imageKit)

// Routes
router.get("/", (req, res) => ourPartnerController.getAllPartners(req, res));
router.get("/:id", (req, res) => ourPartnerController.getPartnerById(req, res));

// ✅ Tambahkan upload.single('image') di POST dan PUT
router.post("/", upload.single("image"), (req, res) => ourPartnerController.createPartner(req, res));
router.put("/:id", upload.single("image"), (req, res) => ourPartnerController.updatePartner(req, res));

router.delete("/:id", (req, res) => ourPartnerController.deletePartner(req, res));

module.exports = router;