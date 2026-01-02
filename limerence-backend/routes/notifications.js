const express = require("express");
const router = express.Router();
const Notification = require("../models/Notification");
const auth = require("../middleware/auth");

// @route   GET /api/notifications
// @desc    Get user's notifications
router.get("/", auth, async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user.userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("sender", "username avatar");
    
    res.json(notifications);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// @route   PUT /api/notifications/:id/read
// @desc    Mark notification as read
router.put("/:id/read", auth, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) return res.status(404).json({ msg: "Notification not found" });

    // Verify ownership
    if (notification.recipient.toString() !== req.user.userId) {
        return res.status(401).json({ msg: "Not authorized" });
    }

    notification.isRead = true;
    await notification.save();
    res.json(notification);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// @route   PUT /api/notifications/read-all
// @desc    Mark all as read
router.put("/read-all", auth, async (req, res) => {
    try {
        await Notification.updateMany(
            { recipient: req.user.userId, isRead: false },
            { $set: { isRead: true } }
        );
        res.json({ msg: "All marked as read" });
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});

module.exports = router;
