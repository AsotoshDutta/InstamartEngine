'use client';

import React from 'react';

export default function Card({ title, subtitle, children, accent = false, className = '' }) {
  return (
    <div 
      className={`glass ${className}`}
      style={{
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow)',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {accent && (
        <div style={{
          height: '4px',
          width: '100%',
          background: 'var(--accent-gradient)',
          position: 'absolute',
          top: 0,
          left: 0
        }} />
      )}
      
      {(title || subtitle) && (
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border)',
          marginTop: accent ? '4px' : '0'
        }}>
          {title && <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)' }}>{title}</h3>}
          {subtitle && <p style={{ margin: '4px 0 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{subtitle}</p>}
        </div>
      )}
      
      <div style={{ padding: '24px', flex: 1 }}>
        {children}
      </div>
    </div>
  );
}
