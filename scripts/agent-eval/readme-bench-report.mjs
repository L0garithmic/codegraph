// Shared pieces of the README A/B: the repo list and output root (read from
// readme-bench.json, the one owner bench-readme.sh also reads) and the pure
// helpers parse-bench-readme.mjs prints with. Kept out of the report script so
// they can be tested without running it.
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';

export const README_BENCH = JSON.parse(
  readFileSync(fileURLToPath(new URL('./readme-bench.json', import.meta.url)), 'utf8'),
);

/** Saved fraction going with→without, as a whole percentage. Negative = the with-arm is larger. */
export const pct = (w, wo) => (wo > 0 ? Math.round((1 - w / wo) * 100) : 0);

/** Mean of per-repo percentages, or null when no repo had both arms complete (nothing to average). */
export const avg = (a) => (a.length ? Math.round(a.reduce((s, x) => s + x, 0) / a.length) : null);

/** Direction word that follows the SIGN, so a negative saving never reads as a win. */
export const dir = (v) => (v < 0 ? 'HIGHER' : 'lower');

/** "82% HIGHER with codegraph" for a signed average; "n/a" when there was nothing to average. */
export const avgText = (v, suffix = '') => (v === null ? 'n/a' : `${Math.abs(v)}% ${dir(v)}${suffix}`);

/** Plain saved figure for the throughput table: "40%", or "n/a" when nothing to average. */
export const savedText = (v) => (v === null ? 'n/a' : `${v}%`);

/** Per-row residual cell: tokens W→WO, then the signed change spelled out in words. */
export const residualCell = (wR, woR, fmtTok) => {
  const p = pct(wR, woR);
  return `${fmtTok(wR)}→${fmtTok(woR)} (${Math.abs(p)}% ${dir(p)})`;
};

/** Why a run did not parse: the transcript's result events say it. */
export function parseFailureReason(results) {
  if (!results || results.length === 0) return 'no result event in the transcript';
  const bad = results.filter((r) => r.subtype !== 'success').map((r) => r.subtype || 'unknown');
  return bad.length ? `result subtype ${bad.join(', ')}` : 'no successful result';
}
