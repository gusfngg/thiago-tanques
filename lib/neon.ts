import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error(
    "DATABASE_URL não está definida. Crie um banco em https://neon.tech, copie a connection string e cole em .env.local como DATABASE_URL=postgres://..."
  );
}

export const sql = neon(url);

let schemaReady: Promise<void> | null = null;

export function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS aqua_users (
          id   TEXT PRIMARY KEY,
          data JSONB NOT NULL
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS aqua_tanks (
          id   TEXT PRIMARY KEY,
          data JSONB NOT NULL
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS aqua_entries (
          id         TEXT PRIMARY KEY,
          data       JSONB NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
    })().catch((e) => {
      schemaReady = null;
      throw e;
    });
  }
  return schemaReady;
}
