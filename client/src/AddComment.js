import React, { useState, useCallback, memo } from 'react';

const AddComment = memo(({ postId, onCommentAdded }) => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (!text.trim()) {
      setError('Please enter a comment');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/v1/comments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: text.trim(),
          postId: postId
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setText('');
        if (onCommentAdded) {
          onCommentAdded(result.data);
        }
      } else {
        setError(result.message || 'Failed to add comment');
      }
    } catch (err) {
      setError('Error adding comment');
    } finally {
      setLoading(false);
    }
  }, [postId, onCommentAdded, text]);

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-4">
      <h3 className="text-lg font-semibold mb-3">Add a Comment</h3>
      <form onSubmit={handleSubmit}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write your comment here..."
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          rows="3"
          disabled={loading}
        />
        {error && (
          <p className="text-red-500 text-sm mt-2">{error}</p>
        )}
        <button
          type="submit"
          disabled={loading || !text.trim()}
          className="mt-3 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Adding...' : 'Add Comment'}
        </button>
      </form>
    </div>
  );
});

export default AddComment; 