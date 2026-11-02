import {
  ComputerUnit,
  DamageReport,
  ISSUE_CATEGORY_LABELS,
  LabRoom,
  POWER_STATE_LABELS,
  REPORT_STATUS_LABELS,
  URGENCY_LABELS,
} from '../types/lab';

export function formatIndonesianDateTime(iso: string): string {
  try {
    const date = new Date(iso);
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return iso;
  }
}

function escapeCsvCell(val: string | number | boolean): string {
  const str = String(val ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function triggerCsvDownload(filename: string, rows: (string | number | boolean)[][]): void {
  const csvContent =
    '\uFEFF' + rows.map((row) => row.map(escapeCsvCell).join(',')).join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadReportsCsv(reports: DamageReport[], filenamePrefix = 'laporan-kerusakan-lab'): void {
  const header = [
    'ID Laporan',
    'Waktu Lapor',
    'Laboratorium',
    'Kode Komputer',
    'Posisi Meja (6x6)',
    'Bisa Menyala',
    'Status Daya',
    'Komponen Bermasalah',
    'Tingkat Urgensi',
    'Deskripsi Masalah Teknis',
    'Nama Siswa Pelapor',
    'Kelas',
    'Status Penanganan',
    'Catatan Teknisi',
  ];

  const rows = reports.map((r) => [
    r.id,
    formatIndonesianDateTime(r.createdAt),
    r.labName,
    r.computerCode,
    r.seatLabel,
    r.canTurnOn ? 'Bisa Menyala' : 'Tidak Menyala',
    POWER_STATE_LABELS[r.powerState],
    r.categories.map((c) => ISSUE_CATEGORY_LABELS[c]).join('; '),
    URGENCY_LABELS[r.urgency],
    r.description,
    r.reporterName,
    r.studentClass,
    REPORT_STATUS_LABELS[r.status],
    r.technicianNote || '-',
  ]);

  const dateStamp = new Date().toISOString().slice(0, 10);
  triggerCsvDownload(`${filenamePrefix}-${dateStamp}.csv`, [header, ...rows]);
}

export function downloadAllComputersCsv(
  labs: LabRoom[],
  computers: ComputerUnit[]
): void {
  const labMap = new Map(labs.map((l) => [l.id, l]));
  const header = [
    'Laboratorium',
    'Lokasi Ruang',
    'Kode Komputer',
    'Posisi Meja (Baris/Kolom)',
    'Bisa Menyala',
    'Kondisi Perangkat',
    'Terakhir Dicek Oleh',
    'Waktu Pengecekan',
    'Catatan Kondisi',
  ];

  const rows = computers.map((pc) => {
    const lab = labMap.get(pc.labId);
    return [
      lab?.name || pc.labId,
      lab?.floor || '-',
      pc.code,
      pc.seatLabel,
      pc.powerState === 'tidak_menyala' ? 'Tidak Menyala' : 'Bisa Menyala',
      POWER_STATE_LABELS[pc.powerState],
      pc.lastCheckedBy,
      formatIndonesianDateTime(pc.lastCheckedAt),
      pc.lastSummaryNote,
    ];
  });

  const dateStamp = new Date().toISOString().slice(0, 10);
  triggerCsvDownload(`rekap-pendataan-4-lab-144-pc-${dateStamp}.csv`, [header, ...rows]);
}
