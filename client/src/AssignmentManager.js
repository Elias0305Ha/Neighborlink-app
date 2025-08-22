import React, { useState, useEffect } from 'react';

const AssignmentManager = ({ post, onAssignmentUpdated, user }) => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (post && post._id) {
      fetchAssignments();
    }
  }, [post]);

  const fetchAssignments = async () => {
    try {
      const response = await fetch(`/api/v1/assignments/post/${post._id}`);
      const data = await response.json();
      
      if (data.success) {
        setAssignments(data.data);
      } else {
        setError('Failed to load assignments');
      }
    } catch (err) {
      setError('Network error loading assignments');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (assignmentId, approved) => {
    try {
      const response = await fetch(`/api/v1/assignments/${assignmentId}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ approved })
      });

      const data = await response.json();

      if (data.success) {
        await fetchAssignments(); // Refresh the list
        onAssignmentUpdated(); // Notify parent component
      } else {
        setError(data.message || 'Failed to update assignment');
      }
    } catch (err) {
      setError('Network error updating assignment');
    }
  };

  const handleStatusUpdate = async (assignmentId, newStatus) => {
    try {
      const response = await fetch(`/api/v1/assignments/${assignmentId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();

      if (data.success) {
        await fetchAssignments(); // Refresh the list
        onAssignmentUpdated(); // Notify parent component
      } else {
        setError(data.message || 'Failed to update status');
      }
    } catch (err) {
      setError('Network error updating status');
    }
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">No Claims Yet</h3>
        <p className="text-gray-600">
          This request hasn't been claimed by anyone yet. Share it with your neighbors to get help!
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Request Claims</h3>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        {assignments.map((assignment) => (
          <div key={assignment._id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <img
                  src={assignment.helper.profilePicture || '/default-avatar.png'}
                  alt={assignment.helper.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <h4 className="font-medium text-gray-900">{assignment.helper.name}</h4>
                  {getStatusBadge(assignment.status)}
                </div>
              </div>
              <span className="text-sm text-gray-500">
                {new Date(assignment.createdAt).toLocaleDateString()}
              </span>
            </div>

            <div className="mb-4">
              <p className="text-gray-700">{assignment.message}</p>
            </div>

            {/* Action buttons based on status */}
            {assignment.status === 'pending' && (
              <div className="flex space-x-2">
                <button
                  onClick={() => handleApprove(assignment._id, true)}
                  className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleApprove(assignment._id, false)}
                  className="px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
                >
                  Reject
                </button>
              </div>
            )}

            {assignment.status === 'approved' && (
              <div className="flex space-x-2">
                <button
                  onClick={() => handleStatusUpdate(assignment._id, 'in_progress')}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                >
                  Mark In Progress
                </button>
                <button
                  onClick={() => handleStatusUpdate(assignment._id, 'cancelled')}
                  className="px-4 py-2 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}

            {assignment.status === 'in_progress' && (
              <div className="flex space-x-2">
                <button
                  onClick={() => handleStatusUpdate(assignment._id, 'completed')}
                  className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
                >
                  Mark Completed
                </button>
                <button
                  onClick={() => handleStatusUpdate(assignment._id, 'cancelled')}
                  className="px-4 py-2 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}

            {assignment.status === 'completed' && (
              <div className="text-sm text-gray-600">
                <p>Completed on {new Date(assignment.completedAt).toLocaleDateString()}</p>
                {assignment.rating && (
                  <div className="mt-2">
                    <div className="flex items-center space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg
                          key={star}
                          className={`w-4 h-4 ${star <= assignment.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    {assignment.review && (
                      <p className="mt-1 italic">"{assignment.review}"</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AssignmentManager;
