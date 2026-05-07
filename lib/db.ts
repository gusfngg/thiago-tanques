import { AppState, CheckEntry, User, Tank } from "./types";

// Cliente HTTP fino para falar com as API routes (que falam com o Neon).
// O Neon só pode ser acessado server-side, então tudo vai via /api/*.

const POLL_MS = 8000;

type Snapshot = {
  users: User[];
  tanks: Tank[];
  entries: CheckEntry[];
};

let lastSnapshot: Snapshot | null = null;
const subs = {
  entries: new Set<(e: CheckEntry[]) => void>(),
  users: new Set<(u: User[]) => void>(),
  tanks: new Set<(t: Tank[]) => void>(),
};
let pollTimer: ReturnType<typeof setInterval> | null = null;

async function fetchState(): Promise<Snapshot> {
  const res = await fetch("/api/state", { cache: "no-store" });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`GET /api/state ${res.status}: ${txt}`);
  }
  return (await res.json()) as Snapshot;
}

function fanout(snap: Snapshot, prev: Snapshot | null) {
  if (!prev || JSON.stringify(prev.entries) !== JSON.stringify(snap.entries)) {
    subs.entries.forEach((cb) => cb(snap.entries));
  }
  if (!prev || JSON.stringify(prev.users) !== JSON.stringify(snap.users)) {
    subs.users.forEach((cb) => cb(snap.users));
  }
  if (!prev || JSON.stringify(prev.tanks) !== JSON.stringify(snap.tanks)) {
    subs.tanks.forEach((cb) => cb(snap.tanks));
  }
}

/** Re-busca o estado e notifica os subscribers. Use após cada write. */
export async function refresh(): Promise<void> {
  try {
    const snap = await fetchState();
    fanout(snap, lastSnapshot);
    lastSnapshot = snap;
  } catch (e) {
    console.error("[db] refresh falhou:", e);
  }
}

function startPolling() {
  if (pollTimer) return;
  pollTimer = setInterval(refresh, POLL_MS);
}

function maybeStopPolling() {
  if (subs.entries.size + subs.users.size + subs.tanks.size === 0 && pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
    lastSnapshot = null;
  }
}

// ─── Listeners ────────────────────────────────────────────────

export function subscribeEntries(
  callback: (entries: CheckEntry[]) => void
): () => void {
  subs.entries.add(callback);
  if (lastSnapshot) callback(lastSnapshot.entries);
  else void refresh();
  startPolling();
  return () => {
    subs.entries.delete(callback);
    maybeStopPolling();
  };
}

export function subscribeUsers(
  callback: (users: User[]) => void
): () => void {
  subs.users.add(callback);
  if (lastSnapshot) callback(lastSnapshot.users);
  else void refresh();
  startPolling();
  return () => {
    subs.users.delete(callback);
    maybeStopPolling();
  };
}

export function subscribeTanks(
  callback: (tanks: Tank[]) => void
): () => void {
  subs.tanks.add(callback);
  if (lastSnapshot) callback(lastSnapshot.tanks);
  else void refresh();
  startPolling();
  return () => {
    subs.tanks.delete(callback);
    maybeStopPolling();
  };
}

// ─── Writes ───────────────────────────────────────────────────

async function postJSON(path: string, body: unknown): Promise<void> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`POST ${path} ${res.status}: ${txt}`);
  }
}

export async function addEntry(entry: CheckEntry): Promise<void> {
  await postJSON("/api/entries", entry);
  await refresh();
}

export async function saveUsers(users: User[]): Promise<void> {
  await postJSON("/api/users", users);
  await refresh();
}

export async function saveTanks(tanks: Tank[]): Promise<void> {
  await postJSON("/api/tanks", tanks);
  await refresh();
}

export async function clearEntries(): Promise<void> {
  const res = await fetch("/api/entries", { method: "DELETE" });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`DELETE /api/entries ${res.status}: ${txt}`);
  }
  await refresh();
}

/**
 * No-op mantido por compatibilidade com a chamada existente em app/page.tsx.
 * O seed dos defaults agora acontece server-side em GET /api/state.
 */
export async function initFirebaseDefaults(_state: AppState): Promise<void> {
  return;
}
