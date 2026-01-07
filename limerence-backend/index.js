require("dotenv").config()
const express = require("express")
const http = require("http")
const socketIo = require("socket.io")
const connectDB = require("./config/db")
const path = require("path")

const app = express()
const server = http.createServer(app)

// Connect to DB
connectDB()

// Middleware
app.use(express.json())
app.use(require("cors")())

// Socket.io Setup
const io = socketIo(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
  }
});
app.set("io", io); // Make available in routes
require("./socket")(io); // Init socket handlers

// Serve uploaded files
app.use("/uploads", express.static("uploads"))

// Routes
app.use("/api/auth", require("./routes/auth"))
app.use("/api/books", require("./routes/books"))
app.use("/api/shelf", require("./routes/shelf"))
app.use("/api/clubs", require("./routes/clubs"))
app.use("/api/users", require("./routes/users"))
app.use("/api/notifications", require("./routes/notifications"))
app.use("/api/dm", require("./routes/dm"))
app.use("/api/onboarding", require("./routes/onboarding"))

const PORT = process.env.PORT || 5000
server.listen(PORT, () => console.log(`Server running on port ${PORT}`))
