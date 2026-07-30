'use client';

import { useState, useEffect } from 'react';

export default function InsightsDashboard() {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterImpact, setFilterImpact] = useState('all');

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/insights');
        if (res.ok) {
          const data = await res.json();
          setInsights(data.insights || []);
        }
      } catch (err) {
        console.error("Error fetching insights:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchInsights();
  }, []);

  // Sort by confidence score (descending)
  const sortedAndFiltered = insights
    .filter(insight => filterImpact === 'all' || insight.impact?.toLowerCase() === filterImpact)
    .sort((a, b) => (b.confidence_score || 0) - (a.confidence_score || 0));

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
      marginBottom: '2rem'
    },
    title: {
      fontSize: '2rem',
      fontWeight: '600',
      margin: 0,
      background: 'linear-gradient(90deg, #ff6b35, #ff9b71)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
    },
    select: {
      background: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(255,255,255,0.1)',
      padding: '0.75rem 1rem',
      borderRadius: '8px',
      color: '#fff',
      outline: 'none',
      cursor: 'pointer'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
      gap: '1.5rem'
    },
    card: {
      background: 'var(--bg-card, rgba(255,255,255,0.04))',
      borderRadius: '16px',
      padding: '1.5rem',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255,255,255,0.08)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      transition: 'transform 0.2s, box-shadow 0.2s'
    },
    insightTitle: {
      fontSize: '1.2rem',
      fontWeight: '600',
      color: '#fff',
      margin: 0
    },
    insightDesc: {
      color: '#aaa',
      fontSize: '0.95rem',
      lineHeight: '1.5'
    },
    metaRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      fontSize: '0.85rem'
    },
    badge: {
      padding: '0.2rem 0.5rem',
      borderRadius: '4px',
      background: 'rgba(255,255,255,0.1)',
      color: '#ddd'
    },
    badgeHigh: {
      background: 'rgba(255, 107, 53, 0.15)',
      color: '#ff6b35',
      border: '1px solid rgba(255, 107, 53, 0.3)'
    },
    actionBox: {
      background: 'rgba(255, 107, 53, 0.05)',
      borderLeft: '4px solid #ff6b35',
      padding: '1rem',
      borderRadius: '0 8px 8px 0',
      marginTop: 'auto'
    },
    actionLabel: {
      fontSize: '0.75rem',
      textTransform: 'uppercase',
      color: '#ff6b35',
      fontWeight: 'bold',
      marginBottom: '0.25rem'
    },
    progressBarContainer: {
      height: '6px',
      background: 'rgba(255,255,255,0.1)',
      borderRadius: '3px',
      overflow: 'hidden',
      marginTop: '0.25rem'
    },
    progressBarFill: (score) => ({
      height: '100%',
      width: `${score}%`,
      background: 'linear-gradient(90deg, #ff6b35, #ff9b71)',
      borderRadius: '3px'
    }),
    loading: {
      textAlign: 'center',
      padding: '3rem',
      color: '#888'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>💡 Strategic Insights</h1>
        <select 
          value={filterImpact} 
          onChange={(e) => setFilterImpact(e.target.value)}
          style={styles.select}
        >
          <option value="all">All Impacts</option>
          <option value="high">High Impact</option>
          <option value="medium">Medium Impact</option>
          <option value="low">Low Impact</option>
        </select>
      </div>

      {loading ? (
        <div style={styles.loading}>Generating insights... 🧠</div>
      ) : (
        <div style={styles.grid}>
          {sortedAndFiltered.length === 0 ? (
            <div style={{color: '#888'}}>No insights available.</div>
          ) : (
            sortedAndFiltered.map(insight => (
              <div key={insight.id} style={styles.card}>
                <div>
                  <h3 style={styles.insightTitle}>{insight.title}</h3>
                  <div style={{marginTop: '0.5rem', display: 'flex', gap: '0.5rem'}}>
                    <span style={{...styles.badge, ...(insight.impact?.toLowerCase() === 'high' ? styles.badgeHigh : {})}}>
                      Impact: {insight.impact}
                    </span>
                    {insight.user_segment && (
                      <span style={styles.badge}>👥 {insight.user_segment}</span>
                    )}
                  </div>
                </div>
                
                <p style={styles.insightDesc}>{insight.description}</p>
                
                <div style={styles.actionBox}>
                  <div style={styles.actionLabel}>Recommended Action</div>
                  <div style={{fontSize: '0.9rem', color: '#eee'}}>{insight.recommended_action}</div>
                </div>

                <div style={styles.metaRow}>
                  <div style={{flex: 1, marginRight: '1rem'}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem'}}>
                      <span>Confidence</span>
                      <span>{insight.confidence_score}%</span>
                    </div>
                    <div style={styles.progressBarContainer}>
                      <div style={styles.progressBarFill(insight.confidence_score || 0)}></div>
                    </div>
                  </div>
                </div>
                
                {insight.strategic_question && (
                  <div style={{fontSize: '0.8rem', color: '#888', fontStyle: 'italic', marginTop: '0.5rem'}}>
                    Relates to: {insight.strategic_question}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
