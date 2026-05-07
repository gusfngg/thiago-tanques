import { NextResponse } from "next/server";
import { sql, ensureSchema } from "@/lib/neon";
import type { User } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    await ensureSchema();
    const users = (await req.json()) as User[];
    if (!Array.isArray(users)) {
      return NextResponse.json({ error: "esperado array de users" }, { status: 400 });
    }
    await sql`DELETE FROM aqua_users`;
    for (const u of users) {
      await sql`
        INSERT INTO aqua_users (id, data)
        VALUES (${u.id}, ${JSON.stringify(u)}::jsonb)
      `;
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[/api/users POST] failed:", e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
