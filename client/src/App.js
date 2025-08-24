import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { io } from 'socket.io-client';
import Register from './Register';
import Login from './Login';
import CreatePost from './CreatePost';
import EditPost from './EditPost';
import PostDetail from './PostDetail';
import UserProfile from './UserProfile';
import MyAssignments from './MyAssignments';
import Chats from './Chats';
import './App.css';
import NavigationHeader from './components/NavigationHeader';

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showLogin, setShowLogin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [socket, setSocket] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  // Fetch user info from backend using token
  const fetchUserInfo = async (token) => {
    try {
      const response = await fetch('http://localhost:5000/api/v1/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const result = await response.json();
      if (result.success) {
        setUser(result.data);
        console.log('Fetched user:', result.data);
      } else {
        setUser(null);
      }
    } catch (err) {
      setUser(null);
    }
  };

  // Check for token on app load
  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
    if (token) {
      fetchUserInfo(token);
    }
  }, []);

  // Set up Socket.IO connection
  useEffect(() => {
    if (isLoggedIn) {
      // Connect to Socket.IO server
      const newSocket = io('http://localhost:5000');
      
      // Handle connection events
      newSocket.on('connect', () => {
        console.log('Connected to Socket.IO server');
        
        // Send user ID to server so it can track who's connected
        if (user && user._id) {
          newSocket.emit('user-login', user._id);
        }
      });
      
      newSocket.on('disconnect', () => {
        console.log('Disconnected from Socket.IO server');
      });
      
      // Store socket in state
      setSocket(newSocket);
      
      // Cleanup on unmount
      return () => {
        newSocket.close();
      };
    }
  }, [isLoggedIn]);

  // Listen for login (token set in localStorage)
  useEffect(() => {
    const handleStorage = () => {
      const token = localStorage.getItem('token');
      setIsLoggedIn(!!token);
      if (token) {
        fetchUserInfo(token);
      } else {
        setUser(null);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Fetch posts when logged in
  const fetchPosts = useCallback(() => {
    if (isLoggedIn) {
      fetch('http://localhost:5000/api/v1/posts')
        .then(res => res.json())
        .then(result => {
          if (result.success) setPosts(result.data);
          else setPosts([]);
        })
        .catch(() => setPosts([]));
    }
  }, [isLoggedIn]);

  // Refresh posts when returning to main page
  useEffect(() => {
    if (isLoggedIn && location.pathname === '/') {
      console.log('Refreshing posts when returning to main page');
      fetchPosts();
    }
  }, [isLoggedIn, location.pathname, fetchPosts]);

  // Filter and sort posts
  const filteredPosts = useMemo(() => {
    let filtered = [...posts];
    
    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(post => 
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Category filter
    if (selectedCategory) {
      filtered = filtered.filter(post => post.category === selectedCategory);
    }
    
    // Type filter
    if (selectedType) {
      filtered = filtered.filter(post => post.type === selectedType);
    }
    

    
    // Sort
    if (sortBy === 'newest') {
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === 'oldest') {
      filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    }
    
    return filtered;
  }, [posts, searchQuery, selectedCategory, selectedType, sortBy, user]);

  useEffect(() => {
    fetchPosts();
  }, [isLoggedIn]);

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setUser(null);
  };

  // After login, fetch user info
  const handleLogin = () => {
    setIsLoggedIn(true);
    const token = localStorage.getItem('token');
    if (token) fetchUserInfo(token);
  };



  // Send user ID to Socket.IO when user info is fetched
  useEffect(() => {
    if (socket && user && user._id) {
      socket.emit('user-login', user._id);
    }
  }, [socket, user]);

  // Listen for profile picture updates
  useEffect(() => {
    if (socket) {
      console.log('Setting up profile picture listener with socket:', socket.id);
      socket.on('profile-picture-updated', (data) => {
        console.log('Profile picture updated received:', data);
        // Update posts with new profile picture
        setPosts(prevPosts => {
          console.log('Updating posts for profile picture change');
          return prevPosts.map(post => {
            if (post.createdBy._id === data.userId) {
              console.log('Updating post:', post._id, 'with new profile picture');
              return {
                ...post,
                createdBy: {
                  ...post.createdBy,
                  profilePicture: data.profilePicture
                }
              };
            }
            return post;
          });
        });
      });

      // Handle new notifications
      socket.on('new-notification', (notification) => {
        console.log('New notification received:', notification);
        // You can add notification handling here if needed
        // For now, we'll just log it
      });

      return () => {
        socket.off('profile-picture-updated');
      };
    } else {
      console.log('No socket available for profile picture listener');
    }
  }, [socket]);

  // Handle post creation
  const handlePostCreated = () => {
    fetchPosts(); // Refresh posts list
    setShowCreatePost(false); // Hide the form
  };

  // Handle post update
  const handlePostUpdated = () => {
    fetchPosts(); // Refresh posts list
    setEditingPost(null); // Hide the edit form
  };

  // Handle canceling edit
  const handleCancelEdit = () => {
    setEditingPost(null); // Hide the edit form
  };

  // Handle edit click
  const handleEditClick = (post) => {
    setEditingPost(post); // Set the post we want to edit
  };

  // Handle delete click
  const handleDeleteClick = async (post) => {
    // Show confirmation dialog
    if (window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/v1/posts/${post._id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const result = await response.json();

        if (result.success) {
          // Refresh posts list
          fetchPosts();
          alert('Post deleted successfully!');
        } else {
          alert(result.message || 'Failed to delete post');
        }
      } catch (err) {
        alert('Network error. Please try again.');
      }
    }
  };

  if (isLoggedIn) {
    return (
      <Routes>
        {/* Main Feed Route */}
        <Route path="/" element={
          <div className="min-h-screen relative overflow-hidden">
            {/* Beautiful Background */}
            <div className="absolute inset-0 z-0">
              {/* Gradient Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"></div>
              
              {/* Animated Background Elements */}
              <div className="absolute inset-0">
                <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
                <div className="absolute top-40 right-20 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse" style={{animationDelay: '2s'}}></div>
                <div className="absolute bottom-20 left-1/4 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse" style={{animationDelay: '4s'}}></div>
              </div>
              
              {/* Subtle Pattern Overlay */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0" style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                  backgroundSize: '60px 60px'
                }}></div>
              </div>
            </div>

            <NavigationHeader user={user} onLogout={handleLogout} socket={socket} />

            {/* Main Content with Glassmorphism */}
            <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
              
              {/* Hero Section */}
              <div className="text-center mb-12">
                <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                  Welcome to <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">NeighborLink</span>
                </h1>
                <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
                  Connect with your neighbors, offer help, and build a stronger community together. 
                  Every act of kindness makes our neighborhood a better place.
                </p>
              </div>

              {/* Create Post Section with Glassmorphism */}
              <div className="mb-12 flex justify-center">
                <div className="backdrop-blur-md bg-white/70 rounded-2xl p-8 shadow-2xl border border-white/20">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to Make a Difference?</h2>
                    <p className="text-gray-600 mb-6 text-lg">Create a post to request help or offer your skills to neighbors</p>
                    
                    {!showCreatePost && !editingPost ? (
                      <button
                        onClick={() => setShowCreatePost(true)}
                        className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                      >
                        <span className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                        <span className="relative flex items-center">
                          <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Create New Post
                        </span>
                      </button>
                    ) : showCreatePost ? (
                      <div className="w-full max-w-md">
                        <CreatePost onPostCreated={handlePostCreated} />
                        <div className="text-center mt-4">
                          <button
                            onClick={() => setShowCreatePost(false)}
                            className="text-gray-500 hover:text-gray-700 font-medium transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : editingPost ? (
                      <div className="w-full max-w-md">
                        <EditPost 
                          post={editingPost}
                          onPostUpdated={handlePostUpdated}
                          onCancel={handleCancelEdit}
                        />
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Search and Filter Section with Glassmorphism */}
              <div className="w-full mb-8">
                <div className="backdrop-blur-md bg-white/70 rounded-2xl p-6 shadow-2xl border border-white/20">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Find Help in Your Neighborhood</h2>
                  
                  {(selectedCategory || selectedType || searchQuery) && (
                    <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl">
                      <p className="text-sm text-blue-800 text-center">
                        <span className="font-semibold">Active filters:</span>
                        {searchQuery && <span className="ml-2">Search: "{searchQuery}"</span>}
                        {selectedCategory && <span className="ml-2">Category: {selectedCategory}</span>}
                        {selectedType && <span className="ml-2">Type: {selectedType}</span>}
                      </p>
                    </div>
                  )}
                  
                  {/* Search Bar */}
                  <div className="mb-6">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search posts (e.g., cleaning, garden, help)..."
                        className="w-full p-4 pl-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg transition-all duration-300"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>
                  
                  {/* Filters */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Category Filter */}
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                    >
                      <option value="">All Categories</option>
                      <option value="household">Household</option>
                      <option value="education">Education</option>
                      <option value="technology">Technology</option>
                      <option value="health">Health</option>
                      <option value="transportation">Transportation</option>
                      <option value="other">Other</option>
                    </select>
                    
                    {/* Type Filter */}
                    <select
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value)}
                      className="p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                    >
                      <option value="">All Types</option>
                      <option value="request">Requests Only</option>
                      <option value="offer">Offers Only</option>
                    </select>
                    
                    {/* Sort Filter */}
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                      <option value="mostCommented">Most Commented</option>
                    </select>
                    
                    {/* Clear Filters Button */}
                    <button
                      onClick={() => {
                        setSelectedCategory('');
                        setSelectedType('');
                        setSearchQuery('');
                        setSortBy('newest');
                      }}
                      className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>
              </div>

              {/* Posts List with Beautiful Design */}
              <div className="w-full">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-3xl font-bold text-gray-900">Community Posts</h3>
                  <span className="text-lg text-gray-600 bg-white/70 px-4 py-2 rounded-xl backdrop-blur-md">
                    {filteredPosts.length} of {posts.length} posts
                  </span>
                </div>
                
                {filteredPosts.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="backdrop-blur-md bg-white/70 rounded-2xl p-12 shadow-2xl border border-white/20">
                      <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <p className="text-xl text-gray-700 mb-2">
                        {posts.length === 0 ? 'No posts yet.' : 'No posts match your search.'}
                      </p>
                      <p className="text-gray-500">
                        {posts.length === 0 ? 'Be the first to create a post!' : 'Try adjusting your search or filters.'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {filteredPosts.map(post => (
                      <div 
                        key={post._id} 
                        className="group backdrop-blur-md bg-white/70 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:-translate-y-2 border border-white/20 overflow-hidden" 
                        onClick={() => navigate(`/post/${post._id}`)}
                      >
                        {/* Post Image */}
                        {post.image && (
                          <div className="relative overflow-hidden">
                            <img 
                              src={`http://localhost:5000${post.image}`} 
                              alt="Post" 
                              className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                            <div className="absolute top-4 right-4 flex flex-col space-y-2">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                post.type === 'request' 
                                  ? 'bg-orange-500 text-white shadow-lg' 
                                  : 'bg-green-500 text-white shadow-lg'
                              }`}>
                                {post.type === 'request' ? 'Request' : 'Offer'}
                              </span>
                              {post.type === 'request' && post.status && (
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                  post.status === 'open' ? 'bg-green-500 text-white' :
                                  post.status === 'in_progress' ? 'bg-blue-500 text-white' :
                                  post.status === 'completed' ? 'bg-gray-500 text-white' :
                                  'bg-red-500 text-white'
                                } shadow-lg`}>
                                  {post.status === 'open' ? 'Open' :
                                   post.status === 'in_progress' ? 'In Progress' :
                                   post.status === 'completed' ? 'Completed' :
                                   'Cancelled'}
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Post Content */}
                        <div className="p-6">
                          {/* Post Header with Profile Picture */}
                          <div className="flex items-start space-x-4 mb-4">
                            <div className="flex-shrink-0">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center overflow-hidden ring-2 ring-white/50">
                                {post.createdBy?.profilePicture ? (
                                  <img 
                                    src={`http://localhost:5000${post.createdBy.profilePicture}`} 
                                    alt={post.createdBy.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="text-lg text-white font-bold">
                                    {post.createdBy?.name?.charAt(0).toUpperCase() || 'U'}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-xl text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                                {post.title}
                              </h4>
                              <div className="flex items-center text-sm text-gray-500">
                                <span 
                                  className="text-blue-600 hover:text-blue-800 cursor-pointer font-medium transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/user/${post.createdBy._id}`);
                                  }}
                                >
                                  {post.createdBy?.name || 'Unknown'}
                                </span>
                                <span className="mx-2">•</span>
                                <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>

                          {/* Post Description */}
                          <p className="text-gray-700 mb-6 line-clamp-3 leading-relaxed">{post.description}</p>
                          
                          {/* Post Details */}
                          <div className="space-y-3 text-sm">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-gray-600">Category:</span>
                              <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full capitalize font-medium">
                                {post.category}
                              </span>
                            </div>
                            {post.location && (
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-gray-600">Location:</span>
                                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                                  {post.location}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        } />

        {/* Individual Post Route */}
        <Route path="/post/:postId" element={<PostDetail socket={socket} currentUserId={user?._id} user={user} />} />

        {/* User Profile Route */}
        <Route path="/user/:userId" element={<UserProfile currentUserId={user?._id} user={user} socket={socket} />} />

        {/* My Assignments Route */}
        <Route path="/my-assignments" element={
          <div className="min-h-screen bg-gray-100">
            <NavigationHeader user={user} onLogout={handleLogout} socket={socket} />
            <MyAssignments user={user} socket={socket} />
          </div>
        } />

        {/* Chats Route */}
        <Route path="/chats" element={
          <div className="min-h-screen bg-gray-100">
            <NavigationHeader user={user} onLogout={handleLogout} socket={socket} />
            <Chats user={user} socket={socket} />
          </div>
        } />

        {/* Create Post Route */}
        <Route path="/create-post" element={
          <div className="min-h-screen relative overflow-hidden">
            {/* Beautiful Background */}
            <div className="absolute inset-0 z-0">
              {/* Gradient Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"></div>
              
              {/* Animated Background Elements */}
              <div className="absolute inset-0">
                <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
                <div className="absolute top-40 right-20 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse" style={{animationDelay: '2s'}}></div>
                <div className="absolute bottom-20 left-1/4 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse" style={{animationDelay: '4s'}}></div>
              </div>
              
              {/* Subtle Pattern Overlay */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0" style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                  backgroundSize: '60px 60px'
                }}></div>
              </div>
            </div>

            <NavigationHeader user={user} onLogout={handleLogout} socket={socket} />

            {/* Main Content with Glassmorphism */}
            <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
              {/* Hero Section */}
              <div className="text-center mb-12">
                <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                  Create Your <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Post</span>
                </h1>
                <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
                  Share what you need or what you can offer to your neighbors. 
                  Every post helps build a stronger, more connected community.
                </p>
              </div>

              {/* Create Post Form */}
              <div className="flex justify-center">
                <CreatePost onPostCreated={() => navigate('/')} />
              </div>
            </div>
          </div>
        } />

        {/* Edit Post Route */}
        <Route path="/edit/:postId" element={<EditPost post={editingPost} onPostUpdated={handlePostUpdated} onCancel={() => navigate('/')} />} />
        
        {/* Community Route */}
        <Route path="/community" element={
          <div className="min-h-screen bg-gray-100">
            <NavigationHeader user={user} onLogout={handleLogout} socket={socket} />
            <div className="max-w-6xl mx-auto px-4 py-8">
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Community</h1>
                <p className="text-lg text-gray-600 mb-6">Connect with your neighbors and build a stronger community together.</p>
                <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                  <div className="bg-blue-50 p-6 rounded-lg">
                    <h3 className="text-xl font-semibold text-blue-900 mb-2">Neighborhood Events</h3>
                    <p className="text-blue-700">Stay updated on local events, meetings, and activities in your area.</p>
                  </div>
                  <div className="bg-green-50 p-6 rounded-lg">
                    <h3 className="text-xl font-semibold text-green-900 mb-2">Local Resources</h3>
                    <p className="text-green-700">Discover helpful resources, services, and information about your neighborhood.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        } />
        
        {/* About Route */}
        <Route path="/about" element={
          <div className="min-h-screen bg-gray-100">
            <NavigationHeader user={user} onLogout={handleLogout} socket={socket} />
            <div className="max-w-6xl mx-auto px-4 py-8">
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">About NeighborLink</h1>
                <p className="text-lg text-gray-600 mb-6">Building stronger neighborhoods through mutual support and community connection.</p>
                <div className="max-w-3xl mx-auto text-left space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Our Mission</h3>
                    <p className="text-gray-600">To create a platform where neighbors can easily help each other, share resources, and build meaningful connections that strengthen our communities.</p>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">How It Works</h3>
                    <p className="text-gray-600">Post requests for help or offer your skills to neighbors. Connect, collaborate, and make your neighborhood a better place to live.</p>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Safety & Trust</h3>
                    <p className="text-gray-600">We prioritize community safety and trust. All users are verified members of the neighborhood, creating a secure environment for mutual support.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        } />
      </Routes>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
      <div className="mb-4">
        <button
          className={`px-4 py-2 rounded-l ${!showLogin ? 'bg-blue-600 text-white' : 'bg-white text-blue-600 border'}`}
          onClick={() => setShowLogin(false)}
        >
          Register
        </button>
        <button
          className={`px-4 py-2 rounded-r ${showLogin ? 'bg-blue-600 text-white' : 'bg-white text-blue-600 border'}`}
          onClick={() => setShowLogin(true)}
        >
          Login
        </button>
      </div>
      {showLogin ? <Login onLogin={handleLogin} /> : <Register onRegistered={() => setShowLogin(true)} />}
    </div>
  );
}

export default App;
