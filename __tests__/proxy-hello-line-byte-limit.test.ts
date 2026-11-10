/**
 * The daemon hello line is size-bounded before it is parsed. The bound was only
 * checked while no newline had arrived, so a complete oversized line sent in one
 * chunk was parsed anyway.
 */
import { describe, it, expect } from 'vitest';
import { EventEmitter } from 'node:events';
import type * as net from 'node:net';
import { readHelloLine } from '../src/mcp/proxy';
import { MAX_HELLO_LINE_BYTES } from '../src/mcp/daemon';

function fakeSocket(): net.Socket & EventEmitter {
  const socket = new EventEmitter() as net.Socket & EventEmitter;
  (socket as unknown as { unshift: () => void }).unshift = () => {};
  return socket;
}

describe('readHelloLine size bound', () => {
  it('rejects an oversized hello that arrives together with its newline', async () => {
    const socket = fakeSocket();
    const pending = readHelloLine(socket);
    const padding = 'x'.repeat(MAX_HELLO_LINE_BYTES);
    socket.emit('data', `${JSON.stringify({ codegraph: '1', pid: 1, padding })}\n`);
    await expect(pending).rejects.toThrow('daemon hello line exceeded size limit');
  });

  it('counts the bound in bytes, not UTF-16 code units', async () => {
    const socket = fakeSocket();
    const pending = readHelloLine(socket);
    // 3 bytes per character: a string half the byte limit in length is over it in bytes.
    const padding = '€'.repeat(Math.ceil(MAX_HELLO_LINE_BYTES / 2));
    socket.emit('data', `${JSON.stringify({ codegraph: '1', pid: 1, padding })}\n`);
    await expect(pending).rejects.toThrow('daemon hello line exceeded size limit');
  });
});
