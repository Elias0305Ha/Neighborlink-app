import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AddComment from './AddComment';
import CommentList from './CommentList';
import ClaimRequest from './ClaimRequest';
import AssignmentManager from './AssignmentManager';

function PostDetail({ socket, currentUserId, user }) {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [comments, setComments] = useState([]);
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [assignments, setAssignments] = useState([]);
  const { postId } = useParams();
  const navigate = useNavigate();

  // Fetch post details
  const fetchPost = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/v1/posts/${postId}`);
      const result = await response.json();
      
      if (result.success) {
        setPost(result.data);
        // Fetch assignments after post is loaded
        fetchAssignments();
      } else {
        setError('Post not found');
      }
    } catch (err) {
      setError('Error loading post');
    } finally {
      setLoading(false);
    }
  }, [postId]);

  // Fetch assignments for this post
  const fetchAssignments = useCallback(async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/v1/assignments/post/${postId}`);
      const data = await response.json();
      
      if (data.success) {
        setAssignments(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch assignments:', err);
    }
  }, [postId]);

  useEffect(() => {
    if (postId) {
      fetchPost();
    }
  }, [postId, fetchPost]);

  // Listen for post updates from other components
  useEffect(() => {
    const handlePostUpdate = () => {
      fetchPost();
    };

    window.addEventListener('post-updated', handlePostUpdate);
    return () => window.removeEventListener('post-updated', handlePostUpdate);
  }, [fetchPost]);

  // Handle assignment updates
  const handleAssignmentUpdated = useCallback(() => {
    fetchAssignments();
    // Also refresh the post to get updated status
    fetchPost();
  }, [fetchAssignments, fetchPost]);

  // Handle post deletion
  const handleDeletePost = useCallback(async () => {
    if (!window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/v1/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (result.success) {
        alert('Post deleted successfully!');
        navigate('/'); // Go back to main page
      } else {
        alert(result.message || 'Failed to delete post');
      }
    } catch (err) {
      alert('Network error. Please try again.');
    }
  }, [postId, navigate]);

  // Handle comment addition
  const handleCommentAdded = useCallback((newComment) => {
    // Add new comment to state instead of reloading
    setComments(prevComments => [newComment, ...prevComments]);
  }, []);

  // Handle claim form close
  const handleClaimFormClose = useCallback(() => {
    setShowClaimForm(false);
  }, []);

  // Handle claim submission
  const handleClaimSubmitted = useCallback((assignment) => {
    setShowClaimForm(false);
    handleAssignmentUpdated();
  }, [handleAssignmentUpdated]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-gray-600">Loading post...</p>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Post Not Found</h2>
          <p className="text-gray-600 mb-4">{error || 'The post you are looking for does not exist.'}</p>
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
          <h1 className="text-xl font-semibold text-gray-800">Post Details</h1>
          <div></div> {/* Spacer for centering */}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Post Card */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <div className="flex items-start justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-800">{post.title}</h2>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              post.type === 'request' 
                ? 'bg-orange-100 text-orange-800' 
                : 'bg-green-100 text-green-800'
            }`}>
              {post.type === 'request' ? 'Request' : 'Offer'}
            </span>
          </div>
          
          {/* Post Image */}
          {post.image && (
            <div className="mb-6">
              <img 
                src={`http://localhost:5000${post.image}`} 
                alt="Post" 
                className="w-full max-h-96 object-cover rounded-lg"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
          )}
          
          <p className="text-gray-700 mb-6 text-lg">{post.description}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-500 mb-6">
            <div>
              <span className="font-medium">Category:</span>
              <span className="ml-2 capitalize">{post.category}</span>
            </div>
            {post.location && (
              <div>
                <span className="font-medium">Location:</span>
                <span className="ml-2">{post.location}</span>
              </div>
            )}
            <div>
              <span className="font-medium">Posted by:</span>
              <span className="ml-2">{post.createdBy?.name || 'Unknown'}</span>
            </div>
          </div>

          {/* Show Edit and Delete buttons only if the logged-in user is the post owner */}
          {user && post.createdBy && user._id === post.createdBy._id && (
            <div className="flex space-x-3 pt-4 border-t border-gray-200">
              <button
                className="bg-yellow-400 text-white px-4 py-2 rounded hover:bg-yellow-500"
                onClick={() => navigate(`/edit/${postId}`)}
              >
                Edit Post
              </button>
              <button
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                onClick={handleDeletePost}
              >
                Delete Post
              </button>
            </div>
          )}
        </div>

        {/* Assignment Section - Only show for requests */}
        {post.type === 'request' && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Help This Request</h3>
            
            {/* Show different content based on post status and user */}
            {post.status === 'open' && (
              <div>
                {user && post.createdBy && user._id !== post.createdBy._id ? (
                  <div>
                    <p className="text-gray-600 mb-4">
                      Can you help with this request? Let the requester know how you can assist.
                    </p>
                    <button
                      onClick={() => setShowClaimForm(true)}
                      className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-medium"
                    >
                      I Can Help
                    </button>
                  </div>
                ) : user && post.createdBy && user._id === post.createdBy._id ? (
                  <p className="text-gray-600">
                    This is your request. Wait for neighbors to offer help!
                  </p>
                ) : (
                  <p className="text-gray-600">
                    Sign in to offer help with this request.
                  </p>
                )}
              </div>
            )}

            {post.status === 'in_progress' && (
              <div className="text-center py-4">
                <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Work in Progress
                </div>
                <p className="text-gray-600 mt-2">Someone is currently helping with this request.</p>
              </div>
            )}

            {post.status === 'completed' && (
              <div className="text-center py-4">
                <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Completed
                </div>
                <p className="text-gray-600 mt-2">This request has been completed.</p>
              </div>
            )}

            {post.status === 'cancelled' && (
              <div className="text-center py-4">
                <div className="inline-flex items-center px-4 py-2 bg-red-100 text-red-800 rounded-full">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Cancelled
                </div>
                <p className="text-gray-600 mt-2">This request was cancelled.</p>
              </div>
            )}
          </div>
        )}

        {/* Assignment Management - Show for post owner */}
        {post.type === 'request' && user && post.createdBy && user._id === post.createdBy._id && (
          <div className="mb-6">
            <AssignmentManager 
              post={post} 
              onAssignmentUpdated={handleAssignmentUpdated}
              user={user}
              socket={socket}
            />
          </div>
        )}

        {/* Claim Request Modal */}
        {showClaimForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <ClaimRequest
              post={post}
              onClaimSubmitted={handleClaimSubmitted}
              onClose={handleClaimFormClose}
              user={user}
            />
          </div>
        )}

        {/* Comments Section */}
        <div className="bg-white p-6 rounded-lg shadow-md">
                     <AddComment 
             postId={post._id} 
             onCommentAdded={handleCommentAdded}
           />
                     <CommentList 
             postId={post._id} 
             currentUserId={user?._id}
             socket={socket}
             post={post}
             comments={comments}
             setComments={setComments}
           />
        </div>
      </div>
    </div>
  );
}

export default PostDetail; 