# @typesense/backfill-fn

HTTP-triggered Cloud Function (v2) that bulk-imports Firestore documents into
Typesense. Source for the upload artifact deployed by the
[`apps/typesense-backfill`](../../../libs/atmos/components/terraform/apps/typesense-backfill/)
Terraform component.

## Why an nx project

Hoisting the function source into the nx graph buys:

- Real TypeScript (strict mode), shared types/client factory from
  [`~@typesense/client`](../../../libs/@typesense/client/) — so the function
  and the rest of the search tooling stay in lockstep.
- Vitest unit tests for the field-projection and import-response parsing
  paths (covers the dotted-nested-field handling that the JS version had
  to learn the hard way).
- ESLint + Prettier via the workspace base config.
- Caching: `nx affected -t typecheck` catches drift the same way it does for
  the rest of the repo.

## Targets

```bash
nx typecheck '@typesense/backfill-fn'
nx test      '@typesense/backfill-fn' -- --run
nx lint      '@typesense/backfill-fn'
nx build     '@typesense/backfill-fn'                # esbuild bundle → dist/
nx plan      '@typesense/backfill-fn' -c <staging|production>   # build → atmos plan
nx deploy    '@typesense/backfill-fn' -c <staging|production>   # build → atmos apply
```

`plan` and `deploy` `dependsOn` the build, so `dist/` is always fresh before
atmos runs. See the TF component's
[README](../../../libs/atmos/components/terraform/apps/typesense-backfill/README.md)
for the full deploy flow + how to invoke the deployed function.

CFv2 discovers HTTP handlers via named exports — the function is exported as
`backfill` from `src/index.ts` to match the TF resource's
`entry_point = "backfill"`, with no `@google-cloud/functions-framework`
registration required.

## Layout

```
src/
  index.ts          # HTTP entry point — exports `backfill(req, res)`
  backfill.ts       # core loop: paginate Firestore, project fields, bulk import
__tests__/
  backfill.test.ts  # vitest: projectFields, assignNested, parseImportResponse
```

## Env vars

Set by TF at deploy time:

| Var                  | Purpose                                                 |
| -------------------- | ------------------------------------------------------- |
| `TYPESENSE_HOSTS`    | Cluster hostname (no scheme)                            |
| `TYPESENSE_PORT`     | Typesense TLS port (usually `443`)                      |
| `TYPESENSE_PROTOCOL` | `https`                                                 |
| `TYPESENSE_API_KEY`  | Write key — mounted from Secret Manager via TF          |
| `FIRESTORE_DATABASE` | Firestore database id (`(default)` for the default DB)  |
| `COLLECTIONS_JSON`   | JSON array of `{ name, fields }` — derived from schemas |

The 3-part Typesense host shape (HOSTS/PORT/PROTOCOL) matches the contract the
upstream extension established; the function composes it into a URL and hands
it to `createTypesenseClient` from `~@typesense/client`.
