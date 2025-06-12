const express = require("express");
const programsController = require("../controllers/contentController/programController");
const { verifyToken } = require("../middlewares/auth");
const upload = require("../middlewares/uploadMiddleware");

const router = express.Router();

// Public routes
router.get("/", programsController.getAllPrograms.bind(programsController));
router.get("/:id", programsController.getProgramById.bind(programsController));

// Protected routes - require authentication
router.post(
  "/",
  verifyToken,
  upload.single("image"), // Add the upload middleware here
  programsController.createProgram.bind(programsController)
);
router.put(
  "/:id",
  verifyToken,
  upload.single("image"), // Add the upload middleware here
  programsController.updateProgram.bind(programsController)
);
router.delete(
  "/:id",
  verifyToken,
  programsController.deleteProgram.bind(programsController)
);

module.exports = router;
