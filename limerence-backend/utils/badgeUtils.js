const User = require("../models/User");

// Complete Badge Definitions
const BADGES = [
    // Reading Milestones
    { name: "Bookworm", icon: "📚", description: "Read your first book", type: "read_count", threshold: 1 },
    { name: "Page Turner", icon: "📖", description: "Read 5 books", type: "read_count", threshold: 5 },
    { name: "Bibliophile", icon: "🤓", description: "Read 10 books", type: "read_count", threshold: 10 },
    { name: "Library Dweller", icon: "🏛️", description: "Read 25 books", type: "read_count", threshold: 25 },
    { name: "Book Hoarder", icon: "📔", description: "Read 50 books", type: "read_count", threshold: 50 },
    { name: "Literary Legend", icon: "👑", description: "Read 100 books", type: "read_count", threshold: 100 },
    
    // Genre Specific
    { name: "Hopeless Romantic", icon: "💘", description: "Read 5 Romance books", type: "genre_count", genre: "Romance", threshold: 5 },
    { name: "Heartbreaker", icon: "💔", description: "Read 10 Romance books", type: "genre_count", genre: "Romance", threshold: 10 },
    { name: "Fantasy Explorer", icon: "🐉", description: "Read 5 Fantasy books", type: "genre_count", genre: "Fantasy", threshold: 5 },
    { name: "Magic Wielder", icon: "🪄", description: "Read 10 Fantasy books", type: "genre_count", genre: "Fantasy", threshold: 10 },
    { name: "Detective", icon: "🕵️‍♀️", description: "Read 5 Mystery books", type: "genre_count", genre: "Mystery", threshold: 5 },
    { name: "Thriller Seeker", icon: "🔪", description: "Read 5 Thriller books", type: "genre_count", genre: "Thriller", threshold: 5 },
    { name: "Sci-Fi Voyager", icon: "👽", description: "Read 5 Sci-Fi books", type: "genre_count", genre: "Science Fiction", threshold: 5 },
    { name: "Historical Buff", icon: "⏳", description: "Read 5 Historical Fiction books", type: "genre_count", genre: "Historical Fiction", threshold: 5 },
    { name: "Dark Romance Devotee", icon: "💀", description: "Read 5 Dark Romance books", type: "genre_count", genre: "Dark Romance", threshold: 5 },
    
    // Social & Community
    { name: "Social Butterfly", icon: "🦋", description: "Join 3 Book Clubs", type: "club_count", threshold: 3 },
    { name: "Club Leader", icon: "🗣️", description: "Create a Book Club", type: "manual" }, // Triggered on creation
    { name: "Chatterbox", icon: "💬", description: "Send 100 messages in clubs", type: "message_count", threshold: 100 },
    { name: "Friend Collector", icon: "🤝", description: "Make 10 friends", type: "friend_count", threshold: 10 },
    { name: "Popular", icon: "🌟", description: "Receive 50 friend requests", type: "request_count", threshold: 50 },
    { name: "Top Critic", icon: "✍️", description: "Post 10 Reviews", type: "review_count", threshold: 10 },
    { name: "Review Influencer", icon: "📢", description: "Post 50 Reviews", type: "review_count", threshold: 50 },
    { name: "Sticker Master", icon: "🎨", description: "Send 50 stickers", type: "sticker_count", threshold: 50 },
    { name: "Gossip Queen", icon: "☕", description: "Active in chat for 7 days streak", type: "streak_count", threshold: 7 },
    
    // Misc
    { name: "Night Owl", icon: "🦉", description: "Read a book after midnight", type: "manual" },
    { name: "Early Bird", icon: "☀️", description: "Read a book before 8 AM", type: "manual" },
    { name: "Weekend Warrior", icon: "⚔️", description: "Read a book in 2 days", type: "manual" },
    { name: "Speed Reader", icon: "⚡", description: "Finish a book in one sitting", type: "manual" },
    { name: "Marathoner", icon: "🏃‍♀️", description: "Read for 5 hours continuously", type: "manual" },
    { name: "Limerence Loyal", icon: "💜", description: "Member for 1 year", type: "tenure_count", threshold: 365 },
    { name: "Beta Tester", icon: "🛠️", description: "Joined during beta", type: "manual" }
];

const checkAndAwardBadge = async (user, triggerType, context = {}) => {
    let newBadge = null;
    const { count } = context;

    // Filter potential badges
    const potentialBadges = BADGES.filter(b => b.type === triggerType);

    for (const def of potentialBadges) {
        // Check if already earned
        if (user.badges.some(b => b.name === def.name)) continue;

        let earned = false;

        switch (def.type) {
            case "read_count":
                if (user.stats.booksRead >= def.threshold) earned = true;
                break;
            case "genre_count":
                // Flexible check: use passed count or generic match
                if (context.genre === def.genre && count >= def.threshold) earned = true;
                break;
            case "club_count":
                // Often passed explicitly or checked against user.clubs length
                const clubLen = context.clubCount || (user.clubs ? user.clubs.length : 0);
                if (clubLen >= def.threshold) earned = true;
                break;
             case "message_count":
                if (user.stats.messagesSent >= def.threshold) earned = true;
                break;
             case "sticker_count":
                if (user.stats.stickersSent >= def.threshold) earned = true;
                break;
             case "friend_count":
                 if (user.friends.length >= def.threshold) earned = true;
                 break;
             case "request_count":
                 // Need context or check array
                 const reqLen = context.requestCount || user.friendRequests.length;
                 if (reqLen >= def.threshold) earned = true;
                 break;
             case "review_count":
                 if (user.stats.reviewsPosted >= def.threshold) earned = true;
                 break;
             case "streak_count":
                 if (user.stats.currentStreak >= def.threshold) earned = true;
                 break;
             case "tenure_count":
                 const daysMember = (new Date() - new Date(user.stats.joinedAt || user.createdAt)) / (1000 * 60 * 60 * 24);
                 if (daysMember >= def.threshold) earned = true;
                 break;
             case "manual":
                 if (context.force) earned = true;
                 break;
        }

        if (earned) {
            const badge = {
                name: def.name,
                description: def.description,
                icon: def.icon,
                earnedAt: new Date()
            };
            user.badges.push(badge);
            newBadge = badge; // Return the most recent one
        }
    }

    return newBadge;
};

module.exports = { BADGES, checkAndAwardBadge };
