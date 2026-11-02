import { Printer, X } from 'lucide-react';
import {
  ComputerUnit,
  DamageReport,
  ISSUE_CATEGORY_LABELS,
  LabRoom,
  POWER_STATE_LABELS,
  REPORT_STATUS_LABELS,
} from '../types/lab';
import { formatIndonesianDateTime } from '../utils/exportCsv';

interface PrintableReportModalProps {
  isOpen: boolean;
  labs: LabRoom[];
  computers: ComputerUnit[];
  reports: DamageReport[];
  onClose: () => void;
}

export function PrintableReportModal({
  isOpen,
  labs,
  computers,
  reports,
  onClose,
}: PrintableReportModalProps) {
  if (!isOpen) return null;

  const activeReports = reports.filter((r) => r.status !== 'selesai');
  const printDate = formatIndonesianDateTime(new Date().toISOString());

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="printable-report-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 print:static print:p-0 print:bg-white"
    >
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-lg print:max-w-none print:max-h-none print:overflow-visible print:border-0 print:shadow-none">
        {/* Modal Action Bar (Hidden when printing) */}
        <div className="no-print px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <span className="text-sm font-semibold text-slate-900">
            Pratinjau Dokumen Laporan Resmi Lab Komputer
          </span>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap"
            >
              <Printer className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Cetak / Simpan PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup pratinjau cetak"
              className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Document Content */}
        <div className="p-6 sm:p-10 space-y-8 text-slate-900">
          <div className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <h2
                id="printable-report-title"
                className="text-xl font-bold tracking-tight text-slate-900"
              >
                Berita Acara Pendataan &amp; Laporan Kondisi Lab Komputer
              </h2>
              <p className="mt-1 text-xs text-slate-600">
                Rekapitulasi Status 4 Ruang Laboratorium (Kapasitas 6×6 / 36 Unit per Ruang)
              </p>
            </div>
            <div className="text-xs text-slate-600 tabular-nums sm:text-right">
              Dicetak pada: {printDate}
            </div>
          </div>

          {/* Summary Table of 4 Labs */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-2">
              A. Ringkasan Kondisi Perangkat per Laboratorium
            </h3>
            <table className="w-full text-left border-collapse border border-slate-300 text-xs">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 font-semibold">
                  <th className="py-2 px-3 border-r border-slate-300">Laboratorium</th>
                  <th className="py-2 px-3 border-r border-slate-300">Penanggung Jawab</th>
                  <th className="py-2 px-3 border-r border-slate-300 text-right">Kapasitas</th>
                  <th className="py-2 px-3 border-r border-slate-300 text-right">Menyala Normal</th>
                  <th className="py-2 px-3 border-r border-slate-300 text-right">Ada Kendala</th>
                  <th className="py-2 px-3 text-right">Tidak Menyala</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300 tabular-nums">
                {labs.map((lab) => {
                  const units = computers.filter((c) => c.labId === lab.id);
                  const normal = units.filter((c) => c.powerState === 'menyala_normal').length;
                  const issue = units.filter(
                    (c) => c.powerState === 'menyala_bermasalah'
                  ).length;
                  const dead = units.filter((c) => c.powerState === 'tidak_menyala').length;
                  return (
                    <tr key={lab.id}>
                      <td className="py-2 px-3 border-r border-slate-300 font-medium">
                        {lab.name}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-300">{lab.supervisor}</td>
                      <td className="py-2 px-3 border-r border-slate-300 text-right font-mono">
                        36
                      </td>
                      <td className="py-2 px-3 border-r border-slate-300 text-right font-mono">
                        {normal}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-300 text-right font-mono">
                        {issue}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-semibold">{dead}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Active Technical Damage Reports Table */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-2">
              B. Daftar Rincian Kerusakan &amp; Kendala Teknis Aktif ({activeReports.length} Unit)
            </h3>
            {activeReports.length === 0 ? (
              <p className="text-xs text-slate-600">
                Seluruh 144 perangkat komputer pada Lab 1 hingga Lab 4 dalam kondisi menyala normal tanpa keluhan aktif.
              </p>
            ) : (
              <table className="w-full text-left border-collapse border border-slate-300 text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300 font-semibold">
                    <th className="py-2 px-2.5 border-r border-slate-300">Kode</th>
                    <th className="py-2 px-2.5 border-r border-slate-300">Ruang &amp; Meja</th>
                    <th className="py-2 px-2.5 border-r border-slate-300">Status Daya</th>
                    <th className="py-2 px-2.5 border-r border-slate-300">Uraian Kerusakan</th>
                    <th className="py-2 px-2.5 border-r border-slate-300">Pelapor</th>
                    <th className="py-2 px-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  {activeReports.map((rep) => (
                    <tr key={rep.id} className="align-top">
                      <td className="py-2 px-2.5 border-r border-slate-300 font-mono tabular-nums whitespace-nowrap">
                        {rep.id}
                      </td>
                      <td className="py-2 px-2.5 border-r border-slate-300 whitespace-nowrap">
                        <div className="font-semibold">{rep.labName}</div>
                        <div className="font-mono tabular-nums text-slate-600">
                          {rep.computerCode} ({rep.seatLabel})
                        </div>
                      </td>
                      <td className="py-2 px-2.5 border-r border-slate-300 whitespace-nowrap">
                        {POWER_STATE_LABELS[rep.powerState]}
                      </td>
                      <td className="py-2 px-2.5 border-r border-slate-300">
                        <div className="text-slate-600 mb-0.5">
                          [{rep.categories.map((c) => ISSUE_CATEGORY_LABELS[c]).join(', ')}]
                        </div>
                        <div>{rep.description}</div>
                      </td>
                      <td className="py-2 px-2.5 border-r border-slate-300 whitespace-nowrap">
                        <div>{rep.reporterName}</div>
                        <div className="text-slate-600">{rep.studentClass}</div>
                      </td>
                      <td className="py-2 px-2.5 whitespace-nowrap">
                        {REPORT_STATUS_LABELS[rep.status]}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Signature Block for Official School Use */}
          <div className="pt-8 grid grid-cols-2 gap-8 text-xs text-slate-700">
            <div>
              <p>Perwakilan Siswa / Petugas Piket,</p>
              <div className="h-16" />
              <p className="border-t border-slate-400 inline-block pr-24 pt-1">
                Nama &amp; Kelas
              </p>
            </div>
            <div className="text-right">
              <p>Koordinator / Teknisi Lab Komputer,</p>
              <div className="h-16" />
              <p className="border-t border-slate-400 inline-block pl-24 pt-1">
                Tanda Tangan &amp; Tanggal
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
