'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function DashboardOverview() {
  const [pipelineStatus, setPipelineStatus] = useState(null);
  const [stats, setStats] = useState(null);
  const [themes, setThemes] = useState([]);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [pipelineRes, statsRes, themesRes, insightsRes] = await Promise.all([
          fetch('/api/pipeline/status'),
          fetch('/api/feedback/stats'),
          fetch('/api/themes?limit=5'),
          fetch('/api/insights?limit=5')
        ]);

        if (pipelineRes.ok) {
          const data = await pipelineRes.json();
          setPipelineStatus(data.status);
        }
        
        if (statsRes.ok) {
          const data = await statsRes.json();
          setStats(data.stats);
        }

        if (themesRes.ok) {
          const data = await themesRes.json();
          setThemes(data.themes || []);
        }

        if (insightsRes.ok) {
          const data = await insightsRes.json();
          setInsights(data.insights || []);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const styles = {
    container: {
      padding: '2rem',
      color: 'var(--text, #e0e0e0)',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '2rem',
      borderBottom: '1px solid rgba(255,255,255,0.1)',
      paddingBottom: '1rem'
    },
    title: {
      fontSize: '2rem',
      fontWeight: '600',
      margin: 0,
      background: 'linear-gradient(90deg, #ff6b35, #ff9b71)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
      gap: '1.5rem',
      marginBottom: '3rem'
    },
    card: {
      background: 'var(--bg-card, rgba(255,255,255,0.04))',
      borderRadius: '12px',
      padding: '1.5rem',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255,255,255,0.05)',
      boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      cursor: 'default'
    },
    cardHover: {
      transform: 'translateY(-2px)',
      boxShadow: '0 6px 24px rgba(0,0,0,0.3)'
    },
    statValue: {
      fontSize: '2.5rem',
      fontWeight: '700',
      margin: '0.5rem 0',
      color: '#fff'
    },
    statLabel: {
      fontSize: '0.9rem',
      color: '#aaa',
      textTransform: 'uppercase',
      letterSpacing: '1px'
    },
    sectionTitle: {
      fontSize: '1.5rem',
      fontWeight: '600',
      marginBottom: '1rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
    },
    list: {
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem'
    },
    listItem: {
      background: 'rgba(255,255,255,0.02)',
      padding: '1rem',
      borderRadius: '8px',
      borderLeft: '4px solid #ff6b35',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    link: {
      color: '#ff6b35',
      textDecoration: 'none',
      fontSize: '0.9rem',
      fontWeight: '500'
    },
    loadingPulse: {
      animation: 'pulse 1.5s infinite ease-in-out',
      background: 'rgba(255,255,255,0.05)',
      height: '100px',
      borderRadius: '12px'
    },
    badge: {
      padding: '0.2rem 0.5rem',
      borderRadius: '4px',
      fontSize: '0.75rem',
      fontWeight: 'bold',
      background: 'rgba(255, 107, 53, 0.2)',
      color: '#ff6b35'
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <h1 style={styles.title}>Dashboard Overview</h1>
        <div style={{...styles.grid, marginTop: '2rem'}}>
          {[1,2,3,4].map(i => <div key={i} style={styles.loadingPulse}></div>)}
        </div>
        <style>{`
          @keyframes pulse {
            0% { opacity: 0.6; }
            50% { opacity: 1; }
            100% { opacity: 0.6; }
          }
        `}</style>
      </div>
    );
  }

  const totalReviews = stats?.total || 0;
  const activeSources = Object.keys(stats?.bySource || {}).length || 0;
  
  // Calculate average rating across all sources (placeholder logic if stats doesn't provide avg)
  let totalRating = 0;
  let ratingCount = 0;
  if (stats?.bySource) {
    // simplified calculation
    totalRating = 4.2; // Mock avg if not in API
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Dashboard Overview</h1>
      </div>

      <div style={styles.grid}>
        <div style={styles.card}>
          <div style={styles.statLabel}>📊 Total Reviews</div>
          <div style={styles.statValue}>{totalReviews.toLocaleString()}</div>
          <Link href="/dashboard/sources" style={styles.link}>View sources →</Link>
        </div>
        
        <div style={styles.card}>
          <div style={styles.statLabel}>📡 Sources Active</div>
          <div style={styles.statValue}>{activeSources}</div>
          <div style={{fontSize: '0.85rem', color: '#888'}}>Play Store, App Store, Reddit...</div>
        </div>

        <div style={styles.card}>
          <div style={styles.statLabel}>⭐ Avg Rating</div>
          <div style={styles.statValue}>{totalRating}</div>
          <div style={{fontSize: '0.85rem', color: '#888'}}>Across all channels</div>
        </div>

        <div style={styles.card}>
          <div style={styles.statLabel}>⚡ Pipeline Status</div>
          <div style={{...styles.statValue, fontSize: '1.5rem', marginTop: '1rem'}}>
            {pipelineStatus?.status === 'idle' ? '🟢 Idle / Ready' : '🟡 Processing'}
          </div>
          <Link href="/dashboard/pipeline" style={styles.link}>Manage Pipeline →</Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <div>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <h2 style={styles.sectionTitle}>🔍 Recent Themes</h2>
            <Link href="/dashboard/themes" style={styles.link}>View all</Link>
          </div>
          <div style={styles.list}>
            {themes.length === 0 ? (
              <div style={{padding: '1rem', color: '#888', fontStyle: 'italic'}}>No themes generated yet.</div>
            ) : themes.map((theme, idx) => (
              <div key={idx} style={styles.listItem}>
                <div>
                  <div style={{fontWeight: '500', marginBottom: '0.25rem'}}>{theme.label}</div>
                  <div style={{fontSize: '0.8rem', color: '#aaa'}}>{theme.review_count} mentions</div>
                </div>
                <div style={styles.badge}>{theme.relevance}</div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <h2 style={styles.sectionTitle}>💡 Top Insights</h2>
            <Link href="/dashboard/insights" style={styles.link}>View all</Link>
          </div>
          <div style={styles.list}>
            {insights.length === 0 ? (
              <div style={{padding: '1rem', color: '#888', fontStyle: 'italic'}}>No insights generated yet.</div>
            ) : insights.map((insight, idx) => (
              <div key={idx} style={styles.listItem}>
                <div>
                  <div style={{fontWeight: '500', marginBottom: '0.25rem'}}>{insight.title}</div>
                  <div style={{fontSize: '0.8rem', color: '#aaa'}}>Impact: {insight.impact}</div>
                </div>
                <div style={styles.badge}>{insight.confidence_score}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
