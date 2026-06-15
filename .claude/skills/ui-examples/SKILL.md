---
name: ui-examples
description: Render, read, and add component examples in the examples renderer. Files take two forms — colocated `*.examples.tsx` (e.g. `Checkbox.examples.tsx` next to `Checkbox.tsx`) or grouped `examples/*.tsx` (e.g. `Checkbox/examples/Default.tsx`). Covers exact iframe URLs per example, story-id derivation, multi-worktree-aware server discovery, file conventions, and the onboarding gate. Onboarded products (the authoritative validation list — only invoke this skill when the work touches one of these): `apps/staff/`. Verify at runtime with `nx show projects --with-target examples`. Use to render, screenshot, inspect, or extend an example in an onboarded product. For anything outside the onboarded list, this skill does not apply.
allowed-tools: Bash(curl:*), Bash(jq:*), Bash(lsof:*), Bash(nx:*)
---

# UI Examples

A guide to the examples renderer — the isolated component-rendering harness for agent-driven UI validation. **Read [§2 Onboarded products](#2-onboarded-products) before doing anything else**; the rest of this skill only applies inside that scope.

## 1. What this skill covers

The examples renderer renders **component examples** as isolated pages — one named export per state, no Storybook ceremony (`Meta` / `args` / controls). Each example becomes a deterministic iframe URL an agent can drive: render, screenshot, inspect computed styles.

**The iframe URL is the API.** Every example is reached via a deterministic URL — agents construct it from `(file path, export name)` and load it directly (`curl`, playwright, `fetch`). The Storybook sidebar UI exists for humans browsing the renderer; **agents do not navigate it**. Combined with CLI scoping (`nx examples staff <path>`), the workflow is: boot a scoped server once, then build URLs for the specific examples you need — no clicks, no browsing. The URL recipe in §3 is the entire access pattern.

Examples come in two file forms:

- **Suffix form (colocated, default for a small set of states)**: `Checkbox.examples.tsx` sitting next to `Checkbox.tsx`. Each named export is one state.
- **Dir form (grouped, for components with many states)**: `Checkbox/examples/Default.tsx`, `Checkbox/examples/Disabled.tsx`, etc. Each file's named exports become sibling entries in `index.json`.

Both forms render the same way. Pick whichever fits the component.

**Examples ≠ Storybook.** The repo also contains `apps/@jii/storybook/` — a traditional documentation Storybook with CSF3 stories, `Meta`, and `args`. That's a different tool for human readers; out of scope here. If the user asks about jii stories, `meta.title`, or Storybook controls, this is the wrong skill — point them to the docs Storybook or ask for clarification.

## 2. Onboarded products

The skill only applies inside the **onboarded products** below. Check the user's target path against this list before proceeding.

- **`apps/staff/`** — examples renderer config at `apps/staff/.examples/`; targets `examples` and `build-examples` in `apps/staff/project.json`; stories glob anchored to `apps/staff/src/`.

Live verification (the authoritative source if this list ever drifts):

```bash
nx show projects --with-target examples
```

Today this returns only `staff`. The nx-target scoping enforces the gate naturally — running the target against an un-onboarded project fails immediately:

```bash
$ nx examples jii
NX  Cannot find configuration for task jii:examples
```

This is not an error to fix; it's the gate doing its job. If the user's target lives outside the onboarded list, do not proceed — surface [§8 Adopting a new product](#8-adopting-a-new-product).

## 3. URL recipe

Every example is reached via a Storybook iframe URL. **Canonical form** (matches what Storybook UI itself emits):

```
http://<server>/iframe.html?args=&globals=&id=<story-id>&viewMode=story
```

`args=` and `globals=` are always empty for this renderer — we don't use Storybook args/controls (`export default {};` is a stub). They're included to mirror the exact format Storybook generates, so the URLs the agent constructs are indistinguishable from URLs copied out of a browser session.

- `<server>` = `localhost:<port>` — `nx examples staff` picks a random port per boot. Discover via [§4](#4-server-discovery).
- `<story-id>` is derivable from `(file path under stories root, export name)`:
  1. Take the file path **relative to the stories glob root** (default scope: `apps/staff/src/`; the narrowed subdir if the user ran `nx examples staff <subdir>`).
  2. Drop the file extension.
  3. **The custom indexer strips a trailing `.examples` segment** from the path. So `Checkbox.examples.tsx` → path `components/Checkbox/Checkbox.examples` → after strip → `components/Checkbox/Checkbox`. _(Dir-form files like `Checkbox/examples/Default.tsx` end in `Default`, not `.examples`, so no strip happens — the `examples` dir name stays in the id.)_
  4. Replace `/` with `-`. Lowercase.
  5. Append `--` + kebab-case of the export name.

**Worked examples** (verified live against `index.json`):

| File + export                                                                             | Active scope                                           | Title (index.json `title` field)  | Story id (URL `id=` param)                  |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------ | --------------------------------- | ------------------------------------------- |
| `apps/staff/src/components/Checkbox/Checkbox.examples.tsx` → `Interactive` (suffix form)  | default (`apps/staff/src/`)                            | `components/Checkbox/Checkbox`    | `components-checkbox-checkbox--interactive` |
| same                                                                                      | narrowed (`nx examples staff src/components/Checkbox`) | `Checkbox`                        | `checkbox--interactive`                     |
| `apps/staff/src/components/Drawer/examples/Open.tsx` → `Default` (dir form, hypothetical) | default                                                | `components/Drawer/examples/Open` | `components-drawer-examples-open--default`  |

Final URL for the first row:

```
http://<server>/iframe.html?args=&globals=&id=components-checkbox-checkbox--interactive&viewMode=story
```

**Verifying a derived id**: before loading the iframe URL, confirm the id exists in the server's index. This is the agent's sanity check, not a substitute for the URL — the URL is still the load target:

```bash
# Confirm a specific id (returns null if it doesn't exist)
curl -s http://<server>/index.json | jq '.entries["components-checkbox-checkbox--interactive"]'

# Enumerate every available id when you're not sure of the active scope
curl -s http://<server>/index.json | jq '.entries | keys[]'
```

When the id checks out, load `http://<server>/iframe.html?args=&globals=&id=<id>&viewMode=story` directly.

For scope edge cases, dir-form id derivation, kebab-case escaping, and the title-vs-id behavior, see [references/url-anatomy.md](references/url-anatomy.md).

## 4. Server discovery

`nx examples staff` picks a random port; multiple worktrees can each run their own. To find the right one:

1. **List listening localhost ports**:

   ```bash
   lsof -nP -iTCP -sTCP:LISTEN -F n | grep -oE 'localhost:[0-9]+|127\.0\.0\.1:[0-9]+' | sort -u
   ```

2. **Probe each for a Storybook index**:

   ```bash
   curl -s --max-time 1 http://<port>/index.json
   ```

   Keep ports that return valid JSON with an `entries` key.

3. **Filter to the examples renderer** — inspect any entry's `importPath`. The staff examples renderer's entries point at `apps/staff/src/...`. This is how you distinguish it from `apps/@jii/storybook/` (whose entries point at `libs/@jii/...`) if both are running.

4. **Disambiguate to this worktree** when multiple staff servers match:

   ```bash
   # port → PID
   lsof -nP -iTCP:<port> -sTCP:LISTEN -Fp

   # PID → cwd
   lsof -a -p <pid> -d cwd -Fn
   ```

   The cwd whose path contains this worktree root is yours.

5. **If zero match**: don't start the server from inside the skill — it's a long-running process the user owns. Tell them which command to run (§5), with any path scoping they need.

Once you have the port, the next step is **URL construction** per §3 — not opening `http://<server>/` (the Storybook home page) and browsing. The whole point of the recipe is that the agent never needs to see the sidebar.

## 5. Boot commands

| Goal                           | Command                                                            |
| ------------------------------ | ------------------------------------------------------------------ |
| Full scan of `apps/staff/src/` | `nx examples staff`                                                |
| Scope to a directory           | `nx examples staff src/components/Checkbox`                        |
| Scope to a single file         | `nx examples staff src/components/Loading.examples.tsx`            |
| Multiple paths                 | `nx examples staff a b c`                                          |
| Static build (same scoping)    | `nx build-examples staff [paths…]` → `apps/staff/examples-static/` |

If positional args aren't forwarded by your shell or nx version, the `--` escape works: `nx examples staff -- src/components/Checkbox`.

## 6. Reading the source file

Locations (both supported simultaneously):

```
apps/staff/src/**/*.examples.tsx     # suffix form
apps/staff/src/**/examples/*.tsx     # dir form
```

The shape is identical in both forms:

```tsx
import Component from "./Component";

// Required by the custom CSF indexer. Title auto-derives from the file path.
export default {};

export const StateName = () => <Component … />;
```

- Every named export is one renderable state.
- The default export is a CSF stub — no `Meta` / `args` / controls (that's docs Storybook territory).
- Reading the file tells you which component is exercised (via the colocated import) and which prop combinations represent the rendered states.

For the full grammar, advanced patterns (controlled state, multi-sub-component examples, dir-form pros and cons, HMR behavior), see [references/file-conventions.md](references/file-conventions.md).

## 7. Adding a new example

Within `apps/staff/`:

- **Suffix form** (default for a small number of states): drop `Foo.examples.tsx` next to `apps/staff/src/.../Foo.tsx`. Add `export default {};` and one named export per state.
- **Dir form** (preferred when a component has 5+ states or you want one file per state): create `apps/staff/src/.../Foo/examples/` and add one file per state (`Default.tsx`, `Disabled.tsx`, …). Each file uses the same plain `export default {};` + named-export shape.

HMR + the custom CSF indexer pick up new files immediately — the new id appears in `index.json` without restart.

## 8. Adopting a new product

**Default answer: no.** The skill only applies inside the §2 onboarded list. If the user's target lives outside it, do not proceed with renderer-related actions. Route them to the staff/spectra team to discuss adoption.

**Web-incompatible by design**: the examples renderer is a web Storybook. React Native / Expo apps cannot render in it — that's fundamental.

**What adoption actually requires** (high-level):

- Copy `apps/staff/.examples/` to the new app, adapt `preview.ts` for that app's global styles / theme / router, add `examples` and `build-examples` targets to its `project.json`, fix tsconfig extension paths.
- Or revive the parked "move config to root" refactor and unify under one workspace-level config.

**Per-app caveats to think through during adoption**:

- Tailwind-using apps have their own `tailwind.config.ts`; the new `.examples/` Vite config must include the right Tailwind PostCSS pipeline.
- Next.js apps render pure presentational components fine, but anything using `next/image`, `next/link`, `next/router`, or RSC features needs Next adapters not present in a vanilla Vite Storybook.

**After onboarding, update this skill**: add the new product to the §2 list AND the frontmatter description. The skill's authoritative scope is the description's onboarded list — keep it accurate.

Full adoption process, per-app deep dives, and skill-update mechanics in [references/onboarding.md](references/onboarding.md).
