require('dotenv').config();
const express = require("express");
const cors = require("cors");
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth'); // Import our auth routes
const postsRoutes = require('./routes/posts'); // Import posts routes
const commentRoutes = require('./routes/comments'); // Import comment routes
const userRoutes = require('./routes/users'); // Import user routes
const assignmentRoutes = require('./routes/assignments'); // Import assignment routes
console.log('Assignment routes loaded:', typeof assignmentRoutes);
const app = express();

// Import Socket.IO
const http = require('http');
const socketIo = require('socket.io');

// Import multer middleware
const multer = require('multer');
const path = require('path');

// Connect to Database
connectDB();

console.log("Starting NeighborLink server...");

app.use(cors());
app.use(express.json());

// Mount assignment routes after database connection
app.use('/api/v1/assignments', assignmentRoutes);

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Make upload middleware available to routes
app.set('upload', upload);

// Mount Routers
app.use('/api/v1/auth', authRoutes); // Use the auth routes for this URL
app.use('/api/v1/posts', postsRoutes); // Use the posts routes for this URL
app.use('/api/v1/comments', commentRoutes); // Use the comments routes for this URL
app.use('/api/v1/users', userRoutes); // Use the user routes for this URL

// Test route for assignments
app.get('/test-assignments', (req, res) => {
  res.json({ message: 'Assignments endpoint test - working!' });
});

app.get("/", (req, res) => {
  console.log("Received request to /");
  res.send("Hello from NeighborLink backend!");
});

const PORT = process.env.PORT || 5000;
console.log(`Attempting to start server on port ${PORT}...`);

// Create HTTP server
const server = http.createServer(app);

// Create Socket.IO server
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000", // Allow React app to connect
    methods: ["GET", "POST"]
  }
});

// Store user connections: userId -> socketId
const userConnections = new Map();

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  
  // Handle user login - store their connection
  socket.on('user-login', (userId) => {
    userConnections.set(userId, socket.id);
    console.log(`User ${userId} connected with socket ${socket.id}`);
  });

  // Handle profile picture updates
  socket.on('profile-picture-updated', (data) => {
    console.log('Profile picture update received from client:', data);
    // Broadcast to all connected clients
    io.emit('profile-picture-updated', data);
    console.log('Profile picture update broadcasted to all clients');
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    // Remove user from connections
    for (const [userId, socketId] of userConnections.entries()) {
      if (socketId === socket.id) {
        userConnections.delete(userId);
        console.log(`User ${userId} disconnected`);
        break;
      }
    }
  });
});

// Make io and userConnections available to other parts of the app
app.set('io', io);
app.set('userConnections', userConnections);

// Make io available to other parts of the app
app.set('io', io);

// Start server with Socket.IO
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Socket.IO server ready for real-time connections`);
}).on('error', (err) => {
  console.error('Server failed to start:', err);
});
