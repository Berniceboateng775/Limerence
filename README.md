# 💜 Limerence

> *The state of being infatuated with another person* – now applied to **books** 📚✨

A full-featured social reading platform for romance book lovers.

---

## 📖 What is Limerence?

**Limerence** is a social reading app for book lovers who want more than just a reading list. It's where you:

- 📚 **Discover** thousands of romance books across genres like Dark Romance, Mafia, Sports, Fantasy & more
- 💬 **Join Book Clubs** and chat with fellow readers in real-time
- 👯‍♀️ **Make Friends** with readers who share your taste
- 🏆 **Earn Badges** as you read and engage with the community
- 🎨 **Customize** your reading experience with themes & chat wallpapers
- 📊 **Track** your reading journey on your personal bookshelf
- 💌 **Direct Message** your friends privately
- 🔔 **Get Notifications** for friend requests, club messages & more

---

## ✨ Features

### 📱 Core Features

| Feature | Description |
|---------|-------------|
| 🏠 **Home** | Netflix-style book carousels personalized to your preferred genres |
| 📖 **Book Details** | View covers, ratings, reviews, moods & add to shelf |
| 📚 **My Library** | Track reading status (Want to Read, Reading, Completed) |
| 🎯 **Moods** | Find books by vibe – "Enemies to Lovers", "Slow Burn", "Morally Grey" etc. |
| 🔍 **Search** | Search books across Hardcover API with Google Books fallback |

### 👥 Social Features

| Feature | Description |
|---------|-------------|
| 💬 **Book Clubs** | WhatsApp-style group chats with multimedia support |
| 👤 **Profiles** | Customize avatar, bio, view badges & reading stats |
| 👯 **Friends** | Send/accept friend requests, view friends' shelves |
| 💌 **Direct Messages** | Private 1-on-1 messaging with friends |
| 🔔 **Notifications** | Real-time alerts for social interactions |
| 👀 **Network** | Discover users, follow/unfollow, view following/followers |

### 💬 Club Features

| Feature | Description |
|---------|-------------|
| 🎨 **Custom Wallpapers** | Set per-club chat backgrounds |
| 📎 **Attachments** | Share images, files, voice notes, locations |
| 📊 **Polls** | Create polls for group decisions |
| 😀 **Reactions** | React to messages with emojis |
| ↩️ **Reply** | Reply to specific messages |
| 👑 **Admin Promotion** | Club admins can promote members to admin |
| 🚫 **Member Management** | Kick members, ban users from clubs |
| 🔗 **Shareable Links** | Generate invite links for clubs |

### 🏆 Gamification

| Feature | Description |
|---------|-------------|
| 📖 **Reading Badges** | Bookworm, Page Turner, Bibliophile, Literary Legend |
| 🎭 **Genre Badges** | Hopeless Romantic, Fantasy Explorer, Detective |
| 👥 **Social Badges** | Social Butterfly, Club Leader |
| 📊 **Stats Tracking** | Books read, reading streaks, genre breakdown |

### 🎨 Customization

| Feature | Description |
|---------|-------------|
| 🌙 **Dark Mode** | System-synced or manual toggle |
| 🎨 **Chat Wallpapers** | Multiple presets + custom upload |
| 👤 **Profile Customization** | Avatar upload, about status, gender |
| 📋 **Onboarding** | Genre preference selection on signup |

---

## 🚀 Tech Stack

**Frontend:**
- React 18
- Tailwind CSS
- Axios
- React Router v6
- Context API (Auth, Theme)

**Backend:**
- Node.js + Express
- MongoDB + Mongoose
- JWT Authentication
- Multer (file uploads)

**APIs:**
- Hardcover API (primary book data)
- Google Books API (fallback)
- OpenLibrary API (genre browsing)

---

## 📁 Project Structure

```
Limerence/
├── limerence-frontend/
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── context/        # Auth & Theme contexts
│   │   ├── pages/          # Route pages
│   │   └── data/           # Static data
│   └── public/
│
├── limerence-backend/
│   ├── models/             # Mongoose schemas
│   ├── routes/             # API endpoints
│   ├── middleware/         # Auth middleware
│   ├── services/           # External API services
│   ├── utils/              # Helper utilities
│   └── uploads/            # User uploaded files
│
└── README.md
```

---

## 🎮 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### Installation

```bash
# Clone the repo
git clone https://github.com/yourusername/limerence.git

# Backend setup
cd limerence-backend
npm install
# Create .env file with:
# MONGODB_URI=your_mongodb_uri
# JWT_SECRET=your_secret
# HARDCOVER_API_KEY=your_key (optional)
npm run dev

# Frontend setup (new terminal)
cd limerence-frontend
npm install
npm start
```

### Environment Variables

**Backend (.env):**
```
MONGODB_URI=mongodb://localhost:27017/limerence
JWT_SECRET=your_jwt_secret_here
HARDCOVER_API_KEY=optional_for_book_search
```

---

## 🛣️ API Routes

### Auth
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users/:id` - Get user profile
- `GET /api/users/:id/following` - Get user's following
- `POST /api/users/:id/follow` - Follow user

### Clubs
- `GET /api/clubs` - Get all clubs
- `GET /api/clubs/:id` - Get single club
- `POST /api/clubs` - Create club
- `POST /api/clubs/:id/join` - Join club
- `POST /api/clubs/:id/make-admin` - Promote member to admin

### Shelf
- `GET /api/shelf` - Get user's shelf
- `POST /api/shelf/add` - Add book to shelf

### DMs
- `GET /api/dm` - Get all conversations
- `POST /api/dm/:userId` - Send message

---

## 💕 Made for Book Lovers

Whether you're obsessed with morally grey villains, crying over sports romances, or debating which trope is supreme – **Limerence** is your reading home.

*Happy Reading!* 📖💜

---

## 📄 License

MIT © 2024 Limerence
