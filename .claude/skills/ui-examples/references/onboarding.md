# Onboarding a new product to the examples renderer

This is the long-form version of SKILL.md §8. Don't follow it casually — onboarding has real cost, and most products in this repo don't currently need an examples renderer.

## Decide first

Before doing any work, answer:

1. **Why does this product need an examples renderer?** The renderer exists for agent-driven UI validation against a design (Figma node, screenshot, spec). If the use case is "I want a place to browse my components", you might be looking for a documentation Storybook (e.g. `apps/@jii/storybook/`) instead.
2. **Who maintains this product's UI?** Examples are colocated with components. Whoever owns the components owns the example files. Make sure that team is on board with the maintenance burden.
3. **Is the product a web React app?** If it's React Native / Expo (e.g. `apps/@meetings/app/`), it can't be onboarded — web Storybook doesn't render RN components. This is fundamental, not a missing feature.
4. **Is this worth doing alone, or should we revive the "config at root" refactor?** If two or more products want the renderer, unifying under a workspace-level `.examples/` config beats copying per-app config. See "Option B" below.

## Option A: Per-app config (copy the staff setup)

The cheapest path when only this new product wants the renderer.

### Files to create in the new app (modeled on `apps/staff/`)

```
apps/<new-app>/
├── .examples/
│   ├── main.ts        # Storybook config — copy from apps/staff/.examples/main.ts
│   ├── preview.ts     # global decorators, CSS imports, router context
│   └── manager.ts     # Storybook UI config (panel position etc.)
├── tsconfig.examples.json   # extends ./tsconfig.json; includes .examples/*.ts + *.examples.tsx
└── project.json             # add `examples` and `build-examples` targets
```

### What to adapt in `main.ts`

- The stories glob anchor changes: `../src/**/*.examples.@(js|jsx|ts|tsx)` and `../src/**/examples/*.@(js|jsx|ts|tsx)` (paths are relative to the new `.examples/` dir).
- Keep the custom CSF indexer block — it's app-agnostic and produces the same id-keep-`.examples`-but-strip-title behavior.
- `react-docgen` is enabled by default and works with TypeScript out of the box — provided the new app's `.babelrc` uses `@nx/react/babel` or another preset that bundles `@babel/preset-typescript` (every Vite-using lib in this monorepo already does, and staff was modernized to match in PR #14086). Only set `typescript: { reactDocgen: false }` if you hit a babel-config conflict the new app's `.babelrc` introduces.
- The `viteFinal` plugins (`svgr`, `babel-macros`) — keep if the new app uses them; remove otherwise.

### What to adapt in `preview.ts`

This is where most per-app friction lives:

- **Global styles**: import the app's global CSS / SCSS / Tailwind entrypoints here. If the app uses Tailwind, you also need the Tailwind PostCSS plugin wired into the Vite config in `main.ts`.
- **Router context**: most React apps need a router decorator around examples. `MemoryRouter` from `react-router-dom` is the staff default; Next.js apps need something different (see "Next.js caveats" below).
- **Theme providers**: if the app uses a `ThemeProvider` (styled-components, MUI, Chakra, etc.), wrap examples globally here.
- **State providers**: **avoid** wrapping in app-wide store providers (MobX RootStore, Redux store) at the global decorator level — examples should be store-free by default. Individual examples that need a store can wrap themselves.

### Targets in `project.json`

Copy verbatim from `apps/staff/project.json`:

```json
"examples": {
  "executor": "nx:run-commands",
  "options": {
    "command": "EXAMPLES_PATHS=\"{args}\" storybook dev --config-dir .examples",
    "cwd": "{projectRoot}"
  }
},
"build-examples": {
  "executor": "nx:run-commands",
  "outputs": ["{projectRoot}/examples-static"],
  "options": {
    "command": "EXAMPLES_PATHS=\"{args}\" storybook build --config-dir .examples --output-dir examples-static",
    "cwd": "{projectRoot}"
  }
}
```

Add `examples-static/` to the repo's `.gitignore` if it isn't already covered (it should be — the staff PR added it).

## Option B: Workspace-level refactor (parked plan)

If multiple products want the renderer, unifying under a single workspace-level config is the long-term move:

- Move the config from `apps/staff/.examples/` to `/.examples/` at the repo root.
- The `stories` glob expands to `apps/**/src/**/*.examples.@(js|jsx|ts|tsx)` plus the `examples/` dir form.
- The command moves to root `package.json` scripts (`yarn examples [paths…]`) instead of per-app nx targets.
- Each app contributes its global styles to the root `preview.ts` (centralized imports) or via an opt-in extension pattern.

The full plan for this refactor is parked under the project plan file alongside the `visual-alignment` skill plan. Reviving it is appropriate when the second product onboards — earlier than that, the per-app option is simpler.

## Per-app caveats

### Tailwind

Apps with their own `tailwind.config.ts` (e.g. `apps/jii/`, `apps/public-pathways/`, `apps/@reentry/frontend/`) need Tailwind plumbing in the Vite config:

- Install `@tailwindcss/postcss` (or `tailwindcss` + `autoprefixer`) at the workspace root if not present.
- Configure PostCSS in the `.examples/` Vite config (`viteFinal` hook) to apply the new app's Tailwind config — its `content` globs, theme tokens, plugins.
- **If multiple Tailwind-using apps end up in a single workspace-level config**, theme tokens may collide. Consider scoping with a wrapper class on each app's examples, or merging configs deliberately if the token vocabularies overlap.

### Next.js

`apps/@reentry/frontend/` is Next.js. Pure presentational components render fine in a Vite Storybook, but Next-specific imports break:

- `next/image` → falls back to a regular `<img>` if you stub it (e.g. via a module-alias in Vite), or use a Storybook addon for Next.
- `next/link` → similar; stub with a `react-router-dom` `<Link>` for example purposes.
- `next/router` → mock via decorator (e.g. provide a fake `RouterContext`).
- RSC (React Server Components) → don't work in client-side Storybook. Constrain examples to client components only.

The honest answer for Next.js apps is "presentational components only" unless you invest in the Next-specific adapters. For an app that's >50% Next-specific behavior, the examples renderer may not be the right fit.

### React Native / Expo

**Hard exclude.** No path to render React Native components in a web Storybook. The component model, styling system, and runtime are all incompatible. If your team needs example-style rendering for `@meetings`, look at Storybook for React Native (a separate package) instead — but it's not what this skill covers.

## Updating this skill after onboarding

Once a new product is onboarded:

1. **Add it to `SKILL.md` §2** under the "Onboarded products" list with its config dir, target paths, and stories root.
2. **Update the frontmatter `description`** — the onboarded list in the description is what an agent uses to decide whether to invoke the skill. Keep it in sync with §2.
3. **Bump worked examples** in §3 if the new app's URL/command shape differs meaningfully (e.g. different default scope, different glob anchor).
4. **Commit the skill change** in the same PR as the onboarding work — the skill and the renderer config travel together. Reviewers should see both.

If the §2 list and the frontmatter description disagree, **the description wins** (the framework reads it for skill-triggering decisions). Don't let them drift; treat the description as the single source of truth and §2 as a human-readable expansion of it.

## Verifying onboarding worked

After all the config is in place:

1. `nx show projects --with-target examples` should now list both `staff` and your new app.
2. `nx examples <new-app>` should boot without errors. With no examples yet, the index is live but empty: `curl -s http://<port>/index.json | jq '.entries'` returns `{}`.
3. Add one `Foo.examples.tsx` to a known location. HMR should pick it up; the new id should appear in `index.json` immediately.
4. Confirm a non-onboarded project still fails the gate: `nx examples <third-app>` returns `NX Cannot find configuration for task <third-app>:examples`.

When all four pass, update SKILL.md per the previous section and ship.
