const express = require("express");
const router = express.Router();
const DirectMessage = require("../models/DirectMessage");
const User = require("../models/User");
const auth = require("../middleware/auth");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Configure Multer for DM attachments
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "..", "uploads", "dm");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).substr(2, 9)}${ext}`);
  },
});
const upload = multer({ storage });

// Get or create conversation with a friend
router.get("/:friendId", auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const friendId = req.params.friendId;

    // Find existing conversation
    let conversation = await DirectMessage.findOne({
      participants: { $all: [userId, friendId] }
    }).populate("messages.sender", "name avatar");

    if (!conversation) {
      // Create new conversation
      conversation = new DirectMessage({
        participants: [userId, friendId],
        messages: []
      });
      await conversation.save();
    }

    res.json(conversation);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Send a message
router.post("/:friendId/message", auth, upload.single("attachment"), async (req, res) => {
  try {
    const userId = req.user.userId;
    const friendId = req.params.friendId;
    const { content, attachmentType, replyToId, replyToContent, replyToUsername } = req.body;

    // Find or create conversation
    let conversation = await DirectMessage.findOne({
      participants: { $all: [userId, friendId] }
    });

    if (!conversation) {
      conversation = new DirectMessage({
        participants: [userId, friendId],
        messages: []
      });
    }

    // Prepare message with optional reply
    const newMessage = {
      sender: userId,
      content: content || "",
      attachment: req.file ? `/uploads/dm/${req.file.filename}` : "",
      attachmentType: attachmentType || "none",
      createdAt: new Date()
    };
    
    // Add reply context if replying
    if (replyToId && replyToContent && replyToUsername) {
      newMessage.replyTo = {
        messageId: replyToId,
        content: replyToContent,
        username: replyToUsername
      };
    }

    conversation.messages.push(newMessage);
    conversation.updatedAt = new Date();
    await conversation.save();

    // Populate sender info for response
    await conversation.populate("messages.sender", "name avatar");

    const addedMessage = conversation.messages[conversation.messages.length - 1];
    res.json(addedMessage);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Add reaction to message
router.post("/:friendId/message/:messageId/reaction", auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { friendId, messageId } = req.params;
    const { emoji } = req.body;

    const conversation = await DirectMessage.findOne({
      participants: { $all: [userId, friendId] }
    });

    if (!conversation) {
      return res.status(404).json({ msg: "Conversation not found" });
    }

    const message = conversation.messages.id(messageId);
    if (!message) {
      return res.status(404).json({ msg: "Message not found" });
    }

    // Toggle reaction
    const existingReaction = message.reactions.find(
      r => r.user.toString() === userId && r.emoji === emoji
    );

    if (existingReaction) {
      message.reactions = message.reactions.filter(
        r => !(r.user.toString() === userId && r.emoji === emoji)
      );
    } else {
      message.reactions.push({ emoji, user: userId });
    }

    await conversation.save();
    res.json(message);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Get unread DM count for navbar
router.get("/unread/count", auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Find all conversations where user is a participant
    const conversations = await DirectMessage.find({
      participants: userId
    });

    // Count messages from others in last 5 minutes (simpler unread logic)
    const fiveMinAgo = new Date(Date.now() - 300000);
    let unreadCount = 0;
    
    conversations.forEach(conv => {
      conv.messages.forEach(msg => {
        if (msg.sender.toString() !== userId && msg.createdAt > fiveMinAgo) {
          unreadCount++;
        }
      });
    });

    res.json({ count: Math.min(unreadCount, 99) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
