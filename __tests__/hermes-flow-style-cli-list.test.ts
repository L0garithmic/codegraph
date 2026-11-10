import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { getTarget } from '../src/installer/targets/registry';

describe('hermes config: an inline (flow-style) cli toolset list', () => {
  let tmpHome: string;
  let savedHome: string | undefined;
  let savedHermesHome: string | undefined;

  beforeEach(() => {
    tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), 'hermes-flow-'));
    savedHome = process.env.HOME;
    savedHermesHome = process.env.HERMES_HOME;
    process.env.HOME = tmpHome;
    delete process.env.HERMES_HOME;
  });

  afterEach(() => {
    if (savedHome === undefined) delete process.env.HOME;
    else process.env.HOME = savedHome;
    if (savedHermesHome === undefined) delete process.env.HERMES_HOME;
    else process.env.HERMES_HOME = savedHermesHome;
    fs.rmSync(tmpHome, { recursive: true, force: true });
  });

  it('install adds mcp-codegraph to the inline list without a duplicate cli key, and uninstall removes it', () => {
    const hermes = getTarget('hermes')!;
    const config = path.join(tmpHome, '.hermes', 'config.yaml');
    fs.mkdirSync(path.dirname(config), { recursive: true });
    fs.writeFileSync(config, [
      'platform_toolsets:',
      '  cli: [hermes-cli, browser]',
      '',
    ].join('\n'));

    hermes.install('global', { autoAllow: true });
    const installed = fs.readFileSync(config, 'utf-8');
    expect(installed.match(/^  cli:/gm)).toHaveLength(1);
    expect(installed).toContain('hermes-cli');
    expect(installed).toContain('browser');
    expect(installed).toContain('mcp-codegraph');

    hermes.uninstall('global');
    const removed = fs.readFileSync(config, 'utf-8');
    expect(removed).not.toContain('mcp-codegraph');
    expect(removed).toContain('hermes-cli');
    expect(removed).toContain('browser');
  });
});
