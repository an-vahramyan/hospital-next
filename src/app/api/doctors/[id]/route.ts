import { handler, idParam } from "@/lib/api";
import { getDoctor } from "@/lib/services/catalog.service";

export const GET = handler<{ id: string }>(async (_req, ctx) => getDoctor(await idParam(ctx)));
