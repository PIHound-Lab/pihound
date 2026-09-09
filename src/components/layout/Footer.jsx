import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useModal } from '../../context/ModalContext';

const SUPPORT_ADDR =
  'MDFNWH6ZFJVHJDLBMNOUT35X4EEKQVJAO3ZDL4NL7VQJLC4PJOQFWAAAAAAHV4F7QQX3Q';

export default function Footer() {
  const { copyToClipboard } = useModal();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    copyToClipboard(SUPPORT_ADDR, 'Support address copied to clipboard!');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <footer className="site-footer">
      <div className="footer-container">
        {/* Support PiHound Infrastructure Card */}
        <div className="footer-support-card">
          <div className="footer-support-header">
            <div className="footer-support-title">
              <svg
                width="22"
                height="22"
                fill="none"
                stroke="var(--accent)"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Support PiHound</span>
            </div>
          </div>

          <div className="footer-support-desc">
            If you find PiHound useful for tracking, tracing, and monitoring the
            Pi Network ecosystem, consider supporting our node hosting and server
            bandwidth.
          </div>

          <div className="footer-support-box">
            <div className="footer-support-addr" id="footer-support-addr">
              {SUPPORT_ADDR}
            </div>
            <button
              id="footer-copy-btn"
              type="button"
              className={`footer-copy-btn ${copied ? 'copied' : ''}`}
              onClick={handleCopy}
              title={copied ? 'Copied to clipboard!' : 'Click to copy support address'}
              aria-label="Copy support address"
            >
              {copied ? (
                <svg
                  width="14"
                  height="14"
                  fill="none"
                  stroke="#34d399"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                >
                  <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <svg
                  width="14"
                  height="14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>
          </div>

          <div
            id="footer-copy-note"
            style={{
              fontSize: '0.76rem',
              marginTop: '0.5rem',
              height: '1rem',
              fontWeight: 600,
              color: copied ? '#34d399' : 'transparent',
              transition: 'color 0.2s',
            }}
          >
            {copied ? '✓ Copied to clipboard!' : ''}
          </div>
        </div>

        {/* Bottom Navigation & Social Icons Row */}
        <div className="footer-bottom-row">
          {/* Brand Info */}
          <Link to="/" className="footer-brand">
            <img src="/images/icon.webp" alt="PiHound" />
            <span>PiHound</span>
          </Link>

          {/* Navigation Links */}
          <div className="footer-links">
            <Link to="/about" className="footer-link">
              About
            </Link>
            <Link to="/faq" className="footer-link">
              FAQ
            </Link>
            <Link to="/terms" className="footer-link">
              Terms of Service
            </Link>
            <Link to="/privacy" className="footer-link">
              Privacy Policy
            </Link>
          </div>

          {/* Social Icon Links */}
          <div className="social-icons-group">
            {/* Telegram */}
            <a
              href="https://t.me/pihound"
              target="_blank"
              rel="noopener noreferrer"
              className="social-icon-btn telegram"
              title="Join our Telegram"
              aria-label="Telegram"
            >
              <svg viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.03-1.99 1.27-5.62 3.72-.53.36-1.01.54-1.44.53-.47-.01-1.38-.27-2.05-.49-.83-.27-1.49-.42-1.43-.88.03-.24.37-.49 1.02-.75 3.98-1.73 6.64-2.87 7.97-3.43 3.8-1.58 4.59-1.86 5.1-1.87.11 0 .36.03.52.16.13.11.17.26.19.37.01.07.03.22.01.35z" />
              </svg>
            </a>

            {/* X / Twitter */}
            <a
              href="https://x.com/pihoundofficial"
              target="_blank"
              rel="noopener noreferrer"
              className="social-icon-btn twitter"
              title="Follow on X (Twitter)"
              aria-label="X Twitter"
            >
              <svg viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>

            {/* GitHub */}
            <a
              href="https://github.com/PIHound-Lab/"
              target="_blank"
              rel="noopener noreferrer"
              className="social-icon-btn github"
              title="View on GitHub"
              aria-label="GitHub"
            >
              <svg viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
            </a>
          </div>
        </div>

        {/* Copyright Note */}
        <div
          style={{
            textAlign: 'center',
            fontSize: '0.76rem',
            color: 'var(--text-dim)',
            marginTop: '-0.5rem',
          }}
        >
          © 2026 PiHound — Open Investigative & Analytics Toolkit for the Pi Network.
        </div>
      </div>
    </footer>
  );
}
