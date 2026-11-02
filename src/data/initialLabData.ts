import type {
  ComputerUnit,
  DamageReport,
  LabRoom,
  LabStatePayload,
  PowerState,
} from '../types/lab.ts';

const ROW_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

export const INITIAL_LABS: LabRoom[] = [
  {
    id: 'LAB-01',
    number: 1,
    name: 'Lab Komputer 1',
    shortName: 'Lab 1',
    floor: 'Gedung Utama Lt. 1 · Ruang 101',
    specialization: 'Rekayasa Perangkat Lunak & Algoritma',
    supervisor: 'Bpk. Hendra Wijaya, S.Kom.',
    specs: 'Intel Core i5-12400 · 16GB RAM · SSD 512GB · Monitor 24"',
    rows: 6,
    cols: 6,
  },
  {
    id: 'LAB-02',
    number: 2,
    name: 'Lab Komputer 2',
    shortName: 'Lab 2',
    floor: 'Gedung Utama Lt. 1 · Ruang 102',
    specialization: 'Jaringan Komputer & Administrasi Server',
    supervisor: 'Ibu Ratna Sari, M.T.',
    specs: 'Intel Core i5-12400 · 16GB RAM · Dual NIC · Monitor 24"',
    rows: 6,
    cols: 6,
  },
  {
    id: 'LAB-03',
    number: 3,
    name: 'Lab Komputer 3',
    shortName: 'Lab 3',
    floor: 'Gedung Utama Lt. 2 · Ruang 201',
    specialization: 'Desain Komunikasi Visual & Multimedia',
    supervisor: 'Bpk. Dimas Pratama, S.Sn.',
    specs: 'AMD Ryzen 5 5600X · 32GB RAM · RTX 3060 · IPS 27"',
    rows: 6,
    cols: 6,
  },
  {
    id: 'LAB-04',
    number: 4,
    name: 'Lab Komputer 4',
    shortName: 'Lab 4',
    floor: 'Gedung Utama Lt. 2 · Ruang 202',
    specialization: 'Simulasi Terpadu & Evaluasi Berbasis Komputer',
    supervisor: 'Ibu Nadia Kusuma, S.Pd.',
    specs: 'Intel Core i3-12100 · 16GB RAM · SSD 256GB · Monitor 22"',
    rows: 6,
    cols: 6,
  },
];

export const INITIAL_REPORTS: DamageReport[] = [
  {
    id: 'LPR-2026-101',
    labId: 'LAB-01',
    labName: 'Lab Komputer 1',
    computerId: 'LAB-01-PC-08',
    computerCode: 'PC-08',
    seatLabel: 'B2',
    powerState: 'tidak_menyala',
    canTurnOn: false,
    categories: ['daya_mati'],
    urgency: 'tinggi',
    description:
      'Tombol power CPU ditekan tidak ada indikator lampu sama sekali, kabel daya sudah dicek di stopkontak meja B2 tetap mati total.',
    reporterName: 'Rizky Ramadhan',
    studentClass: 'XI RPL 1',
    status: 'menunggu',
    technicianNote: '',
    createdAt: '2026-10-29T08:15:00.000Z',
    updatedAt: '2026-10-29T08:15:00.000Z',
  },
  {
    id: 'LPR-2026-102',
    labId: 'LAB-01',
    labName: 'Lab Komputer 1',
    computerId: 'LAB-01-PC-19',
    computerCode: 'PC-19',
    seatLabel: 'D1',
    powerState: 'menyala_bermasalah',
    canTurnOn: true,
    categories: ['monitor_layar', 'keyboard'],
    urgency: 'sedang',
    description:
      'Komputer bisa menyala, tetapi layar monitor berkedip garis vertikal di sisi kanan dan tombol spasi serta Enter pada keyboard macet.',
    reporterName: 'Siti Aisyah Putri',
    studentClass: 'XI RPL 1',
    status: 'diproses',
    technicianNote: 'Unit keyboard cadangan sedang disiapkan teknisi.',
    createdAt: '2026-10-29T08:40:00.000Z',
    updatedAt: '2026-10-29T09:10:00.000Z',
  },
  {
    id: 'LPR-2026-103',
    labId: 'LAB-02',
    labName: 'Lab Komputer 2',
    computerId: 'LAB-02-PC-15',
    computerCode: 'PC-15',
    seatLabel: 'C3',
    powerState: 'tidak_menyala',
    canTurnOn: false,
    categories: ['daya_mati', 'sistem_software'],
    urgency: 'tinggi',
    description:
      'Kipas CPU berputar 2 detik lalu langsung mati berulang-ulang (bootloop), tidak tampil ke BIOS.',
    reporterName: 'Bagas Adi Saputra',
    studentClass: 'XII TKJ 2',
    status: 'menunggu',
    technicianNote: '',
    createdAt: '2026-10-29T09:05:00.000Z',
    updatedAt: '2026-10-29T09:05:00.000Z',
  },
  {
    id: 'LPR-2026-104',
    labId: 'LAB-02',
    labName: 'Lab Komputer 2',
    computerId: 'LAB-02-PC-28',
    computerCode: 'PC-28',
    seatLabel: 'E4',
    powerState: 'menyala_bermasalah',
    canTurnOn: true,
    categories: ['jaringan_internet'],
    urgency: 'sedang',
    description:
      'PC menyala normal namun port LAN RJ45 longgar sehingga koneksi jaringan lokal lab sering terputus saat praktik.',
    reporterName: 'Nabila Maharani',
    studentClass: 'XII TKJ 2',
    status: 'menunggu',
    technicianNote: '',
    createdAt: '2026-10-29T09:22:00.000Z',
    updatedAt: '2026-10-29T09:22:00.000Z',
  },
  {
    id: 'LPR-2026-105',
    labId: 'LAB-03',
    labName: 'Lab Komputer 3',
    computerId: 'LAB-03-PC-05',
    computerCode: 'PC-05',
    seatLabel: 'A5',
    powerState: 'menyala_bermasalah',
    canTurnOn: true,
    categories: ['mouse', 'audio_usb'],
    urgency: 'rendah',
    description:
      'Sensor klik kiri mouse tidak merespons dan port USB bagian depan casing tidak terbaca saat mencolok flashdisk.',
    reporterName: 'Fajar Nugroho',
    studentClass: 'XI DKV 1',
    status: 'diproses',
    technicianNote: 'Sementara gunakan port USB belakang motherboard.',
    createdAt: '2026-10-29T10:00:00.000Z',
    updatedAt: '2026-10-29T10:30:00.000Z',
  },
  {
    id: 'LPR-2026-106',
    labId: 'LAB-04',
    labName: 'Lab Komputer 4',
    computerId: 'LAB-04-PC-33',
    computerCode: 'PC-33',
    seatLabel: 'F3',
    powerState: 'tidak_menyala',
    canTurnOn: false,
    categories: ['daya_mati', 'monitor_layar'],
    urgency: 'tinggi',
    description:
      'CPU dan monitor di meja pojok belakang F3 tidak menyala sama sekali ketika saklar utama baris F diaktifkan.',
    reporterName: 'Dewi Anggraini',
    studentClass: 'X MIPA 3',
    status: 'menunggu',
    technicianNote: '',
    createdAt: '2026-10-29T10:45:00.000Z',
    updatedAt: '2026-10-29T10:45:00.000Z',
  },
  {
    id: 'LPR-2026-100',
    labId: 'LAB-01',
    labName: 'Lab Komputer 1',
    computerId: 'LAB-01-PC-03',
    computerCode: 'PC-03',
    seatLabel: 'A3',
    powerState: 'menyala_normal',
    canTurnOn: true,
    categories: ['mouse'],
    urgency: 'rendah',
    description: 'Mouse optik sebelumnya macet, sudah diganti unit baru.',
    reporterName: 'Aldi Taherudin',
    studentClass: 'X RPL 2',
    status: 'selesai',
    technicianNote: 'Diganti mouse Logitech B100 baru dan diuji normal.',
    createdAt: '2026-10-28T13:20:00.000Z',
    updatedAt: '2026-10-28T15:00:00.000Z',
  },
];

export function buildInitialLabState(): LabStatePayload {
  const activeReportsByComputer = new Map<string, DamageReport>();
  for (const report of INITIAL_REPORTS) {
    if (report.status !== 'selesai') {
      activeReportsByComputer.set(report.computerId, report);
    }
  }

  const computers: ComputerUnit[] = [];

  for (const lab of INITIAL_LABS) {
    for (let r = 0; r < lab.rows; r++) {
      for (let c = 0; c < lab.cols; c++) {
        const unitNumber = r * lab.cols + c + 1;
        const paddedNumber = String(unitNumber).padStart(2, '0');
        const code = `PC-${paddedNumber}`;
        const seatLabel = `${ROW_LETTERS[r]}${c + 1}`;
        const id = `${lab.id}-${code}`;
        const openReport = activeReportsByComputer.get(id);

        let powerState: PowerState = 'menyala_normal';
        let lastCheckedAt = '2026-10-29T07:30:00.000Z';
        let lastCheckedBy = 'Piket Lab Pagi';
        let lastSummaryNote = 'Berfungsi normal dan siap digunakan praktikum.';

        if (openReport) {
          powerState = openReport.powerState;
          lastCheckedAt = openReport.updatedAt;
          lastCheckedBy = `${openReport.reporterName} (${openReport.studentClass})`;
          lastSummaryNote = openReport.description;
        }

        computers.push({
          id,
          labId: lab.id,
          unitNumber,
          code,
          row: r,
          col: c,
          seatLabel,
          powerState,
          lastCheckedAt,
          lastCheckedBy,
          lastSummaryNote,
        });
      }
    }
  }

  return {
    labs: INITIAL_LABS,
    computers,
    reports: INITIAL_REPORTS,
    updatedAt: '2026-10-29T10:45:00.000Z',
  };
}
