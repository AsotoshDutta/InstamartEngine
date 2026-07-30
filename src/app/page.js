export default function Home() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a3e 50%, #0f0f23 100%)',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color: '#e0e0e0'
    }}>
      <div style={{ textAlign: 'center', maxWidth: 600, padding: '2rem' }}>
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: 700,
          background: 'linear-gradient(90deg, #ff6b35, #f7c948)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '0.5rem'
        }}>
          🔍 Discovery Engine
        </h1>
        <p style={{ fontSize: '1.1rem', color: '#a0a0b8', marginBottom: '2rem' }}>
          AI-Powered Feedback Analysis for Swiggy Instamart
        </p>
        <div style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <a href="/dashboard" style={{
            padding: '0.75rem 1.5rem',
            background: 'linear-gradient(135deg, #ff6b35, #e85d26)',
            color: 'white',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: 600,
            transition: 'transform 0.2s'
          }}>
            Open Dashboard →
          </a>
          <a href="/api/pipeline/status" style={{
            padding: '0.75rem 1.5rem',
            background: 'rgba(255,255,255,0.08)',
            color: '#e0e0e0',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: 500,
            border: '1px solid rgba(255,255,255,0.15)'
          }}>
            Pipeline Status
          </a>
        </div>
        <p style={{ fontSize: '0.8rem', color: '#606080', marginTop: '3rem' }}>
          Phase 1 — Data Collection Pipeline Active
        </p>
      </div>
    </div>
  );
}
