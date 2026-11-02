import { Download } from 'lucide-react';
import { ComputerUnit, DamageReport, LabRoom } from '../types/lab';
import { downloadAllComputersCsv } from '../utils/exportCsv';

interface LabsOverviewProps {
  labs: LabRoom[];
  computers: ComputerUnit[];
  reports: DamageReport[];
  onSelectLabAndComputer: (labId: string, computerId?: string) => void;
}

export function LabsOverview({
  labs,
  computers,
  reports,
  onSelectLabAndComputer,
}: LabsOverviewProps) {
  const totalUnits = computers.length;
  const totalNormal = computers.filter((c) => c.powerState === 'menyala_normal').length;
  const totalIssue = computers.filter((c) => c.powerState === 'menyala_bermasalah').length;
  const totalDead = computers.filter((c) => c.powerState === 'tidak_menyala').length;
  const readinessPct =
    totalUnits > 0 ? ((totalNormal / totalUnits) * 100).toFixed(1) : '100.0';

  return (
    <section aria-label="Ringkasan 4 Laboratorium Komputer" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Ringkasan Kesiapan 4 Laboratorium Komputer
          </h1>
          <p className="mt-1 text-sm text-slate-600 tabular-nums">
            <span>Total {totalUnits} unit (4 lab × 36 komputer)</span>
            <span aria-hidden="true" className="mx-2">·</span>
            <span className="text-emerald-700 font-medium">{totalNormal} menyala normal</span>
            <span aria-hidden="true" className="mx-2">·</span>
            <span className="text-amber-700 font-medium">{totalIssue} kendala teknis</span>
            <span aria-hidden="true" className="mx-2">·</span>
            <span className="text-red-700 font-medium">{totalDead} tidak menyala</span>
            <span aria-hidden="true" className="mx-2">·</span>
            <span>Kesiapan {readinessPct}%</span>
          </p>
        </div>

        <button
          type="button"
          onClick={() => downloadAllComputersCsv(labs, computers)}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors duration-150 whitespace-nowrap shrink-0 self-start sm:self-auto"
        >
          <Download className="w-4 h-4" aria-hidden="true" />
          <span>Unduh Rekap 144 PC (CSV)</span>
        </button>
      </div>

      {/* 2x2 Matrix of All 4 Computer Labs (Single-Elevation Surfaces) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {labs.map((lab) => {
          const labComputers = computers
            .filter((c) => c.labId === lab.id)
            .sort((a, b) => a.unitNumber - b.unitNumber);
          const normal = labComputers.filter((c) => c.powerState === 'menyala_normal').length;
          const issues = labComputers.filter(
            (c) => c.powerState === 'menyala_bermasalah'
          ).length;
          const dead = labComputers.filter((c) => c.powerState === 'tidak_menyala').length;
          const openReports = reports.filter(
            (r) => r.labId === lab.id && r.status !== 'selesai'
          ).length;
          const pct = ((normal / labComputers.length) * 100).toFixed(0);

          return (
            <div
              key={lab.id}
              className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-200 flex flex-col justify-between"
            >
              <div className="p-5 sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs text-slate-500">
                      <span>{lab.floor}</span>
                      <span aria-hidden="true" className="mx-1.5">·</span>
                      <span>Penanggung Jawab: {lab.supervisor}</span>
                    </p>
                    <h2 className="mt-1 text-lg font-bold text-slate-900">{lab.name}</h2>
                    <p className="mt-0.5 text-xs text-slate-600">{lab.specialization}</p>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
                      {pct}%
                    </div>
                    <div className="text-xs text-slate-500 whitespace-nowrap">Siap Pakai</div>
                  </div>
                </div>

                {/* Unboxed Metrics Line */}
                <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs tabular-nums">
                  <div className="flex flex-wrap items-center gap-2 text-slate-600">
                    <span className="text-emerald-700 font-semibold">{normal} Nyala</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-amber-700 font-semibold">{issues} Kendala</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-red-700 font-semibold">{dead} Mati</span>
                    <span aria-hidden="true">·</span>
                    <span>{openReports} Laporan Aktif</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onSelectLabAndComputer(lab.id)}
                    className="font-semibold text-slate-900 hover:underline whitespace-nowrap"
                  >
                    Buka Denah 6×6 &rarr;
                  </button>
                </div>

                {/* Interactive Mini 6x6 Map Preview */}
                <div className="mt-4">
                  <p className="text-[11px] text-slate-500 mb-2">
                    Peta Cepat 6×6 (klik kotak nomor untuk memeriksa unit):
                  </p>
                  <div className="grid grid-cols-6 gap-1.5">
                    {labComputers.map((pc) => {
                      let tileStyle =
                        'bg-emerald-50 border-emerald-200 text-emerald-900 hover:bg-emerald-100';
                      let symbol = '';
                      if (pc.powerState === 'menyala_bermasalah') {
                        tileStyle =
                          'bg-amber-100 border-amber-300 text-amber-950 font-bold hover:bg-amber-200';
                        symbol = '!';
                      } else if (pc.powerState === 'tidak_menyala') {
                        tileStyle =
                          'bg-red-100 border-red-300 text-red-950 font-bold hover:bg-red-200';
                        symbol = '×';
                      }

                      return (
                        <button
                          key={pc.id}
                          type="button"
                          onClick={() => onSelectLabAndComputer(lab.id, pc.id)}
                          title={`${lab.shortName} ${pc.code} (${pc.seatLabel})`}
                          className={`py-1.5 px-1 rounded border font-mono text-[11px] tabular-nums text-center transition-colors whitespace-nowrap ${tileStyle}`}
                        >
                          {String(pc.unitNumber).padStart(2, '0')}
                          {symbol}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="px-5 py-3 bg-slate-50/60 text-xs text-slate-500 rounded-b-xl">
                Spesifikasi standar: {lab.specs}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
