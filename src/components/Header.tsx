export type ActiveTab = 'denah' | 'laporan' | 'ringkasan' | 'panduan';

interface HeaderProps {
  activeTab: ActiveTab;
  openReportsCount: number;
  onSelectTab: (tab: ActiveTab) => void;
  onOpenQuickReport: () => void;
}

export function Header({
  activeTab,
  openReportsCount,
  onSelectTab,
  onOpenQuickReport,
}: HeaderProps) {
  const navItems: { id: ActiveTab; label: string }[] = [
    { id: 'denah', label: 'Denah Lab' },
    {
      id: 'laporan',
      label: openReportsCount > 0 ? `Daftar Laporan (${openReportsCount})` : 'Daftar Laporan',
    },
    { id: 'ringkasan', label: 'Ringkasan Lab' },
    { id: 'panduan', label: 'Panduan Siswa' },
  ];

  return (
    <header className="no-print bg-white border-b border-slate-200">
      <div className="max-w-[1360px] mx-auto flex items-center justify-between gap-8 px-4 sm:px-6 lg:px-8 h-16">
        {/* Zone 1: Single text element wordmark */}
        <button
          type="button"
          onClick={() => onSelectTab('denah')}
          className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 rounded"
        >
          LabTrack
        </button>

        {/* Zone 2: 4 concise single-line text navigation links */}
        <nav
          aria-label="Navigasi Utama"
          className="hidden md:flex items-center gap-7 text-sm font-medium"
        >
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`py-5 border-b-2 transition-colors duration-150 whitespace-nowrap shrink-0 tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 ${
                  isActive
                    ? 'border-slate-900 text-slate-900 font-semibold'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onOpenQuickReport}
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
          >
            Buat Laporan
          </button>
        </div>
      </div>

      {/* Mobile navigation strip (visible only below md) */}
      <nav
        aria-label="Navigasi Mobile"
        className="md:hidden flex items-center gap-5 px-4 overflow-x-auto border-t border-slate-100 bg-white text-xs font-medium"
      >
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`py-3 border-b-2 whitespace-nowrap shrink-0 tabular-nums transition-colors duration-150 ${
                isActive
                  ? 'border-slate-900 text-slate-900 font-semibold'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
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
