import { BrainCircuit } from 'lucide-react';

/**
 * LconqLogo component
 * Renders the original gradient box and BrainCircuit icon style of L'CONQ.
 */
export default function LconqLogo({ 
  size = 36, 
  showText = true, 
  textSize = '1.1rem',
  style = {},
  iconOnly = false,
  variant = 'default', // 'default' | 'light' (for dark panels)
  onClick
}) {
  const iconSize = Math.round(size * 0.55);
  const borderRadius = Math.round(size * 0.28);
  const isLight = variant === 'light';

  return (
    <div 
      onClick={onClick}
      style={{ 
        display: 'inline-flex', 
        alignItems: 'center', 
        gap: '0.6rem', 
        userSelect: 'none',
        cursor: onClick ? 'pointer' : 'default',
        ...style 
      }}
    >
      {/* Gradient Icon Container */}
      <div 
        style={{
          width: size, 
          height: size, 
          borderRadius: `${borderRadius}px`,
          background: isLight 
            ? 'rgba(255, 255, 255, 0.15)' 
            : 'linear-gradient(135deg, var(--violet), var(--emerald))',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          flexShrink: 0
        }}
      >
        <BrainCircuit size={iconSize} color="#fff" />
      </div>

      {showText && !iconOnly && (
        <span 
          style={{ 
            fontWeight: 800, 
            fontSize: textSize, 
            letterSpacing: '-0.02em',
            fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
            color: isLight ? '#ffffff' : 'inherit'
          }}
        >
          L'
          {isLight ? (
            <span style={{ color: '#a5f3c8', fontWeight: 800 }}>CONQ</span>
          ) : (
            <span 
              style={{ 
                background: 'linear-gradient(135deg, var(--violet), var(--emerald))', 
                WebkitBackgroundClip: 'text', 
                WebkitTextFillColor: 'transparent', 
                backgroundClip: 'text' 
              }}
            >
              CONQ
            </span>
          )}
        </span>
      )}
    </div>
  );
}
