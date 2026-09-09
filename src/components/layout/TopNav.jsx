import SettingsPopover from './SettingsPopover';

export default function TopNav() {
  return (
    <header className="top-nav-bar w-full h-[52px] px-6 hidden md:flex items-center justify-end gap-3 border-b border-border bg-surface sticky top-0 z-[900]">
      <SettingsPopover />
    </header>
  );
}

