import { getSharedState } from "@/lib/server/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return Response.json({ state: getSharedState() });
  } catch (error) {
    console.error("GET /api/state failed", error);
    return Response.json(
      { error: "Falha ao carregar o estado compartilhado." },
      { status: 500 }
    );
  }
}
