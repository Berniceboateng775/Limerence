const mongoose = require("mongoose")

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  avatar: {
    type: String,
    default: "",
  },
  gender: {
    type: String,
    enum: ["Male", "Female", "Other"],
    required: false,
  },
  // Display username (unique, shown in clubs/friends/profiles)
  username: {
    type: String,
    trim: true,
    lowercase: true,
    unique: true,
    sparse: true, // Allows null values while enforcing uniqueness for non-null
    minlength: 3,
    maxlength: 20
  },
  about: {
    type: String,
    default: "Hey there! I'm using Limerence 📚",
    maxlength: 140
  },
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  friendRequests: [
    {
      from: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" },
    },
  ],
  shelf: [
    {
      book: { type: mongoose.Schema.Types.ObjectId, ref: "Book" },
      status: {
        type: String,
        enum: ["reading", "completed", "want_to_read"],
        default: "want_to_read",
      },
      progress: { type: Number, default: 0 }, // Percentage or page number
      addedAt: { type: Date, default: Date.now },
    },
  ],
  date: {
    type: Date,
    default: Date.now,
  },
  badges: [
  ],
  stats: {
    messagesSent: { type: Number, default: 0 },
    reviewsPosted: { type: Number, default: 0 },
    stickersSent: { type: Number, default: 0 },
    booksRead: { type: Number, default: 0 },
    currentStreak: { type: Number, default: 0 },
    lastActiveDate: { type: Date },
    joinedAt: { type: Date, default: Date.now }
  },
  
  // Onboarding Fields
  onboardingComplete: {
    type: Boolean,
    default: false
  },
  readingGoal: {
    type: Number,
    default: 12 // Books per year
  },
  monthlyGoal: {
    type: Number,
    default: 1 // Books per month
  },
  preferredGenres: [{
    type: String
  }],
  
  // Follow System (for Phase 4)
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  
  // Pinned & Favorites (max 5 each)
  pinnedClubs: [{ type: mongoose.Schema.Types.ObjectId, ref: "Club" }],
  favoriteClubs: [{ type: mongoose.Schema.Types.ObjectId, ref: "Club" }],
  pinnedFriends: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  favoriteFriends: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  
  // Bestie Tracking - message counts per friend for Snapchat-style bestie indicator
  friendMessageCounts: [{
    friend: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    count: { type: Number, default: 0 },
    lastMessage: { type: Date }

  }],

  blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
});

module.exports = mongoose.models.User || mongoose.model("User", UserSchema);
