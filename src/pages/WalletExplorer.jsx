import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useModal } from '../context/ModalContext';
import { fetchWalletInfo, fetchWalletLockups, fetchWalletTransactions } from '../services/api';
import { sanitizeAddress, validateStandardAddress } from '../utils/address';

function shortAddr(addr, left = 8, right = 6) {
  if (!addr || addr === 'N/A') return 'N/A';
  return addr.length > left + right + 1
    ? `${addr.slice(0, left)}...${addr.slice(-right)}`
    : addr;
}

function formatTimestamp(ts) {
  if (!ts) return 'N/A';
  const d = new Date(ts);
  if (isNaN(+d)) return ts;
  return d.toISOString().slice(0, 19).replace('T', ' ').replace(/-/g, '/');
}

export default function WalletExplorer() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { openTxModal, showToast } = useModal();

  const [addressInput, setAddressInput] = useState(
    searchParams.get('a') || searchParams.get('address') || ''
  );
  const [activeAddress, setActiveAddress] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [walletInfo, setWalletInfo] = useState(null);
  const [lockups, setLockups] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [copied, setCopied] = useState(false);

  // Sentinel ref for infinite scroll
  const sentinelRef = useRef(null);
  const nextCursorRef = useRef(null);
  const activeAddressRef = useRef('');
  const loadingMoreRef = useRef(false);

  const handleCopyAddress = (addr) => {
    if (!addr) return;
    navigator.clipboard.writeText(addr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showToast('Address copied to clipboard', { type: 'success' });
  };

  // Filters
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [addrFilter, setAddrFilter] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');

  const loadMoreTransactions = useCallback(async () => {
    if (loadingMoreRef.current || !nextCursorRef.current || !activeAddressRef.current) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      const moreData = await fetchWalletTransactions(activeAddressRef.current, nextCursorRef.current, 100);
      if (moreData.transactions && moreData.transactions.length > 0) {
        setTransactions((prev) => [...prev, ...moreData.transactions]);
        nextCursorRef.current = moreData.cursor || null;
        setNextCursor(moreData.cursor || null);
      } else {
        nextCursorRef.current = null;
        setNextCursor(null);
      }
    } catch {
      // silent
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, []);

  // Infinite scroll observer
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMoreTransactions();
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMoreTransactions, activeAddress]);

  const executeSearch = async (targetAddress) => {
    const cleanAddr = sanitizeAddress(targetAddress);
    const err = validateStandardAddress(cleanAddr);
    if (err) {
      setErrorMsg(err);
      showToast(err, { type: 'error', duration: 4000 });
      setTransactions([]);
      setWalletInfo(null);
      setLockups(null);
      return;
    }

    setErrorMsg('');
    setLoading(true);
    setActiveAddress(cleanAddr);
    activeAddressRef.current = cleanAddr;
    setSearchParams({ a: cleanAddr });
    setTransactions([]);
    nextCursorRef.current = null;
    setNextCursor(null);

    try {
      const [txData, infoData, lockData] = await Promise.all([
        fetchWalletTransactions(cleanAddr, null, 200),
        fetchWalletInfo(cleanAddr),
        fetchWalletLockups(cleanAddr),
      ]);

      const txList = txData.transactions || [];
      setTransactions(txList);
      const cursor = txData.cursor || null;
      setNextCursor(cursor);
      nextCursorRef.current = cursor;
      setWalletInfo(infoData);
      setLockups(lockData);
    } catch (e) {
      const msg = 'Error fetching wallet: ' + e.message;
      setErrorMsg(msg);
      showToast(msg, { type: 'error', duration: 5000 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initial = searchParams.get('a') || searchParams.get('address');
    if (initial) {
      setAddressInput(initial);
      executeSearch(initial);
    }
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      executeSearch(addressInput);
    }
  };

  const handleResetFilters = () => {
    setStatusFilter('all');
    setAddrFilter('');
    setMinAmount('');
    setMaxAmount('');
  };

  const filteredTransactions = transactions.filter((tx) => {
    if (statusFilter === 'successful' && !tx.successful) return false;
    if (statusFilter === 'failed' && tx.successful) return false;

    if (addrFilter.trim()) {
      const q = addrFilter.trim().toLowerCase();
      const dest = (tx.destination || tx.target_account || '').toLowerCase();
      const src = (tx.source_account || tx.from || '').toLowerCase();
      if (!dest.includes(q) && !src.includes(q)) return false;
    }

    let rawAmt = parseFloat(tx.amount);
    if (isNaN(rawAmt)) rawAmt = parseFloat(tx.fee_charged) || 0;

    const min = parseFloat(minAmount);
    if (!isNaN(min) && rawAmt < min) return false;

    const max = parseFloat(maxAmount);
    if (!isNaN(max) && rawAmt > max) return false;

    return true;
  });

  const totalTxCount = transactions.length;
  const successTxCount = transactions.filter((t) => t.successful).length;
  const failedTxCount = transactions.filter((t) => !t.successful).length;

  const rawAvailable = lockups?.available ?? walletInfo?.balance;
  const availableBal = rawAvailable != null ? Number(rawAvailable) : null;
  const lockedBal = lockups?.lock?.amount != null ? Number(lockups.lock.amount) : (lockups ? 0 : null);
  const totalBal = (availableBal != null || lockedBal != null) ? ((availableBal || 0) + (lockedBal || 0)) : null;
  const isClaimable = lockups?.lock && Number(lockups.lock.days) <= 0;
  const isLocked = lockups?.lock && Number(lockups.lock.days) > 0;
  const lockDays = lockups?.lock ? Number(lockups.lock.days) : 0;
  const unlockDateStr = lockups?.lock?.unlock_ts
    ? new Date(lockups.lock.unlock_ts * 1000).toUTCString().replace(':00 GMT', ' UTC')
    : null;
  const isFilteredActive = statusFilter !== 'all' || addrFilter.trim() !== '' || minAmount !== '' || maxAmount !== '';

  const exportTransactionsCSV = () => {
    if (!filteredTransactions || filteredTransactions.length === 0) return;
    const rows = [['Hash', 'Type', 'Amount', 'From', 'To', 'Timestamp', 'Status', 'Memo']];
    filteredTransactions.forEach((tx) => {
      rows.push([
        tx.hash || '',
        tx.type || '',
        tx.amount || 0,
        tx.from || '',
        tx.to || '',
        tx.timestamp || '',
        tx.successful !== false ? 'Successful' : 'Failed',
        tx.memo || '',
      ]);
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `pihound_txs_${activeAddress.slice(0, 8)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Transactions exported as CSV', { type: 'success' });
  };

  return (
    <>
      {/* Wallet Explorer Search Header Card */}
      <div className="explorer-card">
        <div className="explorer-header-title">Wallet Explorer</div>
        <div className="explorer-header-desc">
          Enter a standard public key (G...) to fetch wallet details and transactions.
        </div>

        <div className="explorer-input-wrap">
          <div className="explorer-input-container">
            <input
              id="explorer-address-input"
              className="explorer-input-field"
              type="text"
              placeholder="Enter Standard Public Key (G...)"
              maxLength={56}
              spellCheck="false"
              autoComplete="off"
              value={addressInput}
              onChange={(e) => setAddressInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
          <button
            id="btn-fetch-explorer"
            type="button"
            className="explorer-btn-fetch"
            onClick={() => executeSearch(addressInput)}
          >
            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span>Fetch Transactions</span>
          </button>
        </div>

        {errorMsg && (
          <div id="explorer-error-msg" className="muted" style={{ marginTop: '0.65rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            {errorMsg}
          </div>
        )}
      </div>

      {/* Initial / Empty State Card */}
      {!activeAddress && (
        <div id="explorer-empty-state" className="card explorer-empty-state">
          <div className="explorer-empty-icon-box">
            <svg width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <div className="explorer-empty-title">No transactions loaded</div>
          <div className="explorer-empty-desc">
            Enter a Pi Network standard public key (G...) above to fetch transaction history.
          </div>
        </div>
      )}

      {/* Loaded Results Container */}
      {activeAddress && (
        <div id="explorer-results">

          {/* Loading State */}
          {loading && (
            <div className="card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              <span style={{ color: 'var(--accent)', marginRight: '0.5rem' }}>●</span>
              Fetching wallet data from backend...
            </div>
          )}

          {/* Redesigned Wallet Portfolio & Financials Overview Card */}
          {walletInfo && (
            <div id="wallet-detail" className="wallet-portfolio-card">
              {/* Header: Identity, Address, Actions */}
              <div className="wallet-portfolio-header">
                <div className="wallet-identity-group">
                  <div className="wallet-status-badge">
                    <span>Active Account</span>
                  </div>

                  <div className="wallet-address-pill">
                    <span id="active-wallet-address" className="mono wallet-addr-text">
                      {shortAddr(activeAddress, 10, 8)}
                    </span>
                    <button
                      type="button"
                      className="wallet-copy-btn"
                      onClick={() => handleCopyAddress(activeAddress)}
                      title="Copy full public key"
                    >
                      <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>

                  {walletInfo.created && (
                    <div className="wallet-age-tag">
                      <span>🕰 Genesis: {walletInfo.created}</span>
                    </div>
                  )}
                </div>

                <div className="wallet-actions-group">
                  <a
                    href={`/bubblemap?a=${encodeURIComponent(activeAddress)}`}
                    className="wallet-action-btn primary"
                  >
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="3" />
                      <circle cx="19" cy="5" r="2" />
                      <circle cx="5" cy="19" r="2" />
                      <path d="M10.5 10.5L6.5 17.5M13.5 10.5L17.5 6.5" />
                    </svg>
                    Bubble Map
                  </a>
                  <a
                    href={`https://blockexplorer.minepi.com/mainnet/account/${activeAddress}`}
                    target="_blank"
                    rel="noreferrer"
                    className="wallet-action-btn secondary"
                  >
                    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Pi Explorer ↗
                  </a>
                </div>
              </div>

              {/* Minimal Unified Metrics Bar */}
              <div className="wallet-metrics-bar">
                <div className="metric-item">
                  <span className="metric-label">Available Balance</span>
                  <div className="metric-val mono">
                    {availableBal != null
                      ? availableBal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                      : 'N/A'}
                    <span className="pi-symbol">π</span>
                    <span className="financial-pill pill-liquid">Liquid</span>
                  </div>
                </div>

                <div className="metric-item">
                  <span className="metric-label">Locked Protocol</span>
                  <div className="metric-val mono">
                    {lockedBal != null ? (
                      lockedBal > 0 ? (
                        <>
                          {lockedBal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          <span className="pi-symbol">π</span>
                        </>
                      ) : (
                        <span style={{ color: 'var(--text-dim)' }}>0.00 <span className="pi-symbol">π</span></span>
                      )
                    ) : (
                      'N/A'
                    )}
                    {isClaimable ? (
                      <span className="financial-pill pill-claimable">Claimable</span>
                    ) : isLocked ? (
                      <span className="financial-pill pill-locked">{lockDays}d</span>
                    ) : (
                      <span className="financial-pill pill-none">None</span>
                    )}
                  </div>
                </div>

                <div className="metric-item">
                  <span className="metric-label">Total Holdings</span>
                  <div className="metric-val mono">
                    {totalBal != null
                      ? totalBal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                      : 'N/A'}
                    <span className="pi-symbol">π</span>
                  </div>
                </div>

                <div className="metric-item">
                  <span className="metric-label">Account Age</span>
                  <div className="metric-val mono">
                    {walletInfo?.wallet_days ?? 'N/A'}
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>days</span>
                  </div>
                </div>

                <div className="metric-item">
                  <span className="metric-label">Transactions</span>
                  <div className="metric-val mono">
                    <span id="stat-total-tx">{totalTxCount.toLocaleString()}{nextCursor ? '+' : ''}</span>
                    <span className="metric-tx-breakdown">
                      <span id="stat-success-tx" className="tx-badge-success" title="Successful">✓ {successTxCount.toLocaleString()}</span>
                      <span id="stat-failed-tx" className="tx-badge-failed" title="Failed">✕ {failedTxCount.toLocaleString()}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Dedicated Lockup Schedule Banner (if lock exists) */}
              {lockups?.lock && (
                <div className={`wallet-lockup-banner ${isClaimable ? 'claimable-banner' : 'locked-banner'}`} style={{ marginTop: '0.75rem' }}>
                  <div className="lockup-banner-content">
                    <div>
                      {isClaimable ? (
                        <span>🔓 <strong>CLAIMABLE REWARDS:</strong> Protocol lockup of <strong>{lockups.lock.amount} π</strong> has fully matured.</span>
                      ) : (
                        <span>🔒 <strong>PROTOCOL LOCKUP:</strong> <strong>{lockups.lock.amount} π</strong> unlocks on <strong>{unlockDateStr || 'scheduled date'}</strong>.</span>
                      )}
                    </div>
                    <div>
                      {isClaimable ? (
                        <span className="financial-pill pill-claimable">Matured (0 Days)</span>
                      ) : (
                        <span
                          className={`financial-pill ${
                            lockDays <= 7 ? 'pill-urgent' : lockDays <= 90 ? 'pill-warning' : 'pill-locked'
                          }`}
                        >
                          {lockDays} Days Remaining
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Retain semantic selector for backwards-compatible test queries */}
              <div id="wallet-info" style={{ display: 'none' }}>
                <div>Available Balance: {availableBal ?? 'N/A'}</div>
                {lockups?.lock && <div>Locked: {lockups.lock.amount}</div>}
              </div>
            </div>
          )}

          {/* Transaction History Card */}
          <div className="tx-history-card">
            <div className="tx-history-header">
              <div className="tx-history-title">Transaction History</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span id="explorer-record-count" className="mono dim" style={{ fontSize: '0.8rem' }}>
                  {filteredTransactions.length} of {totalTxCount}{nextCursor ? '+' : ''} records
                </span>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={exportTransactionsCSV}
                  disabled={filteredTransactions.length === 0}
                  title="Export transactions as CSV"
                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.55rem' }}
                >
                  Export CSV
                </button>
              </div>
            </div>

            {/* Transaction Controls Toolbar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                <button
                  id="btn-open-explorer-filter"
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsFilterModalOpen(true)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    padding: '0.45rem 0.85rem',
                    fontSize: '0.84rem',
                    borderRadius: '8px',
                  }}
                >
                  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 00-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  <span>Filters</span>
                  {isFilteredActive && (
                    <span
                      id="explorer-filter-badge"
                      style={{
                        background: 'var(--accent)',
                        color: '#fff',
                        borderRadius: '10px',
                        padding: '0.1rem 0.45rem',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                      }}
                    >
                      Filtered
                    </span>
                  )}
                </button>

                <div
                  id="explorer-filter-summary"
                  className="filter-summary-pill mono"
                  style={{ fontSize: '0.76rem', padding: '0.35rem 0.75rem' }}
                >
                  <span>Status: {statusFilter === 'all' ? 'All' : statusFilter === 'successful' ? 'Successful' : 'Failed'}</span>
                  {addrFilter.trim() && (
                    <>
                      <span>•</span>
                      <span>Addr: {shortAddr(addrFilter.trim(), 4, 4)}</span>
                    </>
                  )}
                  {minAmount !== '' && (
                    <>
                      <span>•</span>
                      <span>Min: {minAmount} π</span>
                    </>
                  )}
                  {maxAmount !== '' && (
                    <>
                      <span>•</span>
                      <span>Max: {maxAmount} π</span>
                    </>
                  )}
                </div>
              </div>

              {isFilteredActive && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleResetFilters}
                  style={{ fontSize: '0.76rem', padding: '0.35rem 0.65rem' }}
                >
                  Reset Filters
                </button>
              )}
            </div>

            {/* Feed items */}
            <div id="explorer-tx-feed" className="tx-history-feed-container">
              {filteredTransactions.length === 0 && !loading ? (
                <div className="muted" style={{ textAlign: 'center', padding: '2rem' }}>
                  No transaction records match the selected filter criteria.
                </div>
              ) : (
                filteredTransactions.map((tx) => {
                  const isOutgoing = tx.is_outgoing;
                  const signPrefix = isOutgoing ? '-' : '+';
                  const amtVal = String(tx.amount || '0');
                  const displayAmt = amtVal.includes('Pi') ? `${signPrefix}${amtVal}` : `${signPrefix}${amtVal} Pi`;
                  const targetAddr = isOutgoing
                    ? tx.destination || tx.target_account
                    : tx.source_account || tx.from;
                  const targetLabel = isOutgoing
                    ? `To: ${shortAddr(targetAddr, 8, 6)}`
                    : `From: ${shortAddr(targetAddr, 8, 6)}`;
                  const formattedDate = tx.date || formatTimestamp(tx.created_at);

                  return (
                    <div
                      key={tx.id || tx.hash}
                      className="tx-item-card"
                      onClick={() => openTxModal(tx)}
                    >
                      <div className="tx-item-left">
                        <div className="tx-item-icon-box">
                          {isOutgoing ? '↗' : '↘'}
                        </div>
                        <div className="tx-item-details">
                          <div className="tx-item-amount">{displayAmt}</div>
                          <div className="tx-item-target">{targetLabel}</div>
                          <div className="tx-item-date">{formattedDate}</div>
                        </div>
                      </div>
                      <div className={`status-pill ${tx.successful ? 'successful' : 'failed'}`}>
                        <span className="status-pill-dot">●</span>
                        <span>{tx.successful ? 'Successful' : 'Failed'}</span>
                      </div>
                    </div>
                  );
                })
              )}

              {/* Infinite scroll sentinel */}
              <div ref={sentinelRef} style={{ height: '1px' }} />

              {/* Loading more spinner */}
              {loadingMore && (
                <div style={{
                  textAlign: 'center',
                  padding: '1.5rem 0',
                  color: 'var(--text-muted)',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.6rem',
                }}>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--accent)"
                    strokeWidth="2.5"
                    style={{ animation: 'spin 0.8s linear infinite' }}
                  >
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round" />
                  </svg>
                  Loading more transactions...
                </div>
              )}

              {/* End of transactions indicator */}
              {!nextCursor && !loadingMore && transactions.length > 0 && (
                <div style={{
                  textAlign: 'center',
                  padding: '1.25rem 0',
                  color: 'var(--text-dim)',
                  fontSize: '0.78rem',
                  borderTop: '1px solid var(--border)',
                  marginTop: '0.75rem',
                }}>
                  All {totalTxCount.toLocaleString()} transactions loaded
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Filter Modal for Wallet Explorer */}
      {isFilterModalOpen && (
        <div
          id="explorer-filter-modal"
          className="modal-backdrop"
          onClick={(e) => {
            if (e.target.id === 'explorer-filter-modal') setIsFilterModalOpen(false);
          }}
        >
          <div className="calendar-modal-card" style={{ maxWidth: '440px' }}>
            <div className="calendar-modal-header">
              <div className="calendar-modal-title">⚙️ Filter Transactions</div>
              <button
                id="btn-close-explorer-filter"
                type="button"
                className="calendar-modal-close"
                onClick={() => setIsFilterModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className="calendar-modal-body">
              <div>
                <label className="cal-label">Transaction Status</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginTop: '0.35rem' }}>
                  <button
                    type="button"
                    id="filter-btn-all"
                    className={`btn btn-sm ${statusFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setStatusFilter('all')}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    id="filter-btn-success"
                    className={`btn btn-sm ${statusFilter === 'successful' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setStatusFilter('successful')}
                  >
                    ✓ Success
                  </button>
                  <button
                    type="button"
                    id="filter-btn-failed"
                    className={`btn btn-sm ${statusFilter === 'failed' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setStatusFilter('failed')}
                  >
                    ✕ Failed
                  </button>
                </div>
              </div>

              <div style={{ marginTop: '0.85rem' }}>
                <label className="cal-label">Target Address (To / From)</label>
                <input
                  id="filter-address-input"
                  className="cal-input mono"
                  type="text"
                  placeholder="Filter by counterparty address..."
                  value={addrFilter}
                  onChange={(e) => setAddrFilter(e.target.value)}
                />
              </div>

              <div>
                <label className="cal-label">Filter by Pi Amount</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.35rem' }}>
                  <div>
                    <label className="cal-label" style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Min Amount</label>
                    <input
                      id="filter-min-amount"
                      className="cal-input mono"
                      type="number"
                      step="any"
                      placeholder="e.g. 10"
                      value={minAmount}
                      onChange={(e) => setMinAmount(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="cal-label" style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Max Amount</label>
                    <input
                      id="filter-max-amount"
                      className="cal-input mono"
                      type="number"
                      step="any"
                      placeholder="e.g. 500"
                      value={maxAmount}
                      onChange={(e) => setMaxAmount(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div
                className="cal-footer"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '0.85rem',
                  paddingTop: '1.25rem',
                  borderTop: '1px solid var(--border)',
                }}
              >
                <button
                  type="button"
                  id="filter-btn-reset-modal"
                  className="cal-btn-cancel"
                  onClick={handleResetFilters}
                >
                  Reset Filters
                </button>
                <button
                  type="button"
                  id="filter-btn-apply-modal"
                  className="cal-btn-apply"
                  onClick={() => setIsFilterModalOpen(false)}
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
