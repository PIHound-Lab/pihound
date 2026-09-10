import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useModal } from '../context/ModalContext';
import { fetchSweeps } from '../services/api';

function shortAddr(a, l = 8, r = 6) {
  if (!a || a === 'N/A') return 'N/A';
  return a.length > l + r + 1 ? `${a.slice(0, l)}...${a.slice(-r)}` : a;
}

function fmtTime(s) {
  if (!s) return 'N/A';
  const t = new Date(s);
  if (isNaN(+t)) return s;
  return t.toISOString().slice(0, 19).replace('T', ' ').replace(/-/g, '/');
}

function getExchangeLogo(name) {
  if (!name) return null;
  const n = String(name).toLowerCase();
  if (n.includes('bitget')) return '/images/bitget.webp';
  if (n.includes('okx')) return '/images/okx.webp';
  if (n.includes('gate')) return '/images/gate.webp';
  if (n.includes('mexc')) return '/images/mexc.webp';
  if (n.includes('kraken')) return '/images/kraken.webp';
  if (n.includes('lbank')) return '/images/lbank.webp';
  if (n.includes('pionex')) return '/images/pionex.webp';
  return null;
}

export default function WalletSweeps() {
  const { openTxModal, copyToClipboard, showToast } = useModal();

  const [activeTab, setActiveTab] = useState('feed'); // 'feed' | 'actors'
  const [sweepsData, setSweepsData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [rangeType, setRangeType] = useState('all');
  const [minAmount, setMinAmount] = useState(0);
  const [searchStr, setSearchStr] = useState('');
  const [muxedOnly, setMuxedOnly] = useState(false);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  // Pagination for Sweeps (Server-side to access every single wallet sweep)
  const [feedPage, setFeedPage] = useState(0);
  const [jumpPageStr, setJumpPageStr] = useState('');
  const sweepsPageSize = 50;

  // Bad Actors (Show all top 100 bad actor wallets)
  const [actorsPage, setActorsPage] = useState(0);
  const [showAllActors, setShowAllActors] = useState(true);

  const loadData = async (targetPage = feedPage) => {
    setLoading(true);
    try {
      const data = await fetchSweeps({
        page: targetPage,
        page_size: sweepsPageSize,
        bad_actors_page_size: 100,
        range_type: rangeType,
        min_amount: minAmount,
        search: searchStr,
        muxed_only: muxedOnly,
        start_date: customStart,
        end_date: customEnd,
      });
      setSweepsData(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(feedPage);
  }, [rangeType, minAmount, muxedOnly, customStart, customEnd, feedPage]);

  const handleResetFilters = () => {
    setRangeType('all');
    setMinAmount(0);
    setSearchStr('');
    setMuxedOnly(false);
    setCustomStart('');
    setCustomEnd('');
    setFeedPage(0);
    setIsFilterModalOpen(false);
  };

  const handleApplyFilters = () => {
    setIsFilterModalOpen(false);
    setFeedPage(0);
    loadData(0);
  };

  const events = sweepsData?.events || [];
  const rawBadActors = sweepsData?.top_bad_actors || sweepsData?.bad_actors || [];
  const badActors = rawBadActors;

  const totalPiSweptVal = sweepsData?.pi_swept != null ? Number(sweepsData.pi_swept) : (sweepsData?.total_swept != null ? Number(sweepsData.total_swept) : null);
  const totalSweepsCount = sweepsData?.total ?? null;
  const badActorsCount = sweepsData?.bad_actors_count ?? (badActors.length > 0 ? badActors.length : null);
  const totalFeedPages = sweepsData?.total_pages || Math.max(1, Math.ceil((totalSweepsCount || 0) / sweepsPageSize));

  const paginatedEvents = events;
  const paginatedActors = showAllActors ? badActors : badActors.slice(actorsPage * 25, (actorsPage + 1) * 25);
  const totalActorsPages = Math.max(1, Math.ceil(badActors.length / 25));

  const isFiltered =
    rangeType !== 'all' || minAmount > 0 || searchStr.trim() !== '' || muxedOnly;

  const exportBadActorsCSV = () => {
    if (!badActors || badActors.length === 0) return;
    const rows = [['Rank', 'Destination_Address', 'Known_Exchange', 'Total_Stolen_Pi', 'Victims_Drained', 'First_Seen', 'Last_Seen']];
    badActors.forEach((act, idx) => {
      rows.push([
        idx + 1,
        act.destination || '',
        act.exchange || '',
        act.total_amount || 0,
        act.count || 0,
        act.first_seen || '',
        act.last_seen || '',
      ]);
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'pihound_top_bad_actors.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Top bad actors exported as CSV');
  };

  return (
    <>
      {/* Search and Filters Header */}
      <div className="card" style={{ padding: '0.85rem 1.15rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.65rem' }}>
          <div>
            <span className="card-title" style={{ marginBottom: '0.1rem', fontSize: '0.78rem' }}>
              Wallet Sweeps Security Intelligence
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
              <span
                id="total-pi-swept"
                style={{
                  fontSize: '1.45rem',
                  fontWeight: 800,
                  color: '#ffffff',
                  fontFamily: 'var(--font-mono)',
                  whiteSpace: 'nowrap',
                }}
              >
                {totalPiSweptVal != null
                  ? `${totalPiSweptVal.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })} π`
                  : 'N/A'}
              </span>
              <span className="dim" style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Total Pi Swept
              </span>
            </div>
          </div>
        </div>

        <div className="sweeps-metrics-bar">
          <div className="metric-item">
            <span className="metric-label">Bad Actor Wallets</span>
            <span id="bad-actor-count" className="metric-val mono">{badActorsCount != null ? badActorsCount.toLocaleString() : 'N/A'}</span>
          </div>
          <div className="metric-item">
            <span className="metric-label">Total Sweeps Detected</span>
            <span id="sweep-count" className="metric-val mono">{totalSweepsCount != null ? totalSweepsCount.toLocaleString() : 'N/A'}</span>
          </div>
          <div className="metric-item">
            <span className="metric-label">Time Frame</span>
            <span id="sweep-window" className="metric-val mono">{sweepsData?.time_window || 'N/A'}</span>
          </div>
          <div className="metric-item">
            <span className="metric-label">Sweep Type</span>
            <span className="metric-val mono" style={{ fontSize: '0.95rem' }}>{sweepsData ? (sweepsData?.sweep_type || 'Claim & Send') : 'N/A'}</span>
          </div>
        </div>
      </div>

      {/* Controls Toolbar with Filter Modal Launcher */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              id="btn-open-sweeps-filter"
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsFilterModalOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.55rem 0.9rem',
                fontSize: '0.88rem',
                borderRadius: '8px',
              }}
            >
              <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 00-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span>Filters</span>
              {isFiltered && (
                <span
                  id="sweeps-filter-badge"
                  style={{
                    background: 'var(--accent)',
                    color: '#fff',
                    borderRadius: '10px',
                    padding: '0.1rem 0.45rem',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                  }}
                >
                  Filtered
                </span>
              )}
            </button>

            <div id="filter-summary-bar" className="filter-summary-pill mono">
              <span>Scope: {rangeType === 'all' ? 'All Time Recorded' : `${rangeType}hr`}</span>
              <span>•</span>
              <span>Min: {minAmount} π</span>
              {muxedOnly && (
                <>
                  <span>•</span>
                  <span style={{ color: '#ffffff', fontWeight: 600 }}>Muxed Only</span>
                </>
              )}
            </div>
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleResetFilters}
            style={{ fontSize: '0.78rem' }}
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Tabbed Navigation Bar */}
      <div className="sweeps-tabs-nav">
        <button
          id="tab-btn-feed"
          type="button"
          className={`tab-btn ${activeTab === 'feed' ? 'active' : ''}`}
          onClick={() => setActiveTab('feed')}
        >
          <span>Sweeps ({totalSweepsCount != null ? totalSweepsCount.toLocaleString() : 'N/A'})</span>
        </button>
        <button
          id="tab-btn-actors"
          type="button"
          className={`tab-btn ${activeTab === 'actors' ? 'active' : ''}`}
          onClick={() => setActiveTab('actors')}
        >
          <span>Bad Actors ({badActorsCount != null ? badActorsCount.toLocaleString() : 'N/A'})</span>
        </button>
      </div>

      {/* TAB 1: Live Continuous Sweeps Feed Container */}
      {activeTab === 'feed' && (
        <div id="tab-content-feed" className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div className="card-title" style={{ marginBottom: 0, color: '#ffffff' }}>
              Real-Time Sweep Detections
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <a
                href="/api/v1/sweeps/export/?format=csv"
                download="pihound_sweeps.csv"
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', textDecoration: 'none' }}
                title="Export all sweeps as CSV"
              >
                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Export CSV
              </a>
              <span id="sweeps-live-badge" className="badge badge-purple" style={{ fontSize: '0.75rem' }}>
                Pi Network Mainnet
              </span>
            </div>
          </div>
          <div id="sweeps-feed-list" className="sweeps-feed-grid">
            {loading ? (
              <div className="dim" style={{ textAlign: 'center', padding: '2rem' }}>
                Loading sweeps…
              </div>
            ) : paginatedEvents.length === 0 ? (
              <div className="muted" style={{ textAlign: 'center', padding: '2rem' }}>
                No sweep events match current filters.
              </div>
            ) : (
              paginatedEvents.map((ev) => (
                <div
                  key={ev.operation_id || ev.tx_hash}
                  className="sweep-card-item"
                  onClick={() => openTxModal(ev)}
                >
                  <div className="sweep-card-icon">😈</div>
                  <div className="sweep-card-body">
                    <div className="sweep-card-amount">
                      <span style={{ color: '#ffffff', fontWeight: 700 }}>
                        -{Number(ev.amount || 0).toFixed(2)} π
                      </span>
                      {ev.destination_exchange && (() => {
                        const logo = getExchangeLogo(ev.destination_exchange);
                        return logo ? (
                          <span
                            className="badge-exchange"
                            title={`Destination Exchange: ${ev.destination_exchange}`}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '20px',
                              height: '20px',
                              marginLeft: '0.45rem',
                              padding: '0',
                              borderRadius: '4px',
                              background: '#0e0e12',
                              border: '1px solid rgba(167, 139, 250, 0.4)',
                              overflow: 'hidden',
                              verticalAlign: 'middle',
                              flexShrink: 0,
                            }}
                          >
                            <img
                              src={logo}
                              alt={ev.destination_exchange}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                display: 'block',
                              }}
                            />
                          </span>
                        ) : (
                          <span
                            className="badge-exchange"
                            style={{
                              marginLeft: '0.45rem',
                              padding: '0.12rem 0.5rem',
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              borderRadius: '4px',
                              background: 'rgba(108, 92, 231, 0.25)',
                              border: '1px solid var(--accent)',
                              color: '#ffffff',
                            }}
                          >
                            {ev.destination_exchange}
                          </span>
                        );
                      })()}
                    </div>
                    <div className="sweep-card-to">
                      Victim: <span className="mono" style={{ color: '#ffffff' }}>{shortAddr(ev.from_address, 8, 6)}</span> → Bad Actor:{' '}
                      <span className="mono" style={{ color: 'var(--text-muted)' }}>
                        {shortAddr(ev.to_address, 8, 6)}
                      </span>
                      {ev.receiver_muxed && ev.receiver_muxed.startsWith('M') && (
                        <span
                          style={{
                            marginLeft: '0.4rem',
                            padding: '0.05rem 0.35rem',
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            borderRadius: '3px',
                            background: 'rgba(255, 255, 255, 0.08)',
                            color: 'var(--text-muted)',
                            border: '1px solid var(--border)',
                          }}
                        >
                          MUXED
                        </span>
                      )}
                    </div>
                    <div className="sweep-card-date">{fmtTime(ev.timestamp)}</div>
                  </div>
                  <div className="status-pill successful">
                    <span className="status-pill-dot">●</span>
                    <span>Bundled</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Enhanced Server-Side Pagination */}
          {totalFeedPages > 1 && (
            <div className="pagination-nav">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <button
                  id="sweeps-first-btn"
                  type="button"
                  className="page-btn"
                  disabled={feedPage === 0 || loading}
                  onClick={() => setFeedPage(0)}
                  title="Jump to first page"
                >
                  « First
                </button>
                <button
                  id="sweeps-prev-btn"
                  type="button"
                  className="page-btn"
                  disabled={feedPage === 0 || loading}
                  onClick={() => setFeedPage((p) => Math.max(0, p - 1))}
                >
                  ‹ Previous
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                <span className="mono" style={{ fontSize: '0.85rem', color: '#ffffff' }}>
                  Page <strong style={{ color: '#ffffff' }}>{(feedPage + 1).toLocaleString()}</strong> of{' '}
                  <strong style={{ color: '#ffffff' }}>{totalFeedPages.toLocaleString()}</strong>
                  <span className="dim" style={{ marginLeft: '0.4rem', fontSize: '0.78rem' }}>
                    ({totalSweepsCount.toLocaleString()} total sweeps)
                  </span>
                </span>

                {/* Quick Jump Input */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const p = parseInt(jumpPageStr, 10);
                    if (!isNaN(p) && p >= 1 && p <= totalFeedPages) {
                      setFeedPage(p - 1);
                      setJumpPageStr('');
                    }
                  }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <input
                    id="sweeps-jump-input"
                    type="number"
                    min="1"
                    max={totalFeedPages}
                    value={jumpPageStr}
                    onChange={(e) => setJumpPageStr(e.target.value)}
                    placeholder="Page #"
                    className="cal-input"
                    style={{ width: '70px', padding: '0.2rem 0.4rem', fontSize: '0.78rem', height: '28px', textAlign: 'center' }}
                  />
                  <button
                    type="submit"
                    className="page-btn"
                    style={{ padding: '0.2rem 0.55rem', height: '28px', fontSize: '0.78rem' }}
                  >
                    Go
                  </button>
                </form>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <button
                  id="sweeps-next-btn"
                  type="button"
                  className="page-btn"
                  disabled={feedPage >= totalFeedPages - 1 || loading}
                  onClick={() => setFeedPage((p) => Math.min(totalFeedPages - 1, p + 1))}
                >
                  Next ›
                </button>
                <button
                  id="sweeps-last-btn"
                  type="button"
                  className="page-btn"
                  disabled={feedPage >= totalFeedPages - 1 || loading}
                  onClick={() => setFeedPage(totalFeedPages - 1)}
                  title="Jump to last page"
                >
                  Last »
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Top 100 Bad Actor Destinations Container */}
      {activeTab === 'actors' && (
        <div id="tab-content-actors" className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <div className="card-title" style={{ marginBottom: '0.2rem', color: '#ffffff' }}>
                Top 100 Bad Actor Destination Wallets
              </div>
              <span id="actors-hint" className="dim" style={{ fontSize: '0.78rem' }}>
                Ranked by total Pi drained from victim accounts • Showing all {badActors.length} top wallets
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={exportBadActorsCSV}
                style={{ fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                title="Export top bad actors as CSV"
              >
                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Export CSV
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setShowAllActors(!showAllActors)}
                style={{ fontSize: '0.78rem' }}
              >
                {showAllActors ? 'Switch to Paginated (25/page)' : 'Show All Top 100'}
              </button>
            </div>
          </div>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '65px', color: '#ffffff' }}># Rank</th>
                  <th>Bad Actor Destination</th>
                  <th>Total Stolen Pi</th>
                  <th>Victims Drained</th>
                  <th className="text-right">Last Active</th>
                </tr>
              </thead>
              <tbody id="bad-actors-body">
                {paginatedActors.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="muted" style={{ textAlign: 'center', padding: '1.5rem' }}>
                      No bad actor records found.
                    </td>
                  </tr>
                ) : (
                  paginatedActors.map((ba, idx) => {
                    const baAddr = ba.address || ba.to_address || '';
                    const baStolen = ba.total_pi || ba.total_stolen || 0;
                    const baVictims = ba.victims_count || ba.victim_count || 0;
                    const rankNum = showAllActors ? idx + 1 : idx + 1 + actorsPage * 25;
                    return (
                      <tr key={baAddr}>
                        <td style={{ fontWeight: 700, color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '0.15rem 0.45rem',
                              borderRadius: '4px',
                              background: rankNum <= 3 ? 'rgba(108, 92, 231, 0.35)' : 'rgba(255, 255, 255, 0.05)',
                              border: rankNum <= 3 ? '1px solid var(--accent)' : '1px solid var(--border)',
                              fontSize: '0.78rem',
                              color: '#ffffff',
                            }}
                          >
                            #{rankNum}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                            <Link
                              to={`/wallet_explorer?a=${encodeURIComponent(baAddr)}`}
                              style={{ color: '#ffffff', textDecoration: 'none', fontWeight: 600 }}
                            >
                              {shortAddr(baAddr, 10, 8)}
                            </Link>
                            {ba.destination_exchange && (() => {
                              const logo = getExchangeLogo(ba.destination_exchange);
                              return logo ? (
                                <span
                                  title={`Destination Exchange: ${ba.destination_exchange}`}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '20px',
                                    height: '20px',
                                    padding: '0',
                                    borderRadius: '4px',
                                    background: '#0e0e12',
                                    border: '1px solid rgba(167, 139, 250, 0.4)',
                                    overflow: 'hidden',
                                    verticalAlign: 'middle',
                                    flexShrink: 0,
                                  }}
                                >
                                  <img
                                    src={logo}
                                    alt={ba.destination_exchange}
                                    style={{
                                      width: '100%',
                                      height: '100%',
                                      objectFit: 'cover',
                                      display: 'block',
                                    }}
                                  />
                                </span>
                              ) : (
                                <span
                                  style={{
                                    padding: '0.1rem 0.4rem',
                                    fontSize: '0.68rem',
                                    fontWeight: 700,
                                    borderRadius: '4px',
                                    background: 'rgba(108, 92, 231, 0.25)',
                                    border: '1px solid var(--accent)',
                                    color: '#ffffff',
                                  }}
                                >
                                  {ba.destination_exchange}
                                </span>
                              );
                            })()}
                            <button
                              type="button"
                              className="copy-btn"
                              onClick={() => copyToClipboard(baAddr, 'Address copied!')}
                              title="Copy public address"
                              style={{ padding: '0.2rem 0.45rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </button>
                          </div>
                        </td>
                        <td style={{ color: '#ffffff', fontWeight: 700, fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
                          {Number(baStolen).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}{' '}
                          π
                        </td>
                        <td style={{ color: '#ffffff', whiteSpace: 'nowrap' }}>{baVictims.toLocaleString()} victims</td>
                        <td className="text-right" style={{ color: 'var(--text-muted)' }}>{fmtTime(ba.last_active)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {!showAllActors && totalActorsPages > 1 && (
            <div className="pagination-nav">
              <button
                id="actors-prev-btn"
                type="button"
                className="page-btn"
                disabled={actorsPage === 0}
                onClick={() => setActorsPage((p) => Math.max(0, p - 1))}
              >
                ‹ Previous
              </button>
              <div id="actors-page-numbers" className="pagination-btns">
                <span className="mono dim" style={{ fontSize: '0.8rem', padding: '0 0.5rem', color: '#ffffff' }}>
                  Page {actorsPage + 1} of {totalActorsPages}
                </span>
              </div>
              <button
                id="actors-next-btn"
                type="button"
                className="page-btn"
                disabled={actorsPage >= totalActorsPages - 1}
                onClick={() => setActorsPage((p) => Math.min(totalActorsPages - 1, p + 1))}
              >
                Next ›
              </button>
            </div>
          )}
        </div>
      )}

      {/* Advanced Filter Modal */}
      {isFilterModalOpen && (
        <div
          id="sweeps-filter-modal"
          className="modal-backdrop"
          onClick={(e) => {
            if (e.target.id === 'sweeps-filter-modal') setIsFilterModalOpen(false);
          }}
        >
          <div className="calendar-modal-card">
            <div className="calendar-modal-header">
              <div className="calendar-modal-title">⚙️ Filter Wallet Sweeps</div>
              <button
                id="btn-close-filter-modal"
                type="button"
                className="calendar-modal-close"
                onClick={() => setIsFilterModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className="calendar-modal-body">
              <div>
                <label className="cal-label">Time Frame</label>
                <select
                  id="modal-range-sel"
                  className="cal-input"
                  value={rangeType}
                  onChange={(e) => {
                    if (e.target.value === 'custom') {
                      setIsFilterModalOpen(false);
                      setIsCalendarModalOpen(true);
                    } else {
                      setRangeType(e.target.value);
                    }
                  }}
                >
                  <option value="all">All Time Recorded (Default)</option>
                  <option value="1">1hr (Last 1 Hour)</option>
                  <option value="6">6hr (Last 6 Hours)</option>
                  <option value="24">24hr (Last 24 Hours)</option>
                  <option value="custom">📅 Custom Calendar Range...</option>
                </select>
              </div>

              <div>
                <div
                  id="modal-filter-muxed"
                  className={`sweeps-toggle-card ${muxedOnly ? 'active' : ''}`}
                  onClick={() => setMuxedOnly(!muxedOnly)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === ' ' || e.key === 'Enter') {
                      e.preventDefault();
                      setMuxedOnly(!muxedOnly);
                    }
                  }}
                >
                  <div className="sweeps-toggle-card-left">
                    <div className="sweeps-toggle-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11" />
                        <path d="M8 14v3M12 14v3M16 14v3" />
                      </svg>
                    </div>
                    <div className="sweeps-toggle-text">
                      <span className="sweeps-toggle-title">Muxed / Exchange Addresses Only</span>
                      <span className="sweeps-toggle-sub">Filter sweeps involving M-addresses or CEX endpoints</span>
                    </div>
                  </div>
                  <div className="sweeps-switch" aria-hidden="true">
                    <div className="sweeps-switch-thumb" />
                  </div>
                </div>
              </div>

              <div>
                <label className="cal-label" htmlFor="modal-filter-min-amount">
                  Minimum Pi Amount (π)
                </label>
                <input
                  id="modal-filter-min-amount"
                  type="number"
                  min="0"
                  step="1"
                  value={minAmount}
                  onChange={(e) => setMinAmount(Number(e.target.value) || 0)}
                  placeholder="0"
                  className="cal-input"
                />
              </div>

              <div>
                <label className="cal-label" htmlFor="modal-filter-search">
                  Search Query (Hash, G... Public, M... Muxed, Exchange)
                </label>
                <input
                  id="modal-filter-search"
                  type="text"
                  className="cal-input"
                  placeholder="Enter hash, address, or exchange (e.g. OKX)"
                  value={searchStr}
                  onChange={(e) => setSearchStr(e.target.value)}
                />
              </div>

              <div className="cal-footer">
                <button type="button" className="cal-btn-cancel" onClick={handleResetFilters}>
                  Reset All
                </button>
                <button type="button" className="cal-btn-apply" onClick={handleApplyFilters}>
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Date Picker Modal */}
      {isCalendarModalOpen && (
        <div
          id="calendar-modal"
          className="modal-backdrop"
          onClick={(e) => {
            if (e.target.id === 'calendar-modal') setIsCalendarModalOpen(false);
          }}
        >
          <div className="calendar-modal-card">
            <div className="calendar-modal-header">
              <div className="calendar-modal-title">📅 Custom Calendar Date Picker</div>
              <button type="button" className="calendar-modal-close" onClick={() => setIsCalendarModalOpen(false)}>
                ✕
              </button>
            </div>
            <div className="calendar-modal-body">
              <div>
                <label className="cal-label">Quick Presets</label>
                <div className="cal-preset-row">
                  <button
                    type="button"
                    className="cal-preset-btn"
                    onClick={() => {
                      const d = new Date();
                      d.setHours(0, 0, 0, 0);
                      setCustomStart(d.toISOString().slice(0, 16));
                      setCustomEnd(new Date().toISOString().slice(0, 16));
                    }}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    className="cal-preset-btn"
                    onClick={() => {
                      const now = new Date();
                      const past = new Date(now.getTime() - 7 * 86400 * 1000);
                      setCustomStart(past.toISOString().slice(0, 16));
                      setCustomEnd(now.toISOString().slice(0, 16));
                    }}
                  >
                    Last 7 Days
                  </button>
                  <button
                    type="button"
                    className="cal-preset-btn"
                    onClick={() => {
                      const now = new Date();
                      const past = new Date(now.getTime() - 30 * 86400 * 1000);
                      setCustomStart(past.toISOString().slice(0, 16));
                      setCustomEnd(now.toISOString().slice(0, 16));
                    }}
                  >
                    Last 30 Days
                  </button>
                </div>
              </div>

              <div className="cal-date-inputs">
                <div className="cal-field">
                  <label className="cal-label">From (UTC)</label>
                  <input
                    type="datetime-local"
                    className="cal-input"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                  />
                </div>
                <div className="cal-field">
                  <label className="cal-label">To (UTC)</label>
                  <input
                    type="datetime-local"
                    className="cal-input"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                  />
                </div>
              </div>

              <div className="cal-footer">
                <button
                  type="button"
                  className="cal-btn-cancel"
                  onClick={() => {
                    setCustomStart('');
                    setCustomEnd('');
                    setIsCalendarModalOpen(false);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="cal-btn-apply"
                  onClick={() => {
                    setIsCalendarModalOpen(false);
                    setRangeType('custom');
                    loadData();
                  }}
                >
                  Apply Date Range
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
