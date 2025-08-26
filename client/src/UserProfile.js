import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function UserProfile({ currentUserId, user, socket }) {
  const [profileUser, setProfileUser] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [userComments, setUserComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('posts');
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [updatingImage, setUpdatingImage] = useState(false);
  
  // New states for profile editing
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    zipCode: '',
    bio: ''
  });
  
  const { userId } = useParams();
  const navigate = useNavigate();

  // Fetch user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        
        // Fetch user info
        const userResponse = await fetch(`http://localhost:5000/api/v1/users/${userId}`);
        const userResult = await userResponse.json();
        
        if (userResult.success) {
          setProfileUser(userResult.data);
        } else {
          setError('User not found');
          return;
        }
        
        // Fetch user's posts
        const postsResponse = await fetch(`http://localhost:5000/api/v1/posts/user/${userId}`);
        const postsResult = await postsResponse.json();
        
        if (postsResult.success) {
          setUserPosts(postsResult.data);
        }
        
        // Fetch user's comments
        const commentsResponse = await fetch(`http://localhost:5000/api/v1/comments/user/${userId}`);
        const commentsResult = await commentsResponse.json();
        
        if (commentsResult.success) {
          setUserComments(commentsResult.data);
        }
        
      } catch (err) {
        setError('Error loading user profile');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserProfile();
    }
  }, [userId]);

  // Listen for profile picture updates
  useEffect(() => {
    if (socket) {
      socket.on('profile-picture-updated', (data) => {
        if (data.userId === userId) {
          setProfileUser(prev => ({
            ...prev,
            profilePicture: data.profilePicture
          }));
        }
      });

      return () => {
        socket.off('profile-picture-updated');
      };
    }
  }, [socket, userId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-xl text-gray-600 font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profileUser) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        {/* Beautiful Background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"></div>
        </div>
        
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center backdrop-blur-md bg-white/70 rounded-2xl p-8 shadow-2xl border border-white/20">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">User Not Found</h2>
            <p className="text-gray-600 mb-6 text-lg">{error || 'The user you are looking for does not exist.'}</p>
            <button
              onClick={() => navigate('/')}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors duration-200 font-medium shadow-md"
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUserId === userId;

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      // Create preview URL
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview('');
  };

  const handleUpdateProfilePicture = async () => {
    if (!selectedImage) return;
    
    setUpdatingImage(true);
    try {
      const token = localStorage.getItem('token');
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('image', selectedImage);
      
      const response = await fetch(`http://localhost:5000/api/v1/users/${userId}/profile-picture`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const result = await response.json();
      
      if (result.success) {
        // Update local state
        setProfileUser(result.data);
        setShowImageUpload(false);
        setSelectedImage(null);
        setImagePreview('');
        
        // Emit Socket.IO event for real-time update
        if (socket) {
          console.log('Emitting profile-picture-updated event with socket:', socket.id);
          socket.emit('profile-picture-updated', {
            userId: userId,
            profilePicture: result.data.profilePicture
          });
        } else {
          console.log('No socket available for profile picture update');
        }
        
        alert('Profile picture updated successfully!');
      } else {
        alert(result.message || 'Failed to update profile picture');
      }
    } catch (err) {
      alert('Network error. Please try again.');
    } finally {
      setUpdatingImage(false);
    }
  };

  // Profile editing functions
  const openEditProfile = () => {
    setProfileForm({
      name: profileUser.name || '',
      email: profileUser.email || '',
      zipCode: profileUser.zipCode || '',
      bio: profileUser.bio || ''
    });
    setShowEditProfile(true);
    setProfileError('');
  };

  const handleProfileChange = (e) => {
    setProfileForm({
      ...profileForm,
      [e.target.name]: e.target.value
    });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setEditingProfile(true);
            setProfileError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/v1/users/${userId}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileForm)
      });

      const result = await response.json();

      if (result.success) {
        // Update local state immediately
        setProfileUser(result.data);
        
        // Close modal immediately
        setShowEditProfile(false);
        
        // Show a brief success message (optional - you can remove this if you want)
        // You could add a toast notification here instead
      } else {
        setProfileError(result.message || 'Failed to update profile');
      }
    } catch (err) {
      setProfileError('Network error. Please try again.');
    } finally {
      setEditingProfile(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* PERFORMANCE OPTIMIZED Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"></div>
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-lg opacity-50"></div>
          <div className="absolute top-40 right-20 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-lg opacity-50"></div>
          <div className="absolute bottom-20 left-1/4 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-lg opacity-50"></div>
        </div>
      </div>

      {/* Header */}
      <div className="relative z-10 sticky top-0 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <button
            onClick={() => navigate('/')}
            className="text-blue-600 hover:text-blue-800 font-medium flex items-center space-x-2 transition-colors duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back to Home</span>
          </button>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            User Profile
          </h1>
          <div></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 mb-8">
          <div className="flex flex-col lg:flex-row items-center lg:items-start space-y-6 lg:space-y-0 lg:space-x-8">
            {/* Profile Picture */}
            <div className="flex-shrink-0">
              <div className="relative">
                <div className="w-40 h-40 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 p-1 shadow-2xl">
                  <div className="w-full h-full rounded-full overflow-hidden bg-white">
                    {profileUser.profilePicture ? (
                      <img 
                        src={`http://localhost:5000${profileUser.profilePicture}`} 
                        alt={profileUser.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-6xl text-gray-600 font-bold flex items-center justify-center w-full h-full">
                        {profileUser.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>
                
                                 {isOwnProfile && (
                   <div className="mt-4 text-center space-y-3">
                     {!showImageUpload ? (
                       <>
                         <button 
                           onClick={() => setShowImageUpload(true)}
                           className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-blue-700 transition-colors duration-200 font-medium shadow-md w-full"
                         >
                           📷 Change Photo
                         </button>
                         <button 
                           onClick={openEditProfile}
                           className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-green-700 transition-colors duration-200 font-medium shadow-md w-full"
                         >
                           ✏️ Edit Profile
                         </button>
                       </>
                     ) : (
                      <div className="space-y-3">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="w-full text-sm bg-white/80 rounded-lg border border-gray-200 p-2"
                        />
                        {imagePreview && (
                          <div className="text-center">
                            <img 
                              src={imagePreview} 
                              alt="Preview" 
                              className="w-20 h-20 object-cover rounded-full mx-auto border-4 border-white shadow-lg"
                            />
                            <div className="flex space-x-2 mt-3 justify-center">
                              <button
                                onClick={handleUpdateProfilePicture}
                                disabled={updatingImage}
                                className="bg-green-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-green-700 disabled:opacity-50 transition-all duration-200"
                              >
                                {updatingImage ? '⏳ Updating...' : '✅ Save'}
                              </button>
                              <button
                                onClick={removeImage}
                                className="bg-red-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-red-700 transition-all duration-200"
                              >
                                ❌ Remove
                              </button>
                              <button
                                onClick={() => {
                                  setShowImageUpload(false);
                                  setSelectedImage(null);
                                  setImagePreview('');
                                }}
                                className="bg-gray-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-gray-700 transition-all duration-200"
                              >
                                🚫 Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center lg:text-left">
              <h2 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
                {profileUser.name}
              </h2>
              <p className="text-gray-600 mb-6 text-lg">
                🎉 Member since {new Date(profileUser.createdAt).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
              
              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 mb-6">
                <div className="text-center bg-white rounded-2xl p-4 border border-gray-200 shadow-md">
                  <div className="text-3xl font-bold text-blue-600 mb-1">{userPosts.length}</div>
                  <div className="text-sm text-gray-600 font-medium">📝 Posts</div>
                </div>
                <div className="text-center bg-white rounded-2xl p-4 border border-gray-200 shadow-md">
                  <div className="text-3xl font-bold text-green-600 mb-1">{userComments.length}</div>
                  <div className="text-sm text-gray-600 font-medium">💬 Comments</div>
                </div>
                <div className="text-center bg-white rounded-2xl p-4 border border-gray-200 shadow-md">
                  <div className="text-3xl font-bold text-yellow-600 mb-1">⭐</div>
                  <div className="text-sm text-gray-600 font-medium">Rating</div>
                </div>
              </div>

              {/* Bio */}
              {profileUser.bio && (
                <div className="bg-white rounded-2xl p-4 border border-gray-200">
                  <p className="text-gray-700 text-lg leading-relaxed">"{profileUser.bio}"</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-8">
              <button
                onClick={() => setActiveTab('posts')}
                className={`py-6 px-1 border-b-2 font-semibold text-lg transition-colors duration-200 ${
                  activeTab === 'posts'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                📝 Posts ({userPosts.length})
              </button>
              <button
                onClick={() => setActiveTab('comments')}
                className={`py-6 px-1 border-b-2 font-semibold text-lg transition-colors duration-200 ${
                  activeTab === 'comments'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                💬 Comments ({userComments.length})
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-8">
            {activeTab === 'posts' && (
              <div>
                <h3 className="text-2xl font-bold mb-6 text-gray-800">Posts by {profileUser.name}</h3>
                {userPosts.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📝</div>
                    <p className="text-gray-500 text-xl">No posts yet. Start sharing with your neighbors!</p>
                  </div>
                ) : (
                  <div className="grid gap-6">
                    {userPosts.map(post => (
                      <div 
                        key={post._id} 
                        className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg cursor-pointer transition-shadow duration-200"
                        onClick={() => navigate(`/post/${post._id}`)}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <h4 className="text-xl font-bold text-gray-800">{post.title}</h4>
                          <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                            post.type === 'request' 
                              ? 'bg-orange-100 text-orange-800 border border-orange-200' 
                              : 'bg-green-100 text-green-800 border border-green-200'
                          }`}>
                            {post.type === 'request' ? '🆘 Request' : '🤝 Offer'}
                          </span>
                        </div>
                        <p className="text-gray-600 text-lg leading-relaxed mb-4">{post.description}</p>
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-500">
                            📅 {new Date(post.createdAt).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </div>
                          <div className="text-sm text-gray-500">
                            📍 {post.location || 'No location specified'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'comments' && (
              <div>
                <h3 className="text-2xl font-bold mb-6 text-gray-800">Comments by {profileUser.name}</h3>
                {userComments.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">💬</div>
                    <p className="text-gray-500 text-xl">No comments yet. Start engaging with your community!</p>
                  </div>
                ) : (
                  <div className="grid gap-6">
                    {userComments.map(comment => (
                      <div key={comment._id} className="bg-white rounded-2xl p-6 border border-gray-200">
                        <p className="text-gray-700 text-lg leading-relaxed mb-4">"{comment.text}"</p>
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <span>📝 On post: {comment.post?.title || 'Unknown post'}</span>
                          <span>📅 {new Date(comment.createdAt).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
                     </div>
         </div>
       </div>

       {/* Edit Profile Modal */}
       {showEditProfile && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
           <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
             {/* Modal Header */}
             <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6 rounded-t-3xl">
               <div className="flex items-center justify-between">
                 <div className="flex items-center space-x-3">
                   <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                     <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                     </svg>
                   </div>
                   <div>
                     <h2 className="text-2xl font-bold">Edit Your Profile</h2>
                     <p className="text-green-100 text-sm">Update your profile information below</p>
                   </div>
                 </div>
                 <button
                   onClick={() => setShowEditProfile(false)}
                   className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                 >
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                   </svg>
                 </button>
               </div>
             </div>

             {/* Modal Content */}
             <div className="p-8">


               {profileError && (
                 <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                   <div className="flex items-center space-x-3">
                     <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                       <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                       </svg>
                     </div>
                     <p className="text-red-700 font-medium">{profileError}</p>
                   </div>
                 </div>
               )}

               <form onSubmit={handleProfileSubmit} className="space-y-6">
                 {/* Name Field */}
                 <div>
                   <label className="block text-sm font-semibold text-gray-700 mb-3">
                     <span className="flex items-center space-x-2">
                       <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                       </svg>
                       <span>Full Name *</span>
                     </span>
                   </label>
                   <input
                     type="text"
                     name="name"
                     value={profileForm.name}
                     onChange={handleProfileChange}
                     required
                     disabled={editingProfile}
                     className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                     placeholder="Enter your full name"
                   />
                 </div>

                 {/* Email Field */}
                 <div>
                   <label className="block text-sm font-semibold text-gray-700 mb-3">
                     <span className="flex items-center space-x-2">
                       <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                       </svg>
                       <span>Email Address *</span>
                     </span>
                   </label>
                   <input
                     type="email"
                     name="email"
                     value={profileForm.email}
                     onChange={handleProfileChange}
                     required
                     disabled={editingProfile}
                     className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                     placeholder="Enter your email address"
                   />
                 </div>

                 {/* ZIP Code Field */}
                 <div>
                   <label className="block text-sm font-semibold text-gray-700 mb-3">
                     <span className="flex items-center space-x-2">
                       <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                       </svg>
                       <span>ZIP Code *</span>
                     </span>
                   </label>
                   <input
                     type="text"
                     name="zipCode"
                     value={profileForm.zipCode}
                     onChange={handleProfileChange}
                     required
                     disabled={editingProfile}
                     maxLength="5"
                     pattern="[0-9]{5}"
                     className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                     placeholder="Enter your ZIP code"
                   />
                 </div>

                 {/* Bio Field */}
                 <div>
                   <label className="block text-sm font-semibold text-gray-700 mb-3">
                     <span className="flex items-center space-x-2">
                       <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                       </svg>
                       <span>Bio</span>
                     </span>
                   </label>
                   <textarea
                     name="bio"
                     value={profileForm.bio}
                     onChange={handleProfileChange}
                     disabled={editingProfile}
                     rows="4"
                     className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 text-lg disabled:opacity-50 disabled:cursor-not-allowed resize-none"
                     placeholder="Tell us about yourself (optional)"
                   />
                 </div>

                 {/* Action Buttons */}
                 <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 pt-6">
                   <button
                     type="submit"
                     disabled={editingProfile}
                     className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 text-white py-4 px-6 rounded-xl hover:from-green-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                   >
                     {editingProfile ? (
                       <span className="flex items-center justify-center space-x-2">
                         <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                           <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                           <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                         </svg>
                         <span>Updating Profile...</span>
                       </span>
                     ) : (
                       <span className="flex items-center justify-center space-x-2">
                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                         </svg>
                         <span>Update Profile</span>
                       </span>
                     )}
                   </button>
                   <button
                     type="button"
                     onClick={() => setShowEditProfile(false)}
                     className="flex-1 bg-gray-100 text-gray-700 py-4 px-6 rounded-xl hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-200 font-semibold text-lg border-2 border-gray-200 hover:border-gray-300"
                   >
                     <span className="flex items-center justify-center space-x-2">
                       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                       </svg>
                       <span>Cancel</span>
                     </span>
                   </button>
                 </div>
               </form>
             </div>
           </div>
         </div>
       )}
     </div>
   );
 }

export default UserProfile; 