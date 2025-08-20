import React, { memo } from 'react';

const Comment = memo(({ comment, onDelete, currentUserId, post }) => {

    // Allow both comment owner AND post owner to delete (using your existing naming)
    const canDelete = comment.createdBy._id === currentUserId || currentUserId === post.createdBy._id;

  return (
    <div>
      <div className="flex items-center mb-2">
        <span className="font-semibold text-gray-800 mr-2">
          {comment.createdBy.name}
        </span>
      </div>
      <p className="text-gray-700">{comment.text}</p>
      {canDelete && (
        <button
          onClick={() => onDelete(comment._id)}
          className="text-red-500 hover:text-red-700 text-sm font-medium"
        >
          Delete
        </button>
      )}
    </div>
  );
});

export default Comment; 