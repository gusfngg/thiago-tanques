import { saveUser } from "@/lib/server/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface UpdateUserBody {
  name?: unknown;
  emoji?: unknown;
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as UpdateUserBody;

    if (typeof body.name !== "string" || !body.name.trim()) {
      return Response.json({ error: "Nome é obrigatório." }, { status: 400 });
    }
    if (typeof body.emoji !== "string" || !body.emoji.trim()) {
      return Response.json({ error: "Emoji é obrigatório." }, { status: 400 });
    }

    const state = saveUser(id, body.name.trim(), body.emoji.trim());
    return Response.json({ state });
  } catch (error) {
    console.error("PUT /api/users/[id] failed", error);
    return Response.json(
      { error: "Falha ao atualizar o membro da família." },
      { status: 500 }
    );
  }
}
