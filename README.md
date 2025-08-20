# NeighborLink App

A full-stack social platform built with React and Node.js that connects neighbors through community posts, requests, and offers.

## 🚀 Features

- **User Authentication**: Secure login/register system with JWT tokens
- **Community Posts**: Create and share posts with your neighborhood
- **Real-time Updates**: Live notifications and updates using Socket.IO
- **Profile Management**: Customize your profile with pictures and bio
- **Comment System**: Engage with community posts through comments
- **Image Uploads**: Share images with your posts and profile
- **Responsive Design**: Modern UI built with Tailwind CSS

## 🛠️ Tech Stack

### Frontend
- React 19
- Tailwind CSS
- React Router DOM
- Socket.IO Client
- React Icons
- React Hot Toast

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- Socket.IO
- JWT Authentication
- Multer for file uploads

## 📁 Project Structure

```
neighborlink-app/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── App.js         # Main app component
│   │   └── index.js       # Entry point
│   ├── package.json       # Frontend dependencies
│   └── tailwind.config.js # Tailwind configuration
├── server/                 # Node.js backend
│   ├── config/            # Database configuration
│   ├── controllers/       # Route controllers
│   ├── middleware/        # Authentication middleware
│   ├── models/            # MongoDB models
│   ├── routes/            # API routes
│   ├── uploads/           # User uploaded files
│   └── index.js           # Server entry point
└── README.md              # This file
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB installed and running
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repository-url>
   cd neighborlink-app
   ```

2. **Install backend dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../client
   npm install
   ```

4. **Set up environment variables**
   Create a `.env` file in the server directory:
   ```env
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   PORT=5000
   ```

5. **Start the backend server**
   ```bash
   cd server
   npm start
   ```

6. **Start the frontend development server**
   ```bash
   cd client
   npm start
   ```

The app will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 🔧 Available Scripts

### Backend (server/)
- `npm start` - Start the production server
- `npm run dev` - Start the development server with nodemon

### Frontend (client/)
- `npm start` - Start the development server
- `npm build` - Build the app for production
- `npm test` - Run tests
- `npm eject` - Eject from Create React App

## 📱 Features in Detail

### Authentication
- User registration and login
- JWT token-based authentication
- Protected routes and middleware

### Posts
- Create posts with title, description, and type (request/offer)
- View all community posts
- Edit and delete your own posts

### Comments
- Add comments to posts
- View all comments on a post
- Real-time comment updates

### User Profiles
- View user profiles
- Update profile pictures
- See user's posts and comments
- Member since information

### Real-time Features
- Live notifications for new posts and comments
- Real-time profile picture updates
- Socket.IO integration for live updates

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built with React and Node.js
- Styled with Tailwind CSS
- Real-time features powered by Socket.IO
- Icons from React Icons
- Toast notifications from React Hot Toast 