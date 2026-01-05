const express = require("express");
const router = express.Router();
const Club = require("../models/Club");
const Notification = require("../models/Notification");
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

    // Club Leader Badge
    const User = require("../models/User");
    const { checkAndAwardBadge } = require("../utils/badgeUtils");
    const user = await User.findById(req.user.userId);
    let newBadge = null;
    
    if (!user.badges.some(b => b.name === "Club Leader")) {
        const badge = { name: "Club Leader", icon: "🗣️", description: "Create a Book Club" };
        user.badges.push(badge);
        await user.save();
        newBadge = badge;
    }
    
    res.json({ club, newBadge });
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
    
    // Social Butterfly Badge
    const User = require("../models/User");
    const { checkAndAwardBadge } = require("../utils/badgeUtils");
    const user = await User.findById(req.user.userId);
    
    // Pass custom context if needed, or rely on manual check of clubs length if we populate it
    // But user.clubs isn't a standard field (clubs store members). 
    // So we need to count how many clubs the user is in.
    const Club = require("../models/Club");
    const clubCount = await Club.countDocuments({ members: req.user.userId });
    
    await checkAndAwardBadge(user, "club_count", { clubCount });
    await user.save();

    res.json(club);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

// Post a message (with optional attachment)
router.post("/:id/message", auth, upload.single("attachment"), async (req, res) => {
  try {
    let { content, username, replyTo } = req.body;
    const club = await Club.findById(req.params.id);
    
    // If username not provided, fetch from User model
    if (!username) {
      const User = require("../models/User");
      const sender = await User.findById(req.user.userId);
      username = sender?.name || "Unknown";
    }
    
    let attachment = null;
    let attachmentType = req.body.attachmentType || "none";

    if (req.file) {
        attachment = {
            fileType: req.file.mimetype.startsWith("image/") ? "image" : 
                  req.file.mimetype.startsWith("audio/") ? "audio" : "file",
            url: `/uploads/${req.file.filename}`,
            name: req.file.originalname
        };
        
        // Auto-detect type from file if not strictly provided (though frontend should send it)
        if (attachmentType === "none") {
             if (req.file.mimetype.startsWith("image/")) attachmentType = "image";
             else if (req.file.mimetype.startsWith("audio/") || req.file.mimetype.startsWith("video/webm")) attachmentType = "voice"; // Assume webm audio is voice
             else if (req.file.mimetype.startsWith("video/")) attachmentType = "video";
             else attachmentType = "file";
        }
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

    let poll = null;
    if (req.body.poll) {
        try {
            poll = JSON.parse(req.body.poll);
            // Initialize votes
            if (poll.options) {
                poll.options = poll.options.map(opt => ({ text: opt.text, votes: [] }));
            }
            attachmentType = "none"; // Polls handle their own display
        } catch (e) {
            console.error("Poll parse error", e);
        }
    }

    const newMessage = {
      user: req.user.userId,
      username,
      content: content || "",
      attachment,
      attachmentType,
      replyTo: parsedReplyTo,
      reactions: [],
      poll
    };

    club.messages.push(newMessage);
    await club.save();
    res.json(club.messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Vote on a poll
router.post("/:id/messages/:msgId/vote", auth, async (req, res) => {
    try {
        const { optionIndex } = req.body;
        const club = await Club.findById(req.params.id);
        const msg = club.messages.id(req.params.msgId);

        if (!msg || !msg.poll) return res.status(404).json({ msg: "Poll not found" });

        // Remove user from all options (Single choice for now)
        msg.poll.options.forEach(opt => {
            opt.votes = opt.votes.filter(v => v.toString() !== req.user.userId);
        });

        // Add to selected option
        if (msg.poll.options[optionIndex]) {
            msg.poll.options[optionIndex].votes.push(req.user.userId);
        }

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

        const msgIndex = club.messages.findIndex(m => m._id.toString() === req.params.msgId);
        if (msgIndex === -1) {
            return res.status(404).json({ msg: "Message not found" });
        }

        const msg = club.messages[msgIndex];
        const isSender = msg.user.toString() === req.user.userId;
        const isAdmin = club.admins.some(a => a.toString() === req.user.userId);

        if (!isAdmin && !isSender) {
            return res.status(401).json({ msg: "Not authorized" });
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
    
    // Create notification for kicked user
    try {
      await Notification.create({
        recipient: userIdToKick,
        type: "club_kick",
        content: `You have been removed from the club "${club.name}" by an admin.`,
        relatedId: club._id
      });
    } catch (notifErr) {
      console.error("Failed to create kick notification:", notifErr);
    }
    
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
    
    // Handle currentBook - can be string (title only) or object
    if (currentBook !== undefined) {
      if (typeof currentBook === 'string') {
        club.currentBook = { title: currentBook, author: '', coverImage: '' };
      } else {
        club.currentBook = currentBook;
      }
    }
    
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

// Invite/Add a user to club (Admin only)
router.post("/:id/invite", auth, async (req, res) => {
  try {
    const { userIdToInvite } = req.body;
    const club = await Club.findById(req.params.id);

    if (!club) return res.status(404).json({ msg: "Club not found" });

    // Check if user is admin
    const isAdmin = club.admins.some(a => a.toString() === req.user.userId);
    if (!isAdmin) {
      return res.status(401).json({ msg: "Not authorized - admin only" });
    }

    // Check if user is already a member
    if (club.members.some(m => m.toString() === userIdToInvite)) {
      return res.status(400).json({ msg: "User is already a member" });
    }

    // Check if user is banned
    if (club.bannedUsers?.some(b => b.toString() === userIdToInvite)) {
      return res.status(400).json({ msg: "User is banned from this club" });
    }

    // Add user to members
    club.members.push(userIdToInvite);
    club.memberStats.push({ user: userIdToInvite, lastReadAt: new Date() });
    await club.save();

    // Create notification for invited user (non-blocking)
    try {
      await Notification.create({
        recipient: userIdToInvite,
        type: "club_invite",
        content: `You have been added to the ${club.name} club`,
        relatedId: club._id
      });
    } catch (notifErr) {
      console.error("Failed to create notification:", notifErr);
      // Don't fail the whole request if notification fails
    }

    // Return updated club
    const updatedClub = await Club.findById(club._id)
      .populate("members", "name avatar badges shelf about")
      .populate("admins", "name avatar")
      .populate("bannedUsers", "_id");

    res.json(updatedClub);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Generate shareable club link (returns club ID for sharing)
router.get("/:id/share", auth, async (req, res) => {
  try {
    const club = await Club.findById(req.params.id)
      .populate("members", "name avatar");
    
    if (!club) return res.status(404).json({ msg: "Club not found" });

    res.json({
      clubId: club._id,
      name: club.name,
      description: club.description,
      memberCount: club.members.length,
      coverImage: club.coverImage
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
