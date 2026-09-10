export default function Terms() {
  return (
    <>
      <div className="card">
        <div className="card-title">Terms of Service</div>
        <p className="muted" style={{ fontSize: '0.85rem' }}>
          Last updated: July 2026
        </p>
      </div>

      <div className="card">
        <h3 style={{ color: 'var(--accent)', marginBottom: '0.75rem' }}>
          1. Acceptance of Terms
        </h3>
        <p className="muted" style={{ lineHeight: 1.6, fontSize: '0.9rem' }}>
          By accessing and using PiHound, you agree to comply with and be bound by these Terms of Service. PiHound provides read-only blockchain analysis, transaction tracing, and node monitoring for the Pi Network ecosystem.
        </p>
      </div>

      <div className="card">
        <h3 style={{ color: 'var(--accent)', marginBottom: '0.75rem' }}>
          2. Read-Only Transparency &amp; Data Usage
        </h3>
        <p className="muted" style={{ lineHeight: 1.6, fontSize: '0.9rem' }}>
          All data displayed on PiHound is served through the PiHound backend API from publicly indexed Pi Network ledger records. PiHound never asks for, stores, or handles private keys, seed phrases, or wallet credentials.
        </p>
      </div>

      <div className="card">
        <h3 style={{ color: 'var(--accent)', marginBottom: '0.75rem' }}>
          3. Limitation of Liability
        </h3>
        <p className="muted" style={{ lineHeight: 1.6, fontSize: '0.9rem' }}>
          PiHound is an open-source investigative tool provided &quot;as is&quot; without warranty of any kind. Users are responsible for verifying transaction information on-chain before taking any investigative or commercial actions.
        </p>
      </div>
    </>
  );
}
