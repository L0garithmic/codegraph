import { describe, it, expect } from 'vitest';
import { buildTomlTable } from '../src/installer/targets/toml';

describe('TOML serializer escapes control characters in values', () => {
  it('writes a newline or tab in a value as a TOML escape, never a raw control character', () => {
    const block = buildTomlTable('mcp_servers.codegraph', { command: 'a\nb\tc' });

    expect(block).toContain('command = "a\\nb\\tc"');
    expect(block).not.toContain('a\nb');
  });
});
