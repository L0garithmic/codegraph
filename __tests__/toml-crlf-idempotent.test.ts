import { describe, it, expect } from 'vitest';
import { upsertTomlTable, buildTomlTable } from '../src/installer/targets/toml';

describe('TOML upsert on a CRLF config', () => {
  it('reports an identical CRLF-saved table as unchanged on re-run', () => {
    const header = 'mcp_servers.codegraph';
    const block = buildTomlTable(header, { command: 'codegraph', args: ['serve'] });
    const crlf = 'model = "gpt"\r\n\r\n[mcp_servers.codegraph]\r\ncommand = "codegraph"\r\nargs = ["serve"]\r\n';

    const { content, action } = upsertTomlTable(crlf, header, block);

    expect(action).toBe('unchanged');
    expect(content).toBe(crlf);
  });
});
