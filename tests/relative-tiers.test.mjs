// Community results turn averages into tiers relative to each other (src/lib/relativeTiers.ts),
// so disagreement no longer squashes the whole roster into B and C.
import { test } from "node:test";
import assert from "node:assert/strict";
import { relativeTiers, MIN_SPREAD } from "@/lib/relativeTiers";

const row = (item_id, avg_score, votes = 5) => ({ item_id, avg_score, votes });
const count = (tiers) => {
  const c = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  for (const t of Object.values(tiers)) c[t]++;
  return c;
};

// Five players who agree on the order but each skew differently: averages of 2.4 to 3.8, which
// rounding put entirely in B and C.
const squashed = Array.from({ length: 20 }, (_, i) => row(`c${i}`, 3.8 - i * 0.07));

test("averages bunched around 3 still fill S and D", () => {
  const rounded = count(Object.fromEntries(squashed.map((r) => [r.item_id, Math.round(r.avg_score)])));
  assert.equal(rounded[5] + rounded[1], 0, "the old rounding left S and D empty");
  const c = count(relativeTiers(squashed));
  assert.ok(c[5] >= 2 && c[1] >= 2, JSON.stringify(c));
  assert.ok(c[3] >= c[5], "B stays at least as big as S");
});

test("strongest first, and the highest average is S, the lowest D", () => {
  const tiers = relativeTiers([...squashed].reverse());
  assert.equal(Object.keys(tiers)[0], "c0");
  assert.equal(tiers.c0, 5);
  assert.equal(tiers.c19, 1);
  const order = Object.values(tiers);
  assert.deepEqual(order, [...order].sort((a, b) => b - a));
});

test("near-identical averages stay together in B instead of being stretched", () => {
  const flat = Array.from({ length: 12 }, (_, i) => row(`c${i}`, 3 + (i % 3) * 0.02));
  assert.deepEqual(count(relativeTiers(flat)), { 5: 0, 4: 0, 3: 12, 2: 0, 1: 0 });
  assert.ok(MIN_SPREAD > 0.02);
});

test("a runaway favourite can sit alone in S", () => {
  const rows = [row("broken", 5), ...Array.from({ length: 15 }, (_, i) => row(`c${i}`, 3 + (i % 2) * 0.3))];
  const tiers = relativeTiers(rows);
  assert.equal(tiers.broken, 5);
  assert.equal(count(tiers)[5], 1);
});

test("one person's lone S doesn't outrank a pick everyone rates highly", () => {
  const rows = [row("lone", 5, 1), row("consensus", 4.6, 10), ...Array.from({ length: 10 }, (_, i) => row(`c${i}`, 2.5 + i * 0.1, 10))];
  const order = Object.keys(relativeTiers(rows));
  assert.equal(order[0], "consensus");
});

test("empty and single-character bands don't crash", () => {
  assert.deepEqual(relativeTiers([]), {});
  assert.deepEqual(relativeTiers([row("only", 4.2)]), { only: 3 });
});
