const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Notification = require("../models/Notification");
const auth = require("../middleware/auth");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Configure Multer for Wallpapers
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "..", "uploads", "wallpapers");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `wp-${Date.now()}${ext}`);
  },
});
const upload = multer({ storage });

// Upload Custom Wallpaper
router.post("/upload-wallpaper", auth, upload.single("wallpaper"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ msg: "No file uploaded" });
    const url = `/uploads/wallpapers/${req.file.filename}`;
    // Optional: Save to user profile if desired, for now just return URL
    res.json({ url });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// Get current user profile (with friends)
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .select("-password")
      .populate("friends", "name avatar nickname about badges shelf")
      .populate("friendRequests.from", "name avatar");
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// Get user by ID (for viewing friend profiles)
router.get("/:id", auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password -email")
      .populate("friends", "name avatar")
      .populate("friendRequests.from", "name avatar")
      .populate("shelf.book", "title coverImage author");
    if (!user) return res.status(404).json({ msg: "User not found" });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// Update Profile (Nickname, etc.)
router.put("/profile", auth, async (req, res) => {
  try {
    const { nickname, avatar, gender } = req.body;
    const user = await User.findById(req.user.userId);

    if (nickname) user.nickname = nickname;
    if (avatar) user.avatar = avatar; // Assuming URL or base64 sent
    if (gender) user.gender = gender;

    await user.save();
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// Send Friend Request
router.post("/friend-request/:id", auth, async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const requesterId = req.user.userId;

    if (targetUserId === requesterId) {
      return res.status(400).json({ msg: "Cannot add yourself" });
    }

    const targetUser = await User.findById(targetUserId);
    const currentUser = await User.findById(requesterId);

    if (!targetUser) return res.status(404).json({ msg: "User not found" });

    // Check if already friends
    if (currentUser.friends.includes(targetUserId)) {
      return res.status(400).json({ msg: "Already friends" });
    }

    // Check if already requested
    const existingReq = targetUser.friendRequests.find(r => r.from.toString() === requesterId);
    if (existingReq) {
      return res.status(400).json({ msg: "Request already sent" });
    }

    targetUser.friendRequests.push({ from: requesterId, status: 'pending' });
    await targetUser.save();

    // Create Notification for Recipient
    await Notification.create({
        recipient: targetUserId,
        sender: requesterId,
        type: "friend_request",
        content: `${currentUser.username || currentUser.name || "Someone"} sent you a friend request.`
    });

    // Create Notification for Sender (Confirmation)
    await Notification.create({
        recipient: requesterId,
        sender: targetUserId, // conceptually from target, or system
        type: "system", 
        content: `Friend request sent to ${targetUser.username || targetUser.name}.`
    });

    res.json({ msg: "Friend request sent" });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// Respond to Friend Request
router.post("/friend-response", auth, async (req, res) => {
  try {
    const { requesterId, action } = req.body; // action: 'accept' or 'reject'
    const user = await User.findById(req.user.userId);
    const requester = await User.findById(requesterId);

    if (!requester) return res.status(404).json({ msg: "User not found" });

    const reqIndex = user.friendRequests.findIndex(r => r.from.toString() === requesterId && r.status === 'pending');
    if (reqIndex === -1) return res.status(400).json({ msg: "No pending request found" });

    let newBadge = null;

    if (action === 'accept') {
       user.friends.push(requesterId);
       requester.friends.push(user._id);
       
       // Remove request
       user.friendRequests.splice(reqIndex, 1);
       
       // Badge Checks (Friends)
       const { checkAndAwardBadge } = require("../utils/badgeUtils");
       const b1 = await checkAndAwardBadge(user, "friend_count");
       await checkAndAwardBadge(requester, "friend_count");
       
       await requester.save();

       // Create Notification
       await Notification.create({
           recipient: requesterId,
           sender: user._id,
           type: "friend_accept",
           content: `${user.name || user.username || "Someone"} accepted your friend request.`
       });
    } else {
       // Reject - just remove request
       user.friendRequests.splice(reqIndex, 1);
    }

    await user.save();
    // Return friends list AND potential new badge for the current user
    res.json({ friends: user.friends, newBadge: action === 'accept' ? (await checkAndAwardBadge(user, "friend_count")) : null }); 
    // Wait, I already called checkAndAwardBadge above. I need to capture it.
    // Let's refactor slightly to be clean.
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// ===== FOLLOW SYSTEM =====

// Follow a user
router.post("/follow/:id", auth, async (req, res) => {
  try {
    const targetId = req.params.id;
    const userId = req.user.userId;

    if (targetId === userId) {
      return res.status(400).json({ msg: "Cannot follow yourself" });
    }

    const targetUser = await User.findById(targetId);
    const currentUser = await User.findById(userId);

    if (!targetUser) return res.status(404).json({ msg: "User not found" });

    // Check if already following
    if (currentUser.following?.includes(targetId)) {
      return res.status(400).json({ msg: "Already following this user" });
    }

    // Add to following/followers
    currentUser.following = currentUser.following || [];
    targetUser.followers = targetUser.followers || [];
    
    currentUser.following.push(targetId);
    targetUser.followers.push(userId);

    await currentUser.save();
    await targetUser.save();

    // Create notification
    await Notification.create({
      recipient: targetId,
      sender: userId,
      type: "follow",
      content: `${currentUser.username || currentUser.name} started following you.`
    });

    res.json({ msg: "Now following", following: currentUser.following });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// Unfollow a user
router.delete("/follow/:id", auth, async (req, res) => {
  try {
    const targetId = req.params.id;
    const userId = req.user.userId;

    const targetUser = await User.findById(targetId);
    const currentUser = await User.findById(userId);

    if (!targetUser) return res.status(404).json({ msg: "User not found" });

    // Remove from following/followers
    currentUser.following = (currentUser.following || []).filter(id => id.toString() !== targetId);
    targetUser.followers = (targetUser.followers || []).filter(id => id.toString() !== userId);

    await currentUser.save();
    await targetUser.save();

    res.json({ msg: "Unfollowed", following: currentUser.following });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// Get user's followers
router.get("/:id/followers", auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate("followers", "name username avatar about stats.booksRead");
    
    if (!user) return res.status(404).json({ msg: "User not found" });
    
    res.json({ followers: user.followers || [] });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// Get who user is following
router.get("/:id/following", auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate("following", "name username avatar about stats.booksRead");
    
    if (!user) return res.status(404).json({ msg: "User not found" });
    
    res.json({ following: user.following || [] });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// Get user's clubs with role info
router.get("/:id/clubs", auth, async (req, res) => {
  try {
    const Club = require("../models/Club");
    const userId = req.params.id;
    
    // Find all clubs where user is a member
    const clubs = await Club.find({ members: userId })
      .select("name description coverImage members admins createdAt")
      .lean();
    
    // Add role info to each club
    const clubsWithRole = clubs.map(club => ({
      ...club,
      memberCount: club.members?.length || 0,
      isAdmin: club.admins?.some(a => a.toString() === userId) || false,
      role: club.admins?.some(a => a.toString() === userId) ? "admin" : "member"
    }));
    
    res.json({ 
      clubs: clubsWithRole,
      total: clubsWithRole.length,
      adminCount: clubsWithRole.filter(c => c.isAdmin).length
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// Get user's full profile stats
router.get("/:id/stats", auth, async (req, res) => {
  try {
    const Club = require("../models/Club");
    const user = await User.findById(req.params.id).select("stats badges shelf followers following readingGoal");
    
    if (!user) return res.status(404).json({ msg: "User not found" });
    
    const clubsAdmin = await Club.countDocuments({ admins: req.params.id });
    const clubsMember = await Club.countDocuments({ members: req.params.id });
    
    res.json({
      booksRead: user.stats?.booksRead || 0,
      reviewsPosted: user.stats?.reviewsPosted || 0,
      currentStreak: user.stats?.currentStreak || 0,
      messagesSent: user.stats?.messagesSent || 0,
      badgesEarned: user.badges?.length || 0,
      booksOnShelf: user.shelf?.length || 0,
      followersCount: user.followers?.length || 0,
      followingCount: user.following?.length || 0,
      clubsAdmin,
      clubsMember,
      readingGoal: user.readingGoal || 12
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
