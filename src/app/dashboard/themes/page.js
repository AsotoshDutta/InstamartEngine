'use client';

import { useState, useEffect } from 'react';

export default function ThemeExplorer() {
  const [themes, setThemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    const fetchThemes = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/themes');
        if (res.ok) {
          const data = await res.json();
          setThemes(data.data || data.themes || (Array.isArray(data) ? data : []));
        }
      } catch (error) {
        console.error("Error fetching themes:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchThemes();
  }, []);

  const filteredThemes = themes.filter(theme => {
    const matchesFilter = filter === 'all' || theme.relevance?.toLowerCase() === filter;
    const matchesSearch = theme.label?.toLowerCase().includes(search.toLowerCase()) || 
                          theme.description?.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const styles = {
    container: {
      padding: '2rem',
      color: 'var(--text, #e0e0e0)',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    },
    header: {
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
    controls: {
      display: 'flex',
      gap: '1rem',
      marginTop: '1.5rem'
    },
    input: {
      background: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(255,255,255,0.1)',
      padding: '0.75rem 1rem',
      borderRadius: '8px',
      color: '#fff',
      flex: 1,
      outline: 'none'
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
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem'
    },
    card: {
      background: 'var(--bg-card, rgba(255,255,255,0.04))',
      borderRadius: '12px',
      padding: '1.5rem',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255,255,255,0.05)',
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
      transition: 'all 0.3s ease',
      cursor: 'pointer'
    },
    cardHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start'
    },
    themeLabel: {
      fontSize: '1.25rem',
      fontWeight: '600',
      marginBottom: '0.5rem',
      color: '#fff'
    },
    themeDesc: {
      color: '#aaa',
      fontSize: '0.95rem',
      marginBottom: '1rem',
      lineHeight: '1.5'
    },
    badgeGroup: {
      display: 'flex',
      gap: '0.5rem',
      flexWrap: 'wrap'
    },
    badge: {
      padding: '0.2rem 0.6rem',
      borderRadius: '4px',
      fontSize: '0.75rem',
      fontWeight: '600',
      background: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(255,255,255,0.1)'
    },
    badgeAccent: {
      background: 'rgba(255, 107, 53, 0.1)',
      color: '#ff6b35',
      border: '1px solid rgba(255, 107, 53, 0.2)'
    },
    quotesSection: {
      marginTop: '1.5rem',
      paddingTop: '1.5rem',
      borderTop: '1px solid rgba(255,255,255,0.1)'
    },
    quote: {
      background: 'rgba(0,0,0,0.2)',
      padding: '1rem',
      borderRadius: '8px',
      marginBottom: '0.5rem',
      fontStyle: 'italic',
      color: '#ccc',
      borderLeft: '3px solid #ff6b35'
    },
    loading: {
      textAlign: 'center',
      padding: '3rem',
      color: '#888'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>🔍 Theme Explorer</h1>
        <div style={styles.controls}>
          <input 
            type="text" 
            placeholder="Search themes..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={styles.input}
          />
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            style={styles.select}
          >
            <option value="all">All Relevance</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div style={styles.loading}>Loading themes... ⏳</div>
      ) : (
        <div style={styles.grid}>
          {filteredThemes.length === 0 ? (
            <div style={{color: '#888'}}>No themes found.</div>
          ) : (
            filteredThemes.map(theme => (
              <div 
                key={theme.id} 
                style={styles.card}
                onClick={() => setExpandedId(expandedId === theme.id ? null : theme.id)}
              >
                <div style={styles.cardHeader}>
                  <div style={{flex: 1}}>
                    <div style={styles.themeLabel}>{theme.label}</div>
                    <div style={styles.themeDesc}>{theme.description}</div>
                  </div>
                  <div style={{marginLeft: '1rem', color: '#ff6b35'}}>
                    {expandedId === theme.id ? '▲' : '▼'}
                  </div>
                </div>
                
                <div style={styles.badgeGroup}>
                  <span style={styles.badge}>📝 {theme.review_count} Mentions</span>
                  <span style={styles.badge}>🎭 {theme.sentiment}</span>
                  <span style={{...styles.badge, ...(theme.relevance === 'High' ? styles.badgeAccent : {})}}>
                    🎯 Relevance: {theme.relevance}
                  </span>
                  {theme.strategic_question && (
                    <span style={{...styles.badge, ...styles.badgeAccent}}>
                      ❓ {theme.strategic_question}
                    </span>
                  )}
                </div>

                {expandedId === theme.id && theme.representative_quotes && (
                  <div style={styles.quotesSection}>
                    <h4 style={{margin: '0 0 1rem 0', color: '#fff'}}>Representative Quotes</h4>
                    {theme.representative_quotes.map((quote, idx) => (
                      <div key={idx} style={styles.quote}>"{quote}"</div>
                    ))}
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
