const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const User = require("../models/User");

// Available genres for selection
const AVAILABLE_GENRES = [
    "Dark Romance",
    "Sports Romance", 
    "Mafia Romance",
    "Fantasy Romance",
    "Werewolf",
    "High School",
    "College",
    "New Adult",
    "CEO/Billionaire",
    "Enemies to Lovers",
    "Friends to Lovers",
    "Second Chance",
    "Forbidden Love",
    "Slow Burn",
    "Paranormal",
    "Historical Romance",
    "Contemporary",
    "Romantic Comedy",
    "Suspense/Thriller",
    "Age Gap",
    "Forced Proximity",
    "Fake Dating",
    "Arranged Marriage"
];

// @route   GET /api/onboarding/genres
router.get("/genres", (req, res) => {
    res.json({ genres: AVAILABLE_GENRES });
});

// @route   GET /api/onboarding/check-username/:username
// @desc    Check if username is available
router.get("/check-username/:username", async (req, res) => {
    const username = req.params.username.toLowerCase().trim();
    
    if (username.length < 3) {
        return res.json({ available: false, msg: "At least 3 characters" });
    }
    if (username.length > 20) {
        return res.json({ available: false, msg: "Max 20 characters" });
    }
    if (!/^[a-z0-9_]+$/.test(username)) {
        return res.json({ available: false, msg: "Only letters, numbers, underscores" });
    }
    
    try {
        const existing = await User.findOne({ username });
        if (existing) {
            return res.json({ available: false, msg: "Already taken" });
        }
        res.json({ available: true, msg: "Available!" });
    } catch (err) {
        res.status(500).send("Server Error");
    }
});

// @route   GET /api/onboarding/suggested-follows
// @desc    Get top 5 users to follow
router.get("/suggested-follows", auth, async (req, res) => {
    try {
        const users = await User.find({ 
            _id: { $ne: req.user.userId },
            onboardingComplete: true
        })
        .sort({ 'stats.booksRead': -1 })
        .limit(5)
        .select("name username avatar about stats.booksRead followers");
        
        res.json({ 
            users: users.map(u => ({
                id: u._id,
                name: u.name,
                username: u.username,
                avatar: u.avatar,
                about: u.about,
                booksRead: u.stats?.booksRead || 0,
                followersCount: u.followers?.length || 0
            }))
        });
    } catch (err) {
        res.status(500).send("Server Error");
    }
});

// @route   GET /api/onboarding/status
router.get("/status", auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select("onboardingComplete readingGoal preferredGenres username");
        res.json({
            onboardingComplete: user.onboardingComplete || false,
            readingGoal: user.readingGoal || 12,
            preferredGenres: user.preferredGenres || [],
            username: user.username || null
        });
    } catch (err) {
        res.status(500).send("Server Error");
    }
});

// @route   POST /api/onboarding/complete
router.post("/complete", auth, async (req, res) => {
    const { username, readingGoal, monthlyGoal, preferredGenres, followIds } = req.body;
    
    if (!username || username.length < 3) {
        return res.status(400).json({ msg: "Please set a valid username" });
    }
    if (!preferredGenres || preferredGenres.length < 5) {
        return res.status(400).json({ msg: "Please select at least 5 genres" });
    }
    if (!readingGoal || readingGoal < 1) {
        return res.status(400).json({ msg: "Please set a valid reading goal" });
    }
    
    try {
        const existing = await User.findOne({ username: username.toLowerCase(), _id: { $ne: req.user.userId } });
        if (existing) {
            return res.status(400).json({ msg: "Username is already taken" });
        }
        
        const user = await User.findById(req.user.userId);
        
        user.username = username.toLowerCase();
        user.readingGoal = readingGoal;
        user.monthlyGoal = monthlyGoal || Math.ceil(readingGoal / 12);
        user.preferredGenres = preferredGenres;
        user.onboardingComplete = true;
        
        // Handle follows
        if (followIds && followIds.length > 0) {
            for (const followId of followIds) {
                if (!user.following.includes(followId)) {
                    user.following.push(followId);
                }
                await User.findByIdAndUpdate(followId, {
                    $addToSet: { followers: user._id }
                });
            }
        }
        
        await user.save();
        
        res.json({
            msg: "Onboarding complete!",
            user: {
                id: user._id,
                name: user.name,
                username: user.username,
                onboardingComplete: true
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});

// @route   PUT /api/onboarding/update
router.put("/update", auth, async (req, res) => {
    const { readingGoal, monthlyGoal, preferredGenres } = req.body;
    
    try {
        const user = await User.findById(req.user.userId);
        if (readingGoal) user.readingGoal = readingGoal;
        if (monthlyGoal) user.monthlyGoal = monthlyGoal;
        if (preferredGenres && preferredGenres.length >= 5) {
            user.preferredGenres = preferredGenres;
        }
        await user.save();
        res.json({ msg: "Updated", readingGoal: user.readingGoal });
    } catch (err) {
        res.status(500).send("Server Error");
    }
});

module.exports = router;
