export default function Faq() {
  return (
    <>
      <div className="card">
        <div className="card-title">Frequently Asked Questions (FAQ)</div>
        <p className="muted" style={{ fontSize: '0.85rem' }}>
          Find answers to common questions about PiHound analytics and tracing tools.
        </p>
      </div>

      <div className="card">
        <h3 style={{ color: 'var(--accent)', marginBottom: '0.5rem' }}>
          Q: How does Track &amp; Trace work?
        </h3>
        <p className="muted" style={{ lineHeight: 1.6, fontSize: '0.9rem' }}>
          Track &amp; Trace accepts a 64-character transaction hash (hexadecimal string) exclusively. It follows payment routes across connected nodes in a visual branch tree layout, tracing up to 20 payment hops to uncover destination exchanges and linked wallets.
        </p>
      </div>

      <div className="card">
        <h3 style={{ color: 'var(--accent)', marginBottom: '0.5rem' }}>
          Q: Does PiHound require my wallet secret key?
        </h3>
        <p className="muted" style={{ lineHeight: 1.6, fontSize: '0.9rem' }}>
          No! PiHound is strictly read-only. All data is queried from public on-chain ledger records via the backend. Never enter your 56-character secret key (<code className="mono">S...</code>) anywhere on the internet.
        </p>
      </div>

      <div className="card">
        <h3 style={{ color: 'var(--accent)', marginBottom: '0.5rem' }}>
          Q: What are Muxed (M...) Addresses?
        </h3>
        <p className="muted" style={{ lineHeight: 1.6, fontSize: '0.9rem' }}>
          Muxed addresses (starting with <code className="mono">M...</code>) wrap a base public key (<code className="mono">G...</code>) alongside a 64-bit memo ID, commonly used by exchanges to attribute deposit transactions to specific accounts. PiHound automatically resolves M-addresses to their underlying base G-addresses.
        </p>
      </div>

      <div className="card">
        <h3 style={{ color: 'var(--accent)', marginBottom: '0.5rem' }}>
          Q: How often is live data refreshed?
        </h3>
        <p className="muted" style={{ lineHeight: 1.6, fontSize: '0.9rem' }}>
          Wallet Sweeps feeds update in real-time as the backend continuously crawls and indexes newly validated blocks and ledgers on the Pi Network.
        </p>
      </div>
    </>
  );
}
