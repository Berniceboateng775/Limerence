require("dotenv").config()
const express = require("express")
const connectDB = require("./config/db")
const path = require("path")

const app = express()

// Connect to DB
connectDB()

// Middleware
app.use(express.json())
app.use(require("cors")())

// Serve uploaded files
app.use("/uploads", express.static("uploads"))

// Routes
app.use("/api/auth", require("./routes/auth"))
app.use("/api/books", require("./routes/books"))
app.use("/api/shelf", require("./routes/shelf"))
app.use("/api/clubs", require("./routes/clubs"))

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
