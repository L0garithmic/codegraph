#!/usr/bin/env bash
# Re-run the README "Benchmark Results" A/B (with vs without codegraph) on the
# current build: the 7 README repos, same queries, RUNS per arm (default 4).
# Output → <root>/<repo>/run<n>/run-headless-{with,without}[.tN].jsonl (root in readme-bench.json)
# Aggregate with parse-bench-readme.mjs. Repos must be cloned + indexed under
# $CORPUS (default /tmp/codegraph-corpus) by the build under test.
#
# Each row is a THREE-TURN session: the README question, then two follow-ups
# that stay inside the same flow. Turns 2-3 are where residual context occupancy
# is actually charged — the first answer's tool output is still in the window,
# so the arms diverge on how much headroom each left behind. CG_TURNS=1 runs the
# README question alone (the original single-question A/B).
set -uo pipefail
H="$(cd "$(dirname "$0")" && pwd)"
C="${CORPUS:-/tmp/codegraph-corpus}"
RUNS="${RUNS:-4}"
RUN_FROM="${RUN_FROM:-1}"   # extend an existing pass: RUN_FROM=3 RUNS=3 adds run3 only
TURNS="${CG_TURNS:-3}"
# Repos, questions and the output root live in readme-bench.json, shared with
# parse-bench-readme.mjs. One row per repo: name|question1|question2|question3.
BENCH="$H/readme-bench.json"
OUT_ROOT="$(node -p 'require(process.argv[1]).root' "$BENCH")"
mapfile -t ROWS < <(node -e 'for (const r of require(process.argv[1]).repos) console.log([r.name, ...r.questions].join("|"))' "$BENCH")

echo "### README A/B START $(date) RUNS=$RUN_FROM..$RUNS TURNS=$TURNS"
for row in "${ROWS[@]}"; do
  repo="${row%%|*}"; rest="${row#*|}"
  # Take the first $TURNS questions and join them with "||" for run-all.sh.
  q=""; n=0
  while [ "$n" -lt "$TURNS" ] && [ -n "$rest" ]; do
    part="${rest%%|*}"
    if [ "$rest" = "$part" ]; then rest=""; else rest="${rest#*|}"; fi
    [ -n "$q" ] && q="$q||"
    q="$q$part"; n=$((n + 1))
  done
  echo "===== $repo ($n turns) ====="
  for run in $(seq "$RUN_FROM" "$RUNS"); do
    out="$OUT_ROOT/$repo/run$run"
    mkdir -p "$out"
    AGENT_EVAL_OUT="$out" bash "$H/run-all.sh" "$C/$repo" "$q" headless > "$out/console.log" 2>&1
    grep -E "^exit [0-9]" "$out/console.log" | sed 's/^/  /' || echo "  run$run: (no exit line)"
    grep -E "codegraph +[0-9,]+ tok|→ file-access" "$out/console.log" | sed 's/^/  /' || true
  done
done
echo "### README A/B DONE $(date)"
