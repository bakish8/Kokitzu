import React from "react";

const SkeletonCryptoCard = () => (
  <div className="skeleton-card">
    <div
      style={{ display: "flex", alignItems: "center", marginBottom: "1rem" }}
    >
      <div className="skeleton skeleton-crypto-icon"></div>
      <div style={{ marginLeft: "1rem", flex: 1 }}>
        <div className="skeleton skeleton-text"></div>
        <div className="skeleton skeleton-text-small"></div>
      </div>
    </div>
    <div className="skeleton skeleton-price"></div>
    <div className="skeleton skeleton-text-small"></div>
  </div>
);

export default SkeletonCryptoCard;
