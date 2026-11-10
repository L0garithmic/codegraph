/**
 * Markdown and TOML uninstall join the text around a removed block the same
 * way: one blank line between the two sides, none when one side is empty.
 * Both removers share one helper so the spacing cannot drift between them.
 */
import { describe, it, expect, afterEach } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { joinAroundRemovedSection, removeMarkedSection } from '../src/installer/targets/shared';
import { removeTomlTable } from '../src/installer/targets/toml';

const roots: string[] = [];
afterEach(() => {
  for (const root of roots.splice(0)) fs.rmSync(root, { recursive: true, force: true });
});

describe('joinAroundRemovedSection', () => {
  it('puts one blank line between two non-empty sides and no separator otherwise', () => {
    expect(joinAroundRemovedSection('a', 'b')).toBe('a\n\nb');
    expect(joinAroundRemovedSection('', 'b')).toBe('b');
    expect(joinAroundRemovedSection('a', '')).toBe('a');
  });

  it('gives markdown and TOML removal the same spacing around a removed block', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'codegraph-join-'));
    roots.push(root);
    const md = path.join(root, 'CLAUDE.md');
    fs.writeFileSync(md, 'intro\n\n<!-- S -->\nx\n<!-- E -->\n\noutro\n');
    removeMarkedSection(md, '<!-- S -->', '<!-- E -->');
    const toml = removeTomlTable(
      'intro\n\n[mcp_servers.codegraph]\ncommand = "x"\n\n[other]\nk = 1\n',
      'mcp_servers.codegraph',
    );
    expect(fs.readFileSync(md, 'utf-8')).toBe('intro\n\noutro\n');
    expect(toml.content).toBe('intro\n\n[other]\nk = 1\n');
  });
});
