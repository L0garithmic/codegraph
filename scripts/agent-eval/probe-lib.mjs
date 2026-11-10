// Pure helpers shared by the agent-eval probes. No I/O and no dist/ import, so
// the regression tests can load them without a build.

/**
 * The `<n>\t<code>` line numbers rendered under one file's section. explore
 * opens each file with a header line `**\`<path>\`**…`; a line number counts for
 * `filePath` only when it sits in that file's section, never for another file.
 */
export function renderedLinesIn(response, filePath) {
  const out = new Set();
  let current = null;
  for (const line of response.split('\n')) {
    const header = /^\*\*`([^`]+)`\*\*/.exec(line);
    if (header) {
      current = header[1];
      continue;
    }
    const numbered = /^(\d+)\t/.exec(line);
    if (numbered && current === filePath) out.add(Number(numbered[1]));
  }
  return out;
}

/**
 * One probe-sweep measurement row. A tool error (an unknown tool, a refused
 * request) is an error row, never a size measurement.
 */
export function sweepRow(subject, res, msElapsed) {
  const text = res?.content?.[0]?.text ?? '';
  if (res?.isError) {
    return { id: subject.id, error: `tool error: ${text.slice(0, 80)}` };
  }
  return {
    id: subject.id,
    ms: msElapsed,
    chars: text.length,
    lines: text.split('\n').length,
  };
}

/** The probe exit status: 1 when any file in any repo was flagged as starved. */
export function exitCodeFor(results) {
  return results.some((r) => r.flags.length > 0) ? 1 : 0;
}
