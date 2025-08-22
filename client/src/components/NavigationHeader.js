import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function NavigationHeader({ user, onLogout, onSearch }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const navigate = useNavigate();

  const navigationItems = [
    { name: 'Home', to: '/' },
    { name: 'Posts', to: '/' },
    // Routes like "/community" and "/about" are not defined yet in this app,
    // so we keep them pointing to home for now to avoid dead routes.
    { name: 'Community', to: '/' },
    { name: 'About', to: '/' },
  ];

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    if (onSearch) {
      onSearch(searchText);
    }
    // Optionally navigate home where the posts are listed
    navigate('/');
  };

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
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                to={item.to}
                className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Search Bar (desktop) */}
          <div className="hidden lg:flex flex-1 max-w-md mx-8">
            <form onSubmit={handleSearchSubmit} className="w-full">
              <div className="relative w-full">
                <input
                  type="search"
                  placeholder="Search neighbors, posts..."
                  className="w-full pl-10 pr-4 h-9 bg-gray-100 border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 103.75 3.75a7.5 7.5 0 0012.9 12.9z"></path>
                </svg>
              </div>
            </form>
          </div>

          {/* Right side: user + mobile toggles */}
          <div className="flex items-center space-x-2">
            {/* Mobile search button (no-op; search shown in mobile menu) */}
            <button
              className="lg:hidden h-9 w-9 p-0 rounded-md hover:bg-gray-100 flex items-center justify-center"
              aria-label="Open search"
              onClick={() => setIsMobileMenuOpen((v) => !v)}
            >
              <svg
                className="h-4 w-4 text-gray-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 103.75 3.75a7.5 7.5 0 0012.9 12.9z"></path>
              </svg>
            </button>

            {/* Profile dropdown */}
            <div className="relative">
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
              {/* Mobile Search */}
              <div className="px-3 py-2">
                <form onSubmit={handleSearchSubmit}>
                  <div className="relative">
                    <input
                      type="search"
                      placeholder="Search neighbors, posts..."
                      className="w-full pl-10 pr-4 h-9 bg-gray-100 border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                    />
                    <svg
                      className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 103.75 3.75a7.5 7.5 0 0012.9 12.9z"></path>
                    </svg>
                  </div>
                </form>
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
    </header>
  );
}

export default NavigationHeader;


