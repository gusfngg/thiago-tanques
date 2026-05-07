import { NextResponse } from "next/server";
import { sql, ensureSchema } from "@/lib/neon";
import type { CheckEntry } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    await ensureSchema();
    const entry = (await req.json()) as CheckEntry;
    if (!entry?.id) {
      return NextResponse.json({ error: "entry.id obrigatório" }, { status: 400 });
    }
    await sql`
      INSERT INTO aqua_entries (id, data)
      VALUES (${entry.id}, ${JSON.stringify(entry)}::jsonb)
      ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data
    `;
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[/api/entries POST] failed:", e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await ensureSchema();
    await sql`DELETE FROM aqua_entries`;
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[/api/entries DELETE] failed:", e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
