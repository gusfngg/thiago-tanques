import {
  clearTodayEntries,
  clearTodayEntriesByTank,
  getSharedState,
  saveEntry,
} from "@/lib/server/db";
import { CheckEntry } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface CreateEntryBody {
  id?: unknown;
  userId?: unknown;
  tankId?: unknown;
  taskId?: unknown;
  completedAt?: unknown;
  notes?: unknown;
  value?: unknown;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateEntryBody;
    const sharedState = getSharedState();

    if (typeof body.userId !== "string" || !body.userId) {
      return Response.json({ error: "userId é obrigatório." }, { status: 400 });
    }
    if (typeof body.tankId !== "string" || !body.tankId) {
      return Response.json({ error: "tankId é obrigatório." }, { status: 400 });
    }
    if (typeof body.taskId !== "string" || !body.taskId) {
      return Response.json({ error: "taskId é obrigatório." }, { status: 400 });
    }

    const hasUser = sharedState.users.some((user) => user.id === body.userId);
    const hasTank = sharedState.tanks.some((tank) => tank.id === body.tankId);
    const hasTask = sharedState.tasks.some((task) => task.id === body.taskId);

    if (!hasUser || !hasTank || !hasTask) {
      return Response.json(
        { error: "Entrada inválida: usuário, tanque ou tarefa não encontrados." },
        { status: 400 }
      );
    }

    const completedAt =
      typeof body.completedAt === "string" && !Number.isNaN(Date.parse(body.completedAt))
        ? body.completedAt
        : new Date().toISOString();

    const entry: CheckEntry = {
      id: typeof body.id === "string" && body.id ? body.id : crypto.randomUUID(),
      userId: body.userId as CheckEntry["userId"],
      tankId: body.tankId,
      taskId: body.taskId as CheckEntry["taskId"],
      completedAt,
      ...(typeof body.notes === "string" && body.notes.trim()
        ? { notes: body.notes.trim() }
        : {}),
      ...(typeof body.value === "string" && body.value.trim()
        ? { value: body.value.trim() }
        : {}),
    };

    const state = saveEntry(entry);
    return Response.json({ state }, { status: 201 });
  } catch (error) {
    console.error("POST /api/entries failed", error);
    return Response.json(
      { error: "Falha ao salvar a tarefa concluída." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tankId = searchParams.get("tankId");

    if (tankId) {
      const hasTank = getSharedState().tanks.some((tank) => tank.id === tankId);
      if (!hasTank) {
        return Response.json({ error: "Tanque não encontrado." }, { status: 400 });
      }

      const state = clearTodayEntriesByTank(tankId);
      return Response.json({ state });
    }

    const state = clearTodayEntries();
    return Response.json({ state });
  } catch (error) {
    console.error("DELETE /api/entries failed", error);
    return Response.json(
      { error: "Falha ao limpar o checklist de hoje." },
      { status: 500 }
    );
  }
}
