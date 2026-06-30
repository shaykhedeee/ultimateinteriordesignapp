import React from "react";

export default function Footer({ whiteLabel }) {
  const {
    disclaimer = "Verify all dimensions with site measurements before cutting. Cutlist Pro is not liable for structural misalignments."
  } = whiteLabel || {};

  const currentYear = new Date().getFullYear();

  return (
    <footer className="brand-footer">
      <div className="footer-container">
        <div className="footer-warning-box">
          <span className="warning-icon">⚠</span>
          <p className="warning-text">{disclaimer}</p>
        </div>
        <div className="footer-copyright-box">
          <p className="copyright-text">
            © {currentYear} Cutlist Pro India. All rights reserved. White-labeled license active.
          </p>
          <span className="footer-version">v1.1.0-MVS</span>
        </div>
      </div>
    </footer>
  );
}
