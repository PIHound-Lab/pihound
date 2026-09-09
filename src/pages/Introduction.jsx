import { Link } from 'react-router-dom';

export default function Introduction() {
  return (
    <>
      {/* Hero Section */}
      <div className="intro-hero">
        <h1 className="intro-title">
          Track, Analyze, and Explore — <br />
          All in One Place
        </h1>

        <p className="intro-subtitle">
          A deep investigative tool to trace, analyze, and monitor transactions and wallet activity on the Pi Network.
        </p>

        <div className="intro-cta-group">
          <Link
            to="/home"
            className="btn btn-primary"
            style={{ padding: '0.75rem 1.6rem', fontSize: '0.95rem', borderRadius: '8px' }}
          >
            Get started →
          </Link>
        </div>
      </div>

      {/* 3 Core Feature Cards Grid */}
      <div className="intro-card-grid">
        {/* Card 1: Track & Trace */}
        <div className="intro-card">
          <div>
            <div className="intro-card-icon">
              <svg width="30" height="30" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <div className="intro-card-title">Track & Trace</div>
            <p className="intro-card-desc">
              Trace transactions across multi-hop paths, uncover exchange endpoints, and map fund movement across Pi wallets.
            </p>
          </div>
          <Link to="/track_and_trace" className="intro-card-link">
            Launch Tracer →
          </Link>
        </div>

        {/* Card 2: Live Sweeps */}
        <div className="intro-card">
          <div>
            <div className="intro-card-icon">
              <span style={{ fontSize: '32px', lineHeight: 1 }} role="img" aria-label="Evil face">😈</span>
            </div>
            <div className="intro-card-title">Live Sweeps Monitor</div>
            <p className="intro-card-desc">
              Real-time operation stream tracking claims and automated sends across the Pi Horizon network.
            </p>
          </div>
          <Link to="/wallet_sweeps" className="intro-card-link">
            View Sweeps Feed →
          </Link>
        </div>

        {/* Card 3: Interactive BubbleMap */}
        <div className="intro-card">
          <div>
            <div className="intro-card-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="4" fill="currentColor" fillOpacity="0.15" />
                <circle cx="5" cy="7" r="3" />
                <circle cx="19" cy="8" r="2.5" />
                <circle cx="17" cy="18" r="3" />
                <circle cx="6" cy="18" r="2" />
                <line x1="7.6" y1="8.6" x2="9.5" y2="10.2" />
                <line x1="14.6" y1="9.8" x2="16.7" y2="8.8" />
                <line x1="14.8" y1="14.8" x2="16.2" y2="16" />
                <line x1="8" y1="17" x2="9.8" y2="14.8" />
              </svg>
            </div>
            <div className="intro-card-title">Visual BubbleMap</div>
            <p className="intro-card-desc">
              Interactive D3 force-directed visualizer mapping complex address relationship clusters and token transfers.
            </p>
          </div>
          <Link to="/bubblemap" className="intro-card-link">
            Open BubbleMap →
          </Link>
        </div>
      </div>

      {/* Toolkit Summary Banner */}
      <div className="toolkit-banner">
        <div
          style={{
            fontSize: '0.8rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--accent)',
            marginBottom: '0.5rem',
          }}
        >
          Open Investigative Platform
        </div>
        <h3
          style={{
            fontSize: '1.25rem',
            fontWeight: 700,
            color: 'var(--text-main)',
            marginBottom: '0.75rem',
          }}
        >
          Built for Pioneers, Analysts, and Developers
        </h3>
        <p
          className="dim"
          style={{
            fontSize: '0.88rem',
            lineHeight: 1.6,
            maxWidth: '800px',
            marginBottom: 0,
          }}
        >
          PiHound directly queries the official Pi Horizon RPC (
          <span className="mono" style={{ color: 'var(--text-main)' }}>
            api.mainnet.minepi.com
          </span>
          ) to deliver transparent, unmanipulated transaction tracking, live sweeps monitoring, and wallet analytics.
        </p>
      </div>
    </>
  );
}
