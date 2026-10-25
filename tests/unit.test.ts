// Юнит-тесты чистой логики:  npm test
import test from "node:test";
import assert from "node:assert/strict";
import { addMinutes, atLocalTime, buildDaySlots, dayRange, isDateString, toLocalDateString } from "../src/lib/date";
import { makeFormatters, makeT } from "../src/i18n/translate";
import { signToken, verifyToken } from "../src/lib/session";

test("toLocalDateString uses local time", () => {
  assert.equal(toLocalDateString(new Date(2026, 0, 5, 23, 59)), "2026-01-05");
});

test("addMinutes / atLocalTime / dayRange", () => {
  const d = atLocalTime("2026-10-24", "09:30");
  assert.equal(d.getHours(), 9);
  assert.equal(addMinutes(d, 45).getHours(), 10);
  const { start, end } = dayRange("2026-10-24");
  assert.equal(end.getTime() - start.getTime(), 24 * 3600_000);
  assert.ok(isDateString("2026-10-24") && !isDateString("24.10.2026"));
});

test("buildDaySlots 09:00-17:00 / 30 min → 16 slots, last 16:30", () => {
  const slots = buildDaySlots("2026-10-24", "09:00", "17:00", 30);
  assert.equal(slots.length, 16);
  assert.equal(slots.at(-1)!.getHours(), 16);
  assert.equal(slots.at(-1)!.getMinutes(), 30);
});

test("buildDaySlots does not overflow workEnd", () => {
  assert.equal(buildDaySlots("2026-10-24", "09:00", "10:00", 40).length, 1);
});

test("i18n: translation, fallback and variables", () => {
  const ru = makeT("ru");
  assert.equal(ru("nav.doctors"), "Врачи");
  assert.equal(ru("doctors.experience", { n: 5 }), "Стаж 5 лет");
  assert.equal(ru("no.such.key"), "no.such.key");
  assert.equal(makeFormatters("hy").money(12000), "12 000 ֏");
  assert.match(makeFormatters("hy").date(new Date(2026, 9, 24)), /24 հոկտեմբերի, 2026/);
});

test("JWT sign / verify", async () => {
  const token = await signToken({ id: 7, role: "ADMIN", email: "a@b.c" });
  assert.deepEqual(await verifyToken(token), { id: 7, role: "ADMIN", email: "a@b.c" });
  assert.equal(await verifyToken(token + "x"), null);
});
