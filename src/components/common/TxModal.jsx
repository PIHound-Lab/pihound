import { useEffect } from 'react';
import { useModal } from '../../context/ModalContext';

export default function TxModal() {
  const { activeTx, isModalOpen, closeTxModal, copyToClipboard } = useModal();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isModalOpen) {
        closeTxModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, closeTxModal]);

  if (!isModalOpen || !activeTx) return null;

  const txHash = String(activeTx.hash || activeTx.id || activeTx.tx_hash || 'N/A');
  const dateStr = String(activeTx.date || activeTx.timestamp || activeTx.created_at || 'N/A');
  const destStr = String(
    activeTx.destination ||
    activeTx.to_address ||
    activeTx.target_account ||
    activeTx.source_account ||
    'N/A'
  );
  const amtStr = String(activeTx.amount || activeTx.amount_pi || '0');
  const displayAmt = amtStr.includes('Pi') || amtStr.includes('π') ? amtStr : `${amtStr} π`;
  const memoStr = String(activeTx.memo || 'None');
  const opCount = activeTx.operation_count || 1;
  const opTypes = String(activeTx.op_types_label || activeTx.op_types || 'Payment');
  const feeStr = String(activeTx.fee_charged || '0.0000100');
  const maxFeeStr = String(activeTx.max_fee || '0.0001000');
  const isSuccess = activeTx.successful !== false;
  const rawXdr = String(activeTx.envelope_xdr || activeTx.xdr || activeTx.paging_token || 'N/A');
  const shortXdr =
    rawXdr !== 'N/A' && rawXdr.length > 20
      ? `${rawXdr.substring(0, 10)}...${rawXdr.substring(rawXdr.length - 6)}`
      : rawXdr;

  return (
    <div
      id="tx-modal"
      className="tx-modal-backdrop"
      style={{ display: 'flex' }}
      onClick={(e) => {
        if (e.target.id === 'tx-modal') closeTxModal();
      }}
    >
      <div className="tx-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="tx-modal-header">
          <div id="modal-title" className="tx-modal-title">
            Transaction Details
          </div>
          <button
            type="button"
            className="tx-modal-close-btn"
            onClick={closeTxModal}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Modal Body Fields Grid */}
        <div className="tx-modal-body">
          {/* ID */}
          <div className="tx-modal-row">
            <span className="tx-modal-lbl">ID / Hash</span>
            <div className="tx-modal-val-wrap">
              <code id="modal-id-text" className="tx-modal-code">
                {txHash}
              </code>
              <button
                type="button"
                className="tx-modal-copy-btn"
                onClick={() => copyToClipboard(txHash, 'Transaction hash copied!')}
                title="Copy ID"
              >
                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>

          {/* Date */}
          <div className="tx-modal-row">
            <span className="tx-modal-lbl">Date</span>
            <span id="modal-date-text" className="tx-modal-val mono">
              {dateStr}
            </span>
          </div>

          {/* Destination */}
          <div className="tx-modal-row">
            <span className="tx-modal-lbl">Destination</span>
            <div className="tx-modal-val-wrap">
              <code id="modal-dest-text" className="tx-modal-code">
                {destStr}
              </code>
              <button
                type="button"
                className="tx-modal-copy-btn"
                onClick={() => copyToClipboard(destStr, 'Destination address copied!')}
                title="Copy Destination"
              >
                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>

          {/* Amount */}
          <div className="tx-modal-row">
            <span className="tx-modal-lbl">Amount</span>
            <span id="modal-amount-text" className="tx-modal-val mono font-bold">
              {displayAmt}
            </span>
          </div>

          {/* Memo */}
          <div className="tx-modal-row">
            <span className="tx-modal-lbl">Memo</span>
            <span id="modal-memo-text" className="tx-modal-val mono">
              {memoStr}
            </span>
          </div>

          {/* Operations */}
          <div className="tx-modal-row">
            <span className="tx-modal-lbl">Operations</span>
            <div className="tx-modal-val-wrap">
              <span id="modal-op-count" className="tx-modal-val mono font-bold">
                {opCount}
              </span>
              <span id="modal-op-types" className="tx-modal-tag">
                {opTypes}
              </span>
            </div>
          </div>

          {/* Fee Charged */}
          <div className="tx-modal-row">
            <span className="tx-modal-lbl">Fee Charged</span>
            <span id="modal-fee-text" className="tx-modal-val mono">
              {feeStr} π
            </span>
          </div>

          {/* Max Fee */}
          <div className="tx-modal-row">
            <span className="tx-modal-lbl">Max Fee</span>
            <span id="modal-maxfee-text" className="tx-modal-val mono">
              {maxFeeStr} π
            </span>
          </div>

          {/* Status */}
          <div className="tx-modal-row">
            <span className="tx-modal-lbl">Status</span>
            <span
              id="modal-status-text"
              className="tx-modal-val font-bold"
              style={{ color: isSuccess ? '#34d399' : '#f87171' }}
            >
              {isSuccess ? '✅ Successful' : '❌ Failed'}
            </span>
          </div>

          {/* Raw XDR */}
          <div className="tx-modal-row">
            <span className="tx-modal-lbl">Raw XDR</span>
            <div className="tx-modal-val-wrap">
              <code
                id="modal-xdr-text"
                className="tx-modal-code truncate"
                style={{ maxWidth: '240px' }}
                title={rawXdr}
              >
                {shortXdr}
              </code>
              <button
                type="button"
                className="tx-modal-copy-btn"
                onClick={() => copyToClipboard(rawXdr, 'Raw XDR copied!')}
                title="Copy XDR"
              >
                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
