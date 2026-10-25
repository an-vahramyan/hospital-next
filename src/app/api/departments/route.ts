import { handler } from "@/lib/api";
import { listDepartments } from "@/lib/services/catalog.service";

export const GET = handler(async () => listDepartments());
