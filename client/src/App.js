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
          <div className="min-h-screen bg-gray-100">
            <NavigationHeader user={user} onLogout={handleLogout} />

            {/* Main Content */}
            <div className="max-w-6xl mx-auto px-4 py-8">
              

                        {/* Create Post Section */}
            <div className="mb-8 flex justify-center">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Need Help or Want to Help?</h2>
                <p className="text-gray-600 mb-6">Create a post to request help or offer your skills to neighbors</p>
                
                {!showCreatePost && !editingPost ? (
                  <button
                    onClick={() => setShowCreatePost(true)}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create New Post
                  </button>
                ) : showCreatePost ? (
                  <div className="w-full max-w-md">
                    <CreatePost onPostCreated={handlePostCreated} />
                    <div className="text-center mt-4">
                      <button
                        onClick={() => setShowCreatePost(false)}
                        className="text-gray-500 hover:text-gray-700"
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

                        {/* Search and Filter Section */}
          <div className="w-full mb-6">
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Find Help in Your Neighborhood</h2>
              {(selectedCategory || selectedType || searchQuery) && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <span className="font-medium">Active filters:</span>
                    {searchQuery && <span className="ml-2">Search: "{searchQuery}"</span>}
                    {selectedCategory && <span className="ml-2">Category: {selectedCategory}</span>}
                    {selectedType && <span className="ml-2">Type: {selectedType}</span>}
                  </p>
                </div>
              )}
              {/* Search Bar */}
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search posts (e.g., cleaning, garden, help)..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Category Filter */}
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Types</option>
                  <option value="request">Requests Only</option>
                  <option value="offer">Offers Only</option>
                </select>
                
                {/* Sort Filter */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

          {/* Posts List */}
          <div className="w-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">Community Posts</h3>
              <span className="text-gray-600">
                {filteredPosts.length} of {posts.length} posts
              </span>
            </div>
                            {filteredPosts.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <p className="text-lg">
                  {posts.length === 0 ? 'No posts yet.' : 'No posts match your search.'}
                </p>
                <p className="text-sm mt-2">
                  {posts.length === 0 ? 'Be the first to create a post!' : 'Try adjusting your search or filters.'}
                </p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredPosts.map(post => (
                      <div key={post._id} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(`/post/${post._id}`)}>
                        {/* Post Header with Profile Picture */}
                        <div className="flex items-start space-x-3 mb-3">
                          <div className="flex-shrink-0">
                                                      <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
                            {post.createdBy?.profilePicture ? (
                              <img 
                                src={`http://localhost:5000${post.createdBy.profilePicture}`} 
                                alt={post.createdBy.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="text-sm text-gray-600 font-bold">
                                {post.createdBy?.name?.charAt(0).toUpperCase() || 'U'}
                              </div>
                            )}
                          </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <h4 className="font-bold text-lg text-gray-800">{post.title}</h4>
                              <div className="flex flex-col items-end space-y-1">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  post.type === 'request' 
                                    ? 'bg-orange-100 text-orange-800' 
                                    : 'bg-green-100 text-green-800'
                                }`}>
                                  {post.type === 'request' ? 'Request' : 'Offer'}
                                </span>
                                {post.type === 'request' && post.status && (
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    post.status === 'open' ? 'bg-green-100 text-green-800' :
                                    post.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                    post.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                                    'bg-red-100 text-red-800'
                                  }`}>
                                    {post.status === 'open' ? 'Open' :
                                     post.status === 'in_progress' ? 'In Progress' :
                                     post.status === 'completed' ? 'Completed' :
                                     'Cancelled'}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center text-xs text-gray-500 mt-1">
                              <span 
                                className="text-blue-600 hover:text-blue-800 cursor-pointer font-medium"
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

                        {/* Post Image */}
                        {post.image && (
                          <div className="mb-4">
                            <img 
                              src={`http://localhost:5000${post.image}`} 
                              alt="Post" 
                              className="w-full h-48 object-cover rounded-lg"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          </div>
                        )}

                        <p className="text-gray-700 mb-4 line-clamp-3">{post.description}</p>
                        
                        <div className="space-y-2 text-sm text-gray-500">
                          <div className="flex items-center">
                            <span className="font-medium">Category:</span>
                            <span className="ml-2 capitalize">{post.category}</span>
                          </div>
                          {post.location && (
                            <div className="flex items-center">
                              <span className="font-medium">Location:</span>
                              <span className="ml-2">{post.location}</span>
                            </div>
                          )}
                        </div>
                        {/* No edit/delete buttons on main page - only on individual post page */}
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
            <NavigationHeader user={user} onLogout={handleLogout} />
            <MyAssignments user={user} />
          </div>
        } />

        {/* Edit Post Route */}
        <Route path="/edit/:postId" element={<EditPost post={editingPost} onPostUpdated={handlePostUpdated} onCancel={() => navigate('/')} />} />
        
        {/* Community Route */}
        <Route path="/community" element={
          <div className="min-h-screen bg-gray-100">
            <NavigationHeader user={user} onLogout={handleLogout} />
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
            <NavigationHeader user={user} onLogout={handleLogout} />
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
