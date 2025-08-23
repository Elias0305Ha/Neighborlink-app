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
                className="h-9 w-9 rounded-full hover:bg-gray-100 flex items-center justify-center"
                onClick={() => setIsProfileMenuOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={isProfileMenuOpen}
              >
                <div className="h-8 w-8 rounded-full overflow-hidden bg-blue-600 text-white flex items-center justify-center text-sm">
                  {/* Prefer backend-served profile picture if present */}
                  {user && user.profilePicture ? (
                    // eslint-disable-next-line jsx-a11y/img-redundant-alt
                    <img
                      src={`http://localhost:5000${user.profilePicture}`}
                      alt="User avatar"
                      className="h-full w-full object-cover"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  ) : (
                    <span>{getUserInitials(user?.name)}</span>
                  )}
                </div>
              </button>
              {isProfileMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 rounded-md border bg-white shadow focus:outline-none"
                  role="menu"
                >
                  <div className="px-3 py-2">
                    <p className="font-medium text-gray-900">{user?.name || 'User'}</p>
                    <p className="text-sm text-gray-500 truncate">{user?.email || ''}</p>
                  </div>
                  <div className="border-t" />
                  <button
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      if (user && user._id) navigate(`/user/${user._id}`);
                    }}
                  >
                    Profile
                  </button>
                  <button
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      navigate('/my-assignments');
                    }}
                  >
                    My Assignments
                  </button>
                  <button
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      // Placeholder for future settings page
                    }}
                  >
                    Settings
                  </button>
                  <div className="border-t" />
                  <button
                    className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      if (onLogout) onLogout();
                    }}
                  >
                    Logout
                  </button>
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


