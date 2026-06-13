import React, { useEffect } from 'react';

export default function PrintPage() {
  useEffect(() => {
    let intervalId;
    let timeoutId;

    const handleStorage = (e) => {
      if (e.key === 'print_html' && e.newValue) {
        checkAndPrint();
      }
    };

    const checkAndPrint = () => {
      try {
        const html = localStorage.getItem('print_html');
        if (html) {
          localStorage.removeItem('print_html');
          
          // Clear all timers immediately before overwriting the document
          clearInterval(intervalId);
          clearTimeout(timeoutId);
          window.removeEventListener('storage', handleStorage);
          
          document.open();
          document.write(html);
          document.close();
          return true;
        }
      } catch (err) {
        console.error('Error reading print HTML:', err);
      }
      return false;
    };

    // 1. Check immediately
    if (checkAndPrint()) return;

    // 2. Poll periodically as a backup
    intervalId = setInterval(() => {
      if (checkAndPrint()) {
        clearInterval(intervalId);
      }
    }, 150);

    // 3. Listen to storage events for instant reaction
    window.addEventListener('storage', handleStorage);

    // 4. Timeout after 15 seconds to prevent hanging
    timeoutId = setTimeout(() => {
      clearInterval(intervalId);
      window.removeEventListener('storage', handleStorage);
      try {
        window.close();
      } catch (e) {
        window.location.href = '/dashboard';
      }
    }, 15000);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('storage', handleStorage);
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      background: '#0D1117',
      color: '#fff',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{ position: 'relative', width: '40px', height: '40px', marginBottom: '1.2rem' }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          border: '3px solid rgba(82, 84, 240, 0.15)',
          borderTop: '3px solid #5254F0',
          animation: 'spinPrint 1s linear infinite'
        }} />
      </div>
      <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, letterSpacing: '0.02em' }}>L'CONQ</h3>
      <p style={{ margin: '0.5rem 0 0', color: '#64748b', fontSize: '0.85rem' }}>Génération de votre document PDF en cours...</p>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spinPrint {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}} />
    </div>
  );
}
