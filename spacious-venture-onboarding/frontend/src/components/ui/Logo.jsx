import React from 'react';

/**
 * Spacious Venture SVG Logo component
 * Supports 'full' (icon + text) and 'icon' variants.
 */
export function Logo({ variant = 'full', height = 40, className = '' }) {
  const iconSize = height;
  
  if (variant === 'icon') {
    return (
      <svg
        className={`sv-logo-svg ${className}`}
        width={iconSize}
        height={iconSize}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Spacious Venture Icon"
      >
        {/* Left sky blue wedge */}
        <polygon
          points="0,100 32.5,100 65,0"
          fill="url(#sv-blue-gradient)"
          stroke="#0b0c0a"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {/* Middle copper/orange wedge */}
        <polygon
          points="32.5,100 65,100 65,0"
          fill="url(#sv-orange-gradient)"
          stroke="#0b0c0a"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {/* Right sky blue wedge */}
        <polygon
          points="65,100 100,100 65,0"
          fill="url(#sv-blue-gradient)"
          stroke="#0b0c0a"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        
        <defs>
          <linearGradient id="sv-blue-gradient" x1="0" y1="100" x2="65" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#00b0ff" />
            <stop offset="100%" stopColor="#00d5ff" />
          </linearGradient>
          <linearGradient id="sv-orange-gradient" x1="32.5" y1="100" x2="65" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#f97316" />
          </linearGradient>
        </defs>
      </svg>
    );
  }

  // Full horizontal layout: text on left, icon on right (matching the transparent PNG logo layout)
  // Let's use clean typography that matches the condensed font and weights of the original logo.
  const textHeight = height * 0.9;
  return (
    <div 
      className={`sv-logo-full ${className}`} 
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        gap: '12px',
        height: `${height}px`,
        width: '100%',
        boxSizing: 'border-box'
      }}
    >
      <div 
        className="sv-logo-text" 
        style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center',
          fontFamily: "var(--font-display, 'Outfit', sans-serif)",
          lineHeight: '1.0',
          color: 'var(--ink, #e6e1da)'
        }}
      >
        <span 
          style={{ 
            fontSize: `${height * 0.45}px`, 
            fontWeight: '800', 
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            display: 'block'
          }}
        >
          SPACIOUS
        </span>
        <span 
          style={{ 
            fontSize: `${height * 0.45}px`, 
            fontWeight: '300', 
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--gold-2, #d2ad67)',
            display: 'block',
            marginTop: '2px'
          }}
        >
          VENTURE
        </span>
      </div>
      
      <svg
        className="sv-logo-svg"
        width={height}
        height={height}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
      >
        {/* Left sky blue wedge */}
        <polygon
          points="0,100 32.5,100 65,0"
          fill="url(#sv-blue-gradient-full)"
          stroke="#0b0c0a"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {/* Middle copper/orange wedge */}
        <polygon
          points="32.5,100 65,100 65,0"
          fill="url(#sv-orange-gradient-full)"
          stroke="#0b0c0a"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {/* Right sky blue wedge */}
        <polygon
          points="65,100 100,100 65,0"
          fill="url(#sv-blue-gradient-full)"
          stroke="#0b0c0a"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        
        <defs>
          <linearGradient id="sv-blue-gradient-full" x1="0" y1="100" x2="65" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#00b0ff" />
            <stop offset="100%" stopColor="#00d5ff" />
          </linearGradient>
          <linearGradient id="sv-orange-gradient-full" x1="32.5" y1="100" x2="65" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#f97316" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
