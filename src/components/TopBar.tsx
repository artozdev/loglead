import GlobalSearch from "./GlobalSearch";

export default function TopBar({ onHamburger }: { onHamburger: () => void }) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/85 backdrop-blur">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
        <button
          onClick={onHamburger}
          aria-label="Ouvrir le menu"
          className="flex h-9 w-9 items-center justify-center rounded-[10px] text-muted hover:bg-surface-hover md:hidden"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>

        <div className="flex flex-1 justify-center">
          <GlobalSearch />
        </div>
      </div>
    </header>
  );
}
