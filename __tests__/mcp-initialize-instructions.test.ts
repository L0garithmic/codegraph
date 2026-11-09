import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { initializeInstructionsFor } from '../src/mcp/session';
import { SERVER_INSTRUCTIONS, SERVER_INSTRUCTIONS_NO_ROOT_INDEX } from '../src/mcp/server-instructions';

describe('initialize instructions for the resolved root (session and proxy share one owner)', () => {
  it('sends the per-project variant when no index root is found', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cg-init-noindex-'));
    try {
      const text = initializeInstructionsFor(dir);
      expect(text).toContain(SERVER_INSTRUCTIONS_NO_ROOT_INDEX);
      expect(text).not.toContain(SERVER_INSTRUCTIONS);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
