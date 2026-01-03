const express = require("express");
const router = express.Router();
const Club = require("../models/Club");
const auth = require("../middleware/auth"); 
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

// Get all clubs
router.get("/", async (req, res) => {
  try {
    const clubs = await Club.find()
      .populate("members", "name avatar badges shelf about")
      .populate("admins", "name avatar")
      .sort({ createdAt: -1 });
    res.json(clubs);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

// Create a club
router.post("/", auth, upload.single("coverImage"), async (req, res) => {
  try {
    const { name, description, currentBook } = req.body;
    let club = await Club.findOne({ name });
    if (club) return res.status(400).json({ msg: "Club already exists" });

    let coverImage = "";
    if (req.file) {
        coverImage = `/uploads/${req.file.filename}`;
    }

    club = new Club({
      name,
      description,
      currentBook,
      coverImage,
      members: [req.user.userId], 
      admins: [req.user.userId],
    });

    await club.save();
    res.json(club);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Join a club
router.post("/:id/join", auth, async (req, res) => {
  try {
    const club = await Club.findById(req.params.id);
    if (!club) return res.status(404).json({ msg: "Club not found" });

    // Check if user is banned from this club
    if (club.bannedUsers && club.bannedUsers.some(b => b.toString() === req.user.userId)) {
      return res.status(403).json({ msg: "You have been banned from this club and cannot rejoin." });
    }

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

// Post a message (with optional attachment)
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

// Delete a message (Admin only)
router.delete("/:id/messages/:msgId", auth, async (req, res) => {
    try {
        const club = await Club.findById(req.params.id);
        if (!club) return res.status(404).json({ msg: "Club not found" });

        // Check if requester is admin
        const isAdmin = club.admins.some(a => a.toString() === req.user.userId);
        if (!isAdmin) {
            return res.status(401).json({ msg: "Not authorized - admin only" });
        }

        // Find and remove the message
        const msgIndex = club.messages.findIndex(m => m._id.toString() === req.params.msgId);
        if (msgIndex === -1) {
            return res.status(404).json({ msg: "Message not found" });
        }

        club.messages.splice(msgIndex, 1);
        await club.save();
        res.json({ msg: "Message deleted", messages: club.messages });
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
    const isAdmin = club.admins.some(a => a.toString() === req.user.userId);
    if (!isAdmin) {
      return res.status(401).json({ msg: "Not authorized - admin only" });
    }

    // Remove from members
    club.members = club.members.filter(m => m.toString() !== userIdToKick);
    // Also remove from admins if they were one
    club.admins = club.admins.filter(a => a.toString() !== userIdToKick);
    
    // Add to bannedUsers so they can't rejoin
    if (!club.bannedUsers) club.bannedUsers = [];
    if (!club.bannedUsers.some(b => b.toString() === userIdToKick)) {
      club.bannedUsers.push(userIdToKick);
    }

    await club.save();
    res.json({ members: club.members, bannedUser: userIdToKick, clubName: club.name });
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

// Update Club Info (Admin only) - with file upload support
router.put("/:id", auth, upload.single("coverImage"), async (req, res) => {
  try {
    const { name, description, currentBook } = req.body;
    const club = await Club.findById(req.params.id);

    if (!club) return res.status(404).json({ msg: "Club not found" });

    // Check if user is admin
    const isAdmin = club.admins.some(a => a.toString() === req.user.userId);
    if (!isAdmin) {
      return res.status(401).json({ msg: "Not authorized - admin only" });
    }

    if (name) club.name = name;
    if (description) club.description = description;
    if (currentBook !== undefined) club.currentBook = currentBook;
    
    // Handle cover image upload
    if (req.file) {
      club.coverImage = `/uploads/${req.file.filename}`;
    }

    await club.save();
    
    // Return populated club
    const updatedClub = await Club.findById(club._id)
      .populate("members", "name avatar badges shelf about")
      .populate("admins", "name avatar");
    
    res.json(updatedClub);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Delete Club (Admin only)
router.delete("/:id", auth, async (req, res) => {
  try {
    const club = await Club.findById(req.params.id);

    if (!club) return res.status(404).json({ msg: "Club not found" });

    // Check if user is admin
    const isAdmin = club.admins.some(a => a.toString() === req.user.userId);
    if (!isAdmin) {
      return res.status(401).json({ msg: "Not authorized - admin only" });
    }

    await Club.findByIdAndDelete(req.params.id);
    res.json({ msg: "Club deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
