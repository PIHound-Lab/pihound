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

  const availableBal = Number(lockups?.available || walletInfo?.balance || 0);
  const lockedBal = lockups?.lock ? Number(lockups.lock.amount || 0) : 0;
  const totalBal = availableBal + lockedBal;
  const isClaimable = lockups?.lock && Number(lockups.lock.days) <= 0;
  const isLocked = lockups?.lock && Number(lockups.lock.days) > 0;
  const lockDays = lockups?.lock ? Number(lockups.lock.days) : 0;
  const unlockDateStr = lockups?.lock?.unlock_ts
    ? new Date(lockups.lock.unlock_ts * 1000).toUTCString().replace(':00 GMT', ' UTC')
    : null;

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
              Fetching wallet data from Pi mainnet...
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

              {/* 4 Financial Highlight Cards */}
              <div className="wallet-financials-grid">
                {/* 1. Liquid / Available Balance */}
                <div className="wallet-financial-card">
                  <div className="wallet-financial-header">
                    <span className="wallet-financial-label">Available Balance</span>
                    <span className="financial-pill pill-liquid">Liquid</span>
                  </div>
                  <div className="wallet-financial-val">
                    {availableBal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    <span className="pi-symbol">π</span>
                  </div>
                  <div className="wallet-financial-sub">Ready for transfer &amp; gas fees</div>
                </div>

                {/* 2. Locked Protocol Balance */}
                <div className="wallet-financial-card">
                  <div className="wallet-financial-header">
                    <span className="wallet-financial-label">Locked Protocol</span>
                    {isClaimable ? (
                      <span className="financial-pill pill-claimable">Claimable</span>
                    ) : isLocked ? (
                      <span className="financial-pill pill-locked">Locked</span>
                    ) : (
                      <span className="financial-pill pill-none">None</span>
                    )}
                  </div>
                  <div className="wallet-financial-val">
                    {lockedBal > 0 ? (
                      <>
                        {lockedBal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        <span className="pi-symbol">π</span>
                      </>
                    ) : (
                      <span style={{ color: 'var(--text-dim)' }}>0.00 <span className="pi-symbol">π</span></span>
                    )}
                  </div>
                  <div className="wallet-financial-sub">
                    {isClaimable
                       ? 'Lockup matured — ready to claim'
                      : isLocked
                      ? `${lockDays} days remaining`
                      : 'No active protocol lockup'}
                  </div>
                </div>

                {/* 3. Total Holdings */}
                <div className="wallet-financial-card">
                  <div className="wallet-financial-header">
                    <span className="wallet-financial-label">Total Holdings</span>
                    <span className="financial-pill pill-total">Total</span>
                  </div>
                  <div className="wallet-financial-val">
                    {totalBal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    <span className="pi-symbol">π</span>
                  </div>
                  <div className="wallet-financial-sub">Liquid + Locked combined</div>
                </div>

                {/* 4. Account Age */}
                <div className="wallet-financial-card">
                  <div className="wallet-financial-header">
                    <span className="wallet-financial-label">Account Age</span>
                    <span className="financial-pill pill-age">Genesis</span>
                  </div>
                  <div className="wallet-financial-val">
                    {walletInfo.wallet_days ?? 'N/A'}
                    <span className="pi-symbol" style={{ fontSize: '0.9rem' }}>days</span>
                  </div>
                  <div className="wallet-financial-sub">
                    {walletInfo.created ? `Created ${walletInfo.created}` : 'On-chain age'}
                  </div>
                </div>
              </div>

              {/* Dedicated Lockup Schedule Banner (if lock exists) */}
              {lockups?.lock && (
                <div className={`wallet-lockup-banner ${isClaimable ? 'claimable-banner' : 'locked-banner'}`}>
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
                <div>Available Balance: {availableBal}</div>
                {lockups?.lock && <div>Locked: {lockups.lock.amount}</div>}
              </div>
            </div>
          )}

          {/* 3 Metric Stat Cards */}
          <div className="explorer-stats-grid">
            <div className="explorer-stat-card">
              <div className="explorer-stat-icon-box explorer-stat-icon-total">
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div id="stat-total-tx" className="explorer-stat-val">
                {totalTxCount.toLocaleString()}{nextCursor ? '+' : ''}
              </div>
              <div className="explorer-stat-lbl">Total Transactions</div>
            </div>

            <div className="explorer-stat-card">
              <div className="explorer-stat-icon-box explorer-stat-icon-success">
                ✓
              </div>
              <div id="stat-success-tx" className="explorer-stat-val">
                {successTxCount.toLocaleString()}
              </div>
              <div className="explorer-stat-lbl">
                Successful
              </div>
            </div>

            <div className="explorer-stat-card">
              <div className="explorer-stat-icon-box explorer-stat-icon-failed">
                ✕
              </div>
              <div id="stat-failed-tx" className="explorer-stat-val">
                {failedTxCount.toLocaleString()}
              </div>
              <div className="explorer-stat-lbl">
                Failed
              </div>
            </div>
          </div>

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

            {/* Transaction Filter Toolbar */}
            <div className="tx-filter-toolbar">
              <div className="tx-filter-status-row">
                <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-muted)', marginRight: '0.3rem' }}>
                  Status:
                </span>
                <button
                  type="button"
                  id="filter-btn-all"
                  className={`tx-filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('all')}
                >
                  All
                </button>
                <button
                  type="button"
                  id="filter-btn-success"
                  className={`tx-filter-btn ${statusFilter === 'successful' ? 'active-success' : ''}`}
                  onClick={() => setStatusFilter('successful')}
                >
                  ✓ Successful
                </button>
                <button
                  type="button"
                  id="filter-btn-failed"
                  className={`tx-filter-btn ${statusFilter === 'failed' ? 'active-failed' : ''}`}
                  onClick={() => setStatusFilter('failed')}
                >
                  ✕ Failed
                </button>
              </div>

              <div className="tx-filter-inputs-row">
                <input
                  id="filter-address-input"
                  className="tx-filter-input tx-filter-input-address"
                  type="text"
                  placeholder="Filter by Address (To / From)..."
                  value={addrFilter}
                  onChange={(e) => setAddrFilter(e.target.value)}
                />
                <input
                  id="filter-min-amount"
                  className="tx-filter-input tx-filter-input-amt"
                  type="number"
                  step="any"
                  placeholder="Min Pi"
                  value={minAmount}
                  onChange={(e) => setMinAmount(e.target.value)}
                />
                <input
                  id="filter-max-amount"
                  className="tx-filter-input tx-filter-input-amt"
                  type="number"
                  step="any"
                  placeholder="Max Pi"
                  value={maxAmount}
                  onChange={(e) => setMaxAmount(e.target.value)}
                />
                <button
                  type="button"
                  className="tx-filter-reset-btn"
                  onClick={handleResetFilters}
                >
                  Reset Filters
                </button>
              </div>
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
    </>
  );
}
