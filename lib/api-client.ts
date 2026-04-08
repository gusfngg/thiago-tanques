import { CheckEntry, SharedState, UserId } from "./types";

interface StateResponse {
  state: SharedState;
  error?: string;
}

async function requestSharedState(
  input: string,
  init?: RequestInit
): Promise<SharedState> {
  const response = await fetch(input, init);

  let payload: StateResponse | null = null;
  try {
    payload = (await response.json()) as StateResponse;
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(payload?.error || "Falha na comunicação com o servidor.");
  }

  if (!payload?.state) {
    throw new Error("Resposta inválida do servidor.");
  }

  return payload.state;
}

export function fetchSharedState(): Promise<SharedState> {
  return requestSharedState("/api/state", { cache: "no-store" });
}

export function createEntry(entry: CheckEntry): Promise<SharedState> {
  return requestSharedState("/api/entries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entry),
  });
}

export function updateUser(
  userId: UserId,
  name: string,
  emoji: string
): Promise<SharedState> {
  return requestSharedState(`/api/users/${userId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, emoji }),
  });
}

export function updateTank(
  tankId: string,
  name: string,
  species: string,
  liters: number,
  emoji: string
): Promise<SharedState> {
  return requestSharedState(`/api/tanks/${tankId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, species, liters, emoji }),
  });
}

export function clearHistory(): Promise<SharedState> {
  return requestSharedState("/api/entries", {
    method: "DELETE",
  });
}
