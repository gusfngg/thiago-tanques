import { getSharedState } from "@/lib/server/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const state = await getSharedState();
    return Response.json({ state });
  } catch (error) {
    console.error("GET /api/state failed", error);
    return Response.json(
      { error: "Falha ao carregar o estado compartilhado." },
      { status: 500 }
    );
  }
}
