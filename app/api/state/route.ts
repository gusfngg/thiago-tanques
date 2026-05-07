import { NextResponse } from "next/server";
import { sql, ensureSchema } from "@/lib/neon";
import { DEFAULT_USERS, DEFAULT_TANKS } from "@/lib/store";
import type { CheckEntry, Tank, User } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function seedIfEmpty() {
  const [{ count: uc }] = (await sql`SELECT COUNT(*)::int AS count FROM aqua_users`) as { count: number }[];
  if (uc === 0) {
    for (const u of DEFAULT_USERS) {
      await sql`INSERT INTO aqua_users (id, data) VALUES (${u.id}, ${JSON.stringify(u)}::jsonb)`;
    }
  }
  const [{ count: tc }] = (await sql`SELECT COUNT(*)::int AS count FROM aqua_tanks`) as { count: number }[];
  if (tc === 0) {
    for (const t of DEFAULT_TANKS) {
      await sql`INSERT INTO aqua_tanks (id, data) VALUES (${t.id}, ${JSON.stringify(t)}::jsonb)`;
    }
  }
}

export async function GET() {
  try {
    await ensureSchema();
    await seedIfEmpty();

    const [usersRows, tanksRows, entriesRows] = await Promise.all([
      sql`SELECT data FROM aqua_users`,
      sql`SELECT data FROM aqua_tanks`,
      sql`SELECT data FROM aqua_entries ORDER BY created_at ASC`,
    ]);

    return NextResponse.json({
      users: usersRows.map((r) => r.data as User),
      tanks: tanksRows.map((r) => r.data as Tank),
      entries: entriesRows.map((r) => r.data as CheckEntry),
    });
  } catch (e) {
    console.error("[/api/state] failed:", e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
