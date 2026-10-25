import { handler } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { getMe } from "@/lib/services/auth.service";

export const GET = handler(async (req) => {
  const user = await requireAuth(req);
  return getMe(user.id);
});
