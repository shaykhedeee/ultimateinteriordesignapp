import React, { useState, useEffect } from "react";
import { saveBrandingProfile, resetBrandingProfile } from "../../services/storageService";
import defaultWhiteLabel from "../../config/whiteLabel.json";

export default function SettingsPanel({ whiteLabel, onBrandingUpdate }) {
  const [formData, setFormData] = useState({ ...whiteLabel });
  const [logoPreview, setLogoPreview] = useState(whiteLabel.logoUrl || "");

  // Sync state if parent branding changes
  useEffect(() => {
    setFormData({ ...whiteLabel });
    setLogoPreview(whiteLabel.logoUrl || "");
    applyCssVariables(whiteLabel);
  }, [whiteLabel]);

  // Direct injection of CSS overrides into the DOM documentElement
  const applyCssVariables = (profile) => {
    if (profile.primaryColor) {
      document.documentElement.style.setProperty("--primary-color", profile.primaryColor);
    }
    if (profile.secondaryColor) {
      document.documentElement.style.setProperty("--secondary-color", profile.secondaryColor);
    }
    if (profile.accentColor) {
      document.documentElement.style.setProperty("--accent-color", profile.accentColor);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...formData, [name]: value };
    setFormData(updated);
    
    // Dynamically skin UI as user changes colors in real-time
    if (["primaryColor", "secondaryColor", "accentColor"].includes(name)) {
      applyCssVariables(updated);
    }
  };

  // Convert uploaded logo file (PNG/SVG) to base64 DataURL for local persistence
  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate size (limit to 1.5MB for local storage safety)
    if (file.size > 1500000) {
      alert("Logo size must be under 1.5MB for storage safety.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setLogoPreview(reader.result);
      setFormData((prev) => ({
        ...prev,
        logoUrl: reader.result
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await saveBrandingProfile(formData);
      onBrandingUpdate(formData);
      alert("Branding settings saved successfully! Ready for white-labeled printing.");
    } catch (err) {
      alert("Failed to save branding profile: " + err.message);
    }
  };

  const handleReset = async () => {
    if (window.confirm("Reset all branding fields back to Muskan's Modular Solutions factory default?")) {
      await resetBrandingProfile();
      onBrandingUpdate(defaultWhiteLabel);
      setFormData(defaultWhiteLabel);
      setLogoPreview("");
      applyCssVariables(defaultWhiteLabel);
    }
  };

  return (
    <div className="card white-label-card">
      <div className="card-header-premium">
        <h2>🎨 Real-Time Brand Customizer</h2>
        <p>Upload your logo, select colors, and watch the entire UI skin instantly</p>
      </div>

      <form onSubmit={handleSave} className="premium-form">
        {/* Core details */}
        <div className="form-group">
          <label>Company / Studio Name</label>
          <input
            type="text"
            name="companyName"
            value={formData.companyName}
            onChange={handleChange}
            placeholder="e.g. Muskan's Autocad Design"
            required
          />
        </div>

        {/* Dynamic Logo Uploader */}
        <div className="form-group logo-upload-group">
          <label>Upload Corporate Logo</label>
          <div className="logo-flex-row">
            <div className="logo-preview-box">
              {logoPreview ? (
                <img src={logoPreview} alt="Brand Logo Preview" className="uploaded-logo-preview" />
              ) : (
                <span className="no-logo-preview">No Logo</span>
              )}
            </div>
            <div className="file-input-wrapper">
              <input
                type="file"
                accept="image/png, image/jpeg, image/svg+xml"
                onChange={handleLogoUpload}
                id="logo-file-input"
                className="hidden-file-input"
              />
              <label htmlFor="logo-file-input" className="btn btn-secondary text-center select-logo-label">
                📁 Upload SVG / PNG
              </label>
            </div>
          </div>
        </div>

        {/* Color Palette Wheels */}
        <h3 className="section-divider">Visual Color Theme</h3>
        <div className="form-grid-3 color-picker-grid">
          <div className="form-group color-picker-cell">
            <label>Primary</label>
            <input
              type="color"
              name="primaryColor"
              value={formData.primaryColor || "#0f172a"}
              onChange={handleChange}
              className="color-wheel-picker"
            />
            <span className="color-code-text">{formData.primaryColor}</span>
          </div>
          <div className="form-group color-picker-cell">
            <label>Secondary</label>
            <input
              type="color"
              name="secondaryColor"
              value={formData.secondaryColor || "#2563eb"}
              onChange={handleChange}
              className="color-wheel-picker"
            />
            <span className="color-code-text">{formData.secondaryColor}</span>
          </div>
          <div className="form-group color-picker-cell">
            <label>Accent</label>
            <input
              type="color"
              name="accentColor"
              value={formData.accentColor || "#fbbf24"}
              onChange={handleChange}
              className="color-wheel-picker"
            />
            <span className="color-code-text">{formData.accentColor}</span>
          </div>
        </div>

        {/* Contact information */}
        <h3 className="section-divider">Business Info (PDF Header)</h3>
        <div className="form-grid-2">
          <div className="form-group">
            <label>Contact Phone</label>
            <input
              type="text"
              name="contactPhone"
              value={formData.contactPhone}
              onChange={handleChange}
              placeholder="+91 XXXXX XXXXX"
            />
          </div>
          <div className="form-group">
            <label>Registered GSTIN</label>
            <input
              type="text"
              name="gstin"
              value={formData.gstin || ""}
              onChange={handleChange}
              placeholder="e.g. 29AAAAA1111A1Z1"
            />
          </div>
        </div>

        <div className="form-group">
          <label>Office Address</label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="Studio office address"
          />
        </div>

        <div className="form-group">
          <label>Legal disclaimer (Printed PDF footer)</label>
          <textarea
            name="disclaimer"
            value={formData.disclaimer}
            onChange={handleChange}
            rows="2"
            className="premium-textarea"
            placeholder="Disclaimer stamped on workshops sheet..."
          />
        </div>

        {/* Actions buttons */}
        <div className="form-grid-2 settings-btn-row">
          <button type="submit" className="btn btn-primary">
            💾 Save Branding
          </button>
          <button type="button" className="btn btn-secondary" onClick={handleReset}>
            🔄 Reset Default
          </button>
        </div>
      </form>
    </div>
  );
}
