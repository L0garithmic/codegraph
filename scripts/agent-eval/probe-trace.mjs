#!/usr/bin/env node
// RETIRED: codegraph_trace was removed from the server (its ToolHandler no longer
// dispatches it), so this probe can only print an error. Use probe-explore.mjs instead.
console.error('probe-trace: codegraph_trace was removed from the server; use scripts/agent-eval/probe-explore.mjs');
process.exit(1);
