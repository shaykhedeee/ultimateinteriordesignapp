import React from "react";

export default function Header({ whiteLabel }) {
  const {
    companyName = "Muskan's Modular Solutions",
    contactPhone = "+91 98765 43210",
    contactEmail = "contact@muskanmodular.in",
    address = "HSR Layout, Bengaluru, KA",
    gstin = ""
  } = whiteLabel || {};

  return (
    <header className="brand-header">
      <div className="header-container">
        {/* Left: Branding & Logo */}
        <div className="brand-box">
          <div className="brand-logo-container">
            <svg
              className="brand-logo"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m15 12-8.5 8.5a2.12 2.12 0 0 1-3-3L12 9" />
              <path d="M17.64 15 22 10.64" />
              <path d="m20.91 11.7-1.25-1.25c-.6-.6-.93-1.4-.93-2.23C18.73 6.5 17.23 5 15.5 5a2.41 2.41 0 0 0-2.22.94l-1.25-1.25" />
              <path d="m19 8.5-3.5 3.5" />
              <path d="m14 2 8 8" />
            </svg>
          </div>
          <div className="brand-text">
            <h1 className="company-title">{companyName}</h1>
            <span className="badge-white-label">Cutlist Pro Verified</span>
          </div>
        </div>

        {/* Right: Studio Contact Meta */}
        <div className="contact-box">
          <div className="contact-item">
            <span className="contact-icon">📞</span>
            <span className="contact-text">{contactPhone}</span>
          </div>
          <div className="contact-item">
            <span className="contact-icon">✉️</span>
            <span className="contact-text">{contactEmail}</span>
          </div>
          <div className="contact-item font-address">
            <span className="contact-icon">📍</span>
            <span className="contact-text">{address}</span>
          </div>
          {gstin && (
            <div className="contact-item font-gstin">
              <span className="contact-badge">GSTIN:</span>
              <span className="contact-text font-mono">{gstin}</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
