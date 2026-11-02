import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, PowerOff } from 'lucide-react';
import {
  ComputerUnit,
  CreateReportPayload,
  DamageReport,
  ISSUE_CATEGORY_LABELS,
  IssueCategory,
  LabRoom,
  POWER_STATE_LABELS,
  PowerState,
  REPORT_STATUS_LABELS,
  ReportStatus,
  URGENCY_LABELS,
  UrgencyLevel,
} from '../types/lab';
import { formatIndonesianDateTime } from '../utils/exportCsv';

interface WorkstationInspectorProps {
  lab: LabRoom;
  computer: ComputerUnit;
  computerReports: DamageReport[];
  isBusy: boolean;
  onQuickSetPowerState: (computerId: string, powerState: PowerState, checkedBy?: string) => Promise<void>;
  onCreateReport: (payload: CreateReportPayload) => Promise<void>;
  onUpdateReportStatus: (reportId: string, status: ReportStatus, note?: string) => Promise<void>;
}

const ALL_CATEGORIES: IssueCategory[] = [
  'daya_mati',
  'monitor_layar',
  'keyboard',
  'mouse',
  'jaringan_internet',
  'sistem_software',
  'audio_usb',
];

export function WorkstationInspector({
  lab,
  computer,
  computerReports,
  isBusy,
  onQuickSetPowerState,
  onCreateReport,
  onUpdateReportStatus,
}: WorkstationInspectorProps) {
  const [selectedPower, setSelectedPower] = useState<PowerState>(computer.powerState);
  const [reporterName, setReporterName] = useState('');
  const [studentClass, setStudentClass] = useState('');
  const [categories, setCategories] = useState<IssueCategory[]>([]);
  const [urgency, setUrgency] = useState<UrgencyLevel>('sedang');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [showReportForm, setShowReportForm] = useState(false);

  useEffect(() => {
    setSelectedPower(computer.powerState);
    setFormError(null);
    if (computer.powerState === 'tidak_menyala') {
      setCategories(['daya_mati']);
      setUrgency('tinggi');
      setShowReportForm(true);
    } else if (computer.powerState === 'menyala_bermasalah') {
      setCategories(['monitor_layar']);
      setUrgency('sedang');
      setShowReportForm(true);
    } else {
      setCategories([]);
      setUrgency('sedang');
      setShowReportForm(false);
    }
  }, [computer.id, computer.powerState]);

  const handlePowerSelection = async (nextState: PowerState) => {
    setSelectedPower(nextState);
    setFormError(null);

    if (nextState === 'menyala_normal') {
      setShowReportForm(false);
      await onQuickSetPowerState(
        computer.id,
        'menyala_normal',
        reporterName ? `${reporterName}${studentClass ? ` (${studentClass})` : ''}` : undefined
      );
      return;
    }

    // Open technical damage report form immediately when not normal
    setShowReportForm(true);
    if (nextState === 'tidak_menyala') {
      setCategories((prev) => (prev.includes('daya_mati') ? prev : ['daya_mati', ...prev]));
      setUrgency('tinggi');
    } else if (categories.length === 0) {
      setCategories(['sistem_software']);
    }
    await onQuickSetPowerState(
      computer.id,
      nextState,
      reporterName ? `${reporterName}${studentClass ? ` (${studentClass})` : ''}` : undefined
    );
  };

  const toggleCategory = (cat: IssueCategory) => {
    setCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!reporterName.trim() || !studentClass.trim()) {
      setFormError('Mohon isi nama siswa pelapor dan kelas terlebih dahulu.');
      return;
    }
    if (!description.trim()) {
      setFormError('Mohon tuliskan detail kendala atau kerusakan pada perangkat ini.');
      return;
    }

    const reportPower: PowerState =
      selectedPower === 'menyala_normal' ? 'menyala_bermasalah' : selectedPower;

    await onCreateReport({
      labId: lab.id,
      computerId: computer.id,
      powerState: reportPower,
      categories:
        categories.length > 0
          ? categories
          : reportPower === 'tidak_menyala'
            ? ['daya_mati']
            : ['sistem_software'],
      urgency,
      description: description.trim(),
      reporterName: reporterName.trim(),
      studentClass: studentClass.trim(),
    });

    setDescription('');
  };

  const activeReports = computerReports.filter((r) => r.status !== 'selesai');

  return (
    <aside
      aria-label={`Detail perangkat ${computer.code}`}
      className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-200"
    >
      {/* Selected Unit Header */}
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs text-slate-500">
              <span>{lab.name}</span>
              <span aria-hidden="true" className="mx-1.5">·</span>
              <span>Baris {computer.seatLabel[0]}, Meja {computer.seatLabel[1]}</span>
            </p>
            <h3 className="mt-1 text-xl font-bold text-slate-900 font-mono tabular-nums">
              {computer.code} ({computer.seatLabel})
            </h3>
          </div>

          <div className="text-right">
            {computer.powerState === 'menyala_normal' && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 whitespace-nowrap">
                <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Menyala Normal</span>
              </span>
            )}
            {computer.powerState === 'menyala_bermasalah' && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 whitespace-nowrap">
                <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Menyala Bermasalah</span>
              </span>
            )}
            {computer.powerState === 'tidak_menyala' && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-700 whitespace-nowrap">
                <PowerOff className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Tidak Menyala</span>
              </span>
            )}
          </div>
        </div>

        <p className="mt-3 text-xs text-slate-500">
          <span>Terakhir dicek oleh {computer.lastCheckedBy}</span>
          <span aria-hidden="true" className="mx-1.5">·</span>
          <span className="tabular-nums">{formatIndonesianDateTime(computer.lastCheckedAt)}</span>
        </p>

        {/* Step 1: Power On / Off Selector */}
        <div className="mt-5">
          <p className="text-xs font-semibold text-slate-800 mb-2">
            1. Apakah komputer ini bisa menyala?
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              disabled={isBusy}
              onClick={() => handlePowerSelection('menyala_normal')}
              className={`px-3 py-2.5 rounded-lg border text-xs font-semibold flex flex-col items-center gap-1 transition-colors duration-150 whitespace-nowrap ${
                selectedPower === 'menyala_normal'
                  ? 'bg-emerald-600 border-emerald-600 text-white'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
              <span>Bisa Nyala</span>
            </button>

            <button
              type="button"
              disabled={isBusy}
              onClick={() => handlePowerSelection('menyala_bermasalah')}
              className={`px-3 py-2.5 rounded-lg border text-xs font-semibold flex flex-col items-center gap-1 transition-colors duration-150 whitespace-nowrap ${
                selectedPower === 'menyala_bermasalah'
                  ? 'bg-amber-600 border-amber-600 text-white'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <AlertTriangle className="w-4 h-4" aria-hidden="true" />
              <span>Ada Kendala</span>
            </button>

            <button
              type="button"
              disabled={isBusy}
              onClick={() => handlePowerSelection('tidak_menyala')}
              className={`px-3 py-2.5 rounded-lg border text-xs font-semibold flex flex-col items-center gap-1 transition-colors duration-150 whitespace-nowrap ${
                selectedPower === 'tidak_menyala'
                  ? 'bg-red-600 border-red-600 text-white'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <PowerOff className="w-4 h-4" aria-hidden="true" />
              <span>Tidak Nyala</span>
            </button>
          </div>
        </div>

        {!showReportForm && computer.powerState === 'menyala_normal' && (
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
            <p className="text-xs text-slate-600">
              Menemukan kerusakan komponen atau masalah teknis pada {computer.code}?
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedPower('menyala_bermasalah');
                setShowReportForm(true);
              }}
              className="px-3 py-1.5 text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0"
            >
              Laporkan Masalah
            </button>
          </div>
        )}
      </div>

      {/* Step 2: Technical Issue Report Form */}
      {showReportForm && (
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-900">
              2. Formulir Laporan Kerusakan ({computer.code})
            </h4>
            <button
              type="button"
              onClick={() => setShowReportForm(false)}
              className="text-xs text-slate-500 hover:text-slate-800 whitespace-nowrap"
            >
              Tutup
            </button>
          </div>

          {formError && (
            <p role="alert" className="text-xs font-medium text-red-700">
              {formError}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="inspector-reporter"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Nama Siswa Pelapor
              </label>
              <input
                id="inspector-reporter"
                type="text"
                required
                maxLength={80}
                value={reporterName}
                onChange={(e) => setReporterName(e.target.value)}
                placeholder="Nama lengkap siswa"
                className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label
                htmlFor="inspector-class"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Kelas / Jurusan
              </label>
              <input
                id="inspector-class"
                type="text"
                required
                maxLength={40}
                value={studentClass}
                onChange={(e) => setStudentClass(e.target.value)}
                placeholder="Contoh: XI TKJ 2"
                className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>

          <div>
            <span className="block text-xs font-medium text-slate-700 mb-1.5">
              Bagian / Komponen Bermasalah
            </span>
            <div className="flex flex-wrap gap-1.5">
              {ALL_CATEGORIES.map((cat) => {
                const active = categories.includes(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    className={`px-2.5 py-1.5 text-xs font-medium rounded-md border transition-colors duration-150 whitespace-nowrap shrink-0 ${
                      active
                        ? 'bg-slate-900 border-slate-900 text-white'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {ISSUE_CATEGORY_LABELS[cat]}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <span className="block text-xs font-medium text-slate-700 mb-1.5">
              Tingkat Urgensi
            </span>
            <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-lg">
              {(['rendah', 'sedang', 'tinggi'] as UrgencyLevel[]).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setUrgency(level)}
                  className={`py-1.5 text-xs font-medium rounded-md transition-colors duration-150 whitespace-nowrap ${
                    urgency === level
                      ? 'bg-white text-slate-900 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {URGENCY_LABELS[level]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label
              htmlFor="inspector-desc"
              className="block text-xs font-medium text-slate-700 mb-1"
            >
              Deskripsi Kerusakan / Masalah Teknis
            </label>
            <textarea
              id="inspector-desc"
              rows={3}
              required
              maxLength={600}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                selectedPower === 'tidak_menyala'
                  ? 'Jelaskan kondisi saat tombol power ditekan (misal: lampu indikator mati, tidak muncul tampilan ke layar, bunyi beep)...'
                  : 'Jelaskan masalah teknis yang dialami (misal: layar berkedip, mouse tidak bergerak, koneksi internet terputus)...'
              }
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <button
            type="submit"
            disabled={isBusy}
            className="w-full py-2.5 px-4 text-xs sm:text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors duration-150 disabled:opacity-50 whitespace-nowrap"
          >
            {isBusy ? 'Menyimpan Laporan...' : `Kirim Laporan ${computer.code}`}
          </button>
        </form>
      )}

      {/* Active Reports on this Computer */}
      <div className="p-5 sm:p-6">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-semibold text-slate-900">
            Riwayat Laporan Unit {computer.code}
          </h4>
          <span className="text-xs text-slate-500 tabular-nums">
            {activeReports.length} aktif · {computerReports.length} total
          </span>
        </div>

        {computerReports.length === 0 ? (
          <p className="text-xs text-slate-500 leading-relaxed">
            Belum ada catatan kerusakan pada {computer.code}. Perangkat tercatat dalam kondisi{' '}
            {POWER_STATE_LABELS[computer.powerState].toLowerCase()}.
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {computerReports.slice(0, 4).map((rep) => (
              <div key={rep.id} className="py-3 first:pt-0 last:pb-0">
                <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                  <span className="font-mono font-semibold text-slate-800 tabular-nums">
                    {rep.id}
                  </span>
                  <span
                    className={
                      rep.status === 'selesai'
                        ? 'text-emerald-700 font-medium'
                        : rep.status === 'diproses'
                          ? 'text-amber-700 font-medium'
                          : 'text-red-700 font-medium'
                    }
                  >
                    {REPORT_STATUS_LABELS[rep.status]}
                  </span>
                </div>

                <p className="mt-1 text-xs text-slate-800 leading-relaxed">
                  {rep.description}
                </p>

                <p className="mt-1 text-[11px] text-slate-500">
                  <span>{rep.reporterName}</span>
                  <span aria-hidden="true" className="mx-1">·</span>
                  <span>{rep.studentClass}</span>
                  <span aria-hidden="true" className="mx-1">·</span>
                  <span className="tabular-nums">{formatIndonesianDateTime(rep.createdAt)}</span>
                </p>

                {rep.status !== 'selesai' && (
                  <div className="mt-2 flex items-center gap-2">
                    {rep.status === 'menunggu' && (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => onUpdateReportStatus(rep.id, 'diproses')}
                        className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors whitespace-nowrap"
                      >
                        Tandai Diproses
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() =>
                        onUpdateReportStatus(
                          rep.id,
                          'selesai',
                          'Telah diperbaiki dan diuji menyala normal.'
                        )
                      }
                      className="px-2.5 py-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors whitespace-nowrap"
                    >
                      Tandai Selesai Diperbaiki
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
