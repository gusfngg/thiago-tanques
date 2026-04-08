import { AppState, CheckEntry } from "./types";

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
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
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
      const time = new Date(entry.completedAt).toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });
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
    if (count > 0) {
      msg += `  ${user.emoji} ${user.name}: ${count} tarefa${count !== 1 ? "s" : ""}\n`;
    }
  }

  msg += `\n_Enviado via AquaControl_ 🐟`;

  return msg;
}

export function generateWhatsAppURL(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
