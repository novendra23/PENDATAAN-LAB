export type PowerState = 'menyala_normal' | 'menyala_bermasalah' | 'tidak_menyala';

export type IssueCategory =
  | 'daya_mati'
  | 'monitor_layar'
  | 'keyboard'
  | 'mouse'
  | 'jaringan_internet'
  | 'sistem_software'
  | 'audio_usb';

export type UrgencyLevel = 'rendah' | 'sedang' | 'tinggi';

export type ReportStatus = 'menunggu' | 'diproses' | 'selesai';

export interface LabRoom {
  id: string;
  number: number;
  name: string;
  shortName: string;
  floor: string;
  specialization: string;
  supervisor: string;
  specs: string;
  rows: number;
  cols: number;
}

export interface ComputerUnit {
  id: string; // e.g., "LAB-01-PC-01"
  labId: string; // e.g., "LAB-01"
  unitNumber: number; // 1..36
  code: string; // "PC-01" .. "PC-36"
  row: number; // 0..5 (A..F)
  col: number; // 0..5 (1..6)
  seatLabel: string; // "A1" .. "F6"
  powerState: PowerState;
  lastCheckedAt: string;
  lastCheckedBy: string;
  lastSummaryNote: string;
}

export interface DamageReport {
  id: string; // e.g., "LPR-2026-1001"
  labId: string;
  labName: string;
  computerId: string;
  computerCode: string;
  seatLabel: string;
  powerState: PowerState;
  canTurnOn: boolean;
  categories: IssueCategory[];
  urgency: UrgencyLevel;
  description: string;
  reporterName: string;
  studentClass: string;
  status: ReportStatus;
  technicianNote: string;
  createdAt: string;
  updatedAt: string;
}

export interface LabStatePayload {
  labs: LabRoom[];
  computers: ComputerUnit[];
  reports: DamageReport[];
  updatedAt: string;
}

export interface ToggleComputerPayload {
  computerId: string;
  powerState: PowerState;
  checkedBy?: string;
  note?: string;
}

export interface BatchCheckPayload {
  labId: string;
  checkedBy: string;
  studentClass: string;
  mode: 'mark_normal_checked' | 'reset_all_normal';
}

export interface CreateReportPayload {
  labId: string;
  computerId: string;
  powerState: PowerState;
  categories: IssueCategory[];
  urgency: UrgencyLevel;
  description: string;
  reporterName: string;
  studentClass: string;
}

export interface UpdateReportStatusPayload {
  status: ReportStatus;
  technicianNote?: string;
}

export const ISSUE_CATEGORY_LABELS: Record<IssueCategory, string> = {
  daya_mati: 'Daya / CPU Mati',
  monitor_layar: 'Monitor / Layar',
  keyboard: 'Keyboard',
  mouse: 'Mouse',
  jaringan_internet: 'Jaringan / Internet',
  sistem_software: 'Sistem / Software',
  audio_usb: 'Port USB / Audio',
};

export const POWER_STATE_LABELS: Record<PowerState, string> = {
  menyala_normal: 'Menyala Normal',
  menyala_bermasalah: 'Menyala Bermasalah',
  tidak_menyala: 'Tidak Menyala',
};

export const POWER_STATE_SHORT: Record<PowerState, string> = {
  menyala_normal: 'Nyala',
  menyala_bermasalah: 'Kendala',
  tidak_menyala: 'Mati',
};

export const URGENCY_LABELS: Record<UrgencyLevel, string> = {
  rendah: 'Rendah',
  sedang: 'Sedang',
  tinggi: 'Mendesak',
};

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  menunggu: 'Menunggu Tindak Lanjut',
  diproses: 'Sedang Diperbaiki',
  selesai: 'Selesai Diperbaiki',
};
