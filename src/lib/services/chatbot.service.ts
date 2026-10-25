// AI-чатбот (Claude API) + fallback по ключевым словам
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "../db";
import { config } from "../config";

export type ChatMessage = { role: "user" | "assistant"; content: string };
export type ChatResult = { reply: string; department: string | null; source: "ai" | "fallback" };

const client = config.ai.apiKey ? new Anthropic({ apiKey: config.ai.apiKey }) : null;

const LANG_NAMES: Record<string, string> = { hy: "Armenian", en: "English", ru: "Russian" };

export function buildSystemPrompt(
  departments: { slug: string; name: string; description: string | null }[],
  language: string,
) {
  const list = departments.map((d) => `- ${d.slug}: ${d.name}${d.description ? ` — ${d.description}` : ""}`).join("\n");
  return `You are the friendly virtual assistant of "${config.hospitalName}" hospital (address: ${config.hospitalAddress}).
Your job: help visitors understand which department / doctor they should see, explain how to book an appointment on the website, and answer general questions about the hospital.

STRICT RULES:
- NEVER make a diagnosis and NEVER prescribe or recommend medicines or doses.
- If the user describes emergency symptoms (chest pain, shortness of breath, loss of consciousness, severe bleeding, stroke signs, etc.), tell them to call emergency services immediately: 911 or 103 (Armenia), before anything else.
- Keep answers short (2–5 sentences), warm and clear.
- Answer in ${LANG_NAMES[language] || "the user's language"} unless the user writes in another language.

Hospital departments (slug: name — description):
${list}

If one department clearly fits the user's request, add a final separate line exactly in the form:
DEPARTMENT: <slug>
Use only slugs from the list above. If none fits, do not add this line.`;
}

export function extractDepartment(text: string, slugs: string[]): { reply: string; department: string | null } {
  const match = text.match(/^\s*DEPARTMENT:\s*([a-z0-9-]+)\s*$/im);
  const slug = match && slugs.includes(match[1].toLowerCase()) ? match[1].toLowerCase() : null;
  return { reply: text.replace(/^\s*DEPARTMENT:.*$/gim, "").trim(), department: slug };
}

const KEYWORDS: Record<string, string[]> = {
  cardiology: ["սիրտ", "սրտ", "ճնշում", "сердц", "давлен", "аритм", "heart", "pressure", "chest"],
  neurology: ["գլխացավ", "գլուխ", "գլխապտույտ", "նյարդ", "голов", "мигрен", "нерв", "головокруж", "headache", "migraine", "dizz", "nerve"],
  pediatrics: ["երեխա", "մանկ", "ребён", "ребен", "детск", "child", "kid", "baby", "pediatric"],
  radiology: ["ռենտգեն", "մրտ", "mri", "կտ", "рентген", "мрт", "томограф", "узи", "x-ray", "scan", "ultrasound", "tomograph"],
  therapy: ["ջերմ", "հազ", "մրսել", "գրիպ", "температур", "кашель", "простуд", "грипп", "fever", "cough", "cold", "flu"],
};

const EMERGENCY = ["կրծքավանդակ", "շնչահեղձ", "գիտակց", "боль в груди", "задыха", "сознани", "chest pain", "can't breathe", "unconscious", "breath"];

const FALLBACK_TEXT: Record<string, { emergency: string; found: (d: string) => string; none: string }> = {
  hy: {
    emergency: "⚠️ Սա կարող է շտապ վիճակ լինել։ Անմիջապես զանգահարեք 911 կամ 103։",
    found: (d) => `Ձեր նկարագրությամբ կարող է օգնել «${d}» բաժինը։ Կարող եք տեսնել բաժնի բժիշկներին և ամրագրել այց կայքում։ Սա բժշկական խորհրդատվություն չէ։`,
    none: "Ես կօգնեմ ընտրել ճիշտ բաժինը։ Նկարագրեք, խնդրում եմ, ինչն է Ձեզ անհանգստացնում (օր․ գլխացավ, սրտի ցավ, երեխայի ջերմություն)։ Ամրագրել կարող եք «Ամրագրել այց» կոճակով։",
  },
  ru: {
    emergency: "⚠️ Это может быть неотложное состояние. Немедленно звоните 911 или 103.",
    found: (d) => `По вашему описанию может помочь отделение «${d}». Вы можете посмотреть врачей отделения и записаться на сайте. Это не медицинская консультация.`,
    none: "Я помогу выбрать нужное отделение. Опишите, пожалуйста, что вас беспокоит (например: головная боль, боль в сердце, температура у ребёнка). Записаться можно кнопкой «Записаться».",
  },
  en: {
    emergency: "⚠️ This may be an emergency. Call 911 or 103 immediately.",
    found: (d) => `Based on your description, the "${d}" department may help. You can see its doctors and book a visit on the website. This is not medical advice.`,
    none: "I can help you choose the right department. Please describe what bothers you (e.g. headache, heart pain, child's fever). You can book with the \"Book a visit\" button.",
  },
};

export function keywordFallback(text: string, language = "hy", departments: { slug: string; name: string }[] = []): ChatResult {
  const t = text.toLowerCase();
  const L = FALLBACK_TEXT[language] || FALLBACK_TEXT.hy;
  if (EMERGENCY.some((k) => t.includes(k))) {
    return { reply: L.emergency, department: departments.some((d) => d.slug === "cardiology") ? "cardiology" : null, source: "fallback" };
  }
  for (const [slug, words] of Object.entries(KEYWORDS)) {
    if (words.some((w) => t.includes(w))) {
      const dep = departments.find((d) => d.slug === slug);
      if (departments.length && !dep) continue;
      return { reply: L.found(dep?.name || slug), department: slug, source: "fallback" };
    }
  }
  return { reply: L.none, department: null, source: "fallback" };
}

export async function chat(messages: ChatMessage[], language = "hy"): Promise<ChatResult> {
  const departments = await prisma.department.findMany({ select: { slug: true, name: true, description: true } });
  const lastUser = [...messages].reverse().find((m) => m.role === "user")?.content || "";

  if (!client) return keywordFallback(lastUser, language, departments);

  // API требует, чтобы история начиналась с user
  const history = messages.slice(-10);
  while (history.length && history[0].role !== "user") history.shift();

  try {
    const res = await client.messages.create({
      model: config.ai.model,
      max_tokens: 600,
      system: buildSystemPrompt(departments, language),
      messages: history,
    });
    const text = res.content
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("")
      .trim();
    return { ...extractDepartment(text, departments.map((d) => d.slug)), source: "ai" };
  } catch (err) {
    console.error("[chatbot] AI error, using fallback:", (err as Error).message);
    return keywordFallback(lastUser, language, departments);
  }
}
