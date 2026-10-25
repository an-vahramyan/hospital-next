import { handler } from "@/lib/api";
import { listEquipment } from "@/lib/services/catalog.service";

export const GET = handler(async (req) => {
  const onlyNew = req.nextUrl.searchParams.get("new") === "true";
  const limit = Number(req.nextUrl.searchParams.get("limit")) || undefined;
  return listEquipment({ onlyNew, take: limit });
});
