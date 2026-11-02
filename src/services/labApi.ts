import { buildInitialLabState } from '../data/initialLabData';
import type {
  BatchCheckPayload,
  CreateReportPayload,
  DamageReport,
  LabStatePayload,
  ToggleComputerPayload,
  UpdateReportStatusPayload,
} from '../types/lab';

const LOCAL_CACHE_KEY = 'labtrack_state_cache_v1';

function saveLocalCache(state: LabStatePayload): void {
  try {
    localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota errors
  }
}

function loadLocalCache(): LabStatePayload {
  try {
    const raw = localStorage.getItem(LOCAL_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as LabStatePayload;
      if (parsed && Array.isArray(parsed.computers) && parsed.computers.length === 144) {
        return parsed;
      }
    }
  } catch {
    // Ignore parse error
  }
  const initial = buildInitialLabState();
  saveLocalCache(initial);
  return initial;
}

export async function fetchLabState(): Promise<LabStatePayload> {
  try {
    const response = await fetch('/api/lab-state');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = (await response.json()) as LabStatePayload;
    saveLocalCache(data);
    return data;
  } catch {
    return loadLocalCache();
  }
}

export async function toggleComputerPower(
  payload: ToggleComputerPayload
): Promise<LabStatePayload> {
  try {
    const response = await fetch('/api/computers/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const errData = (await response.json().catch(() => ({}))) as { error?: string };
      throw new Error(errData.error || 'Gagal memperbarui status komputer.');
    }
    const data = (await response.json()) as LabStatePayload;
    saveLocalCache(data);
    return data;
  } catch {
    // Local fallback update
    const state = loadLocalCache();
    const now = new Date().toISOString();
    state.computers = state.computers.map((pc) =>
      pc.id === payload.computerId
        ? {
            ...pc,
            powerState: payload.powerState,
            lastCheckedAt: now,
            lastCheckedBy: payload.checkedBy || 'Siswa / Piket Lab',
            lastSummaryNote:
              payload.note ||
              (payload.powerState === 'menyala_normal'
                ? 'Berfungsi normal dan siap digunakan.'
                : payload.powerState === 'menyala_bermasalah'
                  ? 'Komputer menyala namun ditemukan kendala teknis.'
                  : 'Komputer tidak dapat dinyalakan saat pengecekan.'),
          }
        : pc
    );
    if (payload.powerState === 'menyala_normal') {
      state.reports = state.reports.map((r) =>
        r.computerId === payload.computerId && r.status !== 'selesai'
          ? { ...r, status: 'selesai', updatedAt: now }
          : r
      );
    }
    state.updatedAt = now;
    saveLocalCache(state);
    return state;
  }
}

export async function submitBatchCheck(
  payload: BatchCheckPayload
): Promise<LabStatePayload> {
  try {
    const response = await fetch('/api/computers/batch-check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error('Gagal menyimpan verifikasi lab.');
    }
    const data = (await response.json()) as LabStatePayload;
    saveLocalCache(data);
    return data;
  } catch {
    const state = loadLocalCache();
    const now = new Date().toISOString();
    const actor = payload.studentClass
      ? `${payload.checkedBy} (${payload.studentClass})`
      : payload.checkedBy;

    state.computers = state.computers.map((pc) => {
      if (pc.labId !== payload.labId) return pc;
      if (payload.mode === 'reset_all_normal') {
        return {
          ...pc,
          powerState: 'menyala_normal',
          lastCheckedAt: now,
          lastCheckedBy: actor,
          lastSummaryNote: 'Seluruh unit lab diverifikasi menyala normal.',
        };
      }
      if (pc.powerState === 'menyala_normal') {
        return {
          ...pc,
          lastCheckedAt: now,
          lastCheckedBy: actor,
          lastSummaryNote: 'Dicek siswa: menyala normal.',
        };
      }
      return pc;
    });
    state.updatedAt = now;
    saveLocalCache(state);
    return state;
  }
}

export async function createDamageReport(
  payload: CreateReportPayload
): Promise<{ state: LabStatePayload; report: DamageReport }> {
  try {
    const response = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const errData = (await response.json().catch(() => ({}))) as { error?: string };
      throw new Error(errData.error || 'Gagal mengirim laporan kerusakan.');
    }
    const result = (await response.json()) as {
      state: LabStatePayload;
      report: DamageReport;
    };
    saveLocalCache(result.state);
    return result;
  } catch (err) {
    if (err instanceof Error && err.message.startsWith('Mohon lengkapi')) {
      throw err;
    }
    const state = loadLocalCache();
    const lab = state.labs.find((l) => l.id === payload.labId)!;
    const pc = state.computers.find((c) => c.id === payload.computerId)!;
    const now = new Date().toISOString();
    const effectivePower =
      payload.powerState === 'menyala_normal' ? 'menyala_bermasalah' : payload.powerState;

    const newReport: DamageReport = {
      id: `LPR-2026-${101 + state.reports.length}`,
      labId: lab.id,
      labName: lab.name,
      computerId: pc.id,
      computerCode: pc.code,
      seatLabel: pc.seatLabel,
      powerState: effectivePower,
      canTurnOn: effectivePower !== 'tidak_menyala',
      categories:
        payload.categories.length > 0
          ? payload.categories
          : effectivePower === 'tidak_menyala'
            ? ['daya_mati']
            : ['sistem_software'],
      urgency: payload.urgency,
      description: payload.description,
      reporterName: payload.reporterName,
      studentClass: payload.studentClass,
      status: 'menunggu',
      technicianNote: '',
      createdAt: now,
      updatedAt: now,
    };

    state.reports = [newReport, ...state.reports];
    state.computers = state.computers.map((c) =>
      c.id === pc.id
        ? {
            ...c,
            powerState: effectivePower,
            lastCheckedAt: now,
            lastCheckedBy: `${payload.reporterName} (${payload.studentClass})`,
            lastSummaryNote: payload.description,
          }
        : c
    );
    state.updatedAt = now;
    saveLocalCache(state);
    return { state, report: newReport };
  }
}

export async function updateReportStatus(
  reportId: string,
  payload: UpdateReportStatusPayload
): Promise<LabStatePayload> {
  try {
    const response = await fetch(`/api/reports/${encodeURIComponent(reportId)}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error('Gagal memperbarui status laporan.');
    }
    const data = (await response.json()) as LabStatePayload;
    saveLocalCache(data);
    return data;
  } catch {
    const state = loadLocalCache();
    const now = new Date().toISOString();
    const target = state.reports.find((r) => r.id === reportId);
    state.reports = state.reports.map((r) =>
      r.id === reportId
        ? {
            ...r,
            status: payload.status,
            technicianNote:
              payload.technicianNote !== undefined
                ? payload.technicianNote
                : r.technicianNote,
            updatedAt: now,
          }
        : r
    );
    if (target) {
      const remainingOpen = state.reports.filter(
        (r) => r.computerId === target.computerId && r.status !== 'selesai'
      );
      state.computers = state.computers.map((pc) => {
        if (pc.id !== target.computerId) return pc;
        if (remainingOpen.length === 0) {
          return {
            ...pc,
            powerState: 'menyala_normal',
            lastCheckedAt: now,
            lastSummaryNote: 'Perbaikan selesai. Perangkat kembali menyala normal.',
          };
        }
        const hasDead = remainingOpen.some((r) => r.powerState === 'tidak_menyala');
        return {
          ...pc,
          powerState: hasDead ? 'tidak_menyala' : 'menyala_bermasalah',
          lastCheckedAt: now,
        };
      });
    }
    state.updatedAt = now;
    saveLocalCache(state);
    return state;
  }
}

export async function deleteReport(reportId: string): Promise<LabStatePayload> {
  try {
    const response = await fetch(`/api/reports/${encodeURIComponent(reportId)}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Gagal menghapus laporan.');
    }
    const data = (await response.json()) as LabStatePayload;
    saveLocalCache(data);
    return data;
  } catch {
    const state = loadLocalCache();
    const now = new Date().toISOString();
    state.reports = state.reports.filter((r) => r.id !== reportId);
    state.updatedAt = now;
    saveLocalCache(state);
    return state;
  }
}
