import { SharedState, User, Tank, Task } from "./types";

export const DEFAULT_USERS: User[] = [
  { id: "user1", name: "Membro 1", emoji: "🧑", color: "#0ea5e9" },
  { id: "user2", name: "Membro 2", emoji: "👩", color: "#f59e0b" },
  { id: "user3", name: "Membro 3", emoji: "🧒", color: "#10b981" },
];

export const DEFAULT_TANKS: Tank[] = [
  { id: "tank1", name: "Tanque 1", species: "Betta", emoji: "🐠", liters: 10 },
  { id: "tank2", name: "Tanque 2", species: "Tetra", emoji: "🐟", liters: 40 },
  { id: "tank3", name: "Tanque 3", species: "Acará", emoji: "🐡", liters: 80 },
  { id: "tank4", name: "Tanque 4", species: "Corydora", emoji: "🦈", liters: 60 },
  { id: "tank5", name: "Tanque 5", species: "Guppy", emoji: "🐬", liters: 30 },
  { id: "tank6", name: "Tanque 6", species: "Neon", emoji: "✨", liters: 50 },
];

export const DEFAULT_TASKS: Task[] = [
  { id: "morning_feeding", label: "Alimentação Manhã", emoji: "🌅", frequency: "daily", assignedTo: ["user1", "user2", "user3"] },
  { id: "evening_feeding", label: "Alimentação Noite", emoji: "🌆", frequency: "daily", assignedTo: ["user1", "user2", "user3"] },
  { id: "temperature_check", label: "Temperatura da Água", emoji: "🌡️", frequency: "daily", assignedTo: ["user1", "user2", "user3"] },
  { id: "water_test", label: "Teste de pH", emoji: "🔬", frequency: "weekly", assignedTo: ["user1", "user2", "user3"] },
  { id: "water_change", label: "Troca de Água", emoji: "💧", frequency: "weekly", assignedTo: ["user1", "user2", "user3"] },
  { id: "filter_check", label: "Checar Filtro", emoji: "🔧", frequency: "weekly", assignedTo: ["user1", "user2", "user3"] },
  { id: "medication", label: "Medicação", emoji: "💊", frequency: "asNeeded", assignedTo: ["user1", "user2", "user3"] },
  { id: "observation", label: "Observação Geral", emoji: "👁️", frequency: "daily", assignedTo: ["user1", "user2", "user3"] },
];

export function getDefaultSharedState(): SharedState {
  return {
    users: DEFAULT_USERS.map((user) => ({ ...user })),
    tanks: DEFAULT_TANKS.map((tank) => ({ ...tank })),
    tasks: DEFAULT_TASKS.map((task) => ({ ...task, assignedTo: [...task.assignedTo] })),
    entries: [],
  };
}
