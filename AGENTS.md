# AGENTS.md

Personal blog and playground for random experiments and research ([randomrohit.com](https://randomrohit.com)). Interactive d3 visualizations are one kind of post, not the only one. Prefer clear, idiomatic code you can learn from over clever abstractions.

## Commands

- `npm start`: dev server
- `npm run build`: production build (run this as the main check)
- `npm run lint`: ESLint (angular-eslint, `app` selector prefix)
- `npm test`: Karma + Jasmine (only a placeholder spec today)

The site deploys to Netlify as an SPA (`netlify.toml` redirects everything to `index.html`).

## Stack

- Angular 20: standalone components, zoneless (`provideZonelessChangeDetection`), signals everywhere
- NgRx SignalStore (`@ngrx/signals`) for page state, provided per page component
- d3 v7 for charts, Angular Material for UI chrome
- `marked` for rendering markdown posts

## Layout

- `src/app/<page>/`: one folder per post. Data-heavy pages have their own store and data service
- `src/app/shared/components/`: reusable generic charts (`donut`, `horizontal-bar`, `horizontal-stacked`, `multi-line`) and `tooltip`
- `src/app/shared/directives/resize.directive.ts`: exposes the host size as a signal. Charts use it via `hostDirectives: [ResizeDirective]`
- `public/data/`: static CSV and GeoJSON data. `public/posts/`: markdown posts

## Conventions

- Use `inject()` instead of constructor injection, and mark fields `private readonly` / `protected readonly`.
- Use signal `input()` / `output()` / `viewChild()`, and derive state with `computed()`.
- Charts are generic over `T` and take accessor inputs (`labelFn`, `valueFn`, ...). d3 owns the SVG contents, and drawing runs in `afterRenderEffect` (older charts use `effect`).
- To add a post: create a route in `app.routes.ts` and add an entry to the `posts` list in `HomeComponent`.
- Use Conventional Commits with a scope, e.g. `perf(aid-data): ...`, `feat(app): ...`.
