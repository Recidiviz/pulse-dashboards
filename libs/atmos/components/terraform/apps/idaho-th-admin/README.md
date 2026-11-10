# Idaho TH Admin Panel

`apps/idaho-th-admin` deploys the shared `recidiviz-data` admin panel image for Idaho TH. It reads and writes the Idaho TH Cloud SQL database owned by `apps/idaho-th`; it does not create a database, migration job, or seed job.

For the Idaho TH infrastructure index, see [`../idaho-th/README.md`](../idaho-th/README.md). For database rollback and recovery, see [`../idaho-th/ROLLBACK.md`](../idaho-th/ROLLBACK.md) and [`../idaho-th/BACKUP_RESTORE.md`](../idaho-th/BACKUP_RESTORE.md).

## Environment Reference

|                      | Staging                                                                    | Production                                                                 |
| -------------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Atmos stack          | `rcdvz-transitional-housing-dev--idaho-th`                                 | `recidiviz-transitional-housing--idaho-th`                                 |
| GCP project          | `rcdvz-transitional-housing-dev`                                           | `recidiviz-transitional-housing`                                           |
| Admin URL            | https://housing-admin-stg.recidiviz.org                                    | https://housing-admin.recidiviz.org                                        |
| Cloud Run service    | `idaho-th-admin-server`                                                    | `idaho-th-admin-server`                                                    |
| Service account      | `<admin-service-account>@<project>.iam.gserviceaccount.com`                | `<admin-service-account>@<project>.iam.gserviceaccount.com`                |
| Artifact Registry    | `us-central1-docker.pkg.dev/rcdvz-transitional-housing-dev/idaho-th-admin` | `us-central1-docker.pkg.dev/rcdvz-transitional-housing-dev/idaho-th-admin` |
| DB secret prefix     | `idaho_th_dev`                                                             | `idaho_th`                                                                 |
| `RECIDIVIZ_ENV`      | `staging`                                                                  | `production`                                                               |
| IAP access           | `group:<iap-access-group>`                                                 | `group:<iap-access-group>`                                                 |
| Direct egress subnet | `idaho-th-server-dev-direct-egress-subnetwork`                             | `default`                                                                  |

## Architecture

| Resource                            | Purpose                                                                                                                                                                        |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Cloud Run service                   | Runs the unmodified `recidiviz-data` admin panel image. Ingress is `INGRESS_TRAFFIC_INTERNAL_LOAD_BALANCER`, so the service is only reachable through the load balancer.       |
| Global external HTTPS load balancer | Fronts the admin panel and provides the backend service used by IAP. It is Global by design; see [Security policy exception](#security-policy-exception-global-load-balancer). |
| IAP                                 | Protects the backend service using Google-managed OAuth. The shared admin panel code also validates the IAP JWT audience.                                                      |
| IAP access grants                   | `iap_access.tf` grants each `iap_access_groups` / `iap_access_users` entry from this component's SOPS values file `roles/iap.httpsResourceAccessor` on the backend service.    |
| Artifact Registry                   | Dedicated admin-panel image repository, separate from the public app's `idaho-th` repository.                                                                                  |
| Idaho TH DB secrets                 | Reads `{sql_base_secret_name}_db_user`, `_db_password`, `_cloudsql_instance_id`, and `_db_host`. These secrets are pre-existing and are not owned by this component.           |
| `idaho_th_intercom_token`           | Secret owned by this component. Its value is copied from `INTERCOM_TOKEN` during apply for the admin panel's HousingProvider-to-Intercom sync.                                 |
| BigQuery query job CMEK             | `bigquery-results.tf` creates a KMS Autokey key and an empty anchor dataset so admin-panel BigQuery query jobs can satisfy the project's CMEK org policy.                      |
| Clean-bucket delete IAM             | Granted by `apps/malware-scanning` through `app_storage_delete_members`, not by this component.                                                                                |

Important details:

- The Cloud Run service grants the IAP service agent `roles/run.invoker`. Terraform-enabled IAP does not auto-grant this the way the Console toggle can.
- `_db_host` is still required even though the connection uses the Cloud SQL Unix socket, because shared `SQLAlchemyEngineManager` code fetches it unconditionally.
- If `INTERCOM_TOKEN` rotates, re-apply this component so `idaho_th_intercom_token` receives the new copied value.
- The BigQuery anchor dataset is not intended to store admin data. Autokey's BigQuery support is dataset-scoped, and `recidiviz-data` passes the generated key directly on query jobs so BigQuery encrypts temporary query result tables while preserving query result caching.

## Security Policy Exception: Global Load Balancer

`.claude/rules/security.md` requires US regions only and no global geography. This component deliberately uses a Global load balancer in staging and production.

Reason: the shared, unmodified `recidiviz-data` admin auth code validates IAP JWTs against a global backend-service audience:

```text
/projects/{project_number}/global/backendServices/{backend_service_id}
```

A regional backend service produces a different audience, so authenticated requests would fail. Keeping the Global load balancer avoids forking shared auth code or replacing IAP for this component.

Verify the address type:

```bash
gcloud compute addresses list \
  --global \
  --project=<project> \
  --filter="name:idaho-th-admin"
```

This exception depends on behavior in the separate `recidiviz-data` repo, specifically `recidiviz/utils/validate_jwt.py`. Re-check that code before relying on this exception after shared auth changes.

## One-Time Bootstrap

These steps are required before the first real IAP-enabled deploy. They are not required for ordinary redeploys.

### 1. Grant Apply Permissions

The identity running Terraform needs the normal permissions to create service accounts, IAM bindings, Secret Manager secrets, Artifact Registry repositories, Cloud Run services, load balancer resources, IAP settings, and the BigQuery query-job Autokey handle. In practice, the component-specific project roles include:

```bash
gcloud projects add-iam-policy-binding <project_id> \
  --member="user:<email>" \
  --role="roles/compute.loadBalancerAdmin"

gcloud projects add-iam-policy-binding <project_id> \
  --member="user:<email>" \
  --role="roles/compute.networkAdmin"

gcloud projects add-iam-policy-binding <project_id> \
  --member="user:<email>" \
  --role="roles/iap.admin"

gcloud projects add-iam-policy-binding <project_id> \
  --member="user:<email>" \
  --role="roles/cloudkms.autokeyUser"
```

Depending on the broader deploy identity, equivalent custom permissions or additional roles such as service-account admin, project IAM admin, Secret Manager admin, Artifact Registry admin, Cloud Run admin, and BigQuery admin may also be required.

It also needs `roles/secretmanager.secretAccessor` on two pre-existing secrets read by Terraform data sources. The values are read into the plan by the applying identity, not only by the Cloud Run service account.

```bash
gcloud secrets add-iam-policy-binding <sql_base_secret_name>_cloudsql_instance_id \
  --project=<project_id> \
  --member="user:<email>" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding INTERCOM_TOKEN \
  --project=<project_id> \
  --member="user:<email>" \
  --role="roles/secretmanager.secretAccessor"
```

The applying identity also needs age-key access to decrypt this component's `values_filename` SOPS file. That file stores `iap_access_groups` and `iap_access_users` separately from `apps/idaho-th` secrets because the app secrets file mirrors every key into its own Secret Manager secret and only supports scalar values.

`roles/compute.securityAdmin` is not required by the current component. Add it only if Cloud Armor/WAF resources are introduced later.

### 2. First Apply With Placeholder Image

Use this only when `create_registry = true`. If the stack shares an already populated registry, skip to [Deploying](#deploying).

On the first apply, this component creates the Artifact Registry repo, so no real admin image exists yet. Use a pullable placeholder image and keep IAP disabled:

```bash
yarn atmos:apply apps/idaho-th-admin -s <stack> -- \
  -var server_container_image=us-docker.pkg.dev/cloudrun/container/hello \
  -var iap_enabled=false
```

After pushing a real image, remove the `server_container_image` override and deploy with `server_container_version`.

### 3. DNS

Point the admin hostname at this component's load-balancer IP:

```bash
yarn atmos terraform output apps/idaho-th-admin load_balancer_ip -s <stack>
```

DNS zone management is outside this Terraform component.

### 4. Enable IAP In The Console

Google shut down the IAP OAuth Admin APIs used to bootstrap a project's first IAP brand. New projects blocked API bootstrap starting January 19, 2026, and the APIs shut down fully on March 19, 2026. For a project with no prior IAP usage, IAP must be enabled once in the Console.

1. Apply this component with `iap_enabled = false` so the backend service exists.
2. In Google Cloud Console, open Security -> Identity-Aware Proxy, not BeyondCorp Enterprise -> Applications.
3. Find this component's backend service and enable IAP.
4. Choose Google-managed OAuth, not Custom OAuth.
5. Set `iap_enabled = true` in stack config and re-apply. The component intentionally leaves `oauth2_client_id` and `oauth2_client_secret` unset so Terraform also resolves to Google-managed OAuth.

Manage access through `iap_access_groups` and `iap_access_users` in this component's SOPS values file after bootstrap. Do not add long-term members manually in the Console; Terraform will not report or remove those non-authoritative grants.

## Deploying

Run from the `pulse-dashboards` repo root.

1. Build and push the `recidiviz-data` admin panel image to `artifact_registry_repository`, tagged as `idaho-th-admin-server:<version>`.
2. Plan with the explicit image tag:

```bash
yarn atmos:plan apps/idaho-th-admin -s <stack> -- \
  -var server_container_version=<tag>
```

3. Apply the same tag:

```bash
yarn atmos:apply apps/idaho-th-admin -s <stack> -- \
  -var server_container_version=<tag>
```

`server_container_version` defaults to `"latest"`. Always pass the tag explicitly, even for unrelated changes such as IAP access, so Terraform does not redeploy whatever `:latest` resolves to at apply time.

## Common Commands

Inspect outputs:

```bash
yarn atmos terraform output apps/idaho-th-admin app_url -s <stack>
yarn atmos terraform output apps/idaho-th-admin cloud_run_service_uri -s <stack>
yarn atmos terraform output apps/idaho-th-admin load_balancer_ip -s <stack>
yarn atmos terraform output apps/idaho-th-admin artifact_registry_repository -s <stack>
yarn atmos terraform output apps/idaho-th-admin query_jobs_kms_key -s <stack>
```

Check Cloud Run readiness:

```bash
gcloud run services describe idaho-th-admin-server \
  --project=<project> \
  --region=us-central1 \
  --format="yaml(status.conditions,status.url,metadata.generation,status.observedGeneration)"
```

Check the IAP-enabled backend service:

```bash
gcloud compute backend-services describe idaho-th-admin-server-lb-backend-default \
  --global \
  --project=<project> \
  --format="yaml(iap,generatedId,backends,logConfig)"
```

Read admin service logs:

```bash
gcloud logging read \
  'resource.type="cloud_run_revision" AND resource.labels.service_name="idaho-th-admin-server"' \
  --project=<project> \
  --limit=100 \
  --format="table(timestamp,severity,textPayload,jsonPayload.message)"
```

Confirm owned secret versions exist:

```bash
gcloud secrets versions list idaho_th_intercom_token --project=<project>
gcloud secrets versions list iap_admin_panel_load_balancer_service_id --project=<project>
```

Confirm the query-job CMEK resources:

```bash
gcloud kms key-handles list \
  --project=<project> \
  --location=us

bq --project_id=<project> show idaho_th_admin_query_jobs_kms_anchor
```

## Post-Deploy Checks

- [ ] Admin URL loads through IAP.
- [ ] Direct `*.run.app` access is blocked by Cloud Run ingress.
- [ ] Expected users/groups are present in this component's `iap_access_groups` / `iap_access_users` values.
- [ ] Service account can read the four Idaho TH DB secrets.
- [ ] `idaho_th_intercom_token` has a current version after any `INTERCOM_TOKEN` rotation.
- [ ] `query_jobs_kms_key` output is populated.
- [ ] Admin service account is present in `apps/malware-scanning` `app_storage_delete_members` if it needs to delete uploaded documents.

## Troubleshooting

| Symptom                                                                  | Likely cause                                                                                          | Action                                                                                                                                      |
| ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Plan fails looking up the direct egress subnet                           | `apps/idaho-th` has not created the subnet, or `direct_egress_subnetwork_name` is wrong for the stack | Apply `apps/idaho-th` first and verify the subnet name from the stack YAML.                                                                 |
| Plan fails creating the KMS key handle                                   | Applying identity lacks Autokey permissions                                                           | Grant `roles/cloudkms.autokeyUser` or equivalent `cloudkms.keyHandles.create` permission on the project and re-plan.                        |
| Admin URL returns IAP access denied                                      | Caller is not in `iap_access_groups` or `iap_access_users`                                            | Add the user/group in this component's SOPS values file and apply this component.                                                           |
| Load balancer reaches IAP but backend returns `run.routes.invoke denied` | IAP service agent lacks Cloud Run Invoker on the admin service                                        | Re-apply this component with `iap_enabled = true`; Terraform grants the IAP service agent invoker access through the Cloud Run module.      |
| Admin app rejects IAP JWT audience                                       | Backend-service id secret is stale or the load balancer is not global                                 | Re-apply this component and confirm `iap_admin_panel_load_balancer_service_id` has a current version.                                       |
| Container fails during bootstrap placeholder deploy                      | Placeholder image was deployed with the real admin entrypoint                                         | Use `server_container_image=us-docker.pkg.dev/cloudrun/container/hello`; the component skips the real entrypoint when this override is set. |
| Intercom features use an old token                                       | `INTERCOM_TOKEN` rotated but the copied `idaho_th_intercom_token` secret was not refreshed            | Re-apply this component so Terraform copies the latest token value.                                                                         |

## Tearing Down

```bash
yarn atmos terraform destroy apps/idaho-th-admin -s <stack>
```

Destroy removes the Cloud Run service, load balancer, backend service, SSL policy/certificate, and secrets owned by this component. It also removes the Artifact Registry repo when `create_registry = true`; shared repos are left alone.

After destroy:

1. Remove this component's service account from `apps/malware-scanning` `app_storage_delete_members` and re-apply `apps/malware-scanning`.
2. Remove the DNS record created during bootstrap.
3. Leave the project-wide IAP/OAuth brand state in place. It is outside this component, and Google does not support deleting an IAP brand through the underlying API.
4. Leave the Autokey `google_kms_key_handle` in place. It is a permanent resource once created; destroying this component removes it from Terraform state but not from the project. A later re-apply reusing the same handle name may need `terraform import` instead of a plain apply.
