import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";

function getInitials(name) {
  if (!name) return "U";
  const parts = name.split(".");
  if (parts.length === 2)
    return parts[0][0].toUpperCase() + parts[1][0].toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function Navigation({
  isDarkMode,
  setIsDarkMode,
  isRefreshing,
  handleRefresh,
  user,
  handleLogout,
  setAuthModalOpen,
  setActiveTab,
  coinsData, // add coinsData prop
  searchQuery, // add searchQuery prop
  setSearchQuery, // add setSearchQuery prop
  setSelectedCrypto,
  setBetType,
  setSelectedTimeframe,
  setBetAmount,
}) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef(null);
  const navigate = useNavigate();

  // Filter suggestions based on search query
  const filteredSuggestions =
    coinsData?.coins
      ?.filter(
        (coin) =>
          coin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          coin.symbol.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .slice(0, 8) || [];

  // Handle suggestion selection - navigate to binary options with trade setup
  const handleSuggestionClick = (coin) => {
    setSearchQuery(coin.name);
    setShowSuggestions(false);

    // Set up the trade parameters
    setSelectedCrypto(coin.symbol);
    setBetType("up");
    setSelectedTimeframe("ONE_MINUTE"); // Set default timeframe to 1 Min
    setBetAmount(100); // Set default bet amount to $100

    // Navigate to binary options page
    navigate("/betting");
    setActiveTab("betting");
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Show suggestions when typing
  useEffect(() => {
    setShowSuggestions(
      searchQuery.length > 0 && filteredSuggestions.length > 0
    );
  }, [searchQuery, filteredSuggestions]);

  return (
    <nav className="nav pro-header">
      <div className="nav-content pro-header-content">
        {/* Logo & Subtitle */}
        <div className="nav-left pro-logo-block">
          <div className="pro-logo">
            {/* Logo Icon */}
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="16" fill="url(#kokitzuGradient)" />
              <text
                x="50%"
                y="55%"
                textAnchor="middle"
                fill="#fff"
                fontSize="18"
                fontWeight="bold"
                fontFamily="Inter, sans-serif"
                dy=".3em"
              >
                K
              </text>
              <defs>
                <linearGradient
                  id="kokitzuGradient"
                  x1="0"
                  y1="0"
                  x2="32"
                  y2="32"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="#3b82f6" />
                  <stop offset="1" stopColor="#6366f1" />
                </linearGradient>
              </defs>
            </svg>
            <span className="kokitzu-logo-text">Kokitzu</span>
          </div>
          <div className="brand-subtitle pro-logo-subtitle">
            Crypto Options Trading
          </div>
        </div>
        {/* Navigation Tabs */}
        <div className="tab-navigation pro-nav-tabs">
          <Link
            className={`tab-button ${
              window.location.pathname === "/" ? "active" : ""
            }`}
            to="/"
            onClick={() => setActiveTab("prices")}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M3 3v18h18M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
            </svg>
            Live Prices
          </Link>
          <Link
            className={`tab-button ${
              window.location.pathname === "/betting" ? "active" : ""
            }`}
            to="/betting"
            onClick={() => setActiveTab("betting")}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            Binary Options
          </Link>
          <Link
            className={`tab-button ${
              window.location.pathname === "/portfolio" ? "active" : ""
            }`}
            to="/portfolio"
            onClick={() => setActiveTab("portfolio")}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            Portfolio
          </Link>
        </div>
        {/* Search Bar with Suggestions */}
        <div className="pro-header-search" ref={searchRef}>
          <input
            type="text"
            placeholder="Search cryptocurrencies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchQuery.length > 0 && setShowSuggestions(true)}
          />
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="pro-search-icon"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          {/* Search Suggestions Dropdown */}
          {showSuggestions && (
            <div className="search-suggestions">
              {filteredSuggestions.map((coin) => (
                <div
                  key={coin.symbol}
                  className="suggestion-item"
                  onClick={() => handleSuggestionClick(coin)}
                >
                  <div className="suggestion-symbol">{coin.symbol}</div>
                  <div className="suggestion-name">{coin.name}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Actions & User */}
        <div className="nav-right pro-header-actions">
          <div className="pro-actions-group">
            <button
              className={`refresh-button ${isRefreshing ? "refreshing" : ""}`}
              onClick={handleRefresh}
              title="Refresh data"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M23 4v6h-6M1 20v-6h6M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
              </svg>
            </button>
            <button
              className="theme-toggle"
              onClick={() => setIsDarkMode(!isDarkMode)}
              title={`Switch to ${isDarkMode ? "light" : "dark"} mode`}
            >
              {isDarkMode ? (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="5" />
                  <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                </svg>
              ) : (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>
          </div>
          {/* User Profile Dropdown */}
          <div
            className="pro-user-menu"
            onMouseLeave={() => setUserMenuOpen(false)}
          >
            <div
              className="pro-user-avatar"
              onClick={() => setUserMenuOpen((v) => !v)}
            >
              {user && user.username ? (
                <span>{getInitials(user.username)}</span>
              ) : (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              )}
            </div>
            <div className="pro-user-info">
              <span className="pro-user-name">
                {user ? user.username : "Guest"}
              </span>
              <span className="pro-user-balance">
                ${user ? user.balance.toLocaleString() : "-"}
              </span>
            </div>
            {userMenuOpen && (
              <div className="pro-user-dropdown">
                <div className="pro-user-dropdown-item">Profile</div>
                <div className="pro-user-dropdown-item">Settings</div>
                <div className="pro-user-dropdown-item" onClick={handleLogout}>
                  Logout
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navigation;
