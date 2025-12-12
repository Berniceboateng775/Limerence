const express = require("express");
const router = express.Router();
const Club = require("../models/Club");
const auth = require("../middleware/auth"); // Assuming you have an auth middleware

// Get all clubs
router.get("/", async (req, res) => {
  try {
    const clubs = await Club.find().populate("members", "name");
    res.json(clubs);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

// Create a club
router.post("/", auth, async (req, res) => {
  try {
    const { name, description, currentBook } = req.body;
    let club = await Club.findOne({ name });
    if (club) return res.status(400).json({ msg: "Club already exists" });

    club = new Club({
      name,
      description,
      currentBook,
      members: [req.user.userId], // Creator joins automatically
      admins: [req.user.userId], // Creator is admin
    });

    await club.save();
    res.json(club);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

// Join a club
router.post("/:id/join", auth, async (req, res) => {
  try {
    const club = await Club.findById(req.params.id);
    if (!club) return res.status(404).json({ msg: "Club not found" });

    if (club.members.includes(req.user.userId)) {
      return res.status(400).json({ msg: "Already a member" });
    }

    club.members.push(req.user.userId);
    await club.save();
    res.json(club);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

// Post a message
router.post("/:id/message", auth, async (req, res) => {
  try {
    const { content, username } = req.body;
    const club = await Club.findById(req.params.id);
    
    const newMessage = {
      user: req.user.userId,
      username,
      content,
    };

    club.messages.push(newMessage);
    await club.save();
    res.json(club.messages);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
