import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import NotificationCenter from './NotificationCenter';

function NavigationHeader({ user, onLogout }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  // Fetch unread notification count
  useEffect(() => {
    if (user) {
      fetchUnreadCount();
    }
  }, [user]);

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

  const fetchUnreadCount = async () => {
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
  };

  const navigationItems = [
    { name: 'Home', to: '/' },
    { name: 'Community', to: '/community' },
    { name: 'About', to: '/about' },
    { name: 'My Posts', to: '/?filter=my-posts' },
    { name: 'My Assignments', to: '/my-assignments' },
  ];



  const getUserInitials = (fullName) => {
    if (!fullName || typeof fullName !== 'string') return 'U';
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

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
                           {navigationItems.map((item) => {
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
              })}
           </nav>

                     {/* Create Post Button */}
           <div className="hidden md:flex items-center">
             <button
               onClick={() => navigate('/create-post')}
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
                onClick={() => setIsNotificationCenterOpen(true)}
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
               onClick={() => navigate('/create-post')}
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
                onClick={() => setIsProfileMenuOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={isProfileMenuOpen}
              >
                <div className="h-11 w-11 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm ring-2 ring-white shadow-lg">
                  {/* Use the same profile picture logic as posts */}
                  {user && user.profilePicture ? (
                    <img
                      src={`http://localhost:5000${user.profilePicture}`}
                      alt="User avatar"
                      className="h-full w-full object-cover cursor-pointer"
                      onError={(e) => { 
                        e.currentTarget.style.display = 'none'; 
                      }}
                      onLoad={() => console.log('Profile picture loaded successfully:', user.profilePicture)}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (user && user._id) navigate(`/user/${user._id}`);
                      }}
                    />
                  ) : (
                    <div 
                      className="text-white font-bold text-lg cursor-pointer flex items-center justify-center w-full h-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (user && user._id) navigate(`/user/${user._id}`);
                      }}
                    >
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
                        {user && user.profilePicture ? (
                          <img
                            src={`http://localhost:5000${user.profilePicture}`}
                            alt="User avatar"
                            className="h-full w-full object-cover cursor-pointer"
                            onError={(e) => { 
                              e.currentTarget.style.display = 'none'; 
                            }}
                            onLoad={() => console.log('Dropdown profile picture loaded successfully:', user.profilePicture)}
                            onClick={() => {
                              setIsProfileMenuOpen(false);
                              if (user && user._id) navigate(`/user/${user._id}`);
                            }}
                          />
                        ) : (
                          <div 
                            className="text-white font-bold text-2xl cursor-pointer flex items-center justify-center w-full h-full"
                            onClick={() => {
                              setIsProfileMenuOpen(false);
                              if (user && user._id) navigate(`/user/${user._id}`);
                            }}
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
                          onClick={() => {
                            setIsProfileMenuOpen(false);
                            if (user && user._id) navigate(`/user/${user._id}`);
                          }}
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
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        if (user && user._id) navigate(`/user/${user._id}`);
                      }}
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
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        navigate('/my-assignments');
                      }}
                    >
                      <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                        <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      <span>My Assignments</span>
                    </button>
                    
                    <button
                      className="w-full text-left px-4 py-3 text-sm font-medium text-gray-700 hover:bg-purple-50 hover:text-purple-700 rounded-xl transition-all duration-200 flex items-center space-x-3 group"
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        // Placeholder for future settings page
                      }}
                    >
                      <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                        <svg className="h-4 w-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <span>Settings</span>
                    </button>
                  </div>
                  
                  {/* Logout Section */}
                  <div className="p-2 border-t border-gray-100">
                    <button
                      className="w-full text-left px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 flex items-center space-x-3 group"
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        if (onLogout) onLogout();
                      }}
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
              onClick={() => setIsMobileMenuOpen((v) => !v)}
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
                   onClick={() => {
                     setIsMobileMenuOpen(false);
                     navigate('/create-post');
                   }}
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
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Notification Center */}
      <NotificationCenter
        isOpen={isNotificationCenterOpen}
        onClose={() => setIsNotificationCenterOpen(false)}
        user={user}
      />
    </header>
  );
}

export default NavigationHeader;


