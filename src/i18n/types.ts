import type hy from "./dictionaries/hy";

type DeepString<T> = { [K in keyof T]: T[K] extends string ? string : DeepString<T[K]> };
export type Dict = DeepString<typeof hy>;

export const LANGS = ["hy", "en", "ru"] as const;
export type Lang = (typeof LANGS)[number];
export const DEFAULT_LANG: Lang = "hy";
export const LANG_COOKIE = "lang";
export const isLang = (v: unknown): v is Lang => typeof v === "string" && (LANGS as readonly string[]).includes(v);

export const LOCALES: Record<Lang, string> = { hy: "hy-AM", en: "en-GB", ru: "ru-RU" };
