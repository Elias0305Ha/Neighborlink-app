import React, { useState, useEffect, useCallback, memo } from 'react';
import Comment from './Comment';

function CommentList({ postId, currentUserId, onCommentAdded, socket, post, comments, setComments }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notification, setNotification] = useState(null);

  // Comments are now passed as props from parent component

  // Function to add a new comment to the list
  const addCommentToList = useCallback((newComment) => {
    setComments(prevComments => [newComment, ...prevComments]);
  }, []);

  // Delete a comment
  const handleDeleteComment = useCallback(async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/v1/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      
      if (result.success) {
        // Remove the comment from the list
        setComments(prevComments => prevComments.filter(comment => comment._id !== commentId));
      } else {
        alert('Failed to delete comment');
      }
    } catch (err) {
      alert('Error deleting comment');
    }
  }, []);

  // Comments are loaded by parent component

  // Handle new comment added
  useEffect(() => {
    if (onCommentAdded) {
      onCommentAdded(addCommentToList);
    }
  }, [onCommentAdded]);

  // Function to show notification
  const showNotification = useCallback((message) => {
    setNotification(message);
    // Auto-hide notification after 3 seconds
    setTimeout(() => setNotification(null), 3000);
  }, []);

  // No more room logic needed - we only notify post owners

  // Listen for real-time comment updates
  useEffect(() => {
    if (!socket) return;

    // Listen for new comments
    const handleNewComment = (newComment) => {
      if (newComment.postId === postId) {
        setComments(prevComments => [newComment, ...prevComments]);
        
        // Only show notification if current user OWNS this post (using your existing naming)
        if (currentUserId === post.createdBy._id) {
          showNotification(`New comment from ${newComment.user.username}!`);
        }
      }
    };

    // Listen for comment updates
    const handleCommentUpdated = (updatedComment) => {
      if (updatedComment.postId === postId) {
        setComments(prevComments => 
          prevComments.map(comment => 
            comment._id === updatedComment._id ? updatedComment : comment
          )
        );
      }
    };

    // Listen for comment deletions
    const handleCommentDeleted = (commentId) => {
      setComments(prevComments => 
        prevComments.filter(comment => comment._id !== commentId)
      );
    };

    // Add event listeners
    socket.on('new-comment', handleNewComment);
    socket.on('comment-updated', handleCommentUpdated);
    socket.on('comment-deleted', handleCommentDeleted);

    // Cleanup function
    return () => {
      socket.off('new-comment', handleNewComment);
      socket.off('comment-updated', handleCommentUpdated);
      socket.off('comment-deleted', handleCommentDeleted);
    };
  }, [socket, postId, showNotification, currentUserId, post]);

  // No more room logic needed

  if (!comments) {
    return (
      <div className="text-center py-4">
        <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-gray-500">Loading comments...</span>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 text-center py-4">{error}</div>;
  }

  return (
    <div className="mt-4">
      {/* Notification popup */}
      {notification && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in">
          {notification}
        </div>
      )}
      
      <h3 className="text-lg font-semibold mb-3">Comments ({comments.length})</h3>
      {comments.length === 0 ? (
        <p className="text-gray-500 text-center py-4">No comments yet. Be the first to comment!</p>
      ) : (
        <div>
          {comments.map(comment => (
            <Comment
              key={comment._id}
              comment={comment}
              onDelete={handleDeleteComment}
              currentUserId={currentUserId}
              post={post}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default memo(CommentList); 