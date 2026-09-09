import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useModal } from '../context/ModalContext';
import { fetchPctAndCexs } from '../services/api';

function fmtPi(val) {
  const num = Number(val) || 0;
  return (
    num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + ' π'
  );
}

function shortAddr(addr, left = 8, right = 6) {
  if (!addr || addr.length <= left + right + 3) return addr || '';
  return `${addr.substring(0, left)}...${addr.substring(addr.length - right)}`;
}

function getPageNumbers(currentPage, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const pages = [];
  pages.push(1);
  if (currentPage > 3) {
    pages.push('...');
  }
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  if (currentPage < totalPages - 2) {
    pages.push('...');
  }
  pages.push(totalPages);
  return pages;
}

export default function PctAndCexs() {
  const { copyToClipboard } = useModal();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Pagination & Filter States
  const [currentCategory, setCurrentCategory] = useState('pct'); // 'pct' | 'cex'
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search query changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset page when category or search changes
  const handleCategoryChange = (cat) => {
    if (cat !== currentCategory) {
      setCurrentCategory(cat);
      setPage(1);
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setPage(1);
  };

  const handlePageSizeChange = (e) => {
    setPageSize(Number(e.target.value));
    setPage(1);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchPctAndCexs({
        category: currentCategory,
        page,
        pageSize,
        search: debouncedSearch,
      });
      setData(res);
      setLastUpdated(res?.updated_at ? new Date(res.updated_at) : new Date());
    } finally {
      setLoading(false);
    }
  }, [currentCategory, page, pageSize, debouncedSearch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const wallets = data?.wallets || (currentCategory === 'pct' ? data?.pct_wallets : data?.cex_wallets) || [];
  const totalCount = data?.total_count ?? wallets.length;
  const totalPages = data?.total_pages ?? Math.max(1, Math.ceil(totalCount / pageSize));
  const pctCount = data?.pct_count ?? (currentCategory === 'pct' ? totalCount : 0);
  const cexCount = data?.cex_count ?? (currentCategory === 'cex' ? totalCount : 8);

  const startRecord = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const endRecord = Math.min(page * pageSize, totalCount);

  return (
    <>
      {/* Header */}
      <div className="pct-header">
        {/* Top row: title */}
        <div className="pct-header-top">
          <div>
            <h1 className="pct-title">PCT &amp; CEX Wallets</h1>
            <p className="pct-subtitle">
              Monitored balances for official Pi Core Team reserves and Centralized Exchange wallets.
              {lastUpdated && (
                <span style={{ marginLeft: '0.6rem', color: 'var(--text-dim)', fontSize: '0.78rem' }}>
                  · Synced {lastUpdated.toLocaleTimeString()}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Bottom row: stat cards */}
        <div className="pct-stats-group">
          <div className="pct-stat-box">
            <span className="pct-stat-label">PCT Core Total</span>
            <div id="total-pct-balance" className="pct-stat-value">
              {loading && !data ? '--' : fmtPi(data?.total_pct_balance)}
            </div>
            <span className="pct-stat-sub">{pctCount.toLocaleString()} Core Wallets</span>
          </div>
          <div className="pct-stat-box">
            <span className="pct-stat-label">CEX Reserves Total</span>
            <div id="total-cex-balance" className="pct-stat-value">
              {loading && !data ? '--' : fmtPi(data?.total_cex_balance)}
            </div>
            <span className="pct-stat-sub">{cexCount.toLocaleString()} Exchange Wallets</span>
          </div>
        </div>
      </div>

      {/* Category Tabs & Search Bar */}
      <div className="pct-nav-bar">
        <div className="pct-tabs">
          <button
            type="button"
            id="tab-pct"
            className={`pct-tab ${currentCategory === 'pct' ? 'active' : ''}`}
            onClick={() => handleCategoryChange('pct')}
          >
            PCT <span id="count-pct-badge" className="tab-count">{pctCount.toLocaleString()}</span>
          </button>
          <button
            type="button"
            id="tab-cex"
            className={`pct-tab ${currentCategory === 'cex' ? 'active' : ''}`}
            onClick={() => handleCategoryChange('cex')}
          >
            CEXs <span id="count-cex-badge" className="tab-count">{cexCount.toLocaleString()}</span>
          </button>
        </div>

        <div className="pct-search-box">
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="search-icon">
            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            id="pct-search-input"
            className="search-input"
            type="text"
            placeholder="Filter wallet name or address..."
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>
      </div>

      {/* Table & Cards View */}
      <div className="pct-card-container">
        {/* Desktop Table View */}
        <div className="pct-table-desktop">
          <div className="table-responsive">
            <table className="pct-table">
              <thead>
                <tr>
                  <th style={{ width: '32%' }}>WALLET NAME</th>
                  <th style={{ width: '30%' }}>PUBLIC KEY</th>
                  <th style={{ width: '23%', textAlign: 'right' }}>BALANCE</th>
                  <th style={{ width: '15%', textAlign: 'center' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody id="pct-table-body">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="loading-cell">
                      Loading wallets...
                    </td>
                  </tr>
                ) : wallets.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="loading-cell" style={{ color: 'var(--text-muted)' }}>
                      No wallets match the search criteria.
                    </td>
                  </tr>
                ) : (
                  wallets.map((w) => (
                    <tr key={w.address} className="table-row">
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <img
                            src={`/images/${w.image || 'pi.webp'}`}
                            alt={w.name}
                            style={{ width: '24px', height: '24px', borderRadius: '4px', objectFit: 'contain' }}
                            onError={(e) => {
                              e.target.src = '/images/pi.webp';
                            }}
                          />
                          <span style={{ fontWeight: 600, color: '#ffffff' }}>{w.name}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          <span className="mono" style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                            {shortAddr(w.address, 10, 8)}
                          </span>
                          <button
                            type="button"
                            className="copy-btn"
                            onClick={() => copyToClipboard(w.address, 'Wallet address copied!')}
                            title="Copy public key"
                          >
                            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </button>
                        </div>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#ffffff', whiteSpace: 'nowrap' }}>
                        {fmtPi(w.balance)}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <Link
                          to={`/wallet_explorer?a=${encodeURIComponent(w.address)}`}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                        >
                          Explore →
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Dedicated Responsive Cards View */}
        <div className="pct-cards-mobile" id="pct-mobile-list">
          {loading ? (
            <div className="card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--accent)', marginRight: '0.5rem' }}>●</span>
              Loading wallets...
            </div>
          ) : wallets.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No wallets match the search criteria.
            </div>
          ) : (
            wallets.map((w) => (
              <div key={w.address} className="pct-mobile-card">
                <div className="pct-mobile-card-top">
                  <div className="pct-mobile-identity">
                    <img
                      src={`/images/${w.image || 'icon.webp'}`}
                      alt={w.name}
                      className="pct-mobile-logo"
                      onError={(e) => {
                        e.target.src = '/images/icon.webp';
                      }}
                    />
                    <div className="pct-mobile-meta">
                      <span className="pct-mobile-name">{w.name}</span>
                    </div>
                  </div>
                  <div className="pct-mobile-balance">
                    <span className="pct-mobile-bal-val">{fmtPi(w.balance)}</span>
                  </div>
                </div>

                <div className="pct-mobile-card-bottom">
                  <div className="pct-mobile-addr-group">
                    <span className="mono pct-mobile-addr">{shortAddr(w.address, 9, 7)}</span>
                    <button
                      type="button"
                      className="copy-btn pct-mobile-copy-btn"
                      onClick={() => copyToClipboard(w.address, 'Wallet address copied!')}
                      title="Copy public key"
                    >
                      <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>
                  <Link
                    to={`/wallet_explorer?a=${encodeURIComponent(w.address)}`}
                    className="btn btn-secondary btn-sm pct-mobile-explore-btn"
                  >
                    Explore →
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Pagination Bar */}
      {!loading && totalCount > 0 && (
        <div className="pct-pagination-bar">
          <div className="pct-pagination-info">
            <span>
              Showing <strong>{startRecord}</strong>–<strong>{endRecord}</strong> of <strong>{totalCount.toLocaleString()}</strong> wallets
            </span>
            <div className="pct-page-size-wrapper">
              <span>Per page:</span>
              <select
                id="pct-page-size-select"
                className="pct-page-size-select"
                value={pageSize}
                onChange={handlePageSizeChange}
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          <div className="pct-pagination-controls">
            {/* First Page */}
            <button
              type="button"
              id="pct-first-page-btn"
              className="pct-page-btn"
              onClick={() => setPage(1)}
              disabled={page <= 1}
              title="First Page"
            >
              «
            </button>

            {/* Previous Page */}
            <button
              type="button"
              id="pct-prev-page-btn"
              className="pct-page-btn"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              title="Previous Page"
            >
              ‹
            </button>

            {/* Numeric Page Buttons */}
            {getPageNumbers(page, totalPages).map((pNum, idx) =>
              pNum === '...' ? (
                <span key={`ellipsis-${idx}`} className="pct-page-ellipsis">
                  …
                </span>
              ) : (
                <button
                  key={`page-${pNum}`}
                  type="button"
                  className={`pct-page-btn ${page === pNum ? 'active' : ''}`}
                  onClick={() => setPage(pNum)}
                >
                  {pNum}
                </button>
              )
            )}

            {/* Next Page */}
            <button
              type="button"
              id="pct-next-page-btn"
              className="pct-page-btn"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              title="Next Page"
            >
              ›
            </button>

            {/* Last Page */}
            <button
              type="button"
              id="pct-last-page-btn"
              className="pct-page-btn"
              onClick={() => setPage(totalPages)}
              disabled={page >= totalPages}
              title="Last Page"
            >
              »
            </button>
          </div>
        </div>
      )}
    </>
  );
}
