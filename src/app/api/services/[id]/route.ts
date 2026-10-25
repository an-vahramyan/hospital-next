import { handler, idParam } from "@/lib/api";
import { getService } from "@/lib/services/catalog.service";

export const GET = handler<{ id: string }>(async (_req, ctx) => getService(await idParam(ctx)));
