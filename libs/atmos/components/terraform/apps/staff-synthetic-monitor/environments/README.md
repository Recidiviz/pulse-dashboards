# staff-synthetic-monitor test-user credentials

The component reads one SOPS-encrypted file **per state, per environment** here:

```
environments/staging/US_AZ.enc.yaml
environments/staging/US_TX.enc.yaml
environments/production/US_AZ.enc.yaml
...
```

Each file holds that state's Auth0 test credentials as a `{ username, password }` map.

## What Terraform derives from these

The set of files in `environments/<env>/` **is** the list of monitored states —
there's no separate config. For each `<STATE>.enc.yaml`, `main.tf`:

- lists the files with `fileset()` (no decrypt) to build `local.states`,
- reads each file **ephemerally** (`ephemeral "sops_file"`) so the plaintext
  never lands in Terraform state,
- writes the two Secret Manager versions from `username` / `password`
- creates one function + two secrets + one uptime check per state.

To add or drop a monitored state, add or delete its `<STATE>.enc.yaml` — then redeploy.

## Per-file KMS keys

Unlike most repo SOPS files (which share `pulse-dashboards-sops-key` via the
catch-all rule in `libs/atmos/.sops.yaml`), each file here is encrypted with its
**own per-state key**, so credential access can be scoped per state.

Reach out to Aurora to get keys provisioned for new states.

## Creating a NEW state file

The repo catch-all rule would encrypt a new file with the **shared**
`pulse-dashboards-sops-key`, not a per-state key — so name the per-state key
explicitly:

```bash
# write the { username, password } YAML, then encrypt it in place with the
# state's own key:
sops --encrypt --in-place \
  --gcp-kms STATE_SPECIFIC_KMS_KEY_ID \
  environments/staging/US_XX.enc.yaml
```
