import { Link } from 'react-router-dom';
import SettingsPopover from './SettingsPopover';

export default function MobileHeader({ isOpen, onToggle }) {
  return (
    <>
      <div className="mobile-header">
        <Link
          to="/"
          className="sidebar-brand"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', marginBottom: 0 }}
        >
          <img
            src="/images/icon.webp"
            alt="PiHound"
            style={{ width: '28px', height: '28px', maxWidth: '28px', maxHeight: '28px', borderRadius: '6px', objectFit: 'contain' }}
          />
          <span style={{ fontWeight: 800, fontSize: '1.15rem', color: '#ffffff', letterSpacing: '-0.02em' }}>
            PiHound
          </span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <SettingsPopover idPrefix="mobile-header-" />
          <button
            type="button"
            className="mobile-toggle"
            onClick={onToggle}
            aria-label="Toggle navigation menu"
          >
            ☰
          </button>
        </div>
      </div>

      {isOpen && (
        <div
          className="sidebar-backdrop active"
          id="sidebar-backdrop"
          onClick={onToggle}
        />
      )}
    </>
  );
}


