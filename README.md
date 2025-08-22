# 🏘️ NeighborLink - Neighborhood Help Platform

A modern, real-time social platform that connects neighbors to help each other with daily tasks, building stronger communities through mutual assistance.

## ✨ Features

### 🆘 Help Request System
- **Request Posts**: Create posts asking for help with tasks
- **Offer Posts**: Share skills and services you can provide
- **Categories**: Organize requests by type (general, moving, cooking, etc.)
- **Location Support**: Add your location for local coordination

### 🤝 Assignment Workflow
- **Claim Requests**: Neighbors can volunteer to help with requests
- **Approval System**: Request owners approve or reject help offers
- **Status Tracking**: Monitor progress from Open → In Progress → Completed
- **One Helper Per Request**: Ensures focused, quality assistance

### 💬 Community Features
- **Real-time Comments**: Discuss and coordinate on posts
- **User Profiles**: Build reputation through your help history
- **Profile Pictures**: Personalize your community presence
- **Search & Filters**: Find relevant requests and offers

### 🔔 Real-time Updates
- **Live Notifications**: Get updates on your requests and assignments
- **Socket.IO Integration**: Real-time communication between users
- **Status Updates**: Instant feedback on assignment progress

### 📱 Modern UI/UX
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Tailwind CSS**: Clean, modern interface
- **Dark/Light Mode**: Comfortable viewing in any lighting
- **Intuitive Navigation**: Easy to find what you need

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB database
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Elias0305Ha/Neighborlink-app.git
   cd Neighborlink-app
   ```

2. **Install server dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Install client dependencies**
   ```bash
   cd ../client
   npm install
   ```

4. **Environment Setup**
   - Create a `.env` file in the server directory
   - Add your MongoDB connection string and JWT secret

5. **Start the application**
   ```bash
   # Terminal 1 - Start server
   cd server
   npm start
   
   # Terminal 2 - Start client
   cd client
   npm start
   ```

## 🏗️ Architecture

### Backend (Node.js + Express)
- **RESTful API**: Clean, organized endpoints
- **MongoDB + Mongoose**: Flexible data modeling
- **JWT Authentication**: Secure user sessions
- **Socket.IO**: Real-time communication
- **Multer**: File upload handling

### Frontend (React)
- **Component-based Architecture**: Reusable, maintainable code
- **React Router**: Smooth navigation between pages
- **State Management**: Efficient data handling
- **Responsive Design**: Mobile-first approach

### Database Models
- **User**: Profile information, authentication
- **Post**: Requests and offers with metadata
- **Assignment**: Help workflow management
- **Comment**: Community discussions

## 🔧 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `GET /api/v1/auth/me` - Get current user

### Posts
- `GET /api/v1/posts` - Get all posts
- `POST /api/v1/posts` - Create new post
- `GET /api/v1/posts/:id` - Get specific post
- `PUT /api/v1/posts/:id` - Update post
- `DELETE /api/v1/posts/:id` - Delete post

### Assignments
- `POST /api/v1/assignments` - Claim a request
- `GET /api/v1/assignments/post/:postId` - Get post assignments
- `PUT /api/v1/assignments/:id/approve` - Approve/reject claim
- `PUT /api/v1/assignments/:id/status` - Update assignment status

### Comments
- `GET /api/v1/comments/post/:postId` - Get post comments
- `POST /api/v1/comments` - Add comment
- `DELETE /api/v1/comments/:id` - Delete comment

## 🎯 Use Cases

### For Requesters
1. **Create a Request**: Post what you need help with
2. **Review Offers**: Choose the best helper for your task
3. **Track Progress**: Monitor your request through completion
4. **Rate & Review**: Provide feedback after completion

### For Helpers
1. **Browse Requests**: Find ways to help your neighbors
2. **Claim Requests**: Offer your assistance
3. **Coordinate**: Communicate with request owners
4. **Build Reputation**: Earn trust through successful help

## 🔒 Security Features

- **JWT Authentication**: Secure user sessions
- **Input Validation**: Prevent malicious data
- **Authorization**: Users can only modify their own content
- **Rate Limiting**: Prevent abuse of the platform

## 🚀 Deployment

### Environment Variables
```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
PORT=5000
```

### Production Build
```bash
# Build the React app
cd client
npm run build

# Start production server
cd ../server
npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with React, Node.js, and MongoDB
- Real-time features powered by Socket.IO
- Styled with Tailwind CSS
- Community-driven development

## 📞 Support

If you have questions or need help:
- Open an issue on GitHub
- Check the documentation
- Review the code examples

---

**Built with ❤️ for stronger neighborhoods** 