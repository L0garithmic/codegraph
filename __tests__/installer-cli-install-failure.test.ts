/**
 * The CLI install failure message names permission only for a permission error,
 * and offers the sudo hint only on POSIX.
 */
import { describe, it, expect } from 'vitest';
import { describeCliInstallFailure } from '../src/installer/index';

describe('describeCliInstallFailure', () => {
  it('names permission and offers sudo on POSIX for an EACCES failure', () => {
    const err = Object.assign(new Error('Command failed'), { stderr: Buffer.from('npm ERR! code EACCES') });
    expect(describeCliInstallFailure(err, 'linux')).toEqual({
      status: 'Could not install (permission denied)',
      hint: 'Try: sudo npm install -g @colbymchenry/codegraph',
    });
  });

  it('does not claim permission denied for a timeout or offline registry', () => {
    const err = Object.assign(new Error('spawnSync npm ETIMEDOUT'), { stderr: Buffer.from('') });
    const out = describeCliInstallFailure(err, 'linux');
    expect(out.status).toBe('Could not install codegraph CLI');
    expect(out.hint).toBeUndefined();
  });

  it('does not suggest sudo on Windows even for a permission error', () => {
    const err = Object.assign(new Error('Command failed'), { stderr: Buffer.from('EPERM: operation not permitted') });
    const out = describeCliInstallFailure(err, 'win32');
    expect(out.status).toBe('Could not install (permission denied)');
    expect(out.hint).toBeUndefined();
  });
});
