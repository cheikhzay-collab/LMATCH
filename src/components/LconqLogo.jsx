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
        <svg viewBox="0 0 48 46" style={{ width: iconSize, height: iconSize }} fill="#fff">
          <path d="M25.946 44.938c-.664.845-2.021.375-2.021-.698V33.937a2.26 2.26 0 0 0-2.262-2.262H10.287c-.92 0-1.456-1.04-.92-1.788l7.48-10.471c1.07-1.497 0-3.578-1.842-3.578H1.237c-.92 0-1.456-1.04-.92-1.788L10.013.474c.214-.297.556-.474.92-.474h28.894c.92 0 1.456 1.04.92 1.788l-7.48 10.471c-1.07 1.498 0 3.579 1.842 3.579h11.377c.943 0 1.473 1.088.89 1.83L25.947 44.94z" />
        </svg>
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
