import { handler, idParam } from "@/lib/api";
import { getStatus } from "@/lib/services/queue.service";

export const dynamic = "force-dynamic";
export const GET = handler<{ id: string }>(async (_req, ctx) => getStatus(await idParam(ctx)));
