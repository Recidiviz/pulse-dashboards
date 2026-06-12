# Typesense — Monitoring & Alert Triage Runbook

On-call guide for the Typesense search cluster (component `apps/typesense`).
The Cloud Monitoring dashboard + alert policies defined in `dashboard.tf` / `monitoring.tf`.

## Before you start

**Get cluster access first:**

```bash
# i.e. for the us-central1 cluster
gcloud container clusters get-credentials typesense-us-central1 \
  --region us-central1 --project recidiviz-dashboard-<staging|production>
```

## Observability

Cloud Monitoring → Dashboards → **"Typesense (us-central1)"**

Cloud Monitoring → Alerting → policies named **"Typesense …"**

Cloud Logging → Logs Explorer → `resource.type="k8s_container" namespace_name="typesense"`

## Severity model

| Severity            | Routing                                                            | Policies                                                                                      |
| ------------------- | ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| **Critical** (page) | PagerDuty (direct) + email                                         | Endpoint down · Quorum/health down · Disk high · Memory high                                  |
| **Warning**         | email + PagerDuty (via the shared "Alert Forwarder" Pub/Sub topic) | Replicas degraded (2/3) · Pod restarts · Requests overloaded · Write backlog · Search latency |

Thresholds are per-env (`var.monitoring.*`): **staging is looser, production tighter** — see each stack.

## First 2 minutes (any alert)

```bash
# 1. Is the cluster itself healthy? (authoritative quorum view)
kubectl -n typesense get typesensecluster                 # want PHASE=QuorumReady, READY=True
kubectl -n typesense get pods -o wide                     # want 3 typesense pods Running, one per zone

# 2. Is the public endpoint serving?
curl -sS https://typesense-staging.recidiviz.org/health   # want {"ok":true}  (prod: typesense.recidiviz.org)

# 3. Aggregated health detail (per-node leader/follower, ok, queued writes)
kubectl -n typesense exec deploy/blackbox-exporter -- wget -qO- \
  http://typesense-svc.typesense.svc.cluster.local:8808/readyz
```

Open the dashboard and scan the **Cluster health** scorecard (1 = healthy) and **Latency / Overloaded** tiles.

---

## Dashboard tile reference

| Tile                   | Metric                                                     | Healthy     | Investigate when                                                    |
| ---------------------- | ---------------------------------------------------------- | ----------- | ------------------------------------------------------------------- |
| Cluster health         | `probe_success`                                            | `1`         | `0` → quorum/readyz failing                                         |
| Public endpoint uptime | uptime `check_passed`                                      | ~100%       | dips → LB/cert/DNS or backend down                                  |
| Request rate           | `typesense_stats_*_requests_per_second`                    | steady      | sudden spike (→ overload) or drop to 0 (→ consumers can't reach it) |
| Latency (ms)           | `_search_latency_ms` / `_write_latency_ms` / `_latency_ms` | low/flat    | rising → CPU/overload/large collections                             |
| Overloaded req/s       | `_overloaded_requests_per_second`                          | `0`         | `>0` → Typesense shedding load (HTTP 503)                           |
| Pending write batches  | `_pending_write_batches`                                   | near 0      | climbing → follower behind / write pressure                         |
| CPU %                  | `_system_cpu_active_percentage`                            | < 70%       | sustained high → scale up machine type                              |
| Process memory         | `_memory_active_bytes` / `_resident_bytes`                 | stable      | climbing toward node memory → OOM risk                              |
| Disk used %            | `_system_disk_used_bytes / _total_bytes`                   | < threshold | near threshold → OUT_OF_DISK risk                                   |
| Pod restarts           | `kubernetes.io/container/restart_count`                    | 0           | >0 → crashloop / OOMKilled                                          |
| Network throughput     | `_system_network_received/sent_bytes`                      | n/a         | context for traffic spikes                                          |

> Coverage note: **everything is per-node.** CPU/memory/PVC tiles + the disk-high & memory-high alerts use
> per-pod GKE system metrics (`kubernetes.io/{container,pod}/*`, requires `SYSTEM_COMPONENTS` — enabled in
> `cluster.tf`). The Typesense stats (`typesense_metrics_*`/`typesense_stats_*`) come from the operator's
> **per-pod `metrics-exporter` sidecar** (each scrapes its own `localhost:8108`), distinguished by the GMP
> `pod` label. The healthcheck `/readyz` (via the blackbox probe) is the aggregated quorum/health source.

---

## Alert triage

### 🔴 Typesense endpoint down (critical)

`/health` uptime check failing. Consumers likely cannot reach search.

**The cluster may be fine — this often means the LB/exposure layer, not Typesense.** Check in order:

1. **Cluster up?** `kubectl -n typesense get typesensecluster,pods` → if `QuorumReady` and pods Ready, it's the LB/DNS/cert path.
2. **Gateway programmed?** `kubectl -n typesense get gateway typesense -o wide` → `PROGRAMMED=True`.
   `kubectl -n typesense describe gateway typesense` — look for listener/cert errors (e.g. `GWCER106 no certificates`).
3. **Backend healthy?**
   ```bash
   BS=$(gcloud compute backend-services list --regions us-central1 \
     --filter="name~typesense-svc-8108" --format="value(name)")
   gcloud compute backend-services get-health "$BS" --region us-central1
   ```
   All `UNHEALTHY` → pods failing `/health` (see disk/memory below) or a firewall change.
4. **TLS / DNS:** cert `ACTIVE` (`gcloud certificate-manager certificates describe typesense-<region>-cert --location us-central1`); the hostname A record resolves to the `endpoint_ip`.
5. Just provisioned? A new regional ALB takes a few minutes after `PROGRAMMED=True` to serve.

### 🔴 Typesense quorum/health down (critical)

`probe_success == 0` — the healthcheck `/readyz` reports the cluster unhealthy (lost quorum or a node down).

1. `kubectl -n typesense get typesensecluster` → `QuorumNotReady`/`QuorumDowngraded`?
2. `kubectl -n typesense get pods -o wide` → which pod is not Ready / not Running.
3. `/readyz` (see First-2-minutes) → per-node `state` (1=leader, 4=follower), `ok`, `committed_index`.
4. One node down: operator usually self-heals; confirm the PVC/node is back, the pod reschedules in its zone.
5. **Lost quorum (≥2 of 3 down):** the operator recovers automatically (its whole point). If it can't, see
   "Cluster won't recover" below. Don't manually delete PVCs unless following that procedure.
   > Won't fire if the probe series is _absent_ (exporter gone) — the endpoint-down alert covers that.

### 🔴 Disk usage high (critical)

`disk_used/total > var.monitoring.disk_alert_ratio`. Typesense returns `resource_error: OUT_OF_DISK` on `/health`
and **stops accepting writes** before it fills.

1. Confirm: `curl .../health` → look for `resource_error`. Dashboard "Disk used %".
2. **Fastest fix — grow the PVCs** (StorageClass has `allowVolumeExpansion=true`): bump `data_disk_size` in the
   stack and apply, then if needed `kubectl -n typesense edit pvc <data-pvc>` to the new size (expansion is online).
3. Reduce usage: trigger a snapshot + compaction, drop unused collections, or lower retention upstream.

### 🔴 Memory usage high (critical)

`mem_used/total > var.monitoring.memory_alert_ratio`. Risk of `OUT_OF_MEMORY` and OOMKills.

1. Dashboard "Process memory" + "Memory used %"; `/health` for `resource_error: OUT_OF_MEMORY`.
2. Short term: confirm pods aren't OOMKilled (`kubectl -n typesense describe pod <p>` → `Last State: OOMKilled`).
3. Fix: bump `node_machine_type` (more RAM) and/or the `typesense_resources` limits in the stack, then apply
   (rolling — the Pod Dispruption Budget keeps ≥2 up). Long term: shard / reduce collection size.

### 🟡 Requests overloaded (warning)

`overloaded_requests_per_second > 0` — Typesense is shedding load (HTTP 503).

1. Dashboard "Request rate" + "Latency" — is this a traffic spike or a slow node?
2. Check CPU tile; if pegged, scale `node_machine_type`. Confirm the LB is spreading across all 3 pods.
3. If a single client is hammering it, the Cloud Armor rate-limit should curb it — check Cloud Armor logs
   (see "Cloud Armor / WAF").

### 🟡 Write backlog (warning)

`pending_write_batches > var.monitoring.pending_writes_alert` — a node (often a follower) can't keep up.

1. `/readyz` → which node has high `queued_writes` / lagging `committed_index`.
2. Check that node's CPU/disk (it may be the disk/memory issue above on one node).
3. Heavy bulk import? Expected to drain after; if it grows unbounded, suspect a stuck/unhealthy follower —
   the operator should recycle it; verify it rejoins quorum.

### 🟡 Search latency high (warning)

`search_latency_ms > var.monitoring.search_latency_alert_ms`.

1. Correlate with Request rate + CPU on the dashboard.
2. Sustained high with high CPU → scale up. Spiky → likely expensive queries or large result sets (tune upstream).

### 🟡 Pods restarting (warning)

`restart_count > 2` over 5m in the `typesense` namespace.

1. `kubectl -n typesense get pods` (RESTARTS column) → which pod.
2. `kubectl -n typesense describe pod <p>` → `Last State` (OOMKilled? Error?) and events.
3. `kubectl -n typesense logs <p> --previous` → crash reason. OOMKilled → see Memory high.

---

## Cloud Armor / WAF (exposure layer)

The Typesense endpoint sits behind a regional Cloud Armor policy (`typesense-<region>-armor`, `exposure.tf`):
OWASP CRS preconfigured WAF rules (priorities 900/901, `deny(403)`), a per-IP rate-limit
(priority 1000, `deny(429)`), and a default allow. Use this section when a consumer reports
`403`/`429`s, or when tuning the WAF.

### Where decisions are logged

Cloud Armor verdicts ride on the **load-balancer request logs**, not the pod logs — every decision
is recorded there because the policy logs at `log_level = VERBOSE` (surfaces _which_ rule matched)
and the backend logs 100% of requests (`GCPBackendPolicy.logging` in `typesense.tf`). Each entry
carries one of:

- `jsonPayload.enforcedSecurityPolicy` — the rule that was **actually enforced** (the request was
  allowed/denied per `outcome`).
- `jsonPayload.previewSecurityPolicy` — a rule running in **preview** (`var.waf_preview = true`): the
  `outcome` shows what it _would_ have done, but the request was **not** blocked by it.

So when the WAF is in preview, a "would-be deny" shows up as `previewSecurityPolicy.outcome="DENY"`
while `httpRequest.status` is still `200`. When enforcing, it's `enforcedSecurityPolicy.outcome="DENY"`
with `status: 403`.

### Logs Explorer queries

Logs Explorer → scope to the env project. `resource.type` is the regional external ALB:

```text
# All ENFORCED WAF/rate-limit denials (real 403/429s hitting clients):
resource.type="http_external_regional_lb_rule"
jsonPayload.enforcedSecurityPolicy.outcome="DENY"

# Would-be denials while in PREVIEW (your false-positive burn-down list before enforcing):
resource.type="http_external_regional_lb_rule"
jsonPayload.previewSecurityPolicy.outcome="DENY"

# A specific OWASP rule (e.g. the JSONL-import false positive 921150):
resource.type="http_external_regional_lb_rule"
jsonPayload.enforcedSecurityPolicy.preconfiguredExprIds:"id921150"
```

### Reading a hit

Key fields on `enforcedSecurityPolicy` / `previewSecurityPolicy`:

- `preconfiguredExprIds` — **which OWASP rule** matched, e.g. `owasp-crs-v030301-id921150-protocolattack`.
  This is the ID you opt out with.
- `priority` — `900` (sqli/xss/lfi/rfi/rce) or `901` (scannerdetection/protocolattack); `1000` = rate-limit.
- `matchedFieldType` + `matchedFieldValue` — _what_ tripped it (e.g. `ARG_NAMES` / `"\n"`), the strongest
  signal for false-positive vs real attack.
- `httpRequest.requestUrl` / `requestMethod` / `userAgent` / `remoteIp` — who and what.

### Detection: false positive vs real attack

The OWASP rules run at **sensitivity 1** (lowest paranoia) to limit false positives on Typesense's
JSON traffic, but JSON/JSONL bodies still occasionally look like attacks. Decide:

- **Likely false positive** — request is from a known consumer (`userAgent`, source ASN/IP), hits a
  normal API path (`/collections/.../documents`, `/search`), and `matchedFieldValue` is benign
  structure (a `\n` JSONL separator, a field value that merely _resembles_ SQL/HTML). Known case:
  **921150** fires on every `/documents/import` because JSONL record-separator newlines parse as arg
  names — see `exposure.tf` `local.waf_opt_out_rule_ids`.
- **Likely real** — unknown source, scanner-ish user agent, odd paths/methods, or a payload that is
  unambiguously an exploit string. Leave the rule enforcing.

### Tuning workflow

1. **Identify** the rule via `preconfiguredExprIds` and confirm it's a false positive (above).
2. **Opt the single rule out**, keeping the rest of the ruleset enforcing — add its ID to
   `local.waf_opt_out_rule_ids` in `exposure.tf` (applied via `evaluatePreconfiguredWaf`'s
   `opt_out_rule_ids`; costs no extra advanced-rule quota), then apply. Prefer this over dropping a
   whole ruleset or lowering sensitivity.
3. **Rolling out new rules safely:** keep `var.waf_preview = true` (default), watch the
   `previewSecurityPolicy.outcome="DENY"` query for a representative period, opt out the false
   positives, then set `waf_preview = false` in the stack to enforce.
4. **Rate-limit 429s** (`priority 1000`): not a WAF rule — a client exceeded 600 req/min/IP and is
   banned for 300s. Expected under a hammering client (see "Requests overloaded"); raise the threshold
   in `exposure.tf` only if a legitimate consumer is being limited.

---

## Recovery scenarios

- **Single node / zone loss:** expected — 3-node quorum + one-pod-per-zone tolerates it; the operator
  reschedules and the node rejoins. No action unless quorum is lost.
- **Disk full:** grow PVCs (Disk-high triage). PVCs use `reclaim_policy=Retain`, so data survives pod churn.
- **Cluster won't recover quorum:** follow the TyKO recovery flow (operator forces single-node mode, then
  re-adds members). See the [operator docs](https://akyriako.github.io/typesense-operator-docs/). Snapshots in
  the CMEK GCS bucket (`dr.tf`) allow a local restore — see below.
- **Region loss (DR):** see "Regional outages" below. The snapshot bucket is multi-region `US`,
  so the old-primary's snapshots stay readable through a regional outage — snapshot-restore is
  usually the fast path, with reindex from source as the no-staleness fallback.

### Regional outages

**A full `us-central1` outage is out of scope for this component's day-to-day HA story.**
The 3-zone Raft quorum + regional GKE + per-zone PVCs + 6h CMEK snapshots all handle node and
single-zone failures; they do not survive losing the entire region.

**Why no warm LB failover?** The org policy `constraints/compute.disableGlobalCloudArmorPolicy`
forbids global Cloud Armor (see `exposure.tf`), which forces a **regional** ALB + regional cert +
regional static IP. There is no way to put a global anycast IP / GCLB in front of this service.

Recovery shape ≈ infra prep + DNS propagation + **data restore**. Two restore paths:

- **Snapshot restore (preferred when a recent snapshot exists).** The snapshot bucket is a
  multi-region `US` GCS bucket (and its KMS key is in the multi-region `us` keyring), so the old
  primary's bucket remains globally readable even when its home region is the thing that's down.
  Copy the latest tarball into the failed-over stack's bucket and follow the in-region "Restore
  from a Raft snapshot" flow. RTO ≈ cluster bring-up + restore. Cost: up to ~6h of write
  staleness vs. the moment of failure (the snapshot cadence).
- **Reindex from source (when no usable snapshot exists, or when staleness is unacceptable).**
  Trigger the consumer-owned reindex pipeline against the new endpoint. RTO is whatever the
  reindex takes — typically hours.

The standby tier exists to cut the infra-prep window from ~20 to 40 min to ~5 min (barring index time)

#### Standby setup (must be done BEFORE an outage — one-time per env)

The standby tier only saves time if its cert DNS authorization has been **pre-validated**. Each
`google_certificate_manager_dns_authorization` resource produces its OWN validation CNAME — the
secondary's is different from the primary's, and the cert won't go ACTIVE during failover until
that CNAME resolves in `recidiviz.org`.

```bash
# Read the secondary's validation CNAME after the initial standby apply.
atmos terraform output apps/typesense--secondary -s recidiviz-dashboard-<env>--typesense \
  cert_dns_authorization_record
# → { name = "_acme-challenge.typesense-staging.recidiviz.org.",
#     type = "CNAME",
#     data = "<random>.<random>.dns-auth.cloud.goog." }
```

Publish that record to the recidiviz.org zone (system-of-record managed outside this project).
Once it's in place, the cert will go ACTIVE within ~minutes of any future failover apply. If you
skip this step, expect ≥30 min added to the RTO while the cert provisions during the incident.

#### If a standby instance IS deployed (preferred path)

Each environment can run a sibling component instance `apps/typesense--secondary` in a fallback
region with `mode: standby` — most resources are already provisioned (regional IP, KMS rings,
snapshot bucket, cert DNS auth, snapshotter GSA + WI binding, Cloud Router/NAT). The GKE cluster,
operator + workloads, Gateway/LB/cert, Cloud Armor, monitoring policies, and CronJobs are all
`count = 0` until the mode flips. Both instances live in the same stack file —
`stacks/typesense/recidiviz-dashboard-<env>.yaml`.

1. **Confirm region-down.** GCP status page + your own per-region probes. If `us-central1` is
   partially degraded (not down), prefer cluster-local recovery — a DNS swap is hard to roll back.
2. **Flip the mode (monitoring deferred).** Edit `stacks/typesense/recidiviz-dashboard-<env>.yaml`:
   under the `apps/typesense--secondary` block, change `mode: standby` to `mode: primary` **and add
   `monitoring_enabled: false`**. The alert policies/dashboard reference GMP metrics that don't exist
   until the operator's exporter + blackbox probe have been scraped, so they're enabled on a second
   apply (step 7) once metrics are flowing. Commit on a hotfix branch.
3. **Plan + apply against the `--secondary` instance.**
   ```bash
   atmos terraform plan  apps/typesense--secondary -s recidiviz-dashboard-<env>--typesense
   ```
   **Review the plan before applying.** Expected: _create_ GKE cluster + node pool + namespaces +
   operator + TypesenseCluster + Gateway + cert + Cloud Armor (policy + 3 rules) + snapshot/compact
   CronJobs. With `monitoring_enabled: false` (step 2) the alert policies + dashboard are **not** in
   this plan — they come in step 7. **Unchanged**: IP, KMS key rings + keys,
   snapshot bucket, cert DNS authorization, GSA + WI binding, Cloud Router/NAT. **Zero destroys.**
   If the plan shows any destroy action, _stop_ — naming or state binding has drifted from what
   this runbook assumes.
   ```bash
   atmos terraform apply apps/typesense--secondary -s recidiviz-dashboard-<env>--typesense
   ```
   Cluster bring-up + cert validation typically take ~10–15 min (assuming the CNAME from the
   "Standby setup" section above is already published).
4. **Cert validation.** With the pre-published CNAME, the managed cert should go ACTIVE without
   manual DNS work:
   ```bash
   gcloud certificate-manager certificates describe typesense-<fallback-region>-cert \
     --location <fallback-region>
   ```
   If it sits in PROVISIONING > 10 min, the validation CNAME wasn't pre-published — re-read the
   secondary's `cert_dns_authorization_record` output and add it now (then wait for propagation).
5. **DNS A-record swap.** Update the `typesense[-staging].recidiviz.org` A record in the
   recidiviz.org system of record from the primary `endpoint_ip` to the failed-over instance's IP:
   ```bash
   atmos terraform output apps/typesense--secondary -s recidiviz-dashboard-<env>--typesense \
     endpoint_ip
   ```
   The A record's TTL controls how fast clients see this — confirm the current TTL with the zone
   owner before failover so you know the cutover window.
6. **Restore data.** Two paths — pick based on whether the old-primary's snapshot bucket has a
   recent-enough tarball and whether the ~snapshot-interval of staleness is acceptable:

   **a. Snapshot restore (faster, may lose up to 6h of writes).**

   ```bash
   # The old-primary's bucket is multi-region US, so it's still readable.
   PROJECT=<project>
   OLD_PRIMARY_REGION=<original-primary-region>
   NEW_PRIMARY_REGION=<failed-over-region>
   OLD_BUCKET="${PROJECT}-typesense-snapshots-${OLD_PRIMARY_REGION}"
   NEW_BUCKET="${PROJECT}-typesense-snapshots-${NEW_PRIMARY_REGION}"
   gcloud storage ls "gs://$OLD_BUCKET/" | tail
   LATEST=<typesense-YYYYMMDDTHHMMSSZ.tar.gz from that listing>
   gcloud storage cp "gs://$OLD_BUCKET/$LATEST" "gs://$NEW_BUCKET/restore-$LATEST"
   ```

   Then follow "Restore from a Raft snapshot" below (step 2b) against the new cluster.

   **b. Reindex from source (no staleness, but RTO is the reindex time).** Trigger the consumer's
   reindex pipeline against the new endpoint.

7. **Enable monitoring.** Once the cluster is serving, confirm the operator metrics are flowing —
   in Metrics Explorer (PromQL) the `probe_success` and `typesense_stats_*` series should be
   present (give the first scrape ~1–2 min). Then remove the `monitoring_enabled: false` line you
   added in step 2 (or set it to `true`) and re-apply, which creates the alert policies + dashboard:
   ```bash
   atmos terraform apply apps/typesense--secondary -s recidiviz-dashboard-<env>--typesense
   ```
   Confirm the policies under Cloud Monitoring → Alerting and open the dashboard via the
   `dashboard_url` output.
8. **Post-incident: fail back (optional).** When `us-central1` recovers, decide whether to fail
   back. If yes: flip `mode` back to `standby` on the `--secondary` block and apply (this
   _destroys_ the cluster + workloads in the fallback region but keeps the supporting infra),
   then update the DNS A record back to the primary `endpoint_ip`. Re-verify everything before
   reusing the fallback for another rotation.

#### If no standby instance is deployed (cold rebuild)

Same idea, longer infra-prep window: deploy a fresh `apps/typesense` instance in a new region
(add a new component block to the env stack, or create a fresh stack), publish the cert
validation CNAME when the `cert_dns_authorization_record` output appears, wait for cert ACTIVE,
then DNS swap + reindex. Plan on ~30–60 min of cluster/cert provisioning before the reindex can
start. See [README.md](./README.md) for full greenfield deployment instructions.

### Restore from a Raft snapshot

The `typesense-snapshot` CronJob writes one gzipped tarball per run to
`gs://<project>-typesense-snapshots-<region>/typesense-<TS>.tar.gz` (CMEK-encrypted,
versioned, 30-day lifecycle). Each tarball is the leader's Raft snapshot directory
as captured from `/usr/share/typesense/data/snapshots/<TS>/` on the leader pod's PVC.

The data dir lives **inside the typesense pod** — every restore step that touches
`/usr/share/typesense/data/...` has to run inside a typesense container. From your
workstation that means piping through `kubectl exec`.

**1. Pick a snapshot.**

```bash
gcloud storage ls gs://recidiviz-dashboard-<env>-typesense-snapshots-us-central1/
```

**2a. Sanity-check the snapshot off-cluster (recommended first step).**

This is the safest way to confirm a snapshot is good before touching the running
cluster. No kubectl exec, no risk to prod.

```bash
# Download + extract locally.
gcloud storage cp gs://.../typesense-<TS>.tar.gz /tmp/typesense-<TS>.tar.gz
mkdir -p /tmp/typesense-restore && tar -xzf /tmp/typesense-<TS>.tar.gz -C /tmp/typesense-restore

# Run a one-off Typesense pointed at the extracted dir.
docker run --rm -p 8108:8108 \
  -v /tmp/typesense-restore:/data \
  typesense/typesense:30.2 \
  --data-dir=/data --api-key=dev --enable-cors

# Query a known collection to confirm.
curl -sS -H 'X-TYPESENSE-API-KEY: dev' http://localhost:8108/collections
```

**2b. Restore back into the live cluster.**

This streams the tarball from GCS through `kubectl exec` into the _typesense
container's_ PVC — the only place where `/usr/share/typesense/data/...` actually
exists. The typesense container has `tar` (Ubuntu base) but no `gcloud`/`curl`, so
`gcloud` runs on your workstation and the bytes flow through stdin.

```bash
# Identify the leader so the restore lands on the right pod's PVC.
for P in typesense-sts-0 typesense-sts-1 typesense-sts-2; do
  STATE=$(kubectl -n typesense exec deploy/blackbox-exporter -- wget -qO- \
    "http://$P.typesense-sts-svc.typesense.svc.cluster.local:8108/debug" \
    -H "X-TYPESENSE-API-KEY: $(kubectl -n typesense get secret typesense-admin-api-key -o jsonpath='{.data.typesense-api-key}' | base64 -d)" \
    | sed -n 's/.*"state":[[:space:]]*\([0-9]\+\).*/\1/p')
  [ "$STATE" = "1" ] && LEADER="$P" && break
done
echo "leader: ${LEADER:?no leader found}"

# Stream GCS → kubectl exec → tar (inside the leader's typesense container).
gcloud storage cp gs://.../typesense-<TS>.tar.gz - \
  | kubectl -n typesense exec -i "$LEADER" -c typesense -- \
      tar -xzf - -C /usr/share/typesense/data/snapshots
```

After 2b, follow the TyKO operator's recovery flow to make Typesense rebuild from
the snapshot directory — that's operator-specific and involves toggling the
`TypesenseCluster` CR into single-node recovery mode, then letting it re-add the
other peers. See the [operator docs](https://akyriako.github.io/typesense-operator-docs/)
and the [Typesense snapshot docs](https://typesense.org/docs/latest/api/cluster-operations.html#create-snapshot-for-backups).

## Tuning the alerts

Edit `var.monitoring` in the stack (`stacks/typesense/recidiviz-dashboard-<env>.yaml`) and re-apply.
To change routing (page vs email), swap a policy's `notification_channels` between `local.notification_channels`
and `local.warning_channels` in `monitoring.tf`.
