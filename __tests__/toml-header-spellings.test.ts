import { describe, it, expect } from 'vitest';
import { upsertTomlTable, removeTomlTable, buildTomlTable } from '../src/installer/targets/toml';

const HEADER = 'mcp_servers.codegraph';

describe('TOML table lookup accepts every header spelling TOML allows', () => {
  it('replaces a spaced or commented header in place instead of appending a duplicate table', () => {
    const existing = 'model = "gpt"\n\n[ mcp_servers.codegraph ] # hand edited\ncommand = "old"\n';
    const block = buildTomlTable(HEADER, { command: 'codegraph', args: ['serve'] });

    const { content, action } = upsertTomlTable(existing, HEADER, block);

    expect(action).toBe('replaced');
    expect(content.match(/mcp_servers\.codegraph/g)).toHaveLength(1);
    expect(content).toContain('command = "codegraph"');
    expect(content).not.toContain('command = "old"');
  });

  it('removes a spaced header table so uninstall does not leave it behind', () => {
    const existing = 'model = "gpt"\n\n[ mcp_servers.codegraph ]\ncommand = "codegraph"\n';

    const { content, action } = removeTomlTable(existing, HEADER);

    expect(action).toBe('removed');
    expect(content).not.toContain('mcp_servers.codegraph');
    expect(content).toContain('model = "gpt"');
  });
});
