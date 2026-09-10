export default function About() {
  return (
    <>
      <div className="card">
        <div className="card-title">Welcome to PiHound</div>
        <p className="muted" style={{ lineHeight: 1.6, fontSize: '0.9rem' }}>
          PiHound is a deep investigative analytics toolkit engineered specifically for analyzing Pi Network mainnet activity. It empowers Pioneers and security researchers with transparent transaction tracing, live sweep monitoring, and visual bubble maps.
        </p>
      </div>

      <div className="card">
        <h3 style={{ color: 'var(--accent)', marginBottom: '0.75rem' }}>
          Core Investigative Tools
        </h3>
        <ul style={{ paddingLeft: '1.25rem', lineHeight: 1.8, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          <li>
            <strong>Home Explorer:</strong> Live market data, wallet balance inspection, lockup schedules, and transaction history.
          </li>
          <li>
            <strong>Track &amp; Trace:</strong> Follow 64-character transaction hashes across multi-hop payment trails in a visual branch tree layout.
          </li>
          <li>
            <strong>BubbleMap:</strong> Interactive D3 force graph visualizer mapping account flows and wallet interactions.
          </li>
          <li>
            <strong>Wallet Sweeps:</strong> Real-time indexing and statistical summaries of 2 in 1 claim/send sweep operations.
          </li>
        </ul>
      </div>

      <div className="card">
        <h3 style={{ color: 'var(--accent)', marginBottom: '0.75rem' }}>
          Read-Only Architecture
        </h3>
        <p className="muted" style={{ lineHeight: 1.6, fontSize: '0.9rem' }}>
          PiHound operates on a 100% read-only architecture. All blockchain data is queried server-side, ensuring your secret keys remain safe and are never requested or stored.
        </p>
      </div>
    </>
  );
}
