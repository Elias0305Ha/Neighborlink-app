import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const MyAssignments = ({ user }) => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchMyAssignments();
    }
  }, [user]);

  const fetchMyAssignments = async () => {
    try {
      const response = await fetch(`/api/v1/assignments/helper/${user._id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setAssignments(data.data);
      } else {
        setError('Failed to load your assignments');
      }
    } catch (err) {
      setError('Network error loading assignments');
    } finally {
      setLoading(false);
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
        await fetchMyAssignments();
      } else {
        setError(data.message || 'Failed to update status');
      }
    } catch (err) {
      setError('Network error updating status');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: '⏳' },
      approved: { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: '✅' },
      in_progress: { color: 'bg-purple-100 text-purple-800 border-purple-200', icon: '🔄' },
      completed: { color: 'bg-green-100 text-green-800 border-green-200', icon: '🎉' },
      cancelled: { color: 'bg-red-100 text-red-800 border-red-200', icon: '❌' }
    };

    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: '❓' };

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${config.color}`}>
        <span className="mr-1">{config.icon}</span>
        {status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}
      </span>
    );
  };

  const getStatusDescription = (status) => {
    const descriptions = {
      pending: 'Waiting for approval from the request owner',
      approved: 'Your claim was approved! You can now start helping',
      in_progress: 'You are currently working on this request',
      completed: 'You have successfully completed this request',
      cancelled: 'This assignment was cancelled'
    };
    return descriptions[status] || '';
  };

  const getFilteredAssignments = () => {
    if (selectedStatus === 'all') return assignments;
    return assignments.filter(assignment => assignment.status === selectedStatus);
  };

  const getStatusCount = (status) => {
    if (status === 'all') return assignments.length;
    return assignments.filter(assignment => assignment.status === status).length;
  };

  if (!user) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">My Assignments</h3>
          <p className="text-gray-600">Please sign in to view your assignments.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-3"></div>
                <div className="h-20 bg-gray-200 rounded mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const filteredAssignments = getFilteredAssignments();

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Assignments</h1>
            <p className="text-lg text-gray-600 mt-2">Track and manage your neighborhood help requests</p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Browse Requests
          </button>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex space-x-1 bg-white p-1 rounded-lg shadow-sm border">
          {[
            { key: 'all', label: 'All', color: 'bg-gray-100 text-gray-700' },
            { key: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-700' },
            { key: 'approved', label: 'Approved', color: 'bg-blue-100 text-blue-700' },
            { key: 'in_progress', label: 'In Progress', color: 'bg-purple-100 text-purple-700' },
            { key: 'completed', label: 'Completed', color: 'bg-green-100 text-green-700' },
            { key: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-700' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSelectedStatus(tab.key)}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                selectedStatus === tab.key
                  ? `${tab.color} shadow-sm`
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {tab.label}
              <span className="ml-2 text-xs bg-white/50 px-2 py-0.5 rounded-full">
                {getStatusCount(tab.key)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredAssignments.length === 0 && (
        <div className="text-center py-12">
          <div className="mx-auto h-24 w-24 text-gray-300 mb-4">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {selectedStatus === 'all' ? 'No assignments yet' : `No ${selectedStatus.replace('_', ' ')} assignments`}
          </h3>
          <p className="text-gray-500 mb-6">
            {selectedStatus === 'all' 
              ? "You haven't claimed any requests yet. Browse the community to find ways to help your neighbors!"
              : `You don't have any ${selectedStatus.replace('_', ' ')} assignments at the moment.`
            }
          </p>
          {selectedStatus === 'all' && (
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Browse Requests
            </button>
          )}
        </div>
      )}

      {/* Assignments Grid */}
      {filteredAssignments.length > 0 && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAssignments.map((assignment) => (
            <div key={assignment._id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200 overflow-hidden">
              {/* Header */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-start justify-between mb-3">
                  <h4 className="font-semibold text-gray-900 text-lg leading-tight line-clamp-2">
                    {assignment.post.title}
                  </h4>
                  {getStatusBadge(assignment.status)}
                </div>
                <p className="text-sm text-gray-600 line-clamp-3 mb-3">
                  {assignment.post.description}
                </p>
                <div className="flex items-center text-xs text-gray-500">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {new Date(assignment.createdAt).toLocaleDateString()}
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="mb-4">
                  <p className="text-sm text-gray-700 mb-2">
                    <span className="font-medium text-gray-900">Your message:</span>
                  </p>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border">
                    {assignment.message}
                  </p>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-100">
                    <span className="font-medium text-blue-900">Status:</span> {getStatusDescription(assignment.status)}
                  </p>
                </div>

                {/* Action Buttons */}
                {assignment.status === 'approved' && (
                  <div className="space-y-2">
                    <button
                      onClick={() => handleStatusUpdate(assignment._id, 'in_progress')}
                      className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    >
                      🚀 Start Working
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(assignment._id, 'cancelled')}
                      className="w-full px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                    >
                      ❌ Cancel Assignment
                    </button>
                  </div>
                )}

                {assignment.status === 'in_progress' && (
                  <div className="space-y-2">
                    <button
                      onClick={() => handleStatusUpdate(assignment._id, 'completed')}
                      className="w-full px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                    >
                      ✅ Mark Completed
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(assignment._id, 'cancelled')}
                      className="w-full px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                    >
                      ❌ Cancel Assignment
                    </button>
                  </div>
                )}

                {assignment.status === 'completed' && (
                  <div className="text-sm text-gray-600 bg-green-50 p-3 rounded-lg border border-green-100">
                    <p className="font-medium text-green-900 mb-2">
                      🎉 Completed on {new Date(assignment.completedAt || assignment.updatedAt).toLocaleDateString()}
                    </p>
                    {assignment.rating && (
                      <div className="mt-3">
                        <div className="flex items-center space-x-1 mb-2">
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
                          <span className="ml-2 text-green-800 font-medium">{assignment.rating}/5</span>
                        </div>
                        {assignment.review && (
                          <p className="text-green-800 italic">"{assignment.review}"</p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {assignment.status === 'cancelled' && (
                  <div className="text-sm text-gray-600 bg-red-50 p-3 rounded-lg border border-red-100">
                    <p className="font-medium text-red-900">❌ This assignment was cancelled</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyAssignments;
