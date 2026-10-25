import { handler, idParam } from "@/lib/api";
import { getBoard } from "@/lib/services/queue.service";

export const dynamic = "force-dynamic";
export const GET = handler<{ id: string }>(async (_req, ctx) => getBoard(await idParam(ctx)));
