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

    const convObj = conversation.toObject();
    convObj.messages = convObj.messages.filter(m => 
      !m.deletedBy || !m.deletedBy.some(id => id.toString() === userId)
    );
    res.json(convObj);
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
    const { content, attachmentType, replyToId, replyToContent, replyToUsername, isForwarded, forwardedFrom } = req.body;
    
    // Check block status
    const receiver = await User.findById(friendId);
    if (receiver.blockedUsers && receiver.blockedUsers.includes(userId)) {
        return res.status(403).json({ msg: "You have been blocked by this user" });
    }
    const sender = await User.findById(userId);
    if (sender.blockedUsers && sender.blockedUsers.includes(friendId)) {
        return res.status(403).json({ msg: "Unblock this user to send messages" });
    }

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
      attachment: req.file ? `/uploads/dm/${req.file.filename}` : (
        typeof req.body.attachment === 'object' && req.body.attachment !== null && req.body.attachment.url 
          ? req.body.attachment.url 
          : (req.body.attachment || "")
      ),
      attachmentType: attachmentType || "none",
      isForwarded: !!isForwarded,
      forwardedFrom: forwardedFrom || null,
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

    // Update friendMessageCounts for both users (for bestie tracking)
    const updateMessageCount = async (userId, friendId) => {
      const user = await User.findById(userId);
      if (!user) return;
      
      const existingEntry = user.friendMessageCounts?.find(
        e => e.friend?.toString() === friendId
      );
      
      if (existingEntry) {
        existingEntry.count += 1;
        existingEntry.lastMessage = new Date();
      } else {
        if (!user.friendMessageCounts) user.friendMessageCounts = [];
        user.friendMessageCounts.push({
          friend: friendId,
          count: 1,
          lastMessage: new Date()
        });
      }
      await user.save();
    };

    // Update for sender
    await updateMessageCount(userId, friendId);
    // Update for receiver too (so they also track this friendship)
    await updateMessageCount(friendId, userId);

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
      // Find user's last read time for this conversation
      const userReadInfo = conv.lastReadBy?.find(r => r.user.toString() === userId);
      const lastReadAt = userReadInfo ? new Date(userReadInfo.lastReadAt).getTime() : 0;

      conv.messages.forEach(msg => {
        const msgTime = new Date(msg.createdAt).getTime();
        // Not my message AND newer than my last read time
        if (msg.sender.toString() !== userId && msgTime > lastReadAt) {
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

// Mark conversation as read
router.post("/:friendId/read", auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const friendId = req.params.friendId;

    const conversation = await DirectMessage.findOne({
      participants: { $all: [userId, friendId] }
    });

    if (!conversation) {
      return res.status(404).json({ msg: "Conversation not found" });
    }

    // Mark all messages from friend as read
    let updated = false;
    conversation.messages.forEach(msg => {
      if (msg.sender.toString() === friendId && !msg.isRead) {
        msg.isRead = true;
        updated = true;
      }
    });

    // Update or add read entry
    const readIndex = conversation.lastReadBy?.findIndex(r => r.user.toString() === userId);
    if (readIndex > -1) {
      conversation.lastReadBy[readIndex].lastReadAt = Date.now();
    } else {
      if (!conversation.lastReadBy) conversation.lastReadBy = [];
      conversation.lastReadBy.push({ user: userId, lastReadAt: Date.now() });
    }

    await conversation.save();
    res.json({ success: true, updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Mark messages as read for a specific friend
router.post("/:friendId/read", auth, async (req, res) => {
  try {
    const friendId = req.params.friendId;
    const userId = req.user.userId;

    // Atomic update: Set user's lastReadAt to now
    // If entry exists, update it. If not, add it.
    await DirectMessage.updateOne(
      { participants: { $all: [userId, friendId] } },
      { 
        $set: { "lastReadBy.$[elem].lastReadAt": new Date() }
      },
      { 
        arrayFilters: [ { "elem.user": userId } ]
      }
    );
    
    // If the above didn't modify anything (user not in array), push it
    // (This is a simplified "upsert" for array elements)
    await DirectMessage.updateOne(
      { 
        participants: { $all: [userId, friendId] },
        "lastReadBy.user": { $ne: userId }
      },
      {
        $push: { lastReadBy: { user: userId, lastReadAt: new Date() } }
      }
    );

    res.json({ msg: "Marked as read" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Delete Message
router.delete("/:friendId/message/:msgId", auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { friendId, msgId } = req.params;
    const { mode } = req.body; // 'me' or 'everyone'

    const conversation = await DirectMessage.findOne({
      participants: { $all: [userId, friendId] }
    });

    if (!conversation) return res.status(404).json({ msg: "Conversation not found" });

    const msg = conversation.messages.id(msgId);
    if (!msg) return res.status(404).json({ msg: "Message not found" });

    if (mode === 'everyone') {
      if (msg.sender.toString() !== userId) {
        return res.status(401).json({ msg: "Unauthorized" });
      }
      // Remove message from array
      conversation.messages.pull(msgId);
    } else {
      // Delete for me
      if (!msg.deletedBy.some(id => id.toString() === userId)) {
        msg.deletedBy.push(userId);
      }
    }

    await conversation.save();
    
    // Return updated filtered messages
    const convObj = conversation.toObject();
    const visibleMessages = convObj.messages.filter(m => 
      !m.deletedBy || !m.deletedBy.some(id => id.toString() === userId)
    );
    res.json(visibleMessages);
    
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});



// Delete entire conversation
router.delete("/:friendId", auth, async (req, res) => {
    try {
        const userId = req.user.userId;
        const friendId = req.params.friendId;

        // For MVP: Delete complete document if both agree? No, traditionally just clear messages.
        // We'll use the deletedBy approach for all messages?
        // Or simpler: Delete the document if it's 1-on-1 and we want to wipe it.
        // User asked to "Delete Chat".
        
        await DirectMessage.deleteMany({
            participants: { $all: [userId, friendId] }
        });
        
        res.json({ msg: "Chat deleted" });
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});

// Pin/Unpin a message
router.post("/:friendId/message/:messageId/pin", auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { friendId, messageId } = req.params;

    const conversation = await DirectMessage.findOne({
      participants: { $all: [userId, friendId] }
    });

    if (!conversation) {
      return res.status(404).json({ msg: "Conversation not found" });
    }

    const msg = conversation.messages.id(messageId);
    if (!msg) {
      return res.status(404).json({ msg: "Message not found" });
    }

    // Toggle pinned on the message itself
    msg.pinned = !msg.pinned;
    
    // Also update conversation.pinnedMessage for backward compatibility
    if (msg.pinned) {
      conversation.pinnedMessage = messageId;
    } else {
      conversation.pinnedMessage = null;
    }

    await conversation.save();
    
    // Return updated messages
    res.json(conversation.messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Forward a message to another friend
router.post("/:friendId/message/:messageId/forward", auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { friendId, messageId } = req.params;
    const { targetFriendIds } = req.body; // Array of friend IDs to forward to

    // Get original conversation and message
    const origConversation = await DirectMessage.findOne({
      participants: { $all: [userId, friendId] }
    });

    if (!origConversation) {
      return res.status(404).json({ msg: "Conversation not found" });
    }

    const originalMsg = origConversation.messages.id(messageId);
    if (!originalMsg) {
      return res.status(404).json({ msg: "Message not found" });
    }

    const user = await require("../models/User").findById(userId);
    const forwardedCount = [];

    // Forward to each target
    for (const targetId of targetFriendIds) {
      let targetConversation = await DirectMessage.findOne({
        participants: { $all: [userId, targetId] }
      });

      if (!targetConversation) {
        targetConversation = new DirectMessage({ 
          participants: [userId, targetId], 
          messages: [] 
        });
      }

      const newMessage = {
        sender: userId,
        content: originalMsg.content,
        attachment: originalMsg.attachment,
        attachmentType: originalMsg.attachmentType,
        isForwarded: true,
        forwardedFrom: originalMsg.sender
      };

      targetConversation.messages.push(newMessage);
      targetConversation.updatedAt = new Date();
      await targetConversation.save();
      forwardedCount.push(targetId);
    }

    res.json({ forwardedTo: forwardedCount.length, targetIds: forwardedCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
