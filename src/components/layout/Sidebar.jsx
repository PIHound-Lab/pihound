import { Link, useLocation } from 'react-router-dom';

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation();
  const currentPath = location.pathname;

  const isLinkActive = (path) => {
    if (path === '/') {
      return currentPath === '/' || currentPath === '/home' || currentPath === '/introduction';
    }
    return currentPath.startsWith(path) && path !== '/';
  };

  const navItems = [
    {
      to: '/',
      label: 'Home',
      icon: (
        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      to: '/wallet_explorer',
      label: 'Wallet Explorer',
      icon: (
        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002-2v10a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      to: '/track_and_trace',
      label: 'Track & Trace',
      icon: (
        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
    },
    {
      to: '/wallet_sweeps',
      label: 'Wallet Sweeps',
      icon: (
        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    },
    {
      to: '/bubblemap',
      label: 'BubbleMap',
      icon: (
        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
    },
    {
      to: '/pct_and_cexs',
      label: 'PCT & CEXs',
      icon: (
        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0h9m-9 0V11m0 10V11m0 0h5m-5 0H7" />
        </svg>
      ),
    },
  ];

  return (
    <aside
      className={`sidebar fixed top-0 left-0 w-[240px] h-screen bg-surface border-r border-border z-[1000] flex flex-col p-4 transition-transform duration-200 ease-in-out max-md:-translate-x-full ${
        isOpen ? 'open !translate-x-0' : ''
      }`}
      id="sidebar"
    >
      {/* Sidebar Header with Brand, Settings Gear, and Close Button on Mobile */}
      <div className="sidebar-header flex items-center justify-between mb-5 px-1 shrink-0">
        <Link
          to="/"
          className="sidebar-brand flex items-center gap-2.5 no-underline mb-0 p-0"
          onClick={onClose}
        >
          <img
            src="/images/icon.webp"
            alt="PiHound"
            className="w-8 h-8 max-w-[32px] max-h-[32px] rounded-md object-contain shrink-0"
            style={{ width: '32px', height: '32px', maxWidth: '32px', maxHeight: '32px', borderRadius: '6px', objectFit: 'contain' }}
          />
          <span className="font-extrabold text-xl tracking-tight" style={{ color: '#ffffff' }}>
            PiHound
          </span>
        </Link>

        <div className="hidden max-md:flex items-center">
          <button
            type="button"
            className="sidebar-close-btn flex items-center justify-center w-8 h-8 rounded-md text-muted hover:text-main hover:bg-card border border-border transition-colors cursor-pointer"
            onClick={onClose}
            aria-label="Close navigation menu"
            style={{ background: 'var(--bg-card)' }}
          >
            ✕
          </button>
        </div>
      </div>

      <nav className="sidebar-nav flex flex-col gap-1 flex-1 overflow-y-auto">
        {navItems.map((item) => {
          const active = isLinkActive(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-2.5 py-2.5 px-3 rounded-md text-sm font-medium transition-all no-underline ${
                active
                  ? 'active font-semibold text-accent bg-card'
                  : 'text-muted hover:text-main hover:bg-card'
              }`}
              onClick={onClose}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

