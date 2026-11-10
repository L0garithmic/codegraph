import { describe, it, expect } from 'vitest';
import { railsResolver } from '../src/resolution/frameworks/ruby';

function routeNames(source: string): string[] {
  return railsResolver
    .extract!('config/routes.rb', source)
    .nodes.filter((n) => n.kind === 'route')
    .map((n) => n.name);
}

describe('Rails singular resource member routes have no :id segment', () => {
  it('emits the six singular resource paths for resource :user', () => {
    expect(routeNames('Rails.application.routes.draw do\n  resource :user\nend\n')).toEqual([
      'POST /user',
      'GET /user/new',
      'GET /user',
      'GET /user/edit',
      'PATCH /user',
      'DELETE /user',
    ]);
  });
});
