import { createContext, useCallback, useContext, useState } from 'react';

const ModalContext = createContext();

let _toastIdCounter = 0;

export function ModalProvider({ children }) {
  const [activeTx, setActiveTx] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Legacy single-message shim kept for backward-compat
  const [toastMessage, setToastMessage] = useState(null);

  const openTxModal = (tx) => {
    setActiveTx(tx);
    setIsModalOpen(true);
  };

  const closeTxModal = () => {
    setIsModalOpen(false);
  };

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  /**
   * showToast(message, options?)
   *   options.type    = 'success' | 'error' | 'warning' | 'info'  (default: 'success')
   *   options.duration = ms before auto-dismiss                     (default: 3000)
   */
  const showToast = useCallback((msg, options = {}) => {
    const type = options.type || 'success';
    const duration = options.duration ?? 3000;

    // Deduplicate: ignore if same message+type already visible
    setToasts((prev) => {
      if (prev.some((t) => t.message === msg && t.type === type)) return prev;
      const id = ++_toastIdCounter;
      const toast = { id, message: msg, type };
      // schedule auto-dismiss
      setTimeout(() => dismissToast(id), duration);
      return [...prev.slice(-4), toast];
    });

    // Legacy shim
    setToastMessage(msg);
    setTimeout(() => setToastMessage((c) => (c === msg ? null : c)), duration);
  }, [dismissToast]);

  const copyToClipboard = (text, label = 'Copied to clipboard!') => {
    if (!text) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        showToast(label);
      }).catch(() => {
        fallbackCopy(text, label);
      });
    } else {
      fallbackCopy(text, label);
    }
  };

  const fallbackCopy = (text, label) => {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      showToast(label);
    } catch {
      // ignore
    }
    document.body.removeChild(ta);
  };

  return (
    <ModalContext.Provider
      value={{
        activeTx,
        isModalOpen,
        openTxModal,
        closeTxModal,
        toastMessage,   // legacy
        toasts,
        showToast,
        dismissToast,
        copyToClipboard,
      }}
    >
      {children}
    </ModalContext.Provider>
  );
}

export function useModal() {
  return useContext(ModalContext);
}
