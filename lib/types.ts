export type UserId = "user1" | "user2" | "user3";

export interface User {
  id: UserId;
  name: string;
  emoji: string;
  color: string;
}

export interface Tank {
  id: string;
  name: string;
  species: string;
  emoji: string;
  liters: number;
}

export type TaskId =
  | "morning_feeding"
  | "evening_feeding"
  | "temperature_check"
  | "water_test"
  | "water_change"
  | "filter_check"
  | "medication"
  | "observation";

export interface Task {
  id: TaskId;
  label: string;
  emoji: string;
  frequency: "daily" | "weekly" | "asNeeded";
  assignedTo: UserId[];
}

export interface CheckEntry {
  id: string;
  userId: UserId;
  tankId: string;
  taskId: TaskId;
  completedAt: string; // ISO string
  notes?: string;
  value?: string; // for temperature, pH, etc.
}

export interface SharedState {
  users: User[];
  tanks: Tank[];
  tasks: Task[];
  entries: CheckEntry[];
}

export interface AppState extends SharedState {
  activeUserId: UserId | null;
}
