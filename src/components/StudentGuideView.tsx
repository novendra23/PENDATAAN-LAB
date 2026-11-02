import { LabRoom } from '../types/lab';

interface StudentGuideViewProps {
  labs: LabRoom[];
  onGoToDenah: (labId?: string) => void;
  onOpenQuickReport: () => void;
}

export function StudentGuideView({
  labs,
  onGoToDenah,
  onOpenQuickReport,
}: StudentGuideViewProps) {
  const steps = [
    {
      num: '01.',
      title: 'Pilih Ruang Lab & Nomor Meja pada Denah 6×6',
      desc: 'Sesuaikan ruang laboratorium (Lab Komputer 1 s.d. Lab Komputer 4) serta posisi tempat duduk Anda berdasarkan Baris A–F (depan ke belakang) dan Meja 1–6 (kiri ke kanan).',
    },
    {
      num: '02.',
      title: 'Periksa & Tandai Status Daya Komputer',
      desc: 'Nyalakan unit komputer di meja Anda. Pilih "Bisa Nyala" apabila komputer berjalan normal, "Ada Kendala" apabila menyala tetapi komponen bermasalah, atau "Tidak Nyala" apabila mati total.',
    },
    {
      num: '03.',
      title: 'Kirim Laporan Kerusakan Teknis Secara Spesifik',
      desc: 'Apabila perangkat tidak menyala atau mengalami gangguan (monitor bergaris, mouse/keyboard rusak, jaringan terputus), isi nama siswa, kelas, komponen terdampak, serta kronologi singkat agar langsung tercatat sebagai laporan resmi.',
    },
    {
      num: '04.',
      title: 'Unduh atau Cetak Rekap Laporan untuk Guru & Teknisi',
      desc: 'Ketua kelas, petugas piket, maupun guru pengampu dapat mengunduh rekapitulasi CSV atau mencetak dokumen Berita Acara Kondisi Lab Komputer dari menu Daftar Laporan.',
    },
  ];

  return (
    <section aria-label="Panduan Pendataan Siswa" className="space-y-8">
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
        <div className="max-w-2xl">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight text-balance">
            Prosedur Pendataan &amp; Pelaporan Perangkat Lab oleh Siswa
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-600 leading-relaxed">
            Sistem ini digunakan oleh seluruh siswa sebelum dan sesudah jam praktikum untuk memastikan 144 komputer pada 4 laboratorium terdata kondisinya secara akurat.
          </p>
        </div>

        <div className="mt-8 pt-8 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
          {steps.map((step) => (
            <div key={step.num}>
              <h2 className="text-base font-bold text-slate-900">
                <span className="font-mono text-slate-500 mr-2 tabular-nums">{step.num}</span>
                {step.title}
              </h2>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 pt-6 border-t border-slate-200 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => onGoToDenah()}
            className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap"
          >
            Mulai Pendataan di Denah 6×6
          </button>
          <button
            type="button"
            onClick={onOpenQuickReport}
            className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap"
          >
            Laporkan Kerusakan Sekarang
          </button>
        </div>
      </div>

      {/* Directory Table of the 4 Computer Labs */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900">
            Daftar 4 Laboratorium &amp; Kapasitas Perangkat
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Setiap ruang memiliki tata letak standar 6 baris × 6 kolom meja komputer.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-600">
                <th className="py-3 px-5 whitespace-nowrap">Ruang Lab</th>
                <th className="py-3 px-5 whitespace-nowrap">Lokasi</th>
                <th className="py-3 px-5">Bidang Praktikum &amp; Spesifikasi</th>
                <th className="py-3 px-5 whitespace-nowrap">Penanggung Jawab</th>
                <th className="py-3 px-5 text-right whitespace-nowrap">Kapasitas</th>
                <th className="py-3 px-5 text-right whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs sm:text-sm">
              {labs.map((lab) => (
                <tr key={lab.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-5 font-semibold text-slate-900 whitespace-nowrap">
                    {lab.name}
                  </td>
                  <td className="py-3.5 px-5 text-slate-600 whitespace-nowrap">{lab.floor}</td>
                  <td className="py-3.5 px-5">
                    <div className="text-slate-900 font-medium">{lab.specialization}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{lab.specs}</div>
                  </td>
                  <td className="py-3.5 px-5 text-slate-600 whitespace-nowrap">
                    {lab.supervisor}
                  </td>
                  <td className="py-3.5 px-5 text-right font-mono tabular-nums text-slate-800 whitespace-nowrap">
                    6×6 (36 PC)
                  </td>
                  <td className="py-3.5 px-5 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => onGoToDenah(lab.id)}
                      className="text-xs font-semibold text-slate-900 hover:underline"
                    >
                      Pilih Lab
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
