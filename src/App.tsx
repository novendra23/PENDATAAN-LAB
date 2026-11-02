import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, FileText, Printer, X } from 'lucide-react';
import { ActiveTab, Header } from './components/Header';
import { GridInteractionMode, LabGrid6x6 } from './components/LabGrid6x6';
import { LabsOverview } from './components/LabsOverview';
import { PrintableReportModal } from './components/PrintableReportModal';
import { QuickReportModal } from './components/QuickReportModal';
import { ReportsView } from './components/ReportsView';
import { StudentGuideView } from './components/StudentGuideView';
import { WorkstationInspector } from './components/WorkstationInspector';
import {
  createDamageReport,
  deleteReport,
  fetchLabState,
  submitBatchCheck,
  toggleComputerPower,
  updateReportStatus,
} from './services/labApi';
import {
  ComputerUnit,
  CreateReportPayload,
  LabStatePayload,
  PowerState,
  ReportStatus,
} from './types/lab';
import { downloadAllComputersCsv, downloadReportsCsv } from './utils/exportCsv';

interface ToastState {
  id: number;
  message: string;
}

export default function App() {
  const [labState, setLabState] = useState<LabStatePayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBusy, setIsBusy] = useState(false);

  const [activeTab, setActiveTab] = useState<ActiveTab>('denah');
  const [selectedLabId, setSelectedLabId] = useState<string>('LAB-01');
  const [selectedComputerId, setSelectedComputerId] = useState<string | null>(null);

  const [interactionMode, setInteractionMode] = useState<GridInteractionMode>('inspeksi');
  const [powerFilter, setPowerFilter] = useState<'semua' | PowerState>('semua');
  const [quickCheckerName, setQuickCheckerName] = useState('');
  const [quickCheckerClass, setQuickCheckerClass] = useState('');

  const [isQuickReportOpen, setIsQuickReportOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback((message: string) => {
    const id = Date.now();
    setToast({ id, message });
    window.setTimeout(() => {
      setToast((current) => (current?.id === id ? null : current));
    }, 3600);
  }, []);

  useEffect(() => {
    let mounted = true;
    fetchLabState()
      .then((data) => {
        if (!mounted) return;
        setLabState(data);
        const lab1Units = data.computers.filter((c) => c.labId === 'LAB-01');
        const firstProblem = lab1Units.find((c) => c.powerState !== 'menyala_normal');
        setSelectedComputerId(firstProblem ? firstProblem.id : lab1Units[0]?.id || null);
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const handleSelectLab = (labId: string, specificComputerId?: string) => {
    setSelectedLabId(labId);
    setPowerFilter('semua');
    if (!labState) return;
    if (specificComputerId) {
      setSelectedComputerId(specificComputerId);
      return;
    }
    const units = labState.computers
      .filter((c) => c.labId === labId)
      .sort((a, b) => a.unitNumber - b.unitNumber);
    const problemUnit = units.find((c) => c.powerState !== 'menyala_normal');
    setSelectedComputerId(problemUnit ? problemUnit.id : units[0]?.id || null);
  };

  const handleQuickSetPowerState = async (
    computerId: string,
    nextPower: PowerState,
    checkedBy?: string
  ) => {
    setIsBusy(true);
    try {
      const actor =
        checkedBy ||
        (quickCheckerName.trim()
          ? `${quickCheckerName.trim()}${
              quickCheckerClass.trim() ? ` (${quickCheckerClass.trim()})` : ''
            }`
          : 'Siswa / Piket Lab');

      const updated = await toggleComputerPower({
        computerId,
        powerState: nextPower,
        checkedBy: actor,
      });
      setLabState(updated);
      const pc = updated.computers.find((c) => c.id === computerId);
      if (pc) {
        const label =
          nextPower === 'menyala_normal'
            ? 'Menyala Normal'
            : nextPower === 'menyala_bermasalah'
              ? 'Menyala (Ada Kendala)'
              : 'Tidak Menyala';
        showToast(`Status ${pc.code} (${pc.seatLabel}) diperbarui menjadi ${label}.`);
      }
    } finally {
      setIsBusy(false);
    }
  };

  const handleQuickToggleTile = async (pc: ComputerUnit) => {
    setSelectedComputerId(pc.id);
    const nextState: PowerState =
      pc.powerState === 'menyala_normal' ? 'tidak_menyala' : 'menyala_normal';
    await handleQuickSetPowerState(pc.id, nextState);
  };

  const handleBatchVerifyNormal = async () => {
    setIsBusy(true);
    try {
      const updated = await submitBatchCheck({
        labId: selectedLabId,
        checkedBy: quickCheckerName.trim() || 'Piket Siswa',
        studentClass: quickCheckerClass.trim() || 'Praktikum',
        mode: 'mark_normal_checked',
      });
      setLabState(updated);
      const lab = updated.labs.find((l) => l.id === selectedLabId);
      showToast(`Waktu pengecekan unit menyala di ${lab?.name || selectedLabId} berhasil dicatat.`);
    } finally {
      setIsBusy(false);
    }
  };

  const handleCreateReport = async (payload: CreateReportPayload) => {
    setIsBusy(true);
    try {
      const { state, report } = await createDamageReport(payload);
      setLabState(state);
      setSelectedLabId(payload.labId);
      setSelectedComputerId(payload.computerId);
      showToast(
        `Laporan ${report.id} untuk ${report.computerCode} (${report.labName}) berhasil disimpan.`
      );
    } finally {
      setIsBusy(false);
    }
  };

  const handleUpdateReportStatus = async (
    reportId: string,
    status: ReportStatus,
    note?: string
  ) => {
    setIsBusy(true);
    try {
      const updated = await updateReportStatus(reportId, {
        status,
        technicianNote: note,
      });
      setLabState(updated);
      showToast(`Status laporan ${reportId} berhasil diperbarui.`);
    } finally {
      setIsBusy(false);
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    setIsBusy(true);
    try {
      const updated = await deleteReport(reportId);
      setLabState(updated);
      showToast(`Laporan ${reportId} telah dihapus.`);
    } finally {
      setIsBusy(false);
    }
  };

  const openReports = useMemo(
    () => (labState ? labState.reports.filter((r) => r.status !== 'selesai') : []),
    [labState]
  );

  const selectedLab = useMemo(
    () => labState?.labs.find((l) => l.id === selectedLabId) || labState?.labs[0] || null,
    [labState, selectedLabId]
  );

  const selectedLabComputers = useMemo(
    () =>
      labState
        ? labState.computers
            .filter((c) => c.labId === selectedLabId)
            .sort((a, b) => a.unitNumber - b.unitNumber)
        : [],
    [labState, selectedLabId]
  );

  const selectedComputer = useMemo(() => {
    if (!selectedLabComputers.length) return null;
    return (
      selectedLabComputers.find((c) => c.id === selectedComputerId) ||
      selectedLabComputers[0]
    );
  }, [selectedLabComputers, selectedComputerId]);

  const selectedComputerReports = useMemo(
    () =>
      labState && selectedComputer
        ? labState.reports.filter((r) => r.computerId === selectedComputer.id)
        : [],
    [labState, selectedComputer]
  );

  const globalTotals = useMemo(() => {
    if (!labState) return { total: 144, normal: 0, issue: 0, dead: 0 };
    const total = labState.computers.length;
    const normal = labState.computers.filter((c) => c.powerState === 'menyala_normal').length;
    const issue = labState.computers.filter(
      (c) => c.powerState === 'menyala_bermasalah'
    ).length;
    const dead = labState.computers.filter((c) => c.powerState === 'tidak_menyala').length;
    return { total, normal, issue, dead };
  }, [labState]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Header
        activeTab={activeTab}
        openReportsCount={openReports.length}
        onSelectTab={setActiveTab}
        onOpenQuickReport={() => setIsQuickReportOpen(true)}
      />

      <main className="no-print flex-1 max-w-[1360px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {isLoading || !labState || !selectedLab ? (
          <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Memuat data laboratorium">
            <div className="h-14 bg-slate-200/70 rounded-xl w-full max-w-2xl" />
            <div className="grid grid-cols-1 xl:grid-cols-[1fr_410px] gap-6">
              <div className="h-[580px] bg-white border border-slate-200 rounded-xl" />
              <div className="h-[580px] bg-white border border-slate-200 rounded-xl" />
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'denah' && (
              <div className="space-y-6">
                {/* Workspace Context Header & 4-Lab Selector */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium text-slate-500 tabular-nums">
                      <span>4 Ruang Lab (Total {globalTotals.total} PC)</span>
                      <span aria-hidden="true" className="mx-1.5">·</span>
                      <span className="text-emerald-700 font-semibold">
                        {globalTotals.normal} Menyala Normal
                      </span>
                      <span aria-hidden="true" className="mx-1.5">·</span>
                      <span className="text-amber-700 font-semibold">
                        {globalTotals.issue} Kendala Teknis
                      </span>
                      <span aria-hidden="true" className="mx-1.5">·</span>
                      <span className="text-red-700 font-semibold">
                        {globalTotals.dead} Tidak Menyala
                      </span>
                    </p>
                    <h1 className="mt-1 text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight text-balance">
                      Pendataan &amp; Pelaporan Perangkat Lab Komputer
                    </h1>
                  </div>

                  {/* Secondary Export & Print Actions */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => setIsPrintModalOpen(true)}
                      className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0"
                    >
                      <Printer className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Cetak Laporan</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadReportsCsv(labState.reports)}
                      className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0"
                    >
                      <FileText className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Unduh CSV Laporan</span>
                    </button>
                  </div>
                </div>

                {/* 4 Computer Labs Switcher Bar */}
                <div
                  role="tablist"
                  aria-label="Pilih Ruang Laboratorium Komputer"
                  className="grid grid-cols-2 lg:grid-cols-4 gap-3"
                >
                  {labState.labs.map((lab) => {
                    const units = labState.computers.filter((c) => c.labId === lab.id);
                    const normalCount = units.filter(
                      (c) => c.powerState === 'menyala_normal'
                    ).length;
                    const problemCount = units.length - normalCount;
                    const isActive = lab.id === selectedLabId;

                    return (
                      <button
                        key={lab.id}
                        role="tab"
                        aria-selected={isActive}
                        type="button"
                        onClick={() => handleSelectLab(lab.id)}
                        className={`p-4 rounded-xl border text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 ${
                          isActive
                            ? 'bg-slate-900 border-slate-900 text-white'
                            : 'bg-white border-slate-200 text-slate-900 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-bold whitespace-nowrap">{lab.name}</span>
                          <span
                            className={`font-mono text-xs tabular-nums whitespace-nowrap ${
                              isActive ? 'text-slate-300' : 'text-slate-500'
                            }`}
                          >
                            {normalCount}/36 Nyala
                          </span>
                        </div>
                        <p
                          className={`mt-1 text-xs truncate ${
                            isActive ? 'text-slate-300' : 'text-slate-500'
                          }`}
                        >
                          {problemCount === 0
                            ? 'Semua 36 unit berfungsi normal'
                            : `${problemCount} unit butuh perhatian teknis`}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {/* Primary 2-Column Workspace: 6x6 Lab Map + Selected Workstation Inspector */}
                <div className="grid grid-cols-1 xl:grid-cols-[1fr_410px] gap-6 items-start">
                  <LabGrid6x6
                    lab={selectedLab}
                    computers={selectedLabComputers}
                    openReports={openReports.filter((r) => r.labId === selectedLab.id)}
                    selectedComputerId={selectedComputer?.id || null}
                    interactionMode={interactionMode}
                    powerFilter={powerFilter}
                    quickCheckerName={quickCheckerName}
                    quickCheckerClass={quickCheckerClass}
                    isBusy={isBusy}
                    onChangeMode={setInteractionMode}
                    onChangePowerFilter={setPowerFilter}
                    onChangeQuickCheckerName={setQuickCheckerName}
                    onChangeQuickCheckerClass={setQuickCheckerClass}
                    onSelectComputer={(pc) => setSelectedComputerId(pc.id)}
                    onQuickToggleComputer={handleQuickToggleTile}
                    onBatchVerifyNormal={handleBatchVerifyNormal}
                  />

                  {selectedComputer && (
                    <WorkstationInspector
                      lab={selectedLab}
                      computer={selectedComputer}
                      computerReports={selectedComputerReports}
                      isBusy={isBusy}
                      onQuickSetPowerState={handleQuickSetPowerState}
                      onCreateReport={handleCreateReport}
                      onUpdateReportStatus={handleUpdateReportStatus}
                    />
                  )}
                </div>
              </div>
            )}

            {activeTab === 'laporan' && (
              <ReportsView
                labs={labState.labs}
                reports={labState.reports}
                isBusy={isBusy}
                onUpdateStatus={handleUpdateReportStatus}
                onDeleteReport={handleDeleteReport}
                onJumpToComputer={(labId, computerId) => {
                  handleSelectLab(labId, computerId);
                  setActiveTab('denah');
                }}
                onOpenPrintModal={() => setIsPrintModalOpen(true)}
                onOpenCreateReport={() => setIsQuickReportOpen(true)}
              />
            )}

            {activeTab === 'ringkasan' && (
              <LabsOverview
                labs={labState.labs}
                computers={labState.computers}
                reports={labState.reports}
                onSelectLabAndComputer={(labId, computerId) => {
                  handleSelectLab(labId, computerId);
                  setActiveTab('denah');
                }}
              />
            )}

            {activeTab === 'panduan' && (
              <StudentGuideView
                labs={labState.labs}
                onGoToDenah={(labId) => {
                  if (labId) handleSelectLab(labId);
                  setActiveTab('denah');
                }}
                onOpenQuickReport={() => setIsQuickReportOpen(true)}
              />
            )}
          </>
        )}
      </main>

      {/* Quiet Institutional Footer */}
      <footer className="no-print border-t border-slate-200 bg-white mt-12">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>
            LabTrack — Sistem Pendataan &amp; Pelaporan Fasilitas Laboratorium Komputer (4 Lab × Denah 6×6)
          </p>
          {labState && (
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setIsPrintModalOpen(true)}
                className="hover:text-slate-900 transition-colors whitespace-nowrap"
              >
                Berita Acara Cetak
              </button>
              <span aria-hidden="true">·</span>
              <button
                type="button"
                onClick={() => downloadAllComputersCsv(labState.labs, labState.computers)}
                className="hover:text-slate-900 transition-colors whitespace-nowrap"
              >
                Ekspor Status 144 PC
              </button>
            </div>
          )}
        </div>
      </footer>

      {/* Modals */}
      {labState && (
        <>
          <QuickReportModal
            isOpen={isQuickReportOpen}
            labs={labState.labs}
            computers={labState.computers}
            defaultLabId={selectedLabId}
            defaultComputerId={selectedComputer?.id}
            isBusy={isBusy}
            onClose={() => setIsQuickReportOpen(false)}
            onSubmitReport={handleCreateReport}
          />

          <PrintableReportModal
            isOpen={isPrintModalOpen}
            labs={labState.labs}
            computers={labState.computers}
            reports={labState.reports}
            onClose={() => setIsPrintModalOpen(false)}
          />
        </>
      )}

      {/* Non-blocking Toast Feedback */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="no-print fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 bg-slate-900 text-white text-xs sm:text-sm font-medium rounded-lg shadow-lg max-w-md"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />
          <span>{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            aria-label="Tutup notifikasi"
            className="ml-2 text-slate-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
