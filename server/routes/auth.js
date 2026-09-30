const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");
const db = require("../database/db");
const { ApiError } = require("../middleware/errors");

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts. Please wait a few minutes and try again." },
});

router.post("/login", loginLimiter, (req, res, next) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      throw new ApiError(400, "Username and password are required.");
    }

    const admin = db
      .prepare("SELECT * FROM admins WHERE username = ?")
      .get(String(username).trim());

    if (!admin || !bcrypt.compareSync(password, admin.password_hash)) {
      throw new ApiError(401, "Invalid username or password.");
    }

    const token = jwt.sign(
      { id: admin.id, username: admin.username },
      process.env.JWT_SECRET,
      { expiresIn: "12h" }
    );

    res.json({ token, admin: { username: admin.username } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
