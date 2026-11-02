import { AlertTriangle, CheckCircle2, PowerOff } from 'lucide-react';
import type { ComputerUnit, DamageReport, LabRoom, PowerState } from '../types/lab';
import { POWER_STATE_SHORT } from '../types/lab';

export type GridInteractionMode = 'inspeksi' | 'cek_cepat';

interface LabGrid6x6Props {
  lab: LabRoom;
  computers: ComputerUnit[];
  openReports: DamageReport[];
  selectedComputerId: string | null;
  interactionMode: GridInteractionMode;
  powerFilter: 'semua' | PowerState;
  quickCheckerName: string;
  quickCheckerClass: string;
  isBusy: boolean;
  onChangeMode: (mode: GridInteractionMode) => void;
  onChangePowerFilter: (filter: 'semua' | PowerState) => void;
  onChangeQuickCheckerName: (val: string) => void;
  onChangeQuickCheckerClass: (val: string) => void;
  onSelectComputer: (pc: ComputerUnit) => void;
  onQuickToggleComputer: (pc: ComputerUnit) => void;
  onBatchVerifyNormal: () => void;
}

const ROW_LABELS = ['Baris A', 'Baris B', 'Baris C', 'Baris D', 'Baris E', 'Baris F'];
const COL_LABELS = ['Meja 1', 'Meja 2', 'Meja 3', 'Meja 4', 'Meja 5', 'Meja 6'];

export function LabGrid6x6({
  lab,
  computers,
  openReports,
  selectedComputerId,
  interactionMode,
  powerFilter,
  quickCheckerName,
  quickCheckerClass,
  isBusy,
  onChangeMode,
  onChangePowerFilter,
  onChangeQuickCheckerName,
  onChangeQuickCheckerClass,
  onSelectComputer,
  onQuickToggleComputer,
  onBatchVerifyNormal,
}: LabGrid6x6Props) {
  const openReportCountByPc = new Map<string, number>();
  for (const r of openReports) {
    openReportCountByPc.set(r.computerId, (openReportCountByPc.get(r.computerId) || 0) + 1);
  }

  const normalCount = computers.filter((c) => c.powerState === 'menyala_normal').length;
  const issueCount = computers.filter((c) => c.powerState === 'menyala_bermasalah').length;
  const deadCount = computers.filter((c) => c.powerState === 'tidak_menyala').length;

  const handleTileClick = (pc: ComputerUnit) => {
    if (interactionMode === 'cek_cepat') {
      onQuickToggleComputer(pc);
    } else {
      onSelectComputer(pc);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl">
      {/* Lab Floorplan Header & Mode Switcher */}
      <div className="p-5 sm:p-6 border-b border-slate-200 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              Denah 6×6 {lab.name}
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-500">
              <span>{lab.floor}</span>
              <span aria-hidden="true" className="mx-1.5">·</span>
              <span>{lab.specialization}</span>
              <span aria-hidden="true" className="mx-1.5">·</span>
              <span className="tabular-nums">36 Unit Komputer</span>
            </p>
          </div>

          {/* Interactive Mode Segmented Control */}
          <div
            role="group"
            aria-label="Mode Interaksi Denah"
            className="inline-flex items-center p-1 bg-slate-100 rounded-lg self-start sm:self-auto"
          >
            <button
              type="button"
              onClick={() => onChangeMode('inspeksi')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors duration-150 whitespace-nowrap shrink-0 ${
                interactionMode === 'inspeksi'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Inspeksi & Laporan
            </button>
            <button
              type="button"
              onClick={() => onChangeMode('cek_cepat')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors duration-150 whitespace-nowrap shrink-0 ${
                interactionMode === 'cek_cepat'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Cek Cepat Nyala / Mati
            </button>
          </div>
        </div>

        {/* Filter & Status Legend Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div
            role="group"
            aria-label="Filter Status Daya"
            className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg"
          >
            <button
              type="button"
              onClick={() => onChangePowerFilter('semua')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors duration-150 whitespace-nowrap shrink-0 tabular-nums ${
                powerFilter === 'semua'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua (36)
            </button>
            <button
              type="button"
              onClick={() => onChangePowerFilter('menyala_normal')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors duration-150 whitespace-nowrap shrink-0 tabular-nums ${
                powerFilter === 'menyala_normal'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Nyala ({normalCount})
            </button>
            <button
              type="button"
              onClick={() => onChangePowerFilter('menyala_bermasalah')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors duration-150 whitespace-nowrap shrink-0 tabular-nums ${
                powerFilter === 'menyala_bermasalah'
                  ? 'bg-white text-amber-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Kendala ({issueCount})
            </button>
            <button
              type="button"
              onClick={() => onChangePowerFilter('tidak_menyala')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors duration-150 whitespace-nowrap shrink-0 tabular-nums ${
                powerFilter === 'tidak_menyala'
                  ? 'bg-white text-red-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Mati ({deadCount})
            </button>
          </div>

          <p className="text-xs text-slate-500">
            {interactionMode === 'cek_cepat'
              ? 'Klik langsung kotak komputer untuk mengubah status Nyala atau Mati.'
              : 'Klik nomor komputer sesuai meja Anda untuk mengisi pendataan atau laporan.'}
          </p>
        </div>

        {/* Quick Check Identity Strip (only when Mode Cek Cepat active) */}
        {interactionMode === 'cek_cepat' && (
          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
              <div>
                <label
                  htmlFor="quick-checker-name"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  Nama Petugas Piket / Siswa
                </label>
                <input
                  id="quick-checker-name"
                  type="text"
                  maxLength={60}
                  value={quickCheckerName}
                  onChange={(e) => onChangeQuickCheckerName(e.target.value)}
                  placeholder="Contoh: Andi Pratama"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
              <div>
                <label
                  htmlFor="quick-checker-class"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  Kelas / Rombel
                </label>
                <input
                  id="quick-checker-class"
                  type="text"
                  maxLength={30}
                  value={quickCheckerClass}
                  onChange={(e) => onChangeQuickCheckerClass(e.target.value)}
                  placeholder="Contoh: XI RPL 1"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>
            <button
              type="button"
              disabled={isBusy}
              onClick={onBatchVerifyNormal}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 disabled:opacity-50"
            >
              Catat Waktu Cek Semua Unit Nyala
            </button>
          </div>
        )}
      </div>

      {/* Physical Room Orientation & 6x6 Grid */}
      <div className="p-4 sm:p-6">
        {/* Front of Lab Orientation Bar */}
        <div className="mb-5 pb-4 border-b border-dashed border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <span>Pintu Masuk Ruang</span>
          <span className="font-semibold text-slate-700 tracking-tight">
            Meja Guru / Instruktur &amp; Layar Proyektor (Depan Lab)
          </span>
          <span>Rak Switch &amp; Panel Daya</span>
        </div>

        {/* Column Headers (Meja 1 - Meja 6) */}
        <div className="hidden sm:grid sm:grid-cols-[68px_repeat(6,minmax(0,1fr))] gap-2.5 mb-2">
          <div aria-hidden="true" />
          {COL_LABELS.map((colLabel, idx) => (
            <div
              key={colLabel}
              className={`text-center text-xs font-medium text-slate-500 whitespace-nowrap ${
                idx === 2 ? 'pr-2' : idx === 3 ? 'pl-2' : ''
              }`}
            >
              {colLabel}
            </div>
          ))}
        </div>

        {/* 6 Rows x 6 Columns Matrix */}
        <div className="space-y-2.5">
          {ROW_LABELS.map((rowLabel, rowIndex) => {
            const rowUnits = computers
              .filter((c) => c.row === rowIndex)
              .sort((a, b) => a.col - b.col);

            return (
              <div
                key={rowLabel}
                className="grid grid-cols-3 sm:grid-cols-[68px_repeat(6,minmax(0,1fr))] gap-2 sm:gap-2.5 items-stretch"
              >
                {/* Row Coordinate Label */}
                <div className="col-span-3 sm:col-span-1 flex items-center text-xs font-semibold text-slate-500 pt-2 sm:pt-0 whitespace-nowrap">
                  {rowLabel}
                </div>

                {rowUnits.map((pc) => {
                  const isSelected = selectedComputerId === pc.id;
                  const matchesFilter =
                    powerFilter === 'semua' || pc.powerState === powerFilter;
                  const reportCount = openReportCountByPc.get(pc.id) || 0;

                  let stateClasses =
                    'bg-emerald-50/70 hover:bg-emerald-50 border-emerald-200 text-emerald-950';
                  let statusTextClass = 'text-emerald-700';
                  let IconComponent = CheckCircle2;

                  if (pc.powerState === 'menyala_bermasalah') {
                    stateClasses =
                      'bg-amber-50 hover:bg-amber-100/70 border-amber-300 text-amber-950';
                    statusTextClass = 'text-amber-800';
                    IconComponent = AlertTriangle;
                  } else if (pc.powerState === 'tidak_menyala') {
                    stateClasses =
                      'bg-red-50 hover:bg-red-100/70 border-red-300 text-red-950';
                    statusTextClass = 'text-red-800';
                    IconComponent = PowerOff;
                  }

                  // Center aisle visual breathing room between column 3 (col=2) and column 4 (col=3) on desktop
                  const aisleSpacing =
                    pc.col === 2 ? 'sm:mr-1.5' : pc.col === 3 ? 'sm:ml-1.5' : '';

                  return (
                    <button
                      key={pc.id}
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleTileClick(pc)}
                      aria-pressed={isSelected}
                      aria-label={`${pc.code} Meja ${pc.seatLabel}, Status ${POWER_STATE_SHORT[pc.powerState]}`}
                      className={`group relative flex flex-col justify-between p-2.5 sm:p-3 min-h-[76px] rounded-lg border text-left transition-transform transition-opacity duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-1 ${stateClasses} ${aisleSpacing} ${
                        isSelected
                          ? 'ring-2 ring-slate-900 border-slate-900 shadow-xs'
                          : ''
                      } ${!matchesFilter ? 'opacity-25' : 'opacity-100 active:scale-[0.98]'}`}
                    >
                      <div className="flex items-center justify-between gap-1 w-full">
                        <span className="font-mono text-xs sm:text-[13px] font-semibold tabular-nums tracking-tight whitespace-nowrap">
                          {pc.code}
                        </span>
                        <span className="font-mono text-[11px] text-slate-500 tabular-nums whitespace-nowrap">
                          {pc.seatLabel}
                        </span>
                      </div>

                      <div className="mt-2 flex items-center justify-between gap-1 w-full">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] sm:text-xs font-semibold whitespace-nowrap ${statusTextClass}`}
                        >
                          <IconComponent className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                          <span>{POWER_STATE_SHORT[pc.powerState]}</span>
                        </span>

                        {reportCount > 0 && (
                          <span
                            title={`${reportCount} laporan aktif`}
                            className="font-mono text-[11px] font-semibold text-slate-600 tabular-nums whitespace-nowrap"
                          >
                            {reportCount} lap.
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Back of Room Orientation */}
        <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
          <span>Sisi Kiri Ruang (Jendela)</span>
          <span>Bagian Belakang {lab.shortName}</span>
          <span>Sisi Kanan Ruang (Dinding)</span>
        </div>
      </div>
    </div>
  );
}
