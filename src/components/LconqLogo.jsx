import React from 'react';

/**
 * LconqLogo component
 * Renders the original vector logo icon from public/favicon.svg and the brand text "lconq".
 */
export default function LconqLogo({ 
  size = 32, 
  showText = true, 
  textSize = '1.1rem',
  textColor = 'var(--text-main)',
  style = {},
  iconOnly = false
}) {
  return (
    <div 
      style={{ 
        display: 'inline-flex', 
        alignItems: 'center', 
        gap: `${size * 0.28}px`, 
        userSelect: 'none',
        ...style 
      }}
    >
      {/* Icon SVG - matches public/favicon.svg exactly */}
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 512 512" 
        width={size} 
        height={size} 
        style={{ flexShrink: 0 }}
      >
        {/* Rounded background square */}
        <rect width="512" height="512" rx="128" fill="#5254F0" />
        
        {/* Lighter rounded square in the center */}
        <rect x="96" y="96" width="320" height="320" rx="80" fill="#FFFFFF" fill-opacity="0.15" />
        
        {/* Brain Circuit Logo in White */}
        <g transform="translate(144, 144) scale(9.333)" stroke="#FFFFFF" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none">
          <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
          <path d="M9 13a4.5 4.5 0 0 0 3-4" />
          <path d="M6.003 5.125A3 3 0 0 0 6.401 6.5" />
          <path d="M3.477 10.896a4 4 0 0 1 .585-.396" />
          <path d="M6 18a4 4 0 0 1-1.967-.516" />
          <path d="M12 13h4" />
          <path d="M12 18h6a2 2 0 0 1 2 2v1" />
          <path d="M12 8h8" />
          <path d="M16 8V5a2 2 0 0 1 2-2" />
          <circle cx="16" cy="13" r=".5" fill="#FFFFFF" />
          <circle cx="18" cy="3" r=".5" fill="#FFFFFF" />
          <circle cx="20" cy="21" r=".5" fill="#FFFFFF" />
          <circle cx="20" cy="8" r=".5" fill="#FFFFFF" />
        </g>
      </svg>

      {showText && !iconOnly && (
        <span 
          style={{ 
            fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
            fontWeight: 800, 
            fontSize: textSize, 
            letterSpacing: '-0.03em', 
            color: textColor,
            lineHeight: 1
          }}
        >
          lconq
        </span>
      )}
    </div>
  );
}
