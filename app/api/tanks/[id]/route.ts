import { saveTank } from "@/lib/server/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface UpdateTankBody {
  name?: unknown;
  species?: unknown;
  liters?: unknown;
  emoji?: unknown;
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as UpdateTankBody;

    if (typeof body.name !== "string" || !body.name.trim()) {
      return Response.json({ error: "Nome do tanque é obrigatório." }, { status: 400 });
    }
    if (typeof body.species !== "string" || !body.species.trim()) {
      return Response.json({ error: "Espécie é obrigatória." }, { status: 400 });
    }
    if (typeof body.emoji !== "string" || !body.emoji.trim()) {
      return Response.json({ error: "Emoji é obrigatório." }, { status: 400 });
    }

    const litersValue = Number(body.liters);
    if (!Number.isFinite(litersValue) || litersValue <= 0) {
      return Response.json({ error: "Litros deve ser maior que zero." }, { status: 400 });
    }

    const state = await saveTank(
      id,
      body.name.trim(),
      body.species.trim(),
      Math.round(litersValue),
      body.emoji.trim()
    );

    return Response.json({ state });
  } catch (error) {
    console.error("PUT /api/tanks/[id] failed", error);
    return Response.json(
      { error: "Falha ao atualizar o tanque." },
      { status: 500 }
    );
  }
}
