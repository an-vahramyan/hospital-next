import { cookies, headers } from "next/headers";
import { makeFormatters, makeT } from "./translate";
import { DEFAULT_LANG, LANG_COOKIE, isLang, type Lang } from "./types";

export async function getLang(): Promise<Lang> {
  const c = (await cookies()).get(LANG_COOKIE)?.value;
  if (isLang(c)) return c;
  // first visit — use the browser language
  const accept = (await headers()).get("accept-language") || "";
  const fromHeader = accept.split(",").map((s) => s.trim().slice(0, 2).toLowerCase()).find(isLang);
  return fromHeader ?? DEFAULT_LANG;
}

export async function getI18n() {
  const lang = await getLang();
  return { lang, t: makeT(lang), f: makeFormatters(lang) };
}
