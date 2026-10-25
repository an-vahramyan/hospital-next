import { handler } from "@/lib/api";
import { listServices } from "@/lib/services/catalog.service";

export const GET = handler(async (req) => {
  const department = req.nextUrl.searchParams.get("department") || undefined;
  const limit = Number(req.nextUrl.searchParams.get("limit")) || undefined;
  return listServices(department, limit);
});
