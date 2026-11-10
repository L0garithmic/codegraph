import { describe, it, expect } from 'vitest';
import { flaskResolver } from '../src/resolution/frameworks/python';

describe('flaskResolver: a decorator declaring several methods', () => {
  it('emits a route for every declared method, not only the first', () => {
    const src = [
      'from flask import Flask',
      'app = Flask(__name__)',
      "@app.route('/items', methods=['GET', 'POST'])",
      'def items():',
      '    return "ok"',
      '',
    ].join('\n');
    const { nodes, references } = flaskResolver.extract!('app.py', src);
    const names = nodes.filter((n) => n.kind === 'route').map((n) => n.name);
    expect(names).toContain('GET /items');
    expect(names).toContain('POST /items');
    expect(references.filter((r) => r.referenceName === 'items').length).toBeGreaterThanOrEqual(2);
  });
});
