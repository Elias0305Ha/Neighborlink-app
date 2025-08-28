import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import NotificationCenter from './NotificationCenter';

function NavigationHeader({ user, onLogout, socket }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  
  // Debug profile menu state
  useEffect(() => {
    console.log('Profile menu state changed:', isProfileMenuOpen);
  }, [isProfileMenuOpen]);

  // Debug user data for profile picture
  useEffect(() => {
    if (user) {
      console.log('NavigationHeader user data:', {
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture,
        hasProfilePicture: !!user.profilePicture && user.profilePicture !== 'no-photo.jpg'
      });
    }
  }, [user]);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  // Fetch unread notification count
  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    
    try {
      const response = await fetch('/api/v1/notifications/unread-count', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setUnreadCount(data.data.count);
      }
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
    }
  }, [user]);

  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  // Real-time unread count updates
  useEffect(() => {
    if (!socket) return;

    // Listen for new notifications to update count
    socket.on('new-notification', () => {
      console.log('New notification received in NavigationHeader');
      setUnreadCount(prev => prev + 1);
    });

    // Listen for notification updates (when marked as read)
    socket.on('notification-updated', (data) => {
      console.log('Notification update received in NavigationHeader:', data);
      
      if (data.userId === user?._id) {
        if (data.action === 'marked-read') {
          setUnreadCount(prev => Math.max(0, prev - 1));
        } else if (data.action === 'marked-all-read') {
          setUnreadCount(0);
        }
      }
    });

    return () => {
      socket.off('new-notification');
      socket.off('notification-updated');
    };
  }, [socket, user?._id]);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isProfileMenuOpen && !event.target.closest('.profile-dropdown')) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileMenuOpen]);

  const navigationItems = [
    { name: 'Home', to: '/' },
    { name: 'My Posts', to: '/?filter=my-posts' },
    { name: 'My Assignments', to: '/my-assignments' },
    { name: 'Chats', to: '/chats' },
    { name: 'Community', to: '/community' },
    { name: 'About', to: '/about' },
  ];

  const getUserInitials = useCallback((fullName) => {
    if (!fullName || typeof fullName !== 'string') return 'U';
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }, []);

  // Memoize navigation item rendering
  const renderNavigationItems = useCallback(() => {
    return navigationItems.map((item) => {
      const isActive = item.to === '/' ? 
        location.pathname === '/' && !location.search :
        location.pathname === item.to;
       
      return (
        <Link
          key={item.name}
          to={item.to}
          className={`text-sm font-medium transition-colors ${
            isActive 
              ? 'text-blue-600 font-semibold' 
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          {item.name}
        </Link>
      );
    });
  }, [location.pathname, location.search]);

  // Memoize profile menu handlers
  const handleProfileMenuToggle = useCallback(() => {
    console.log('Profile button clicked, current state:', isProfileMenuOpen);
    setIsProfileMenuOpen(!isProfileMenuOpen);
  }, [isProfileMenuOpen]);

  const handleProfileMenuClose = useCallback(() => {
    setIsProfileMenuOpen(false);
  }, []);

  const handleNavigateToProfile = useCallback(() => {
    setIsProfileMenuOpen(false);
    if (user && user._id) navigate(`/user/${user._id}`);
  }, [user, navigate]);

  const handleNavigateToAssignments = useCallback(() => {
    setIsProfileMenuOpen(false);
    navigate('/my-assignments');
  }, [navigate]);

  const handleNavigateToChats = useCallback(() => {
    setIsProfileMenuOpen(false);
    navigate('/chats');
  }, [navigate]);

  const handleLogout = useCallback(() => {
    setIsProfileMenuOpen(false);
    if (onLogout) onLogout();
  }, [onLogout]);

  const handleMobileMenuToggle = useCallback(() => {
    setIsMobileMenuOpen((v) => !v);
  }, []);

  const handleMobileMenuClose = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  const handleCreatePostClick = useCallback(() => {
    navigate('/create-post');
  }, [navigate]);

  const handleNotificationCenterToggle = useCallback(() => {
    setIsNotificationCenterOpen(true);
  }, []);

  const handleNotificationCenterClose = useCallback(() => {
    setIsNotificationCenterOpen(false);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/90 backdrop-blur">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo / Brand */}
          <div className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-sm">
              NL
            </div>
            <span className="text-xl font-bold text-gray-900">NeighborLink</span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {renderNavigationItems()}
          </nav>

          {/* Create Post Button */}
          <div className="hidden md:flex items-center">
            <button
              onClick={handleCreatePostClick}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Post
            </button>
          </div>

          {/* Right side: user + mobile toggles */}
          <div className="flex items-center space-x-2">
            {/* Notification Bell */}
            {user && (
              <button
                onClick={handleNotificationCenterToggle}
                className="relative h-9 w-9 p-0 rounded-md hover:bg-gray-100 flex items-center justify-center"
                aria-label="Notifications"
              >
                <svg
                  className="h-5 w-5 text-gray-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-5 5v-5zM10 3a6 6 0 00-6 6v7h12V9a6 6 0 00-6-6z"
                  />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            )}

            

            {/* Create Post Button (Mobile) */}
            <button
              className="md:hidden h-9 w-9 p-0 rounded-md hover:bg-gray-100 flex items-center justify-center"
              aria-label="Create Post"
              onClick={handleCreatePostClick}
            >
              <svg
                className="h-4 w-4 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>

            {/* Profile dropdown */}
            <div className="relative profile-dropdown">
              <button
                className="h-12 w-12 rounded-full hover:bg-gray-100 flex items-center justify-center transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                onClick={handleProfileMenuToggle}
                aria-haspopup="menu"
                aria-expanded={isProfileMenuOpen}
              >
                <div className="h-11 w-11 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm ring-2 ring-white shadow-lg">
                  {/* Use the same profile picture logic as posts */}
                  {user && user.profilePicture && user.profilePicture !== 'no-photo.jpg' ? (
                    <img
                      src={`http://localhost:5000${user.profilePicture}`}
                      alt="User avatar"
                      className="h-full w-full object-cover"
                      onError={(e) => { 
                        console.log('Profile picture failed to load:', user.profilePicture);
                        e.currentTarget.style.display = 'none'; 
                      }}
                      onLoad={() => console.log('Profile picture loaded successfully:', user.profilePicture)}
                    />
                  ) : (
                    <div className="text-white font-bold text-lg flex items-center justify-center w-full h-full">
                      {getUserInitials(user?.name)}
                    </div>
                  )}
                </div>
              </button>
              
              {/* Fancy Dropdown Menu */}
              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-3 w-72 rounded-2xl bg-white/95 backdrop-blur-md shadow-2xl border border-white/20 focus:outline-none transform transition-all duration-200 ease-out z-50">
                  {/* Profile Header Section */}
                  <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center space-x-4">
                      {/* Large Profile Picture */}
                      <div className="h-16 w-16 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center ring-4 ring-white shadow-lg">
                        {user && user.profilePicture && user.profilePicture !== 'no-photo.jpg' ? (
                          <img
                            src={`http://localhost:5000${user.profilePicture}`}
                            alt="User avatar"
                            className="h-full w-full object-cover cursor-pointer"
                            onError={(e) => { 
                              console.log('Profile picture failed to load:', user.profilePicture);
                              e.currentTarget.style.display = 'none'; 
                            }}
                            onLoad={() => console.log('Dropdown profile picture loaded successfully:', user.profilePicture)}
                            onClick={handleNavigateToProfile}
                          />
                        ) : (
                          <div 
                            className="text-white font-bold text-2xl cursor-pointer flex items-center justify-center w-full h-full"
                            onClick={handleNavigateToProfile}
                          >
                            {getUserInitials(user?.name)}
                          </div>
                        )}
                      </div>
                      
                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-lg font-bold text-gray-900 truncate">{user?.name || 'User'}</p>
                        <p className="text-sm text-gray-500 truncate">{user?.email || ''}</p>
                        <button
                          onClick={handleNavigateToProfile}
                          className="mt-2 text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
                        >
                          View Full Profile →
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Menu Items */}
                  <div className="p-2">
                    <button
                      className="w-full text-left px-4 py-3 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-xl transition-all duration-200 flex items-center space-x-3 group"
                      onClick={handleNavigateToProfile}
                    >
                      <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                        <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <span>My Profile</span>
                    </button>
                    
                    <button
                      className="w-full text-left px-4 py-3 text-sm font-medium text-gray-700 hover:bg-green-50 hover:text-green-700 rounded-xl transition-all duration-200 flex items-center space-x-3 group"
                      onClick={handleNavigateToAssignments}
                    >
                      <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                        <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 00-2 2h2V5z" />
                        </svg>
                      </div>
                      <span>My Assignments</span>
                    </button>
                    
                    <button
                      className="w-full text-left px-4 py-3 text-sm font-medium text-gray-700 hover:bg-purple-50 hover:text-purple-700 rounded-xl transition-all duration-200 flex items-center space-x-3 group"
                      onClick={handleNavigateToChats}
                    >
                      <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                        <svg className="h-4 w-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                      <span>My Chats</span>
                    </button>
                  </div>
                  
                  {/* Logout Section */}
                  <div className="p-2 border-t border-gray-100">
                    <button
                      className="w-full text-left px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 flex items-center space-x-3 group"
                      onClick={handleLogout}
                    >
                      <div className="h-8 w-8 rounded-lg bg-red-100 flex items-center justify-center group-hover:bg-red-200 transition-colors">
                        <svg className="h-4 w-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                      </div>
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden h-9 w-9 p-0 rounded-md hover:bg-gray-100 flex items-center justify-center"
              aria-label="Toggle menu"
              onClick={handleMobileMenuToggle}
            >
              {isMobileMenuOpen ? (
                <svg className="h-5 w-5 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
              ) : (
                <svg className="h-5 w-5 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t bg-white">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {/* Mobile Create Post Button */}
              <div className="px-3 py-2">
                <button
                  onClick={handleCreatePostClick}
                  className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Post
                </button>
              </div>

              {/* Mobile Navigation Items */}
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.to}
                  className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md"
                  onClick={handleMobileMenuClose}
                >
                  {item.name}
                </Link>
              ))}

              {/* Mobile Logout Button */}
              <div className="px-3 py-2 border-t border-gray-200">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 text-base font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors flex items-center"
                >
                  <svg
                    className="h-4 w-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Notification Center */}
      <NotificationCenter
        isOpen={isNotificationCenterOpen}
        onClose={handleNotificationCenterClose}
        user={user}
        socket={socket}
      />
    </header>
  );
}

export default NavigationHeader;


