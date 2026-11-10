import { describe, it, expect } from 'vitest';
import { railsResolver } from '../src/resolution/frameworks/ruby';

function routeNames(source: string): string[] {
  return railsResolver
    .extract!('config/routes.rb', source)
    .nodes.filter((n) => n.kind === 'route')
    .map((n) => n.name);
}

describe('Rails resources only:/except: accept a single symbol', () => {
  it('honours only: :show and except: :destroy without the bracket array', () => {
    expect(routeNames('resources :articles, only: :show\n')).toEqual(['GET /articles/:id']);
    expect(routeNames('resources :articles, except: :destroy\n')).toEqual([
      'GET /articles',
      'POST /articles',
      'GET /articles/new',
      'GET /articles/:id',
      'GET /articles/:id/edit',
      'PATCH /articles/:id',
    ]);
  });
});
