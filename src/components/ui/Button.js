'use client';

import React from 'react';

export default function Button({ 
  variant = 'primary', 
  onClick, 
  disabled = false, 
  loading = false, 
  children,
  ...props 
}) {
  const getStyles = () => {
    const base = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '8px 16px',
      borderRadius: 'var(--radius-sm)',
      fontSize: '0.9rem',
      fontWeight: '500',
      cursor: disabled || loading ? 'not-allowed' : 'pointer',
      transition: 'all 0.2s ease',
      border: 'none',
      outline: 'none',
      opacity: disabled ? 0.6 : 1,
    };

    switch (variant) {
      case 'primary':
        return {
          ...base,
          background: 'var(--accent-gradient)',
          color: '#fff',
          boxShadow: '0 2px 10px rgba(255, 107, 53, 0.3)',
        };
      case 'secondary':
        return {
          ...base,
          background: 'var(--bg-card)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border)',
        };
      case 'ghost':
        return {
          ...base,
          background: 'transparent',
          color: 'var(--text-primary)',
        };
      default:
        return base;
    }
  };

  const styles = getStyles();

  return (
    <button 
      onClick={onClick}
      disabled={disabled || loading}
      style={styles}
      onMouseOver={(e) => {
        if (!disabled && !loading) {
          if (variant === 'secondary') {
            e.currentTarget.style.background = 'var(--border-hover)';
          } else if (variant === 'ghost') {
            e.currentTarget.style.background = 'var(--bg-card)';
          } else if (variant === 'primary') {
            e.currentTarget.style.filter = 'brightness(1.1)';
          }
        }
      }}
      onMouseOut={(e) => {
        if (!disabled && !loading) {
          if (variant === 'secondary') {
            e.currentTarget.style.background = 'var(--bg-card)';
          } else if (variant === 'ghost') {
            e.currentTarget.style.background = 'transparent';
          } else if (variant === 'primary') {
            e.currentTarget.style.filter = 'brightness(1)';
          }
        }
      }}
      {...props}
    >
      {loading ? (
        <span style={{ 
          display: 'inline-block',
          width: '16px',
          height: '16px',
          border: '2px solid rgba(255,255,255,0.3)',
          borderTopColor: variant === 'primary' ? '#fff' : 'var(--accent)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginRight: children ? '8px' : '0'
        }} />
      ) : null}
      {children}
      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </button>
  );
}
