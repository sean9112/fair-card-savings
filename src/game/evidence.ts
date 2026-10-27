import type { WeekRecord } from './simulation/systems/Campaign';

// The web app URL is public in the game; it must never be treated as a secret.
const ENDPOINT = import.meta.env.VITE_EVIDENCE_URL ?? 'https://script.google.com/macros/s/AKfycbz8FXYv7Q5RlM3CdHn8sKRzsYrzeRrEt5Ul4xLnQT43amO_fI0wn-BMbTZwo47oTNMuLQ/exec';
const QUEUE_KEY = 'fair-card-evidence-v1';
const MAX_AGE = 7 * 24 * 60 * 60 * 1000;
type Evidence = { eventId: string; sessionId: string; eventType: string; clientTime: string; gameVersion: string; [key: string]: unknown };

function identifier(): string {
  return globalThis.crypto?.randomUUID?.() ?? `session_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

export class EvidenceRecorder {
  private readonly sessionId = identifier();
  private pending: Evidence[] = [];
  private readonly attempted = new Set<string>();
  private readonly onOnline = () => { this.attempted.clear(); void this.retry(); };

  constructor() {
    try {
      const saved: unknown = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
      if (Array.isArray(saved)) this.pending = saved.filter((item): item is Evidence =>
        typeof item?.eventId === 'string' && typeof item?.clientTime === 'string' &&
        Date.now() - Date.parse(item.clientTime) < MAX_AGE).slice(-100);
    } catch { /* Recording must never prevent the game from starting. */ }
    void this.retry();
    window.addEventListener('online', this.onOnline);
  }

  close(): void { window.removeEventListener('online', this.onOnline); }

  week(record: WeekRecord, weeklyPlan: number): void {
    this.add('week_settled', `week_${record.week}`, { ...record, weeklyPlan });
  }

  complete(fundAfter: number, gap: number): void {
    this.add('game_completed', 'completed', { fundAfter, gap, goalReached: gap === 0 });
  }

  reflection(reflection: string): void {
    this.add('reflection', 'reflection', { reflection });
  }

  private add(eventType: string, suffix: string, fields: object): void {
    const event: Evidence = {
      ...fields, eventId: `${this.sessionId}_${suffix}`, sessionId: this.sessionId,
      eventType, clientTime: new Date().toISOString(), gameVersion: '1.1.0',
    };
    if (!this.pending.some((item) => item.eventId === event.eventId)) this.pending.push(event);
    this.pending = this.pending.slice(-100);
    this.persist();
    void this.retry();
  }

  private persist(): void {
    try { localStorage.setItem(QUEUE_KEY, JSON.stringify(this.pending)); } catch { /* Best effort. */ }
  }

  private async retry(): Promise<void> {
    this.pending = this.pending.filter((item) => Date.now() - Date.parse(item.clientTime) < MAX_AGE);
    if (!ENDPOINT || !navigator.onLine) return;
    for (const item of this.pending) {
      if (this.attempted.has(item.eventId)) continue;
      this.attempted.add(item.eventId);
      try {
        // Apps Script responses are opaque in no-cors mode. Keep records for a
        // bounded retry period; the server deduplicates by eventId.
        await fetch(ENDPOINT, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify(item), keepalive: true });
      } catch { this.attempted.delete(item.eventId); }
    }
    this.persist();
  }
}
