import { describe, it, expect } from 'vitest';
import { rustResolver } from '../src/resolution/frameworks/rust';

describe('Actix web::resource chain stops at the resource expression', () => {
  it('does not read a sibling app-level .route as the resource method', () => {
    const source =
      'use actix_web::{web, App};\n' +
      'fn app() -> App<()> {\n' +
      '  App::new()\n' +
      '    .service(web::resource("/a").to(a))\n' +
      '    .route("/b", web::get().to(b))\n' +
      '}\n';
    const names = rustResolver.extract!('src/main.rs', source)
      .nodes.filter((n) => n.kind === 'route')
      .map((n) => n.name);
    expect(names).toContain('ANY /a');
    expect(names).not.toContain('GET /a');
  });
});
