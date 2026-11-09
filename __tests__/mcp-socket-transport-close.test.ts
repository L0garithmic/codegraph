import { describe, it, expect } from 'vitest';
import * as net from 'net';
import { SocketTransport } from '../src/mcp/transport';

describe('SocketTransport close handlers', () => {
  it('runs registered close handlers when the transport is stopped locally', async () => {
    const server = net.createServer((s) => s.on('error', () => {}));
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
    const port = (server.address() as net.AddressInfo).port;
    const client = net.connect(port, '127.0.0.1');
    await new Promise<void>((resolve) => client.once('connect', () => resolve()));

    const transport = new SocketTransport(client);
    transport.start(() => {});
    let closed = 0;
    transport.onClose(() => { closed++; });

    const socketClosed = new Promise<void>((resolve) => client.once('close', () => resolve()));
    transport.stop();
    await socketClosed;
    // The close event arrives after stop(); the handler must still have run once.
    expect(closed).toBe(1);

    server.close();
  });
});
