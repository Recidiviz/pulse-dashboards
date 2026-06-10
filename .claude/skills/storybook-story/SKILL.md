---
name: storybook-story
description: Create a Storybook story for a component. Use when the user asks to add a story, write a story, or create a Storybook story for a component.
---

# Skill: Create a Storybook Story

## Overview

This skill covers how to write Storybook stories (CSF3 format) for components in this monorepo.

### Storybook instances

There is currently one active Storybook app:

- **JII**: `apps/@jii/storybook/.storybook/main.ts`

Read that file to confirm the current `stories` glob scope before writing a story. Additional Storybook instances (e.g. for Staff) may be added to the repo in the future; when they are, read each config file to determine which directories each one covers, and use that to drive the title conventions in Step 3.

---

## Step 1: Read the Component

Read the target component file to understand:

- Its props/type signature
- Whether it uses React Router (needs `MemoryRouter` decorator)
- Whether it is generic (e.g. `Component<T>`) — use a concrete type in the story
- Whether it is a styled component (often no meaningful controls beyond `children`)
- Whether it needs controlled state (`value` + `onChange`)

Also check sibling files: related types, constants, sub-components used in composition.

---

## Step 2: Choose the Right Pattern

### Pattern A — Simple inline render (stateless)

Use when the component is stateless and can be rendered directly.

```tsx
const meta = {
  title: "Common UI/MyComponent",
  component: MyComponent,
  args: { children: "Label text" },
} satisfies Meta<typeof MyComponent>;
```

For components with interesting variants, add multiple named stories.

### Pattern B — Inline render function in meta (stateless with composition)

Use when the component needs children or siblings composed around it, but no state.

```tsx
const meta: Meta<CombinedArgs> = {
  title: "Common UI/MyComponent",
  render: ({ foo, bar, onAction }) => (
    <MyComponent foo={foo} bar={bar}>
      <MyChildComponent onClick={onAction}>Item</MyChildComponent>
    </MyComponent>
  ),
  ...
};
```

### Pattern C — `examples/example.tsx` file (stateful)

Use when the component requires controlled state (`useState`) — e.g. a controlled input, checkbox, selector, or slider.

1. Create `examples/example.tsx` alongside the story file
2. Export a named `*ExampleArgs` type and a default named React component (not an arrow function — hooks require named components)
3. Import it in the stories file with `?raw` for the code panel source

```tsx
// examples/example.tsx
export type MyExampleArgs = {
  onChange: (v: string) => void;
  disabled: boolean;
};

export default function MyExample({ onChange, disabled }: MyExampleArgs) {
  const [value, setValue] = useState("");
  return (
    <MyComponent
      value={value}
      disabled={disabled}
      onChange={(next) => {
        setValue(next);
        onChange(next);
      }}
    />
  );
}
```

```tsx
// MyComponent.stories.tsx
import MyExample, { type MyExampleArgs } from "./examples/example";
import exampleSource from "./examples/example?raw";

const meta: Meta<MyExampleArgs> = {
  title: "Common UI/MyComponent",
  render: (args) => <MyExample {...args} />,
  parameters: {
    docs: { codePanel: true, source: { code: exampleSource } },
  },
  ...
};
```

---

## Step 3: Title Convention

Story titles encode both **which Storybook** the story belongs to and **what library** it comes from.

### Determining shared vs JII-specific

**Shared** libraries are anything outside of `libs/@jii/` — they are not scoped to JII and may eventually appear in other Storybooks. **JII-specific** libraries live under `libs/@jii/`.

> When additional Storybook instances are added to the repo, check each config file's `stories` globs to determine which directories each one covers, and use that to drive `Shared/` vs. app-specific titles.

### Shared libraries (`libs/` outside `libs/@jii/`)

Prefix with `Shared/` followed by the library name:

| Source                               | Title prefix                                    |
| ------------------------------------ | ----------------------------------------------- |
| `libs/design-system/src/components/` | `"Shared/Design System/Components/MyComponent"` |
| `libs/design-system/src/styles/`     | `"Shared/Design System/Styles/MyThing"`         |

### JII-specific libraries (`libs/@jii/`)

Prefix with the library's short name — **no** `Shared/` prefix:

| Source                      | Title prefix                   |
| --------------------------- | ------------------------------ |
| `libs/@jii/common-ui/`      | `"Common UI/MyComponent"`      |
| `libs/@jii/states/US_TN/`   | `"US_TN/MyComponent"`          |
| `libs/@jii/sentence-dates/` | `"Sentence Dates/MyComponent"` |

### Subfolders

Add a subfolder segment when a component lives in a named subdirectory that differs from the component name and contains multiple documented components, e.g.:

- `"Common UI/Header/HeaderBarContainer"`
- `"Common UI/Buttons/ButtonLink"`
- `"Shared/Design System/Components/Dropdown"`

---

## Step 4: argTypes and args

- **Use `fn()` from `storybook/test`** (not `@storybook/test`) for callback args (`onClick`, `onChange`, etc.)
- **Hide callbacks** from the controls panel with `table: { disable: true }`
- **Use `options` + `control`** for enums:
  ```tsx
  kind: { options: ["primary", "secondary"], control: "radio" }
  ```
- **Common control types**: `"text"`, `"boolean"`, `"color"`, `"select"`, `"radio"`, `{ type: "range", min, max, step }`, `{ type: "number" }`
- Hide props that can't be meaningfully controlled (complex objects, render props, `children` when managed in render) with `table: { disable: true }`

---

## Step 5: React Router

If the component (or anything it renders) imports from `react-router-dom`, wrap with a `MemoryRouter` decorator:

```tsx
decorators: [
  (Story) => (
    <MemoryRouter>
      <Story />
    </MemoryRouter>
  ),
],
```

---

## Step 6: Story height

If the component opens a dropdown or popover that would be clipped, add:

```tsx
parameters: {
  docs: { story: { height: "300px" } },
},
```

---

## Step 7: Generic copy

Use **generic placeholder text** in story args and render functions — not domain-specific or app-specific copy. Unless the user specifies otherwise:

- Labels: `"Label"`, `"Option A"`, `"First item"`, `"Section heading"`
- Body text: `"The quick brown fox jumps over the lazy dog."` or similar
- URLs/routes: `"/"` or `"#"`
- Do **not** use realistic app content like `"Days without a violation"` or `"Back to home"` — the user will provide that if needed

---

## Step 8: Multiple stories

Add separate named exports when the component has distinct visual states:

```tsx
export const Primary: Story = { args: { kind: "primary" } };
export const Secondary: Story = { args: { kind: "secondary" } };
export const Disabled: Story = { args: { disabled: true } };
```

---

## Step 9: Lint and format

Always run both after creating or modifying story files:

```bash
npx eslint path/to/Component.stories.tsx [path/to/examples/example.tsx] --fix
npx prettier --write path/to/Component.stories.tsx [path/to/examples/example.tsx]
```

`simple-import-sort` will reorder imports; Prettier formats the files.

---

## Common Mistakes

- **`fn()` import**: use `storybook/test`, not `@storybook/test`
- **Named component in examples**: use `export default function Foo()`, not `const Foo = () =>` — React hooks require named components
- **`satisfies` vs explicit annotation**: use `satisfies Meta<typeof Component>` when the component type aligns; use `const meta: Meta<CustomArgs> = {}` when using a custom args type (e.g. for generic components or composed args)
- **Generic components**: instantiate with a concrete type (e.g. `string`) in the example wrapper
- **Styled components**: they inherit all HTML element props — only add argTypes for props that are actually useful to control
