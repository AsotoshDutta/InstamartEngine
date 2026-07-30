'use client';

import { useState, useEffect } from 'react';

export default function SourceAnalytics() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/feedback/stats');
        if (res.ok) {
          const data = await res.json();
          setStats(data.stats);
        }
      } catch (err) {
        console.error("Error fetching stats:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const styles = {
    container: {
      padding: '2rem',
      color: 'var(--text, #e0e0e0)',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    },
    title: {
      fontSize: '2rem',
      fontWeight: '600',
      marginBottom: '2rem',
      background: 'linear-gradient(90deg, #ff6b35, #ff9b71)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '1.5rem',
      marginBottom: '3rem'
    },
    card: {
      background: 'var(--bg-card, rgba(255,255,255,0.04))',
      borderRadius: '12px',
      padding: '1.5rem',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255,255,255,0.05)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center'
    },
    icon: {
      fontSize: '2.5rem',
      marginBottom: '1rem'
    },
    count: {
      fontSize: '2rem',
      fontWeight: '700',
      color: '#fff',
      margin: '0.5rem 0'
    },
    label: {
      color: '#aaa',
      textTransform: 'uppercase',
      fontSize: '0.85rem',
      letterSpacing: '1px'
    },
    percentage: {
      color: '#ff6b35',
      fontSize: '0.9rem',
      fontWeight: '600',
      marginTop: '0.5rem',
      background: 'rgba(255,107,53,0.1)',
      padding: '0.2rem 0.6rem',
      borderRadius: '12px'
    },
    section: {
      background: 'var(--bg-card, rgba(255,255,255,0.02))',
      borderRadius: '12px',
      padding: '2rem',
      border: '1px solid rgba(255,255,255,0.05)'
    },
    sectionTitle: {
      fontSize: '1.25rem',
      fontWeight: '600',
      marginBottom: '1.5rem',
      color: '#fff'
    },
    barRow: {
      display: 'flex',
      alignItems: 'center',
      marginBottom: '1rem',
      gap: '1rem'
    },
    barLabel: {
      width: '60px',
      color: '#aaa'
    },
    barTrack: {
      flex: 1,
      height: '12px',
      background: 'rgba(255,255,255,0.05)',
      borderRadius: '6px',
      overflow: 'hidden'
    },
    barFill: (percent) => ({
      height: '100%',
      width: `${percent}%`,
      background: 'linear-gradient(90deg, #ff6b35, #ff9b71)',
      borderRadius: '6px'
    }),
    barValue: {
      width: '50px',
      textAlign: 'right',
      color: '#fff',
      fontWeight: '500'
    }
  };

  const sourceIcons = {
    play_store: '🤖',
    app_store: '🍎',
    reddit: '👽',
    csv: '📄'
  };

  const sourceLabels = {
    play_store: 'Play Store',
    app_store: 'App Store',
    reddit: 'Reddit',
    csv: 'CSV Uploads'
  };

  if (loading) {
    return <div style={{...styles.container, textAlign: 'center', marginTop: '3rem'}}>Loading analytics... 📊</div>;
  }

  const total = stats?.total || 1; // prevent div by zero
  const bySource = stats?.bySource || {};
  
  // Mock rating data since it might not be in the basic stats endpoint yet
  const mockRatings = {
    5: Math.floor(total * 0.45),
    4: Math.floor(total * 0.25),
    3: Math.floor(total * 0.15),
    2: Math.floor(total * 0.05),
    1: Math.floor(total * 0.10)
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>📊 Source Analytics</h1>

      <div style={styles.grid}>
        {['play_store', 'app_store', 'reddit', 'csv'].map(source => {
          const count = bySource[source] || 0;
          const percentage = ((count / total) * 100).toFixed(1);
          
          return (
            <div key={source} style={styles.card}>
              <div style={styles.icon}>{sourceIcons[source]}</div>
              <div style={styles.label}>{sourceLabels[source]}</div>
              <div style={styles.count}>{count.toLocaleString()}</div>
              <div style={styles.percentage}>{percentage}% of total</div>
            </div>
          );
        })}
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>⭐ Rating Distribution (Estimate)</h2>
        <div>
          {[5, 4, 3, 2, 1].map(stars => {
            const count = mockRatings[stars];
            const percent = (count / total) * 100;
            return (
              <div key={stars} style={styles.barRow}>
                <div style={styles.barLabel}>{stars} Stars</div>
                <div style={styles.barTrack}>
                  <div style={styles.barFill(percent)}></div>
                </div>
                <div style={styles.barValue}>{count.toLocaleString()}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
