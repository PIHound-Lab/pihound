export default function Privacy() {
  return (
    <>
      <div className="card">
        <div className="card-title">Privacy Policy</div>
        <p className="muted" style={{ fontSize: '0.85rem' }}>
          Last updated: July 2026
        </p>
      </div>

      <div className="card">
        <h3 style={{ color: 'var(--accent)', marginBottom: '0.75rem' }}>
          1. No Personal Data Collection
        </h3>
        <p className="muted" style={{ lineHeight: 1.6, fontSize: '0.9rem' }}>
          PiHound does not require user accounts, emails, or personal identification. We prioritize privacy and operate entirely on public blockchain data retrieved directly from the Pi Network Mainnet.
        </p>
      </div>

      <div className="card">
        <h3 style={{ color: 'var(--accent)', marginBottom: '0.75rem' }}>
          2. Cookies &amp; Local Preferences
        </h3>
        <p className="muted" style={{ lineHeight: 1.6, fontSize: '0.9rem' }}>
          We use local storage strictly to persist client-side user preferences such as Dark/Light theme mode (<code className="mono">pihound_theme</code>) and recent trace history.
        </p>
      </div>

      <div className="card">
        <h3 style={{ color: 'var(--accent)', marginBottom: '0.75rem' }}>
          3. Public On-Chain Information
        </h3>
        <p className="muted" style={{ lineHeight: 1.6, fontSize: '0.9rem' }}>
          All transactions, wallet balances, and ledger entries searched or traced on PiHound are immutable public records on the Pi Network blockchain.
        </p>
      </div>
    </>
  );
}
