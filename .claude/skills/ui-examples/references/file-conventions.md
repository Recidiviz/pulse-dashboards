# File conventions — the `*.examples.tsx` grammar

This is the complete grammar for examples files. SKILL.md §6 gives the basic shape; this doc covers the patterns you'll hit when building real examples.

## Both file forms (recap)

```
apps/staff/src/**/*.examples.tsx       # suffix form — Checkbox.examples.tsx next to Checkbox.tsx
apps/staff/src/**/examples/*.tsx       # dir form — Checkbox/examples/Default.tsx, Disabled.tsx, ...
```

Both forms work simultaneously. Pick **suffix form** for ≤4 states, **dir form** for many states or when each state is complex enough to deserve its own file.

## The minimum viable example file

```tsx
// Recidiviz - a data platform for criminal justice reform
// Copyright (C) <YEAR> Recidiviz, Inc.
// ...standard license header...

import Component from "./Component";

// Required by the custom CSF indexer. Title auto-derives from the file path.
export default {};

export const Default = () => <Component />;
```

The `export default {};` is a CSF stub. It exists only so Storybook's parser sees a Component Story Format file. **Don't put `Meta` / `args` / `parameters` inside it** — that's the documentation Storybook idiom, not this one. If you find yourself reaching for `argTypes` or controls, you're using the wrong tool; see SKILL.md §1 (Examples ≠ Storybook).

## Common patterns

### Controlled state with hooks

When an example needs interaction (toggle, slider, input), wrap the component in a small stateful wrapper inside the export:

```tsx
import { useState } from "react";
import Checkbox from "./Checkbox";

export default {};

export const Interactive = () => {
  const [checked, setChecked] = useState(false);
  return (
    <Checkbox
      value="option"
      name="interactive"
      checked={checked}
      onChange={() => setChecked((c) => !c)}
    >
      Click to toggle — currently {checked ? "checked" : "unchecked"}
    </Checkbox>
  );
};
```

An agent (or human) can drive this via playwright — click the checkbox, observe the state flip in the rendered text.

### Visual frame around the component

For components that need a sized container (e.g. width-constrained or padded), introduce a small `Frame` helper inside the file rather than relying on browser defaults:

```tsx
const Frame = ({ children }: { children: React.ReactNode }) => (
  <div style={{ width: 320, padding: 24 }}>{children}</div>
);

export const Default = () => {
  const [value, setValue] = useState(3);
  return (
    <Frame>
      <Slider max={10} value={value} onChange={setValue} />
    </Frame>
  );
};
```

This makes screenshots stable across rendering contexts and avoids edge-of-viewport rendering quirks.

### Static no-op handlers

When a state is purely visual (e.g. `Disabled`), avoid inline `onChange={() => {}}` — eslint's `@typescript-eslint/no-empty-function` will flag it. Use a named no-op:

```tsx
const noop = () => {
  // intentionally empty for the static example
};

export const Disabled = () => (
  <Slider max={10} value={4} disabled onChange={noop} />
);
```

### Composed sub-component examples

When the component you're exercising is rarely used alone (e.g. a `Checkbox` that's almost always rendered in a group), the example can compose multiple instances:

```tsx
export const Group = () => {
  const [picks, setPicks] = useState({
    apple: true,
    banana: false,
    cherry: false,
  });
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {Object.keys(picks).map((fruit) => (
        <Checkbox
          key={fruit}
          value={fruit}
          name={fruit}
          checked={picks[fruit]}
          onChange={() => setPicks((p) => ({ ...p, [fruit]: !p[fruit] }))}
        >
          {fruit}
        </Checkbox>
      ))}
    </div>
  );
};
```

This is fine — the example is still a "single state" from the rendering perspective (one URL, one screenshot).

## Dir form: when to use

Reach for dir form when:

- A component has 5+ states and the suffix-form file would get crowded.
- States have substantially different setup (different fixtures, mocks, wrappers) that benefit from per-file isolation.
- You want each state's git history to live in its own file (e.g. for blame, code review focus, or selective revert).

Layout:

```
src/components/Drawer/
├── Drawer.tsx
├── Drawer.scss              # if applicable
└── examples/
    ├── Closed.tsx
    ├── Open.tsx
    ├── OpenWithLongContent.tsx
    └── WithCustomHeader.tsx
```

Each file follows the same `export default {};` + named-export shape. `index.json` titles derive as `components/Drawer/examples/Open`, `components/Drawer/examples/Closed`, etc., grouped under the parent component's path (`.examples` doesn't appear in dir-form because the file extension is just `.tsx`, not `.examples.tsx`).

## HMR and the custom indexer

The renderer hot-reloads on file changes — adding a new export, editing an existing one, or renaming a file are all picked up without restart. The custom CSF indexer in `apps/staff/.examples/main.ts` watches the glob and updates `index.json` live.

If a new id you derived doesn't show up after editing, check:

1. **Path matches the glob**: file lives under `apps/staff/src/**` (or your scoped subdir).
2. **Top-level named export**: the export is `export const StateName = …` at module scope, not buried inside a function or namespaced.
3. **Default export exists**: `export default {};` — empty object is fine, but it must exist for CSF parsing to treat the file as a story module.
4. **Server is running**: `nx examples staff` is still alive in the worktree (HMR doesn't help if the server crashed).

If all four are true and the id still doesn't appear in `index.json`, restart the server. Edge cases (very rare): the indexer cache can desync after a quick succession of file renames.

## Anti-patterns to avoid

- **Mixing CSF formats**: don't export `default { component: Foo, title: "Bar" }` (the docs-Storybook `Meta` shape) here. The custom indexer relies on the stub form; a real `Meta` will confuse things.
- **Rendering inside the default export**: `export default () => <Foo />;` won't work — the default export is metadata, not a story. Use named exports.
- **Cross-file shared state**: examples should be self-contained. Hoisting state into a module-scope variable shared across files breaks the "one URL, one screenshot" property.
- **Side effects at module load**: avoid `import` statements that trigger network calls, store mutations, or analytics. Examples should be cheap to load — Storybook may lazy-load them, but their module evaluation still runs.
