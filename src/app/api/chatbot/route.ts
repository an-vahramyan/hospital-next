import { handler, parseBody } from "@/lib/api";
import { prisma } from "@/lib/db";
import { rateLimit } from "@/lib/rateLimit";
import { chatSchema } from "@/lib/schemas";
import { chat } from "@/lib/services/chatbot.service";
import { doctorPublicInclude } from "@/lib/services/catalog.service";

export const POST = handler(async (req) => {
  rateLimit(req, "chatbot", 20, 60_000);
  const { messages, language = "hy" } = await parseBody(req, chatSchema);
  const result = await chat(messages, language);
  const doctors = result.department
    ? await prisma.doctor.findMany({
        where: { department: { slug: result.department } },
        include: doctorPublicInclude,
        orderBy: { experienceYears: "desc" },
        take: 3,
      })
    : [];
  return { ...result, doctors };
});
