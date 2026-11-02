import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildInitialLabState } from './src/data/initialLabData.ts';
import type {
  BatchCheckPayload,
  CreateReportPayload,
  DamageReport,
  IssueCategory,
  LabStatePayload,
  PowerState,
  ReportStatus,
  ToggleComputerPayload,
  UpdateReportStatusPayload,
  UrgencyLevel,
} from './src/types/lab.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'lab-state.json');

function loadState(): LabStatePayload {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw) as LabStatePayload;
      if (
        parsed &&
        Array.isArray(parsed.labs) &&
        Array.isArray(parsed.computers) &&
        Array.isArray(parsed.reports) &&
        parsed.computers.length === 144
      ) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to read persisted lab state, initializing fresh state:', err);
  }

  const initial = buildInitialLabState();
  saveState(initial);
  return initial;
}

function saveState(state: LabStatePayload): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to persist lab state:', err);
  }
}

const VALID_POWER_STATES: PowerState[] = [
  'menyala_normal',
  'menyala_bermasalah',
  'tidak_menyala',
];

const VALID_CATEGORIES: IssueCategory[] = [
  'daya_mati',
  'monitor_layar',
  'keyboard',
  'mouse',
  'jaringan_internet',
  'sistem_software',
  'audio_usb',
];

const VALID_URGENCY: UrgencyLevel[] = ['rendah', 'sedang', 'tinggi'];
const VALID_REPORT_STATUS: ReportStatus[] = ['menunggu', 'diproses', 'selesai'];

function sanitizeText(value: unknown, maxLen: number, fallback = ''): string {
  if (typeof value !== 'string') return fallback;
  return value.trim().slice(0, maxLen);
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '256kb' }));

  let labState = loadState();

  app.get('/api/lab-state', (_req, res) => {
    res.json(labState);
  });

  app.post('/api/computers/toggle', (req, res) => {
    const body = req.body as Partial<ToggleComputerPayload>;
    const computerId = sanitizeText(body.computerId, 64);
    const powerState = body.powerState;

    if (!computerId || !powerState || !VALID_POWER_STATES.includes(powerState)) {
      res.status(400).json({ error: 'Parameter status komputer tidak valid.' });
      return;
    }

    const pcIndex = labState.computers.findIndex((pc) => pc.id === computerId);
    if (pcIndex === -1) {
      res.status(404).json({ error: 'Unit komputer tidak ditemukan.' });
      return;
    }

    const now = new Date().toISOString();
    const checkedBy = sanitizeText(body.checkedBy, 80, 'Siswa / Piket Lab');
    const defaultNote =
      powerState === 'menyala_normal'
        ? 'Berfungsi normal dan siap digunakan.'
        : powerState === 'menyala_bermasalah'
          ? 'Komputer menyala namun ditemukan kendala teknis.'
          : 'Komputer tidak dapat dinyalakan saat pengecekan.';
    const note = sanitizeText(body.note, 300, defaultNote);

    const targetPc = labState.computers[pcIndex];
    labState.computers[pcIndex] = {
      ...targetPc,
      powerState,
      lastCheckedAt: now,
      lastCheckedBy: checkedBy,
      lastSummaryNote: note,
    };

    // If marked back to menyala_normal via quick toggle, close open reports on this unit if any
    if (powerState === 'menyala_normal') {
      labState.reports = labState.reports.map((rep) =>
        rep.computerId === computerId && rep.status !== 'selesai'
          ? {
              ...rep,
              status: 'selesai',
              technicianNote:
                rep.technicianNote || 'Diverifikasi menyala normal kembali saat pendataan.',
              updatedAt: now,
            }
          : rep
      );
    }

    labState.updatedAt = now;
    saveState(labState);
    res.json(labState);
  });

  app.post('/api/computers/batch-check', (req, res) => {
    const body = req.body as Partial<BatchCheckPayload>;
    const labId = sanitizeText(body.labId, 32);
    const checkedBy = sanitizeText(body.checkedBy, 80, 'Piket Kelas');
    const studentClass = sanitizeText(body.studentClass, 40, 'Umum');
    const mode = body.mode === 'reset_all_normal' ? 'reset_all_normal' : 'mark_normal_checked';

    const lab = labState.labs.find((l) => l.id === labId);
    if (!lab) {
      res.status(404).json({ error: 'Lab komputer tidak ditemukan.' });
      return;
    }

    const now = new Date().toISOString();
    const actorLabel = studentClass ? `${checkedBy} (${studentClass})` : checkedBy;

    labState.computers = labState.computers.map((pc) => {
      if (pc.labId !== labId) return pc;
      if (mode === 'reset_all_normal') {
        return {
          ...pc,
          powerState: 'menyala_normal',
          lastCheckedAt: now,
          lastCheckedBy: actorLabel,
          lastSummaryNote: 'Seluruh unit lab diverifikasi menyala normal.',
        };
      }
      if (pc.powerState === 'menyala_normal') {
        return {
          ...pc,
          lastCheckedAt: now,
          lastCheckedBy: actorLabel,
          lastSummaryNote: 'Dicek siswa: menyala normal.',
        };
      }
      return pc;
    });

    if (mode === 'reset_all_normal') {
      labState.reports = labState.reports.map((rep) =>
        rep.labId === labId && rep.status !== 'selesai'
          ? {
              ...rep,
              status: 'selesai',
              technicianNote: rep.technicianNote || `Diselesaikan saat verifikasi massal oleh ${actorLabel}.`,
              updatedAt: now,
            }
          : rep
      );
    }

    labState.updatedAt = now;
    saveState(labState);
    res.json(labState);
  });

  app.post('/api/reports', (req, res) => {
    const body = req.body as Partial<CreateReportPayload>;
    const labId = sanitizeText(body.labId, 32);
    const computerId = sanitizeText(body.computerId, 64);
    const reporterName = sanitizeText(body.reporterName, 80);
    const studentClass = sanitizeText(body.studentClass, 40);
    const description = sanitizeText(body.description, 600);
    const powerState: PowerState =
      body.powerState && VALID_POWER_STATES.includes(body.powerState)
        ? body.powerState
        : 'tidak_menyala';
    const urgency: UrgencyLevel =
      body.urgency && VALID_URGENCY.includes(body.urgency) ? body.urgency : 'sedang';

    const rawCategories = Array.isArray(body.categories) ? body.categories : [];
    const categories = rawCategories.filter((c): c is IssueCategory =>
      VALID_CATEGORIES.includes(c as IssueCategory)
    );

    if (!labId || !computerId || !reporterName || !studentClass || !description) {
      res.status(400).json({
        error: 'Mohon lengkapi nama pelapor, kelas, dan deskripsi masalah teknis.',
      });
      return;
    }

    const lab = labState.labs.find((l) => l.id === labId);
    const pcIndex = labState.computers.findIndex(
      (pc) => pc.id === computerId && pc.labId === labId
    );

    if (!lab || pcIndex === -1) {
      res.status(404).json({ error: 'Komputer atau laboratorium tidak ditemukan.' });
      return;
    }

    const pc = labState.computers[pcIndex];
    const now = new Date().toISOString();
    const nextNum = 101 + labState.reports.length;
    const reportId = `LPR-2026-${nextNum}`;

    const effectivePowerState: PowerState =
      powerState === 'menyala_normal' ? 'menyala_bermasalah' : powerState;

    const finalCategories: IssueCategory[] =
      categories.length > 0
        ? categories
        : effectivePowerState === 'tidak_menyala'
          ? ['daya_mati']
          : ['sistem_software'];

    const newReport: DamageReport = {
      id: reportId,
      labId: lab.id,
      labName: lab.name,
      computerId: pc.id,
      computerCode: pc.code,
      seatLabel: pc.seatLabel,
      powerState: effectivePowerState,
      canTurnOn: effectivePowerState !== 'tidak_menyala',
      categories: finalCategories,
      urgency,
      description,
      reporterName,
      studentClass,
      status: 'menunggu',
      technicianNote: '',
      createdAt: now,
      updatedAt: now,
    };

    labState.reports = [newReport, ...labState.reports];
    labState.computers[pcIndex] = {
      ...pc,
      powerState: effectivePowerState,
      lastCheckedAt: now,
      lastCheckedBy: `${reporterName} (${studentClass})`,
      lastSummaryNote: description,
    };
    labState.updatedAt = now;

    saveState(labState);
    res.status(201).json({ state: labState, report: newReport });
  });

  app.patch('/api/reports/:id/status', (req, res) => {
    const reportId = sanitizeText(req.params.id, 40);
    const body = req.body as Partial<UpdateReportStatusPayload>;
    const status = body.status;

    if (!status || !VALID_REPORT_STATUS.includes(status)) {
      res.status(400).json({ error: 'Status laporan tidak valid.' });
      return;
    }

    const repIndex = labState.reports.findIndex((r) => r.id === reportId);
    if (repIndex === -1) {
      res.status(404).json({ error: 'Laporan tidak ditemukan.' });
      return;
    }

    const now = new Date().toISOString();
    const targetReport = labState.reports[repIndex];
    const technicianNote =
      typeof body.technicianNote === 'string'
        ? sanitizeText(body.technicianNote, 300)
        : targetReport.technicianNote;

    labState.reports[repIndex] = {
      ...targetReport,
      status,
      technicianNote,
      updatedAt: now,
    };

    // Recalculate target PC power state from remaining active reports
    const pcIndex = labState.computers.findIndex(
      (pc) => pc.id === targetReport.computerId
    );
    if (pcIndex !== -1) {
      const remainingOpen = labState.reports.filter(
        (r) => r.computerId === targetReport.computerId && r.status !== 'selesai'
      );

      if (remainingOpen.length === 0) {
        labState.computers[pcIndex] = {
          ...labState.computers[pcIndex],
          powerState: 'menyala_normal',
          lastCheckedAt: now,
          lastSummaryNote:
            technicianNote || 'Perbaikan selesai. Perangkat kembali menyala normal.',
        };
      } else {
        const hasDead = remainingOpen.some((r) => r.powerState === 'tidak_menyala');
        labState.computers[pcIndex] = {
          ...labState.computers[pcIndex],
          powerState: hasDead ? 'tidak_menyala' : 'menyala_bermasalah',
          lastCheckedAt: now,
          lastSummaryNote: remainingOpen[0].description,
        };
      }
    }

    labState.updatedAt = now;
    saveState(labState);
    res.json(labState);
  });

  app.delete('/api/reports/:id', (req, res) => {
    const reportId = sanitizeText(req.params.id, 40);
    const target = labState.reports.find((r) => r.id === reportId);
    if (!target) {
      res.status(404).json({ error: 'Laporan tidak ditemukan.' });
      return;
    }

    const now = new Date().toISOString();
    labState.reports = labState.reports.filter((r) => r.id !== reportId);

    const pcIndex = labState.computers.findIndex((pc) => pc.id === target.computerId);
    if (pcIndex !== -1) {
      const remainingOpen = labState.reports.filter(
        (r) => r.computerId === target.computerId && r.status !== 'selesai'
      );
      if (remainingOpen.length === 0) {
        labState.computers[pcIndex] = {
          ...labState.computers[pcIndex],
          powerState: 'menyala_normal',
          lastCheckedAt: now,
          lastSummaryNote: 'Berfungsi normal dan siap digunakan.',
        };
      } else {
        const hasDead = remainingOpen.some((r) => r.powerState === 'tidak_menyala');
        labState.computers[pcIndex] = {
          ...labState.computers[pcIndex],
          powerState: hasDead ? 'tidak_menyala' : 'menyala_bermasalah',
          lastCheckedAt: now,
          lastSummaryNote: remainingOpen[0].description,
        };
      }
    }

    labState.updatedAt = now;
    saveState(labState);
    res.json(labState);
  });

  const distPath = path.join(__dirname, 'dist');
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LabTrack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
