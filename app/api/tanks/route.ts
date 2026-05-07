import { NextResponse } from "next/server";
import { sql, ensureSchema } from "@/lib/neon";
import type { Tank } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    await ensureSchema();
    const tanks = (await req.json()) as Tank[];
    if (!Array.isArray(tanks)) {
      return NextResponse.json({ error: "esperado array de tanks" }, { status: 400 });
    }
    await sql`DELETE FROM aqua_tanks`;
    for (const t of tanks) {
      await sql`
        INSERT INTO aqua_tanks (id, data)
        VALUES (${t.id}, ${JSON.stringify(t)}::jsonb)
      `;
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[/api/tanks POST] failed:", e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
