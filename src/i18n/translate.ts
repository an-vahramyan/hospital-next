import hy from "./dictionaries/hy";
import en from "./dictionaries/en";
import ru from "./dictionaries/ru";
import { LOCALES, type Dict, type Lang } from "./types";

export const dictionaries: Record<Lang, Dict> = { hy, en, ru };

export type TFunction = (key: string, vars?: Record<string, string | number>) => string;

/** t("doctors.experience", { n: 5 }) — ищет ключ в языке, потом в hy, иначе возвращает ключ */
export function makeT(lang: Lang): TFunction {
  const lookup = (dict: unknown, key: string) =>
    key.split(".").reduce<unknown>((o, k) => (o && typeof o === "object" ? (o as Record<string, unknown>)[k] : undefined), dict);
  return (key, vars) => {
    let s = lookup(dictionaries[lang], key) ?? lookup(dictionaries.hy, key);
    if (typeof s !== "string") return key;
    if (vars) for (const [k, v] of Object.entries(vars)) s = (s as string).replaceAll(`{${k}}`, String(v));
    return s as string;
  };
}

// Армянские названия — не во всех браузерах/Node есть ICU-данные для hy-AM
const HY_MONTHS = ["հունվարի", "փետրվարի", "մարտի", "ապրիլի", "մայիսի", "հունիսի", "հուլիսի", "օգոստոսի", "սեպտեմբերի", "հոկտեմբերի", "նոյեմբերի", "դեկտեմբերի"];
const HY_WEEKDAYS = ["կիրակի", "երկուշաբթի", "երեքշաբթի", "չորեքշաբթի", "հինգշաբթի", "ուրբաթ", "շաբաթ"];
const pad2 = (n: number) => String(n).padStart(2, "0");

export function makeFormatters(lang: Lang) {
  const locale = LOCALES[lang];
  const hy = lang === "hy";
  const time = (d: string | Date) => {
    const x = new Date(d);
    return `${pad2(x.getHours())}:${pad2(x.getMinutes())}`;
  };
  return {
    date: (d: string | Date) => {
      const x = new Date(d);
      return hy ? `${x.getDate()} ${HY_MONTHS[x.getMonth()]}, ${x.getFullYear()} թ.` : x.toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" });
    },
    dateShort: (d: string | Date) => {
      const x = new Date(d);
      return `${pad2(x.getDate())}.${pad2(x.getMonth() + 1)}.${x.getFullYear()}`;
    },
    time,
    dateTime: (d: string | Date) => {
      const x = new Date(d);
      return hy ? `${x.getDate()} ${HY_MONTHS[x.getMonth()]}, ${time(x)}` : x.toLocaleString(locale, { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", hour12: false });
    },
    weekday: (d: string | Date) => {
      const x = new Date(d);
      return hy ? `${HY_WEEKDAYS[x.getDay()]}, ${x.getDate()} ${HY_MONTHS[x.getMonth()]}` : x.toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" });
    },
    money: (n: number) => `${String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " ")} ֏`,
  };
}

export type Formatters = ReturnType<typeof makeFormatters>;

/** Название отделения: перевод по slug, иначе название из БД */
export const deptName = (t: TFunction, d: { slug: string; name: string }) => {
  const v = t(`dept.${d.slug}`);
  return v === `dept.${d.slug}` ? d.name : v;
};
