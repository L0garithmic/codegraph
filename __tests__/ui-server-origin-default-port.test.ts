/**
 * The origin check promises that a present Origin must be loopback on OUR port.
 * WHATWG URL drops an explicit default port (`:80` on http, `:443` on https) to
 * an empty string, so an empty port must mean that scheme's default, not any port.
 */
import { describe, it, expect } from 'vitest';
import { isAllowedOrigin } from '../src/ui-server/security';

describe('isAllowedOrigin default ports', () => {
  it('refuses loopback origins whose default port is not the bound port', () => {
    expect(isAllowedOrigin('http://localhost', 4747)).toBe(false);
    expect(isAllowedOrigin('http://localhost:80', 4747)).toBe(false);
    expect(isAllowedOrigin('https://localhost', 4747)).toBe(false);
    expect(isAllowedOrigin('https://localhost:443', 4747)).toBe(false);
  });

  it('still accepts the bound port, written out or implied by the scheme', () => {
    expect(isAllowedOrigin('http://localhost:4747', 4747)).toBe(true);
    expect(isAllowedOrigin('http://127.0.0.1:4747', 4747)).toBe(true);
    expect(isAllowedOrigin('http://localhost', 80)).toBe(true);
    expect(isAllowedOrigin('https://localhost', 443)).toBe(true);
  });
});
