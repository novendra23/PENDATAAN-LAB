import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import {
  ComputerUnit,
  CreateReportPayload,
  ISSUE_CATEGORY_LABELS,
  IssueCategory,
  LabRoom,
  PowerState,
  URGENCY_LABELS,
  UrgencyLevel,
} from '../types/lab';

interface QuickReportModalProps {
  isOpen: boolean;
  labs: LabRoom[];
  computers: ComputerUnit[];
  defaultLabId: string;
  defaultComputerId?: string | null;
  isBusy: boolean;
  onClose: () => void;
  onSubmitReport: (payload: CreateReportPayload) => Promise<void>;
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

export function QuickReportModal({
  isOpen,
  labs,
  computers,
  defaultLabId,
  defaultComputerId,
  isBusy,
  onClose,
  onSubmitReport,
}: QuickReportModalProps) {
  const [labId, setLabId] = useState(defaultLabId);
  const [computerId, setComputerId] = useState('');
  const [powerState, setPowerState] = useState<PowerState>('tidak_menyala');
  const [categories, setCategories] = useState<IssueCategory[]>(['daya_mati']);
  const [urgency, setUrgency] = useState<UrgencyLevel>('tinggi');
  const [reporterName, setReporterName] = useState('');
  const [studentClass, setStudentClass] = useState('');
  const [description, setDescription] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setLabId(defaultLabId);
    const labUnits = computers.filter((c) => c.labId === defaultLabId);
    const matched = defaultComputerId
      ? labUnits.find((c) => c.id === defaultComputerId)
      : labUnits[0];
    if (matched) {
      setComputerId(matched.id);
    }
    setErrorMsg(null);
  }, [isOpen, defaultLabId, defaultComputerId, computers]);

  if (!isOpen) return null;

  const labUnits = computers
    .filter((c) => c.labId === labId)
    .sort((a, b) => a.unitNumber - b.unitNumber);

  const handleLabChange = (nextLabId: string) => {
    setLabId(nextLabId);
    const nextUnits = computers
      .filter((c) => c.labId === nextLabId)
      .sort((a, b) => a.unitNumber - b.unitNumber);
    if (nextUnits.length > 0) {
      setComputerId(nextUnits[0].id);
    }
  };

  const toggleCategory = (cat: IssueCategory) => {
    setCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!reporterName.trim() || !studentClass.trim() || !description.trim()) {
      setErrorMsg('Mohon lengkapi nama pelapor, kelas, dan deskripsi kerusakan.');
      return;
    }

    await onSubmitReport({
      labId,
      computerId,
      powerState,
      categories:
        categories.length > 0
          ? categories
          : powerState === 'tidak_menyala'
            ? ['daya_mati']
            : ['sistem_software'],
      urgency,
      description: description.trim(),
      reporterName: reporterName.trim(),
      studentClass: studentClass.trim(),
    });
    setDescription('');
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-report-title"
      className="no-print fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50"
    >
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-lg">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 id="quick-report-title" className="text-base font-bold text-slate-900">
            Buat Laporan Kerusakan Perangkat Lab
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup formulir"
            className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <p role="alert" className="text-xs font-medium text-red-700">
              {errorMsg}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="modal-lab"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Pilih Ruang Lab
              </label>
              <select
                id="modal-lab"
                value={labId}
                onChange={(e) => handleLabChange(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                {labs.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} (6×6)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="modal-pc"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Nomor Komputer &amp; Meja
              </label>
              <select
                id="modal-pc"
                value={computerId}
                onChange={(e) => setComputerId(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm font-mono bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                {labUnits.map((pc) => (
                  <option key={pc.id} value={pc.id}>
                    {pc.code} — Meja {pc.seatLabel}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <span className="block text-xs font-medium text-slate-700 mb-1.5">
              Kondisi Daya Saat Dicek Siswa
            </span>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg">
              <button
                type="button"
                onClick={() => {
                  setPowerState('tidak_menyala');
                  setUrgency('tinggi');
                  if (!categories.includes('daya_mati')) {
                    setCategories(['daya_mati', ...categories]);
                  }
                }}
                className={`py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                  powerState === 'tidak_menyala'
                    ? 'bg-white text-red-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tidak Bisa Menyala (Mati)
              </button>
              <button
                type="button"
                onClick={() => {
                  setPowerState('menyala_bermasalah');
                  setUrgency('sedang');
                  setCategories((prev) => prev.filter((c) => c !== 'daya_mati'));
                }}
                className={`py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                  powerState === 'menyala_bermasalah'
                    ? 'bg-white text-amber-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Menyala Tetapi Bermasalah
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="modal-reporter"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Nama Siswa Pelapor
              </label>
              <input
                id="modal-reporter"
                type="text"
                required
                maxLength={80}
                value={reporterName}
                onChange={(e) => setReporterName(e.target.value)}
                placeholder="Nama lengkap siswa"
                className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label
                htmlFor="modal-class"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Kelas / Jurusan
              </label>
              <input
                id="modal-class"
                type="text"
                required
                maxLength={40}
                value={studentClass}
                onChange={(e) => setStudentClass(e.target.value)}
                placeholder="Contoh: XI RPL 2"
                className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>

          <div>
            <span className="block text-xs font-medium text-slate-700 mb-1.5">
              Komponen yang Bermasalah
            </span>
            <div className="flex flex-wrap gap-1.5">
              {ALL_CATEGORIES.map((cat) => {
                const active = categories.includes(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    className={`px-2.5 py-1.5 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 ${
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
              {(['rendah', 'sedang', 'tinggi'] as UrgencyLevel[]).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setUrgency(lvl)}
                  className={`py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                    urgency === lvl
                      ? 'bg-white text-slate-900 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {URGENCY_LABELS[lvl]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label
              htmlFor="modal-desc"
              className="block text-xs font-medium text-slate-700 mb-1"
            >
              Deskripsi Masalah Teknis
            </label>
            <textarea
              id="modal-desc"
              rows={3}
              required
              maxLength={600}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tuliskan gejala kerusakan secara jelas agar memudahkan perbaikan teknisi..."
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isBusy}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              {isBusy ? 'Mengirim...' : 'Simpan Laporan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
