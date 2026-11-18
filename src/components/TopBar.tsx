import type { WorkspaceScreen } from '../types/assessment';

interface TopBarProps {
  activeScreen: WorkspaceScreen;
  onNavigate: (screen: WorkspaceScreen) => void;
  onNewQuestion: () => void;
}

const NAV_ITEMS: { id: WorkspaceScreen; label: string }[] = [
  { id: 'studio', label: 'Item Studio' },
  { id: 'generator', label: 'Generator' },
  { id: 'matrix', label: 'Test Matrix' },
  { id: 'rubrics', label: 'Rubrics' },
];

export function TopBar({ activeScreen, onNavigate, onNewQuestion }: TopBarProps) {
  return (
    <header className="no-print md:sticky md:top-0 z-30 border-b border-[#E2E8F0] bg-white">
      <div className="mx-auto flex h-14 max-w-[1440px] items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Single text element wordmark */}
        <button
          type="button"
          onClick={() => onNavigate('studio')}
          className="font-display text-lg font-bold tracking-[-0.02em] text-[#0F172A] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#2563EB]"
        >
          EduSoal AI
        </button>

        {/* Zone 2: 4 concise single-line text links */}
        <nav
          aria-label="Primary workspace"
          className="hidden md:flex items-center gap-6 h-full"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeScreen === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`relative flex h-full items-center text-[14px] font-medium whitespace-nowrap shrink-0 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-[#2563EB] ${
                  isActive
                    ? 'text-[#0F172A] font-semibold'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                {item.label}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 bottom-0 h-0.5 bg-[#2563EB]"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onNewQuestion}
            className="rounded bg-[#0F172A] px-4 py-2 text-[13px] font-semibold text-white whitespace-nowrap shrink-0 transition-all duration-150 hover:bg-[#1E293B] active:scale-[0.995] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB]"
          >
            New Question
          </button>
        </div>
      </div>

      {/* Mobile horizontal navigation bar */}
      <nav
        aria-label="Mobile workspace"
        className="flex md:hidden items-center justify-between border-t border-[#E2E8F0] bg-[#F8FAFC] px-4 h-10 overflow-x-auto"
      >
        {NAV_ITEMS.map((item) => {
          const isActive = activeScreen === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`px-2 py-1 text-[13px] font-medium whitespace-nowrap shrink-0 ${
                isActive
                  ? 'text-[#2563EB] font-semibold'
                  : 'text-[#64748B]'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>
    </header>
  );
}
