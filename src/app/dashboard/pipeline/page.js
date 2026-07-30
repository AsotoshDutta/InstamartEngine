'use client';

import { useState, useEffect } from 'react';

export default function PipelineControls() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [responseLog, setResponseLog] = useState('');
  const [secret, setSecret] = useState('dev-secret-change-in-production');

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/pipeline/status');
      if (res.ok) {
        const data = await res.json();
        setStatus(data.status);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const handleAction = async (endpoint, method = 'POST') => {
    setActionLoading(endpoint);
    setResponseLog(`Starting ${endpoint}...\n`);
    try {
      const url = `${endpoint}?cron_secret=${secret}`;
      const options = {
        method,
        headers: {
          'Authorization': `Bearer ${secret}`
        }
      };
      
      const res = await fetch(url, options);
      const data = await res.json();
      
      setResponseLog(prev => prev + `Status: ${res.status}\nResponse: ${JSON.stringify(data, null, 2)}`);
      fetchStatus();
    } catch (err) {
      setResponseLog(prev => prev + `Error: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const styles = {
    container: {
      padding: '2rem',
      color: 'var(--text, #e0e0e0)',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      maxWidth: '1000px',
      margin: '0 auto'
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
    statusCard: {
      background: 'var(--bg-card, rgba(255,255,255,0.04))',
      borderRadius: '12px',
      padding: '1.5rem',
      border: '1px solid rgba(255,255,255,0.1)',
      marginBottom: '2rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    statusBadge: (state) => ({
      padding: '0.5rem 1rem',
      borderRadius: '20px',
      fontSize: '0.9rem',
      fontWeight: 'bold',
      background: state === 'idle' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255, 152, 0, 0.1)',
      color: state === 'idle' ? '#4caf50' : '#ff9800',
      border: `1px solid ${state === 'idle' ? 'rgba(76, 175, 80, 0.3)' : 'rgba(255, 152, 0, 0.3)'}`,
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.5rem'
    }),
    controlsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '1rem',
      marginBottom: '2rem'
    },
    btn: {
      background: 'rgba(255, 255, 255, 0.05)',
      color: '#fff',
      border: '1px solid rgba(255,255,255,0.1)',
      padding: '1rem',
      borderRadius: '8px',
      fontSize: '1rem',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem'
    },
    btnPrimary: {
      background: 'linear-gradient(90deg, #ff6b35, #ff4e00)',
      border: 'none',
      color: '#fff'
    },
    logViewer: {
      background: '#000',
      color: '#0f0',
      fontFamily: 'monospace',
      padding: '1rem',
      borderRadius: '8px',
      minHeight: '200px',
      whiteSpace: 'pre-wrap',
      overflowX: 'auto',
      border: '1px solid #333'
    },
    spinner: {
      display: 'inline-block',
      width: '16px',
      height: '16px',
      border: '2px solid rgba(255,255,255,0.3)',
      borderRadius: '50%',
      borderTopColor: '#fff',
      animation: 'spin 1s ease-in-out infinite'
    },
    input: {
      background: 'rgba(0,0,0,0.2)',
      border: '1px solid rgba(255,255,255,0.1)',
      color: '#fff',
      padding: '0.5rem 1rem',
      borderRadius: '4px',
      width: '300px'
    }
  };

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .btn-hover:hover {
          background: rgba(255,255,255,0.1) !important;
        }
        .btn-primary-hover:hover {
          opacity: 0.9;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3);
        }
      `}</style>
      
      <h1 style={styles.title}>⚡ Pipeline Controls</h1>

      <div style={styles.statusCard}>
        <div>
          <h3 style={{margin: '0 0 0.5rem 0', color: '#fff'}}>System Status</h3>
          <div style={{color: '#aaa', fontSize: '0.9rem'}}>
            Last Run: {status?.last_run ? new Date(status.last_run).toLocaleString() : 'Never'}
          </div>
        </div>
        
        {loading ? (
          <div style={styles.spinner}></div>
        ) : (
          <div style={styles.statusBadge(status?.status || 'idle')}>
            {status?.status === 'idle' ? '🟢 Ready' : '🟡 Processing'}
          </div>
        )}
      </div>

      <div style={{marginBottom: '2rem'}}>
        <label style={{display: 'block', marginBottom: '0.5rem', color: '#aaa', fontSize: '0.9rem'}}>
          Admin Secret (cron_secret)
        </label>
        <input 
          type="password" 
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          style={styles.input}
        />
      </div>

      <div style={styles.controlsGrid}>
        <button 
          className="btn-hover"
          style={styles.btn}
          onClick={() => handleAction('/api/pipeline/collect', 'POST')}
          disabled={!!actionLoading}
        >
          {actionLoading === '/api/pipeline/collect' ? <span style={styles.spinner}></span> : '📥'} 
          Run Collection Only
        </button>
        
        <button 
          className="btn-hover"
          style={styles.btn}
          onClick={() => handleAction('/api/pipeline/analyze', 'POST')}
          disabled={!!actionLoading}
        >
          {actionLoading === '/api/pipeline/analyze' ? <span style={styles.spinner}></span> : '🧠'} 
          Run Analysis Only
        </button>

        <button 
          className="btn-primary-hover"
          style={{...styles.btn, ...styles.btnPrimary}}
          onClick={() => handleAction('/api/pipeline/run', 'GET')}
          disabled={!!actionLoading}
        >
          {actionLoading === '/api/pipeline/run' ? <span style={styles.spinner}></span> : '🚀'} 
          Run Full Pipeline
        </button>
      </div>

      <div>
        <h3 style={{color: '#fff', marginBottom: '1rem'}}>Execution Logs</h3>
        <div style={styles.logViewer}>
          {responseLog || '> Ready to execute commands...'}
        </div>
      </div>
    </div>
  );
}
