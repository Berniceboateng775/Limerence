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
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Configure Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "..", "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  },
});
const upload = multer({ storage });

// Post a message (with optional attachment)
// Post a message (with optional attachment and reply)
router.post("/:id/message", auth, upload.single("attachment"), async (req, res) => {
  try {
    const { content, username, replyTo } = req.body;
    const club = await Club.findById(req.params.id);
    
    let attachment = null;
    if (req.file) {
        attachment = {
            fileType: req.file.mimetype.startsWith("image/") ? "image" : 
                  req.file.mimetype.startsWith("audio/") ? "audio" : "file",
            url: `/uploads/${req.file.filename}`,
            name: req.file.originalname
        };
    } else if (req.body.attachment) {
        try {
            attachment = JSON.parse(req.body.attachment);
        } catch (e) {
            attachment = req.body.attachment;
        }
    }

    let parsedReplyTo = null;
    if (replyTo) {
        try { parsedReplyTo = JSON.parse(replyTo); } catch(e) { parsedReplyTo = replyTo; }
    }

    const newMessage = {
      user: req.user.userId,
      username,
      content: content || "",
      attachment,
      replyTo: parsedReplyTo,
      reactions: []
    };

    club.messages.push(newMessage);
    await club.save();
    res.json(club.messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// React to a message
router.post("/:id/messages/:msgId/react", auth, async (req, res) => {
    try {
        const { emoji } = req.body;
        const club = await Club.findById(req.params.id);
        const msg = club.messages.id(req.params.msgId);
        
        if (!msg) return res.status(404).json({ msg: "Message not found" });

        // Toggle reaction
        const existingIndex = msg.reactions.findIndex(r => r.user.toString() === req.user.userId && r.emoji === emoji);
        
        if (existingIndex > -1) {
            // Remove
            msg.reactions.splice(existingIndex, 1);
        } else {
            // Add
            msg.reactions.push({ user: req.user.userId, emoji });
        }

        await club.save();
        res.json(club.messages);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Server Error" });
    }
});

// Mark club as read
router.post("/:id/read", auth, async (req, res) => {
    try {
        const club = await Club.findById(req.params.id);
        
        // Update or add entry in memberStats
        const statIndex = club.memberStats.findIndex(s => s.user.toString() === req.user.userId);
        if (statIndex > -1) {
            club.memberStats[statIndex].lastReadAt = Date.now();
        } else {
            club.memberStats.push({ user: req.user.userId, lastReadAt: Date.now() });
        }

        await club.save();
        res.json(club.memberStats);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Server Error" });
    }
});

// Kick a member (Admin only)
router.post("/:id/kick", auth, async (req, res) => {
  try {
    const { userIdToKick } = req.body;
    const club = await Club.findById(req.params.id);

    if (!club) return res.status(404).json({ msg: "Club not found" });

    // Check if requester is admin
    if (!club.admins.includes(req.user.userId)) {
      return res.status(401).json({ msg: "Not authorized" });
    }

    club.members = club.members.filter(m => m.toString() !== userIdToKick);
    // Also remove from admins if they were one
    club.admins = club.admins.filter(a => a.toString() !== userIdToKick);

    await club.save();
    res.json(club.members);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Leave a Club
router.post("/:id/leave", auth, async (req, res) => {
  try {
    const club = await Club.findById(req.params.id);
    if (!club) return res.status(404).json({ msg: "Club not found" });

    // Remove user from members
    club.members = club.members.filter(
      (m) => m.toString() !== req.user.userId
    );

    // If admins includes user, remove them too
    if (club.admins && club.admins.length > 0) {
        club.admins = club.admins.filter(a => a.toString() !== req.user.userId);
    }

    await club.save();
    res.json(club.members);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// Update Club Info (Admin only)
router.put("/:id", auth, async (req, res) => {
  try {
    const { name, description } = req.body;
    const club = await Club.findById(req.params.id);

    if (!club) return res.status(404).json({ msg: "Club not found" });

    if (!club.admins.includes(req.user.userId)) {
      return res.status(401).json({ msg: "Not authorized" });
    }

    if (name) club.name = name;
    if (description) club.description = description;

    await club.save();
    res.json(club);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
