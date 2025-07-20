import React from "react";
import { Link, useLocation } from "react-router-dom";

const MobileFooterNav = ({ setActiveTab }) => {
  const location = useLocation();

  const navItems = [
    {
      path: "/",
      label: "Live Prices",
      icon: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M3 3v18h18M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
        </svg>
      ),
      activeTab: "prices",
    },
    {
      path: "/betting",
      label: "Binary Options",
      icon: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ),
      activeTab: "betting",
    },
    {
      path: "/portfolio",
      label: "Portfolio",
      icon: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      activeTab: "portfolio",
    },
  ];

  return (
    <nav className="mobile-footer-nav">
      <div className="mobile-footer-nav-content">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`mobile-footer-nav-item ${isActive ? "active" : ""}`}
              onClick={() => setActiveTab(item.activeTab)}
            >
              <div className="mobile-footer-nav-icon">{item.icon}</div>
              <span className="mobile-footer-nav-label">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileFooterNav;
