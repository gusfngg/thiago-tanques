import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { Pool } from "pg";
import { DEFAULT_TANKS, DEFAULT_TASKS, DEFAULT_USERS } from "@/lib/defaults";
import { CheckEntry, SharedState, Task, Tank, User } from "@/lib/types";

const DATABASE_URL = process.env.DATABASE_URL?.trim();
const USE_POSTGRES = Boolean(DATABASE_URL);

const database = createDatabase();

database.pragma("journal_mode = WAL");
database.pragma("foreign_keys = ON");
database.pragma("synchronous = NORMAL");

database.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    emoji TEXT NOT NULL,
    color TEXT NOT NULL,
    sort_order INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS tanks (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    species TEXT NOT NULL,
    emoji TEXT NOT NULL,
    liters INTEGER NOT NULL,
    sort_order INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    emoji TEXT NOT NULL,
    frequency TEXT NOT NULL,
    assigned_to TEXT NOT NULL,
    sort_order INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS entries (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    tank_id TEXT NOT NULL,
    task_id TEXT NOT NULL,
    completed_at TEXT NOT NULL,
    notes TEXT,
    value TEXT
  );
`);

seedDatabaseIfNeeded();

function createDatabase(): Database.Database {
  const resolvedPath = resolveDatabasePath();

  try {
    ensureParentDirectory(resolvedPath);
    return new Database(resolvedPath);
  } catch (error) {
    console.error(
      `[aqua-control] Failed to open SQLite at "${resolvedPath}". Falling back to in-memory database.`,
      error
    );
    return new Database(":memory:");
  }
}

function resolveDatabasePath(): string {
  const configuredPath = process.env.AQUA_DB_PATH?.trim();
  if (configuredPath) {
    return configuredPath;
  }

  const isVercel = Boolean(process.env.VERCEL || process.env.VERCEL_ENV);
  if (isVercel) {
    // Vercel runtime only allows writing under /tmp.
    return path.join("/tmp", "aqua-control", "aqua-control.sqlite");
  }

  return path.join(process.cwd(), "data", "aqua-control.sqlite");
}

function ensureParentDirectory(databasePath: string): void {
  if (databasePath === ":memory:") {
    return;
  }

  fs.mkdirSync(path.dirname(databasePath), { recursive: true });
}

declare global {
  var aquaControlPgPool: Pool | undefined;
  var aquaControlPgInitPromise: Promise<void> | undefined;
}

const pgPool = USE_POSTGRES ? getPgPool() : null;

function getPgPool(): Pool {
  if (!globalThis.aquaControlPgPool) {
    globalThis.aquaControlPgPool = new Pool({
      connectionString: DATABASE_URL,
    });
  }

  return globalThis.aquaControlPgPool;
}

async function ensurePostgresReady(): Promise<void> {
  if (!pgPool) {
    return;
  }

  if (!globalThis.aquaControlPgInitPromise) {
    globalThis.aquaControlPgInitPromise = initializePostgres(pgPool);
  }

  await globalThis.aquaControlPgInitPromise;
}

async function initializePostgres(pool: Pool): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      emoji TEXT NOT NULL,
      color TEXT NOT NULL,
      sort_order INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tanks (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      species TEXT NOT NULL,
      emoji TEXT NOT NULL,
      liters INTEGER NOT NULL,
      sort_order INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      emoji TEXT NOT NULL,
      frequency TEXT NOT NULL,
      assigned_to TEXT NOT NULL,
      sort_order INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS entries (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      tank_id TEXT NOT NULL,
      task_id TEXT NOT NULL,
      completed_at TEXT NOT NULL,
      notes TEXT,
      value TEXT
    );
  `);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const totalUsersResult = await client.query<{ total: number }>(
      "SELECT COUNT(*)::int AS total FROM users"
    );
    const totalUsers = totalUsersResult.rows[0]?.total ?? 0;

    if (totalUsers === 0) {
      for (const [index, user] of DEFAULT_USERS.entries()) {
        await client.query(
          `
            INSERT INTO users (id, name, emoji, color, sort_order)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (id) DO NOTHING
          `,
          [user.id, user.name, user.emoji, user.color, index]
        );
      }

      for (const [index, tank] of DEFAULT_TANKS.entries()) {
        await client.query(
          `
            INSERT INTO tanks (id, name, species, emoji, liters, sort_order)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (id) DO NOTHING
          `,
          [tank.id, tank.name, tank.species, tank.emoji, tank.liters, index]
        );
      }

      for (const [index, task] of DEFAULT_TASKS.entries()) {
        await client.query(
          `
            INSERT INTO tasks (id, label, emoji, frequency, assigned_to, sort_order)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (id) DO NOTHING
          `,
          [
            task.id,
            task.label,
            task.emoji,
            task.frequency,
            JSON.stringify(task.assignedTo),
            index,
          ]
        );
      }
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

interface TaskRow {
  id: string;
  label: string;
  emoji: string;
  frequency: Task["frequency"];
  assigned_to: string;
}

interface EntryRow {
  id: string;
  user_id: string;
  tank_id: string;
  task_id: string;
  completed_at: string;
  notes: string | null;
  value: string | null;
}

const selectUsersStatement = database.prepare(`
  SELECT id, name, emoji, color
  FROM users
  ORDER BY sort_order ASC
`);

const selectTanksStatement = database.prepare(`
  SELECT id, name, species, emoji, liters
  FROM tanks
  ORDER BY sort_order ASC
`);

const selectTasksStatement = database.prepare(`
  SELECT id, label, emoji, frequency, assigned_to
  FROM tasks
  ORDER BY sort_order ASC
`);

const selectEntriesStatement = database.prepare(`
  SELECT id, user_id, tank_id, task_id, completed_at, notes, value
  FROM entries
  ORDER BY completed_at DESC
`);

const insertEntryStatement = database.prepare(`
  INSERT OR IGNORE INTO entries (id, user_id, tank_id, task_id, completed_at, notes, value)
  VALUES (@id, @user_id, @tank_id, @task_id, @completed_at, @notes, @value)
`);

const updateUserStatement = database.prepare(`
  UPDATE users
  SET name = @name,
      emoji = @emoji
  WHERE id = @id
`);

const updateTankStatement = database.prepare(`
  UPDATE tanks
  SET name = @name,
      species = @species,
      liters = @liters,
      emoji = @emoji
  WHERE id = @id
`);

const clearTodayEntriesStatement = database.prepare(`
  DELETE FROM entries
  WHERE completed_at LIKE @todayPrefix
`);

const clearTodayEntriesByTankStatement = database.prepare(`
  DELETE FROM entries
  WHERE tank_id = @tankId
    AND completed_at LIKE @todayPrefix
`);

export async function getSharedState(): Promise<SharedState> {
  if (pgPool) {
    await ensurePostgresReady();

    const [usersResult, tanksResult, tasksResult, entriesResult] = await Promise.all([
      pgPool.query(`
        SELECT id, name, emoji, color
        FROM users
        ORDER BY sort_order ASC
      `),
      pgPool.query(`
        SELECT id, name, species, emoji, liters
        FROM tanks
        ORDER BY sort_order ASC
      `),
      pgPool.query(`
        SELECT id, label, emoji, frequency, assigned_to
        FROM tasks
        ORDER BY sort_order ASC
      `),
      pgPool.query(`
        SELECT id, user_id, tank_id, task_id, completed_at, notes, value
        FROM entries
        ORDER BY completed_at DESC
      `),
    ]);

    return toSharedState(
      usersResult.rows as User[],
      tanksResult.rows as Tank[],
      tasksResult.rows as TaskRow[],
      entriesResult.rows as EntryRow[]
    );
  }

  const users = selectUsersStatement.all() as User[];
  const tanks = selectTanksStatement.all() as Tank[];
  const taskRows = selectTasksStatement.all() as TaskRow[];
  const entryRows = selectEntriesStatement.all() as EntryRow[];

  return toSharedState(users, tanks, taskRows, entryRows);
}

export async function saveEntry(entry: CheckEntry): Promise<SharedState> {
  if (pgPool) {
    await ensurePostgresReady();
    await pgPool.query(
      `
        INSERT INTO entries (id, user_id, tank_id, task_id, completed_at, notes, value)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (id) DO NOTHING
      `,
      [
        entry.id,
        entry.userId,
        entry.tankId,
        entry.taskId,
        entry.completedAt,
        entry.notes ?? null,
        entry.value ?? null,
      ]
    );
    return getSharedState();
  }

  insertEntryStatement.run({
    id: entry.id,
    user_id: entry.userId,
    tank_id: entry.tankId,
    task_id: entry.taskId,
    completed_at: entry.completedAt,
    notes: entry.notes ?? null,
    value: entry.value ?? null,
  });

  return getSharedState();
}

export async function saveUser(
  userId: string,
  name: string,
  emoji: string
): Promise<SharedState> {
  if (pgPool) {
    await ensurePostgresReady();
    const result = await pgPool.query(
      `
        UPDATE users
        SET name = $2,
            emoji = $3
        WHERE id = $1
      `,
      [userId, name, emoji]
    );

    if (result.rowCount === 0) {
      throw new Error("Usuário não encontrado.");
    }

    return getSharedState();
  }

  const result = updateUserStatement.run({
    id: userId,
    name,
    emoji,
  });

  if (result.changes === 0) {
    throw new Error("Usuário não encontrado.");
  }

  return getSharedState();
}

export async function saveTank(
  tankId: string,
  name: string,
  species: string,
  liters: number,
  emoji: string
): Promise<SharedState> {
  if (pgPool) {
    await ensurePostgresReady();
    const result = await pgPool.query(
      `
        UPDATE tanks
        SET name = $2,
            species = $3,
            liters = $4,
            emoji = $5
        WHERE id = $1
      `,
      [tankId, name, species, liters, emoji]
    );

    if (result.rowCount === 0) {
      throw new Error("Tanque não encontrado.");
    }

    return getSharedState();
  }

  const result = updateTankStatement.run({
    id: tankId,
    name,
    species,
    liters,
    emoji,
  });

  if (result.changes === 0) {
    throw new Error("Tanque não encontrado.");
  }

  return getSharedState();
}

export async function clearTodayEntries(): Promise<SharedState> {
  const todayUtc = new Date().toISOString().split("T")[0];

  if (pgPool) {
    await ensurePostgresReady();
    await pgPool.query(
      `
        DELETE FROM entries
        WHERE completed_at LIKE $1
      `,
      [`${todayUtc}%`]
    );
    return getSharedState();
  }

  clearTodayEntriesStatement.run({
    todayPrefix: `${todayUtc}%`,
  });
  return getSharedState();
}

export async function clearTodayEntriesByTank(tankId: string): Promise<SharedState> {
  const todayUtc = new Date().toISOString().split("T")[0];

  if (pgPool) {
    await ensurePostgresReady();
    await pgPool.query(
      `
        DELETE FROM entries
        WHERE tank_id = $1
          AND completed_at LIKE $2
      `,
      [tankId, `${todayUtc}%`]
    );
    return getSharedState();
  }

  clearTodayEntriesByTankStatement.run({
    tankId,
    todayPrefix: `${todayUtc}%`,
  });
  return getSharedState();
}

function toSharedState(
  users: User[],
  tanks: Tank[],
  taskRows: TaskRow[],
  entryRows: EntryRow[]
): SharedState {
  const tasks: Task[] = taskRows.map((row) => ({
    id: row.id as Task["id"],
    label: row.label,
    emoji: row.emoji,
    frequency: row.frequency,
    assignedTo: parseAssignedUsers(row.assigned_to),
  }));

  const entries: CheckEntry[] = entryRows.map((row) => ({
    id: row.id,
    userId: row.user_id as CheckEntry["userId"],
    tankId: row.tank_id,
    taskId: row.task_id as CheckEntry["taskId"],
    completedAt: row.completed_at,
    ...(row.notes ? { notes: row.notes } : {}),
    ...(row.value ? { value: row.value } : {}),
  }));

  return {
    users,
    tanks,
    tasks,
    entries,
  };
}

function parseAssignedUsers(raw: string): Task["assignedTo"] {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed as Task["assignedTo"];
    }
  } catch {
    // Keep fallback below.
  }

  return ["user1", "user2", "user3"];
}

function seedDatabaseIfNeeded(): void {
  const totalUsersRow = database
    .prepare("SELECT COUNT(*) AS total FROM users")
    .get() as { total: number };

  if (totalUsersRow.total > 0) {
    return;
  }

  const seedTransaction = database.transaction(() => {
    const insertUser = database.prepare(`
      INSERT INTO users (id, name, emoji, color, sort_order)
      VALUES (?, ?, ?, ?, ?)
    `);
    const insertTank = database.prepare(`
      INSERT INTO tanks (id, name, species, emoji, liters, sort_order)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const insertTask = database.prepare(`
      INSERT INTO tasks (id, label, emoji, frequency, assigned_to, sort_order)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    DEFAULT_USERS.forEach((user, index) => {
      insertUser.run(user.id, user.name, user.emoji, user.color, index);
    });

    DEFAULT_TANKS.forEach((tank, index) => {
      insertTank.run(tank.id, tank.name, tank.species, tank.emoji, tank.liters, index);
    });

    DEFAULT_TASKS.forEach((task, index) => {
      insertTask.run(
        task.id,
        task.label,
        task.emoji,
        task.frequency,
        JSON.stringify(task.assignedTo),
        index
      );
    });
  });

  seedTransaction();
}
