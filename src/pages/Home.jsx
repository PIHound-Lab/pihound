import { useEffect, useState } from 'react';
import PriceChart from '../components/charts/PriceChart';
import { fetchNetworkStats, fetchPrice, fetchPriceHistory } from '../services/api';

export default function Home() {
  const [timeframe, setTimeframe] = useState('D');
  const [priceData, setPriceData] = useState({ price_usd: 0.8542, change_24h: 3.42 });
  const [historyPoints, setHistoryPoints] = useState([]);
  const [networkStats, setNetworkStats] = useState({
    accounts: '15482910',
    locked: '6855210940.12',
    circulating: '313840120.45',
    pioneer_transfers: '302290.80',
  });

  useEffect(() => {
    fetchPrice().then(setPriceData);
    fetchNetworkStats().then(setNetworkStats);
  }, []);

  useEffect(() => {
    fetchPriceHistory(timeframe).then(setHistoryPoints);
  }, [timeframe]);

  const formatStat = (val) => {
    const n = Number(val);
    if (isNaN(n)) return val;
    if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
    if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
    return n.toLocaleString();
  };

  const isPositiveChange = (priceData.change_24h || 0) >= 0;

  const lockedVal = Number(networkStats.locked || 6188601569);
  const circulatingVal = Number(networkStats.circulating || 11015608971);
  const totalTrackedSupply = lockedVal + circulatingVal || 17204210540;
  const lockedPct = ((lockedVal / totalTrackedSupply) * 100).toFixed(1);
  const circulatingPct = ((circulatingVal / totalTrackedSupply) * 100).toFixed(1);

  return (
    <>
      {/* Hero Section */}
      <div className="intro-hero" style={{ padding: '2rem 1rem 1.5rem', maxWidth: '850px' }}>
        <h1 className="intro-title" style={{ fontSize: '2.5rem', marginBottom: '0.85rem' }}>
          Track, Analyze, and Explore — <br />
          All in One Place
        </h1>

        <p className="intro-subtitle" style={{ marginBottom: '1.75rem', fontSize: '1.05rem' }}>
          A deep investigative analytics suite to trace transactions, analyze market metrics, and monitor live wallet activity across the Pi Network.
        </p>
      </div>

      {/* Pi Market Price & Analytics Chart */}
      <div style={{ marginBottom: '2rem' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            marginBottom: '0.75rem',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
        >
          <div>
            <span className="card-title" style={{ marginBottom: '0.25rem' }}>
              Pi Market Analytics
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem' }}>
              <span
                id="price-usd"
                style={{
                  fontSize: '1.75rem',
                  fontWeight: 800,
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-main)',
                }}
              >
                ${Number(priceData.price_usd || 0.8542).toFixed(4)}
              </span>
              <span
                id="price-change"
                className="mono"
                style={{
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  color: isPositiveChange ? 'var(--accent)' : 'var(--text-muted)',
                }}
              >
                {isPositiveChange ? '+' : ''}
                {Number(priceData.change_24h || 3.42).toFixed(2)}%
              </span>
            </div>
          </div>
          <div className="tab-row" style={{ marginTop: 0 }}>
            <button
              type="button"
              className={`tab-btn ${timeframe === 'D' ? 'active' : ''}`}
              onClick={() => setTimeframe('D')}
            >
              24H
            </button>
            <button
              type="button"
              className={`tab-btn ${timeframe === 'W' ? 'active' : ''}`}
              onClick={() => setTimeframe('W')}
            >
              7D
            </button>
            <button
              type="button"
              className={`tab-btn ${timeframe === 'M' ? 'active' : ''}`}
              onClick={() => setTimeframe('M')}
            >
              30D
            </button>
          </div>
        </div>

        {/* SVG Price Chart */}
        <PriceChart points={historyPoints} />
      </div>

      {/* Stat Grid */}
      <div className="stat-grid" id="network-stats">
        <div className="stat-card-clean">
          <div className="stat-top">
            <span className="stat-label">Total Accounts</span>
          </div>
          <div className="stat-value" id="stat-accounts">
            {formatStat(networkStats.accounts || '15000000')}
          </div>
        </div>

        <div className="stat-card-clean">
          <div className="stat-top">
            <span className="stat-label">Locked Supply</span>
          </div>
          <div className="stat-value" id="stat-locked">
            {formatStat(networkStats.locked || '6188601569')} π
          </div>
        </div>

        <div className="stat-card-clean">
          <div className="stat-top">
            <span className="stat-label">Circulating Supply</span>
          </div>
          <div className="stat-value" id="stat-circulating">
            {formatStat(networkStats.circulating || '11015608971')} π
          </div>
        </div>

        <div className="stat-card-clean">
          <div className="stat-top">
            <span className="stat-label">Pioneer Transfers</span>
          </div>
          <div className="stat-value" id="stat-pioneer">
            {formatStat(networkStats.pioneer_transfers || '12500000')} π
          </div>
        </div>
      </div>

      {/* Supply Economics Progress Breakdown */}
      <div className="card">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.5rem',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
        >
          <span className="card-title" style={{ marginBottom: 0 }}>
            Pi Network Tokenomics Breakdown
          </span>
          <span className="dim mono" style={{ fontSize: '0.75rem' }}>
            Total Max: 100 Billion π
          </span>
        </div>
        <div className="progress-bar-wrap">
          <div
            className="progress-fill-locked"
            style={{ width: `${lockedPct}%` }}
            title={`Locked Supply (${lockedPct}%)`}
          />
          <div
            className="progress-fill-circulating"
            style={{ width: `${circulatingPct}%`, background: '#22c55e' }}
            title={`Circulating Supply (${circulatingPct}%)`}
          />
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '0.78rem',
            fontFamily: 'var(--font-mono)',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
          className="muted"
        >
          <span style={{ color: 'var(--accent)', fontWeight: 600 }}>
            ● Locked Supply: {formatStat(lockedVal)} π ({lockedPct}%)
          </span>
          <span style={{ color: '#22c55e', fontWeight: 600 }}>
            ● Circulating Supply: {formatStat(circulatingVal)} π ({circulatingPct}%)
          </span>
        </div>
      </div>

      {/* Toolkit Summary Banner */}
      <div className="toolkit-banner" style={{ marginTop: '1.5rem' }}>
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
