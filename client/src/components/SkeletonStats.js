import React from "react";

const SkeletonStats = () => (
  <div className="skeleton-stats">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="skeleton-stat-card">
        <div className="skeleton skeleton-stat-value"></div>
        <div className="skeleton skeleton-stat-label"></div>
      </div>
    ))}
  </div>
);

export default SkeletonStats;
