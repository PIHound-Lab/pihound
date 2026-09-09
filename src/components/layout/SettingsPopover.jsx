import { useEffect, useRef, useState } from 'react';
import { useTheme } from '../../context/ThemeContext';

const LANGUAGES = [
  { code: 'en', name: 'English', region: 'Global', flag: 'gb' },
  { code: 'cnr', name: 'Crnogorski', region: 'Montenegro', flag: 'me' },
  { code: 'tg', name: 'Тоҷикӣ', region: 'Tajikistan', flag: 'tj' },
  { code: 'mk', name: 'Македонски', region: 'North Macedonia', flag: 'mk' },
  { code: 'mn', name: 'Монгол хэл', region: 'Mongolia', flag: 'mn' },
  { code: 'kk', name: 'Қазақ тілі', region: 'Kazakhstan', flag: 'kz' },
  { code: 'uz', name: 'Oʻzbekcha', region: 'Uzbekistan', flag: 'uz' },
  { code: 'ka', name: 'ქართული', region: 'Georgia', flag: 'ge' },
  { code: 'lo', name: 'ພາສາລາວ', region: 'Laos', flag: 'la' },
  { code: 'az', name: 'Azərbaycanca', region: 'Azerbaijan', flag: 'az' },
  { code: 'hy', name: 'Հայերեն', region: 'Armenia', flag: 'am' },
  { code: 'ne', name: 'नेपाली', region: 'Nepal', flag: 'np' },
  { code: 'vi', name: 'Tiếng Việt', region: 'Vietnam', flag: 'vn' },
  { code: 'th', name: 'ไทย', region: 'Thailand', flag: 'th' },
  { code: 'id', name: 'Bahasa Indonesia', region: 'Indonesia', flag: 'id' },
  { code: 'ms', name: 'Bahasa Melayu', region: 'Malaysia', flag: 'my' },
  { code: 'tl', name: 'Filipino', region: 'Philippines', flag: 'ph' },
  { code: 'hi', name: 'हिन्दी', region: 'India', flag: 'in' },
  { code: 'bn', name: 'বাংলা', region: 'Bangladesh', flag: 'bd' },
  { code: 'ur', name: 'اردو', region: 'Pakistan', flag: 'pk' },
  { code: 'ar', name: 'العربية', region: 'Middle East', flag: 'sa' },
  { code: 'fa', name: 'فارسی', region: 'Iran', flag: 'ir' },
];

export default function SettingsPopover({ idPrefix = '', isMobile = false, showLabel = false, onOpen }) {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const popoverRef = useRef(null);

  // Initialize Google Translate script
  useEffect(() => {
    if (!window.googleTranslateElementInit) {
      window.googleTranslateElementInit = () => {
        try {
          new window.google.translate.TranslateElement(
            {
              pageLanguage: 'en',
              layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
              autoDisplay: false,
            },
            'google_translate_element'
          );
        } catch {
          // ignore
        }
      };

      if (!document.getElementById('google-translate-script')) {
        const script = document.createElement('script');
        script.id = 'google-translate-script';
        script.type = 'text/javascript';
        script.src =
          '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
        document.body.appendChild(script);
      }
    }

    // Google Translate bannerslop observer & suppressor
    const cleanGoogleTranslateSlop = () => {
      if (document.body.style.top && document.body.style.top !== '0px') {
        document.body.style.top = '0px';
      }
      document.querySelectorAll('.goog-te-banner-frame, body > .skiptranslate, iframe.goog-te-banner-frame, #goog-gt-tt').forEach((el) => {
        el.style.setProperty('display', 'none', 'important');
        el.style.setProperty('visibility', 'hidden', 'important');
      });
    };

    cleanGoogleTranslateSlop();
    const observer = new MutationObserver(cleanGoogleTranslateSlop);
    observer.observe(document.body, { attributes: true, attributeFilter: ['style', 'class'], childList: true });

    return () => observer.disconnect();
  }, []);

  // Lock body scroll when settings modal is open to prevent background scrolling
  useEffect(() => {
    if (isOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isOpen]);

  // Handle outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const selectLanguage = (langCode) => {
    document.cookie = `googtrans=/en/${langCode}; path=/;`;
    document.cookie = `googtrans=/en/${langCode}; path=/; domain=${window.location.hostname};`;
    localStorage.setItem('universal_lang_selected', 'true');
    setIsOpen(false);
    window.location.reload();
  };

  const filteredLanguages = LANGUAGES.filter(
    (l) =>
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.region.toLowerCase().includes(search.toLowerCase()) ||
      l.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div id={`${idPrefix}univ-lang-widget`} className={`univ-lang-widget-container ${isMobile ? 'in-sidebar' : ''}`} ref={popoverRef}>
      {/* Settings & Language Trigger Button */}
      <button
        type="button"
        className={`univ-lang-trigger ${showLabel ? 'with-label' : ''} ${isMobile && showLabel ? 'mobile-sidebar-btn' : ''}`}
        id={`${idPrefix}univ-lang-trigger`}
        title="Settings & Language"
        onClick={() => {
          setIsOpen((prev) => {
            const next = !prev;
            if (next && onOpen) onOpen();
            return next;
          });
        }}
        aria-label="Settings and language toggle"
      >
        <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        {showLabel && <span className="settings-trigger-text">Settings</span>}
      </button>

      {/* Popover Window */}
      <div
        className={`univ-lang-popover ${isOpen ? 'active' : ''} ${isMobile ? 'popover-in-sidebar' : ''}`}
        id={`${idPrefix}univ-lang-popover`}
      >
        <div className="univ-lang-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <svg
              width="15"
              height="15"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              style={{ color: 'var(--text-muted)' }}
            >
              <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <h3>Settings</h3>
          </div>
          <button
            type="button"
            className="univ-lang-close"
            id={`${idPrefix}univ-lang-close`}
            title="Close"
            onClick={() => setIsOpen(false)}
          >
            ✕
          </button>
        </div>

        {/* Segmented Theme Mode Switcher */}
        <div className="theme-toggle-row">
          <span className="theme-row-label">Theme Mode</span>
          <div className="theme-pill-group">
            <button
              type="button"
              id={`${idPrefix}btn-theme-dark`}
              className={`theme-pill-btn ${theme === 'dark' ? 'active' : ''}`}
              title="Dark Theme"
              onClick={() => setTheme('dark')}
            >
              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
              <span>Dark</span>
            </button>
            <button
              type="button"
              id={`${idPrefix}btn-theme-light`}
              className={`theme-pill-btn ${theme === 'light' ? 'active' : ''}`}
              title="Light Theme"
              onClick={() => setTheme('light')}
            >
              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <span>Light</span>
            </button>
          </div>
        </div>

        {/* Search language input */}
        <div className="univ-lang-search-wrapper">
          <input
            type="text"
            className="univ-lang-search"
            id={`${idPrefix}univ-lang-search`}
            placeholder="Search language..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Searchable Language List */}
        <div className="univ-lang-list" id={`${idPrefix}univ-lang-list`}>
          {filteredLanguages.length === 0 ? (
            <div className="univ-lang-empty">No matching languages.</div>
          ) : (
            filteredLanguages.map((lang) => (
              <button
                key={lang.code}
                type="button"
                className="univ-lang-item"
                onClick={() => selectLanguage(lang.code)}
              >
                <div className="univ-lang-flag">
                  <img src={`https://flagcdn.com/w40/${lang.flag}.png`} alt={lang.name} />
                </div>
                <div className="univ-lang-text">
                  <div className="univ-lang-name">{lang.name}</div>
                  <div className="univ-lang-region">{lang.region}</div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
