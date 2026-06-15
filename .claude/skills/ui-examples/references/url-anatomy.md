# URL anatomy — story-id derivation deep-dive

This is the deep dive on how the examples renderer turns `(file path, export name)` into a story-id, and how scope and the custom CSF indexer interact with that. Read this when SKILL.md §3's worked examples don't cover your case (e.g. unusual file paths, dir-form examples, scoped boots).

**The agent's access pattern is iframe URL → direct GET.** This doc explains how to derive the id you'll plug into `http://<server>/iframe.html?args=&globals=&id=<id>&viewMode=story`. Once derived, you load that URL directly via `curl`, playwright, or `fetch` — not via the Storybook UI.

## The mechanical algorithm

Storybook builds the story-id from the **title** (not the raw file path), then appends the export name. The custom indexer in `apps/staff/.examples/main.ts` wraps Storybook's `makeTitle` to strip a trailing `.examples` segment from the title — and **because the id derives from the title, the strip applies to both**. So they always agree in this setup.

End-to-end formula:

1. Take the file path **relative to the stories glob root** (not absolute, not relative to the workspace root — relative to whatever the active glob is rooted at; see "Why scope changes ids" below).
2. Drop the file extension. This is the raw title.
3. **Strip a trailing `.examples` segment** if present (custom indexer wrap). `components/Checkbox/Checkbox.examples` → `components/Checkbox/Checkbox`. _(Dir-form paths like `components/Drawer/examples/Open` don't end with `.examples` — they end with the filename — so no strip happens. The `examples` dir name stays in.)_
4. Replace `/` with `-`. Lowercase. This is the id prefix.
5. Append `--` + kebab-case of the named export.

## Why scope changes ids

When the user passes path args to `nx examples staff <subdir>`, the stories glob root narrows to that subdir. Every id then derives relative to the narrower root. Examples (verified live against `index.json`):

| File                                                       | Glob root                                        | Title (index.json field)       | Story id (URL `id=` param)                  |
| ---------------------------------------------------------- | ------------------------------------------------ | ------------------------------ | ------------------------------------------- |
| `apps/staff/src/components/Checkbox/Checkbox.examples.tsx` | `apps/staff/src/` (default)                      | `components/Checkbox/Checkbox` | `components-checkbox-checkbox--interactive` |
| same                                                       | `apps/staff/src/components/Checkbox/` (narrowed) | `Checkbox`                     | `checkbox--interactive`                     |
| `apps/staff/src/components/BrandedLink.examples.tsx`       | `apps/staff/src/` (default)                      | `components/BrandedLink`       | `components-brandedlink--internal`          |

This is why **`index.json` lookup beats derivation** when you don't know the active scope. The server is always authoritative — `curl -s http://<port>/index.json | jq '.entries | keys[]'` lists exactly what's available, no guessing.

## Dir-form ids

For dir-form files (e.g. `apps/staff/src/components/Drawer/examples/Open.tsx`) at default scope:

1. Path under the stories root: `components/Drawer/examples/Open.tsx`.
2. Drop extension: `components/Drawer/examples/Open`. The trailing segment is `Open`, not `.examples`, so the strip is a no-op.
3. After slash-to-dash + lowercase: `components-drawer-examples-open`.
4. Append `--<export-kebab>`. So a `Default` export becomes `components-drawer-examples-open--default`.

**Important caveat for dir-form**: Storybook CSF only indexes **named** exports. A dir-form file whose default export is the React component itself (no `export const Foo = …`) won't be indexed at all — the renderer needs at least one named export. The required pattern is the same as suffix-form: `export default {};` (stub) plus one or more `export const StateName = () => …;`.

## Title vs story-id

The `title` field in `index.json` and the story-id don't diverge in this setup — the same `makeTitle` output seeds both, so any title transform (including the `.examples` strip) flows into the id. An entry whose `title` is `components/Checkbox/Checkbox` has id prefix `components-checkbox-checkbox` (same string, lowercased + slash-replaced).

This is different from documentation Storybook setups where stories set `meta.title` explicitly (which can deliberately diverge from the path-derived id). The examples renderer doesn't use `meta.title` — `export default {};` is a stub — so path → title → id is a single chain.

Practically: when reading `index.json` to pick an id, the `title` field tells you the human-readable path and the entry's key tells you the URL id. They're two views of the same string.

## Kebab-case escaping

Storybook's kebab-case is permissive — it lowercases, replaces non-alphanumeric characters with `-`, and collapses runs. Edge cases worth knowing:

| Export name          | Kebab id                                        |
| -------------------- | ----------------------------------------------- |
| `WithLongName`       | `with-long-name`                                |
| `CSVUploader`        | `csv-uploader` (all-caps acronym boundary)      |
| `with_underscores`   | `with-underscores`                              |
| `Size2x`             | `size-2x` (digit transition inserts a boundary) |
| `Has-Already-Dashes` | `has-already-dashes` (idempotent)               |

When in doubt, query `index.json` rather than guess — it's faster and unambiguous.

## File-path edge cases

A few patterns from the staff codebase that produce non-obvious ids:

- **Component inside a single-file dir**: `apps/staff/src/components/Loading.examples.tsx` (no subdir for Loading) → path under root is `components/Loading.examples` → strip `.examples` → `components/Loading` → id `components-loading--<export>`.
- **Component with its own dir**: `apps/staff/src/components/Checkbox/Checkbox.examples.tsx` → path `components/Checkbox/Checkbox.examples` → strip → `components/Checkbox/Checkbox` → id `components-checkbox-checkbox--<export>` (note the repeated `checkbox` segment — that's the dir name AND the file basename, both lowercase, both survive the strip).
- **`__tests__` or `__mocks__` dirs**: would survive the path-to-id transform (`__tests__` → `tests`), but in practice these dirs are excluded from the stories glob, so they shouldn't show up.

## Verifying derived ids against the server

Always finalize with a server check before relying on a derived id:

```bash
# Probe the iframe URL you'll actually load (canonical form, matches Storybook's UI)
curl -s "http://<port>/iframe.html?args=&globals=&id=<derived-id>&viewMode=story" | head -20

# Or just confirm the id exists in the index
curl -s http://<port>/index.json | jq -r '.entries | keys[]' | grep <derived-id>
```

If `iframe.html` returns the rendered story (HTML with iframe content), the id is correct and the URL is what the agent loads going forward. If it returns a 404 page or "Story not found", the derivation was off — fall back to `jq '.entries | keys[]'` and search by suffix or component name.
