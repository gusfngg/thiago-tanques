import { AppState, CheckEntry, User, Tank, Task, UserId } from "./types";

export const DEFAULT_USERS: User[] = [
  { id: "user1", name: "Membro 1", emoji: "🧑", color: "#0ea5e9" },
  { id: "user2", name: "Membro 2", emoji: "👩", color: "#f59e0b" },
  { id: "user3", name: "Membro 3", emoji: "🧒", color: "#10b981" },
];

export const DEFAULT_TANKS: Tank[] = [
  { id: "tank1", name: "Tanque 1", species: "Betta",    emoji: "🐠", liters: 10 },
  { id: "tank2", name: "Tanque 2", species: "Tetra",    emoji: "🐟", liters: 40 },
  { id: "tank3", name: "Tanque 3", species: "Acará",    emoji: "🐡", liters: 80 },
  { id: "tank4", name: "Tanque 4", species: "Corydora", emoji: "🦈", liters: 60 },
  { id: "tank5", name: "Tanque 5", species: "Guppy",    emoji: "🐬", liters: 30 },
  { id: "tank6", name: "Tanque 6", species: "Neon",     emoji: "✨", liters: 50 },
];

export const DEFAULT_TASKS: Task[] = [
  { id: "morning_feeding",  label: "Alimentação Manhã",  emoji: "🌅", frequency: "daily",     assignedTo: ["user1","user2","user3"] },
  { id: "evening_feeding",  label: "Alimentação Noite",  emoji: "🌆", frequency: "daily",     assignedTo: ["user1","user2","user3"] },
  { id: "temperature_check",label: "Temperatura da Água",emoji: "🌡️", frequency: "daily",     assignedTo: ["user1","user2","user3"] },
  { id: "water_test",       label: "Teste de pH",        emoji: "🔬", frequency: "weekly",    assignedTo: ["user1","user2","user3"] },
  { id: "water_change",     label: "Troca de Água",      emoji: "💧", frequency: "weekly",    assignedTo: ["user1","user2","user3"] },
  { id: "filter_check",     label: "Checar Filtro",      emoji: "🔧", frequency: "weekly",    assignedTo: ["user1","user2","user3"] },
  { id: "medication",       label: "Medicação",          emoji: "💊", frequency: "asNeeded",  assignedTo: ["user1","user2","user3"] },
  { id: "observation",      label: "Observação Geral",   emoji: "👁️", frequency: "daily",     assignedTo: ["user1","user2","user3"] },
];

const ACTIVE_USER_KEY = "aqua_active_user";

export function getDefaultState(): AppState {
  return {
    users: DEFAULT_USERS,
    tanks: DEFAULT_TANKS,
    tasks: DEFAULT_TASKS,
    entries: [],
    activeUserId: null,
  };
}

export function loadActiveUser(): UserId | null {
  if (typeof window === "undefined") return null;
  return (localStorage.getItem(ACTIVE_USER_KEY) as UserId) || null;
}

export function saveActiveUser(id: UserId | null): void {
  if (typeof window === "undefined") return;
  if (id) localStorage.setItem(ACTIVE_USER_KEY, id);
  else localStorage.removeItem(ACTIVE_USER_KEY);
}

export function getTodayEntries(entries: CheckEntry[]): CheckEntry[] {
  const today = new Date().toISOString().split("T")[0];
  return entries.filter((e) => e.completedAt.startsWith(today));
}

export function isTaskDoneToday(
  entries: CheckEntry[],
  tankId: string,
  taskId: string
): CheckEntry | undefined {
  const today = new Date().toISOString().split("T")[0];
  return entries.find(
    (e) =>
      e.tankId === tankId &&
      e.taskId === taskId &&
      e.completedAt.startsWith(today)
  );
}

export function generateWhatsAppReport(state: AppState): string {
  const today = new Date();
  const dateStr = today.toLocaleDateString("pt-BR", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const todayEntries = getTodayEntries(state.entries);

  let msg = `🐠 *AquaControl - Relatório Diário*\n`;
  msg += `📅 ${dateStr}\n`;
  msg += `${"─".repeat(28)}\n\n`;

  for (const tank of state.tanks) {
    const tankEntries = todayEntries.filter((e) => e.tankId === tank.id);
    if (tankEntries.length === 0) continue;
    msg += `${tank.emoji} *${tank.name}* (${tank.species})\n`;
    for (const entry of tankEntries) {
      const task = state.tasks.find((t) => t.id === entry.taskId);
      const user = state.users.find((u) => u.id === entry.userId);
      const time = new Date(entry.completedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
      msg += `  ✅ ${task?.emoji} ${task?.label}`;
      if (entry.value) msg += ` (${entry.value})`;
      msg += ` — ${user?.name} ${time}\n`;
      if (entry.notes) msg += `    📝 _${entry.notes}_\n`;
    }
    msg += `\n`;
  }

  msg += `${"─".repeat(28)}\n`;
  msg += `👥 *Resumo por Membro*\n`;
  for (const user of state.users) {
    const count = todayEntries.filter((e) => e.userId === user.id).length;
    if (count > 0) msg += `  ${user.emoji} ${user.name}: ${count} tarefa${count !== 1 ? "s" : ""}\n`;
  }
  msg += `\n_Enviado via AquaControl_ 🐟`;
  return msg;
}

export function generateWhatsAppURL(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
