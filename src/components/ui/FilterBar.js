'use client';

import React from 'react';
import Button from './Button';

export default function FilterBar({ filters = [], onReset }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '16px',
      padding: '16px 20px',
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-md)',
      marginBottom: '24px'
    }}>
      <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '500' }}>
        Filters:
      </div>
      
      {filters.map((filter, idx) => (
        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{filter.label}</label>
          <select 
            value={filter.value} 
            onChange={(e) => filter.onChange(e.target.value)}
            style={{
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              padding: '6px 12px',
              fontSize: '0.9rem',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            {filter.options.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      ))}

      {onReset && (
        <div style={{ marginLeft: 'auto' }}>
          <Button variant="ghost" onClick={onReset}>
            Reset Filters
          </Button>
        </div>
      )}
    </div>
  );
}
