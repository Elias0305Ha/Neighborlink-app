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
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profileUser) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">User Not Found</h2>
          <p className="text-gray-600 mb-4">{error || 'The user you are looking for does not exist.'}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Back to Posts
          </button>
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

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <button
            onClick={() => navigate('/')}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Back to Posts
          </button>
          <h1 className="text-xl font-semibold text-gray-800">User Profile</h1>
          <div></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-start space-x-6">
            {/* Profile Picture */}
            <div className="flex-shrink-0">
              <div className="w-32 h-32 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
                                 {profileUser.profilePicture ? (
                   <img 
                     src={`http://localhost:5000${profileUser.profilePicture}`} 
                     alt={profileUser.name}
                     className="w-full h-full object-cover"
                   />
                 ) : (
                  <div className="text-4xl text-gray-600 font-bold">
                    {profileUser.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
                             {isOwnProfile && (
                 <div className="mt-2">
                   {!showImageUpload ? (
                     <button 
                       onClick={() => setShowImageUpload(true)}
                       className="w-full bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                     >
                       Change Photo
                     </button>
                   ) : (
                     <div className="space-y-2">
                       <input
                         type="file"
                         accept="image/*"
                         onChange={handleImageChange}
                         className="w-full text-xs"
                       />
                       {imagePreview && (
                         <div className="text-center">
                           <img 
                             src={imagePreview} 
                             alt="Preview" 
                             className="w-16 h-16 object-cover rounded-full mx-auto border"
                           />
                           <div className="flex space-x-1 mt-1">
                             <button
                               onClick={handleUpdateProfilePicture}
                               disabled={updatingImage}
                               className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700 disabled:opacity-50"
                             >
                               {updatingImage ? 'Updating...' : 'Save'}
                             </button>
                             <button
                               onClick={removeImage}
                               className="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700"
                             >
                               Remove
                             </button>
                             <button
                               onClick={() => {
                                 setShowImageUpload(false);
                                 setSelectedImage(null);
                                 setImagePreview('');
                               }}
                               className="bg-gray-600 text-white px-2 py-1 rounded text-xs hover:bg-gray-700"
                             >
                               Cancel
                             </button>
                           </div>
                         </div>
                       )}
                     </div>
                   )}
                 </div>
               )}
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">{profileUser.name}</h2>
              <p className="text-gray-600 mb-4">
                Member since {new Date(profileUser.createdAt).toLocaleDateString()}
              </p>
              
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{userPosts.length}</div>
                  <div className="text-sm text-gray-500">Posts</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{userComments.length}</div>
                  <div className="text-sm text-gray-500">Comments</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">⭐</div>
                  <div className="text-sm text-gray-500">Rating</div>
                </div>
              </div>

              {/* Bio */}
              {profileUser.bio && (
                <p className="text-gray-700">{profileUser.bio}</p>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('posts')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'posts'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Posts ({userPosts.length})
              </button>
              <button
                onClick={() => setActiveTab('comments')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'comments'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Comments ({userComments.length})
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'posts' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Posts by {profileUser.name}</h3>
                {userPosts.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No posts yet.</p>
                ) : (
                  <div className="space-y-4">
                    {userPosts.map(post => (
                      <div 
                        key={post._id} 
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md cursor-pointer"
                        onClick={() => navigate(`/post/${post._id}`)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-gray-800">{post.title}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            post.type === 'request' 
                              ? 'bg-orange-100 text-orange-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {post.type === 'request' ? 'Request' : 'Offer'}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm line-clamp-2">{post.description}</p>
                        <div className="text-xs text-gray-500 mt-2">
                          {new Date(post.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'comments' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Comments by {profileUser.name}</h3>
                {userComments.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No comments yet.</p>
                ) : (
                  <div className="space-y-4">
                    {userComments.map(comment => (
                      <div key={comment._id} className="border border-gray-200 rounded-lg p-4">
                        <p className="text-gray-700 mb-2">{comment.text}</p>
                        <div className="text-xs text-gray-500">
                          On post: {comment.post?.title || 'Unknown post'} • {new Date(comment.createdAt).toLocaleDateString()}
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
    </div>
  );
}

export default UserProfile; 