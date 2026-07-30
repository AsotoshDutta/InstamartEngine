'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { name: 'Overview', path: '/dashboard', icon: '📊' },
    { name: 'Themes', path: '/dashboard/themes', icon: '🎨' },
    { name: 'Insights', path: '/dashboard/insights', icon: '💡' },
    { name: 'Sources', path: '/dashboard/sources', icon: '🌐' },
    { name: 'Pipeline', path: '/dashboard/pipeline', icon: '⚙️' },
  ];

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
      {/* Sidebar */}
      <aside style={{
        width: '240px',
        backgroundColor: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        height: '100vh',
        zIndex: 50,
        transition: 'transform 0.3s ease',
        transform: `translateX(${mobileMenuOpen ? '0' : '0'})` // Handle mobile logic with CSS if needed, simplified here
      }} className={`sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        
        <div style={{ padding: '24px', borderBottom: '1px solid var(--border)' }}>
          <h1 style={{ fontSize: '1.25rem', fontWeight: '700', margin: 0 }} className="text-gradient">
            Discovery Engine
          </h1>
        </div>
        
        <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {navItems.map((item) => {
            const isActive = pathname === item.path || (pathname?.startsWith(item.path + '/') && item.path !== '/dashboard');
            return (
              <Link key={item.name} href={item.path} onClick={() => setMobileMenuOpen(false)}>
                <div style={{
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  backgroundColor: isActive ? 'var(--bg-card)' : 'transparent',
                  border: isActive ? '1px solid var(--border)' : '1px solid transparent',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer'
                }}
                onMouseOver={(e) => { if (!isActive) { e.currentTarget.style.backgroundColor = 'var(--bg-card)'; } }}
                onMouseOut={(e) => { if (!isActive) { e.currentTarget.style.backgroundColor = 'transparent'; } }}
                >
                  <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
                  <span style={{ fontWeight: isActive ? '600' : '500' }}>{item.name}</span>
                </div>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main style={{ 
        flex: 1, 
        marginLeft: '240px',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh'
      }}>
        {/* Mobile Header */}
        <header style={{
          display: 'none',
          padding: '16px',
          borderBottom: '1px solid var(--border)',
          backgroundColor: 'var(--bg-secondary)',
          alignItems: 'center',
          justifyContent: 'space-between'
        }} className="mobile-header">
          <h1 style={{ fontSize: '1.25rem', fontWeight: '700', margin: 0 }} className="text-gradient">
            Discovery Engine
          </h1>
          <button onClick={toggleMobileMenu} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '1.5rem', cursor: 'pointer' }}>
            ☰
          </button>
        </header>

        <div style={{ padding: '32px', flex: 1 }}>
          {children}
        </div>
      </main>

      <style jsx>{`
        @media (max-width: 768px) {
          .sidebar {
            transform: translateX(-100%) !important;
          }
          .sidebar.open {
            transform: translateX(0) !important;
          }
          main {
            marginLeft: 0 !important;
          }
          .mobile-header {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  );
}
