const express = require("express")
const router = express.Router()
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const multer = require("multer")
const path = require("path")
const fs = require("fs")
const User = require("../models/User")
const auth = require("../middleware/auth")

// ============================
// SET UP MULTER FOR FILE UPLOADS
// ============================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "..", "uploads")
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir)
    }
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, Date.now() + ext)
  },
})
const upload = multer({ storage })

// ============================
// REGISTER USER
// ============================
router.post("/register", upload.single("avatar"), async (req, res) => {
  const { name, email, password, gender } = req.body

  if (!name || !email || !password) {
    return res.status(400).json({ msg: "Please fill in all required fields" })
  }

  if (gender && !["Male", "Female", "Other"].includes(gender)) {
    return res.status(400).json({ msg: "Please select a valid gender" })
  }

  try {
    let user = await User.findOne({ email })
    if (user) return res.status(400).json({ msg: "User already exists" })

    const avatarPath = req.file ? `/uploads/${req.file.filename}` : null

    user = new User({
      name,
      email,
      password,
      gender: gender || null,
      avatar: avatarPath,
    })

    const salt = await bcrypt.genSalt(10)
    user.password = await bcrypt.hash(password, salt)
    await user.save()

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" })

    res.status(201).json({ token })
  } catch (err) {
    console.error(err)
    res.status(500).send("Server error")
  }
})

// ============================
// LOGIN USER
// ============================
router.post("/login", async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ msg: "Please enter both email and password" })
  }

  try {
    const user = await User.findOne({ email })
    if (!user) return res.status(400).json({ msg: "Invalid credentials" })

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" })

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" })

    res.json({ token })
  } catch (err) {
    console.error(err)
    res.status(500).send("Server error")
  }
})

// ============================
// UPDATE PROFILE
// ============================
router.put("/me", auth, upload.single("avatar"), async (req, res) => {
  const updates = {}
  const allowedFields = ["name", "gender", "about"]

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field]
  })

  if (req.body.gender && !["Male", "Female", "Other"].includes(req.body.gender)) {
    return res.status(400).json({ msg: "Invalid gender value" })
  }

  if (req.file) {
    updates.avatar = `/uploads/${req.file.filename}`
  }

  try {
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { $set: updates },
      { new: true, runValidators: true },
    ).select("-password")

    res.json(user)
  } catch (err) {
    console.error(err)
    res.status(500).send("Server error")
  }
})

// ============================
// UPDATE PREFERENCES
// ============================
router.put("/preferences", auth, async (req, res) => {
  try {
    const { preferences } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { $set: { preferences } },
      { new: true }
    ).select("-password");
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// ============================
// DELETE ACCOUNT
// ============================
router.delete("/me", auth, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user.userId)
    res.json({ msg: "Account successfully deleted" })
  } catch (err) {
    console.error(err)
    res.status(500).send("Server error")
  }
})

// ============================
// GET CURRENT USER
// ============================
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password")
    res.json(user)
  } catch (err) {
    console.error(err)
    res.status(500).send("Server error")
  }
})

module.exports = router
