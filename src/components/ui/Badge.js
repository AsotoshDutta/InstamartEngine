'use client';

import React from 'react';

export default function Badge({ variant = 'neutral', children }) {
  const getColors = () => {
    switch (variant) {
      case 'high':
      case 'positive':
        return { bg: 'rgba(74, 222, 128, 0.1)', color: 'var(--success)', border: 'rgba(74, 222, 128, 0.2)' };
      case 'medium':
      case 'neutral':
        return { bg: 'rgba(247, 201, 72, 0.1)', color: 'var(--warning)', border: 'rgba(247, 201, 72, 0.2)' };
      case 'low':
      case 'negative':
        return { bg: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: 'rgba(239, 68, 68, 0.2)' };
      case 'mixed':
        return { bg: 'rgba(167, 139, 250, 0.1)', color: 'var(--mixed)', border: 'rgba(167, 139, 250, 0.2)' };
      default:
        return { bg: 'var(--bg-card)', color: 'var(--text-secondary)', border: 'var(--border)' };
    }
  };

  const colors = getColors();

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '4px 10px',
      borderRadius: '20px',
      fontSize: '0.75rem',
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      backgroundColor: colors.bg,
      color: colors.color,
      border: `1px solid ${colors.border}`,
      whiteSpace: 'nowrap'
    }}>
      {children}
    </span>
  );
}
