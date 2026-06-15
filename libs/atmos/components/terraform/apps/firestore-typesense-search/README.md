# apps/firestore-typesense-search

Terraform-managed installation of the upstream
[`typesense/firestore-typesense-search`](https://firebase.google.com/products/extensions/typesense-firestore-typesense-search)
Firebase extension.

This component owns the Cloud-Functions-v2 trigger pipeline that mirrors Firestore
document changes into the Typesense cluster created by the sibling
[`apps/typesense`](../typesense/) component. They share a `typesense_host` value
and otherwise have no Terraform coupling.

## Bootstrap (one-time per env)

The component owns the Secret Manager secret and its current version. The secret
value comes from a SOPS-encrypted file at `secrets/<project-id>.enc.yaml`,
keyed by `typesense_extension_api_key`.

This is **not** the same key as the cluster bootstrap admin key managed by
the sibling [apps/typesense](../typesense/) component. That one is the operator's
root credential and is wired directly into the cluster pod via the
TypesenseCluster CR. The extension uses a separate, narrower API key minted via
the cluster's `/keys` endpoint.

### Mint a new extension API key

Stash the cluster admin key in an env var. It's stored alongside the cluster
config in the sibling typesense component's SOPS file:

```bash
export TS_ADMIN_KEY="$(sops -d libs/atmos/components/terraform/apps/typesense/secrets/recidiviz-dashboard-staging.enc.yaml | yq '.typesense_admin_api_key')"
```

Mint a key against the running cluster with the actions the extension needs.
`documents:*` covers `import`/`upsert`/`delete` (the extension's three operations
on documents) and `collections:*` covers `create` (the backfill function will
attempt to create collections it can't find). Scope to the exact collection set
the extension is configured to mirror — this keeps blast radius narrow if the
key ever leaks:

```bash
curl -fsS "https://typesense-staging.recidiviz.org/keys" \
  -H "X-TYPESENSE-API-KEY: $TS_ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "firestore-typesense-search extension write (staging)",
    "actions": ["documents:*", "collections:*"],
    "collections": ["clients", "residents", "supervisionStaff", "incarcerationStaff", "locations"]
  }' | jq
```

The response contains the **only** copy of the key in `value` — capture it
before it disappears. Subsequent reads of `/keys` only return `value_prefix`,
not the full value.

> ⚠️ This key is NOT the same as the search-only parent key used by the staff
> app's search bar (managed in [libs/@typesense/client](../../../../../@typesense/client/)).
> The extension needs WRITE permission. If you accidentally encrypt a
> `documents:search`-only key here, the backfill function logs `Done backfilling`
> immediately and the cluster pod logs show
> `Scoped API keys can only be used for searches.` Verify the action scope
> before encrypting.

### Test the new key before applying TF

Before encrypting, confirm the key actually has the right scope by hitting the
exact endpoint the extension calls. A successful `{"success":true}` means the
key is correctly scoped for the bulk-import path:

```bash
curl -i -X POST "https://typesense-staging.recidiviz.org/collections/clients/documents/import?action=upsert" \
  -H "X-TYPESENSE-API-KEY: <new-key-value>" \
  -H "Content-Type: text/plain" \
  --data $'{"id":"key_check_doc","stateCode":"US_TEST","personExternalId":"x","personName":{"givenNames":"x","surname":"x"}}'
```

A 403 here means the key doesn't have the actions needed — go back and re-mint
with the wider scope. A 401 means the key value is wrong/typo'd.

Clean up the test doc:

```bash
curl -fsS -X DELETE "https://typesense-staging.recidiviz.org/collections/clients/documents/key_check_doc" \
  -H "X-TYPESENSE-API-KEY: $TS_ADMIN_KEY"
```

### Encrypt + apply

```bash
sops libs/atmos/components/terraform/apps/firestore-typesense-search/secrets/recidiviz-dashboard-staging.enc.yaml
# Set:
#   typesense_extension_api_key: <value>
```

Use the project's existing SOPS configuration — `.sops.yaml` at the repo root
already covers `**/secrets/*.enc.yaml`.

```bash
atmos terraform apply apps/firestore-typesense-search -s recidiviz-dashboard-staging
```

TF creates a new `google_secret_manager_secret_version` and reconfigures the
extension instance to point at it. The extension's Cloud Run revisions roll over
to the new value automatically. The Firebase Extensions service grants the
per-instance service agent
(`ext-<instance>@<project>.iam.gserviceaccount.com`) `secretmanager.secretAccessor`
on the secret automatically at install time.

### Revoke the old key (after rotation)

Once the new key is live and you've confirmed sync is healthy, delete the old
one in Typesense so it can't be reused if it ever leaked:

```bash
# Find its id by matching value_prefix:
curl -fsS "https://typesense-staging.recidiviz.org/keys" \
  -H "X-TYPESENSE-API-KEY: $TS_ADMIN_KEY" \
  | jq '.keys[] | {id, description, value_prefix}'

# Delete:
curl -fsS -X DELETE "https://typesense-staging.recidiviz.org/keys/<id>" \
  -H "X-TYPESENSE-API-KEY: $TS_ADMIN_KEY"
```

## Collection bindings

`var.collections` is the single source of truth for the four parallel-list params
the extension expects. Keep it in sync with the canonical schema definitions in
[libs/@typesense/client/src/schemas/index.ts](../../../../../@typesense/client/src/schemas/index.ts).
A collection added there must also be added here (and to the cluster's
provisioning script) for the trigger pipeline to mirror it.

## Stack files

Per-env config lives at `libs/atmos/stacks/typesense/recidiviz-dashboard-<env>.yaml`
under the `apps/firestore-typesense-search` key.
