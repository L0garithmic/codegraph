import { describe, it, expect } from 'vitest';
import { rustResolver } from '../src/resolution/frameworks/rust';

describe('Axum route matching ignores parentheses inside string literals', () => {
  it('keeps a route whose path contains a closing parenthesis', () => {
    const source =
      'use axum::{routing::get, Router};\n' +
      'fn app() -> Router {\n' +
      '  Router::new()\n' +
      '    .route("/)", get(list))\n' +
      '    .route("/ok", get(ok))\n' +
      '}\n';
    const names = rustResolver.extract!('src/main.rs', source)
      .nodes.filter((n) => n.kind === 'route')
      .map((n) => n.name);
    expect(names).toContain('GET /)');
    expect(names).toContain('GET /ok');
  });
});
