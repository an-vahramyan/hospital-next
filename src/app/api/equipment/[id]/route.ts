import { handler, idParam } from "@/lib/api";
import { getEquipment } from "@/lib/services/catalog.service";

export const GET = handler<{ id: string }>(async (_req, ctx) => getEquipment(await idParam(ctx)));
