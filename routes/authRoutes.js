const express = require("express");
const { createUser } = require("../controllers/createUserController");
const { loginUser } = require("../controllers/authController/login");

const router = express.Router();

// create user
router.post("/users", createUser);

router.post("/login", loginUser);

module.exports = router;
