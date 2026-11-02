import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  PowerOff,
  Printer,
  Search,
} from 'lucide-react';
import {
  DamageReport,
  ISSUE_CATEGORY_LABELS,
  LabRoom,
  POWER_STATE_LABELS,
  REPORT_STATUS_LABELS,
  ReportStatus,
  URGENCY_LABELS,
} from '../types/lab';
import { downloadReportsCsv, formatIndonesianDateTime } from '../utils/exportCsv';

interface ReportsViewProps {
  labs: LabRoom[];
  reports: DamageReport[];
  isBusy: boolean;
  onUpdateStatus: (reportId: string, status: ReportStatus, note?: string) => Promise<void>;
  onDeleteReport: (reportId: string) => Promise<void>;
  onJumpToComputer: (labId: string, computerId: string) => void;
  onOpenPrintModal: () => void;
  onOpenCreateReport: () => void;
}

export function ReportsView({
  labs,
  reports,
  isBusy,
  onUpdateStatus,
  onDeleteReport,
  onJumpToComputer,
  onOpenPrintModal,
  onOpenCreateReport,
}: ReportsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [labFilter, setLabFilter] = useState<string>('semua');
  const [statusFilter, setStatusFilter] = useState<'semua' | ReportStatus>('semua');
  const [powerFilter, setPowerFilter] = useState<'semua' | 'tidak_menyala' | 'menyala_bermasalah'>(
    'semua'
  );
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState('');

  const filteredReports = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return reports.filter((r) => {
      if (labFilter !== 'semua' && r.labId !== labFilter) return false;
      if (statusFilter !== 'semua' && r.status !== statusFilter) return false;
      if (powerFilter !== 'semua' && r.powerState !== powerFilter) return false;
      if (!q) return true;

      const haystack = [
        r.id,
        r.labName,
        r.computerCode,
        r.seatLabel,
        r.reporterName,
        r.studentClass,
        r.description,
        ...r.categories.map((c) => ISSUE_CATEGORY_LABELS[c]),
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [reports, searchQuery, labFilter, statusFilter, powerFilter]);

  const waitingCount = reports.filter((r) => r.status === 'menunggu').length;
  const inProgressCount = reports.filter((r) => r.status === 'diproses').length;
  const resolvedCount = reports.filter((r) => r.status === 'selesai').length;

  const handleSaveNoteAndStatus = async (reportId: string, nextStatus: ReportStatus) => {
    await onUpdateStatus(reportId, nextStatus, noteDraft);
    setEditingNoteId(null);
    setNoteDraft('');
  };

  return (
    <section aria-label="Daftar Laporan Kerusakan Lab Komputer" className="space-y-6">
      {/* Header & Export Toolbar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Laporan Kerusakan &amp; Kendala Teknis
          </h1>
          <p className="mt-1 text-sm text-slate-600 tabular-nums">
            <span>{waitingCount} menunggu tindak lanjut</span>
            <span aria-hidden="true" className="mx-2">·</span>
            <span>{inProgressCount} sedang diperbaiki</span>
            <span aria-hidden="true" className="mx-2">·</span>
            <span>{resolvedCount} selesai diperbaiki</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => downloadReportsCsv(filteredReports)}
            disabled={filteredReports.length === 0}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors duration-150 whitespace-nowrap shrink-0 disabled:opacity-50"
          >
            <Download className="w-4 h-4" aria-hidden="true" />
            <span>Unduh CSV ({filteredReports.length})</span>
          </button>

          <button
            type="button"
            onClick={onOpenPrintModal}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors duration-150 whitespace-nowrap shrink-0"
          >
            <Printer className="w-4 h-4" aria-hidden="true" />
            <span>Cetak Laporan Resmi</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Workspace Surface */}
      <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-200">
        <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search
              className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari kode PC, meja, nama siswa, kelas, atau keluhan..."
              aria-label="Cari laporan kerusakan"
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          {/* Segmented Filters */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Lab Filter */}
            <div
              role="group"
              aria-label="Filter Laboratorium"
              className="inline-flex items-center p-1 bg-slate-100 rounded-lg overflow-x-auto"
            >
              <button
                type="button"
                onClick={() => setLabFilter('semua')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  labFilter === 'semua'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua Lab
              </button>
              {labs.map((lab) => (
                <button
                  key={lab.id}
                  type="button"
                  onClick={() => setLabFilter(lab.id)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    labFilter === lab.id
                      ? 'bg-white text-slate-900 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {lab.shortName}
                </button>
              ))}
            </div>

            {/* Power Filter */}
            <div
              role="group"
              aria-label="Filter Kondisi Nyala"
              className="inline-flex items-center p-1 bg-slate-100 rounded-lg"
            >
              <button
                type="button"
                onClick={() => setPowerFilter('semua')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  powerFilter === 'semua'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua Kondisi
              </button>
              <button
                type="button"
                onClick={() => setPowerFilter('tidak_menyala')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  powerFilter === 'tidak_menyala'
                    ? 'bg-white text-red-800 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tidak Nyala
              </button>
              <button
                type="button"
                onClick={() => setPowerFilter('menyala_bermasalah')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  powerFilter === 'menyala_bermasalah'
                    ? 'bg-white text-amber-800 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Kendala Teknis
              </button>
            </div>

            {/* Status Filter */}
            <div
              role="group"
              aria-label="Filter Status Penanganan"
              className="inline-flex items-center p-1 bg-slate-100 rounded-lg"
            >
              {(['semua', 'menunggu', 'diproses', 'selesai'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    statusFilter === st
                      ? 'bg-white text-slate-900 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {st === 'semua'
                    ? 'Semua Status'
                    : st === 'menunggu'
                      ? 'Menunggu'
                      : st === 'diproses'
                        ? 'Diproses'
                        : 'Selesai'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* High-Density Reports Data Table */}
        {filteredReports.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm font-semibold text-slate-900">
              Tidak ada laporan kerusakan yang sesuai filter
            </p>
            <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
              Laporan yang dikirim siswa melalui denah 6×6 atau formulir pelaporan akan tampil secara terstruktur di tabel ini.
            </p>
            <div className="mt-4 flex items-center justify-center gap-3">
              {(searchQuery ||
                labFilter !== 'semua' ||
                statusFilter !== 'semua' ||
                powerFilter !== 'semua') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setLabFilter('semua');
                    setStatusFilter('semua');
                    setPowerFilter('semua');
                  }}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap"
                >
                  Reset Filter
                </button>
              )}
              <button
                type="button"
                onClick={onOpenCreateReport}
                className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap"
              >
                Catat Laporan Baru
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-600">
                  <th className="py-3 px-4 whitespace-nowrap">Kode &amp; Waktu</th>
                  <th className="py-3 px-4 whitespace-nowrap">Unit Komputer</th>
                  <th className="py-3 px-4 whitespace-nowrap">Kondisi Daya</th>
                  <th className="py-3 px-4">Masalah Teknis &amp; Komponen</th>
                  <th className="py-3 px-4 whitespace-nowrap">Pelapor (Siswa)</th>
                  <th className="py-3 px-4 whitespace-nowrap">Status Penanganan</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs sm:text-sm">
                {filteredReports.map((rep) => {
                  const isEditing = editingNoteId === rep.id;
                  return (
                    <tr
                      key={rep.id}
                      className="hover:bg-slate-50/80 transition-colors align-top"
                    >
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-mono font-semibold text-slate-900 tabular-nums text-xs">
                          {rep.id}
                        </div>
                        <div className="mt-0.5 text-xs text-slate-500 tabular-nums">
                          {formatIndonesianDateTime(rep.createdAt)}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => onJumpToComputer(rep.labId, rep.computerId)}
                          className="font-mono font-semibold text-slate-900 hover:underline tabular-nums text-left"
                        >
                          {rep.computerCode} · Meja {rep.seatLabel}
                        </button>
                        <div className="mt-0.5 text-xs text-slate-500">{rep.labName}</div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {rep.powerState === 'tidak_menyala' ? (
                          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-700">
                            <PowerOff className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                            <span>Tidak Menyala</span>
                          </div>
                        ) : rep.powerState === 'menyala_bermasalah' ? (
                          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                            <span>Menyala (Kendala)</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                            <span>{POWER_STATE_LABELS[rep.powerState]}</span>
                          </div>
                        )}
                        <div className="mt-0.5 text-xs text-slate-500">
                          Urgensi: {URGENCY_LABELS[rep.urgency]}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 min-w-[260px] max-w-md">
                        <div className="text-xs text-slate-500 mb-1">
                          {rep.categories.map((c) => ISSUE_CATEGORY_LABELS[c]).join(' · ')}
                        </div>
                        <p className="text-xs sm:text-sm text-slate-900 leading-relaxed">
                          {rep.description}
                        </p>
                        {rep.technicianNote && !isEditing && (
                          <p className="mt-1.5 text-xs text-slate-600">
                            Catatan teknisi: {rep.technicianNote}
                          </p>
                        )}
                        {isEditing && (
                          <div className="mt-2 space-y-2">
                            <input
                              type="text"
                              maxLength={250}
                              value={noteDraft}
                              onChange={(e) => setNoteDraft(e.target.value)}
                              placeholder="Tulis tindakan perbaikan teknisi..."
                              className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900"
                            />
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => handleSaveNoteAndStatus(rep.id, 'diproses')}
                                className="px-2.5 py-1 text-xs font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 rounded-md whitespace-nowrap"
                              >
                                Simpan &amp; Proses
                              </button>
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => handleSaveNoteAndStatus(rep.id, 'selesai')}
                                className="px-2.5 py-1 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-md whitespace-nowrap"
                              >
                                Simpan &amp; Selesai
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingNoteId(null)}
                                className="px-2 py-1 text-xs text-slate-500 hover:text-slate-800 whitespace-nowrap"
                              >
                                Batal
                              </button>
                            </div>
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-medium text-slate-900 text-xs sm:text-sm">
                          {rep.reporterName}
                        </div>
                        <div className="mt-0.5 text-xs text-slate-500">{rep.studentClass}</div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`text-xs font-semibold ${
                            rep.status === 'selesai'
                              ? 'text-emerald-700'
                              : rep.status === 'diproses'
                                ? 'text-amber-700'
                                : 'text-red-700'
                          }`}
                        >
                          {REPORT_STATUS_LABELS[rep.status]}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-2">
                          {rep.status !== 'selesai' ? (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => {
                                setEditingNoteId(rep.id);
                                setNoteDraft(
                                  rep.technicianNote ||
                                    'Perangkat telah diperbaiki dan diuji menyala normal.'
                                );
                              }}
                              className="px-2.5 py-1.5 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors whitespace-nowrap"
                            >
                              Tindak Lanjut
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => onUpdateStatus(rep.id, 'menunggu')}
                              className="px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-md transition-colors whitespace-nowrap"
                            >
                              Buka Kembali
                            </button>
                          )}

                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => onDeleteReport(rep.id)}
                            className="px-2 py-1.5 text-xs font-medium text-slate-400 hover:text-red-700 transition-colors whitespace-nowrap"
                            title="Hapus laporan"
                          >
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
