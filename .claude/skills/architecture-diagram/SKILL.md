---
name: architecture-diagram
description:
  Create a Mermaid architecture diagram for an app in this monorepo. Use when
  the user asks for an architecture diagram, system diagram, or wants to
  visualize how an app's components fit together.
---

# Skill: Architecture Diagram

## Overview

Creates a Mermaid `flowchart TD` diagram for an app in this monorepo, covering
infrastructure, data flows, auth, storage, external services, and observability.
Diagrams are intended to be pasted into Notion or other Mermaid-compatible renderers.

## Instructions

### Step 1: Explore the App

Spawn an Explore agent to understand the app's architecture. Target:

- **App structure**: `apps/<app>/` — frontend, backend, jobs, workers
- **Prisma schema**: `libs/@<app>/prisma/prisma/schema.prisma` — data models
- **Backend routes**: tRPC routers, Fastify routes, REST endpoints
- **Auth**: Auth0 config, JWT verification, any non-standard auth setup beyond
  the standard Auth0 OIDC flow (e.g. custom claims, additional IdP integrations)
- **Web client hosting**: Check for Firebase config files (`firebase.json`,
  `.firebaserc`, `firebaseHosting` in `project.json`) — if present, the web app
  is deployed to Firebase Hosting
- **Infrastructure**: `libs/atmos/components/terraform/apps/<app>/` — Cloud Run,
  Cloud SQL, GCS buckets, Pub/Sub, Cloud Tasks, Workflows, Scheduler
- **Terraform vendor modules** referenced (especially `cloud-sql-instance/main.tf`
  and `vendor/submodules/cloud-storage-bucket/main.tf`) for encryption, SSL mode,
  logging, and backup configs
- **BigQuery transfer**: Check `libs/atmos/components/terraform/postgres-bq-data-transfer/`
  and whether `create_bigquery_connection` is set to `true` for this app's Cloud SQL
  module, or whether the `postgres-bq-data-transfer` component is instantiated for
  this app in any stack config
- **External services**: API clients for LLMs, transcription, error monitoring,
  notifications, CDNs
- **Observability**: Sentry, Cloud Logging, Stackdriver, Slack notifications

### Step 2: Ask Clarifying Questions Before Diagramming

Do not guess about anything security- or compliance-relevant. The following
facts are known for all apps in this monorepo and do NOT need to be asked:

- **Firebase Hosting**: determined from the code in Step 1
- **Auth0 / SSO**: all apps use Auth0 as the OIDC broker, supporting SAML,
  OIDC, and Azure AD federation with state IdPs. MFA is enforced by the state
  IdP, not by Recidiviz. Only ask if Step 1 reveals something non-standard.
- **Postgres → BQ transfer**: determined from the Terraform in Step 1

Always ask if unsure about:

1. **Encryption**: Check the Terraform — does `encryption_key_id` get a non-null
   value for Cloud SQL? Do GCS bucket modules receive `encryption_key_names`? If
   the variable exists but is never set, it's Google-managed encryption (say
   "Google default encryption", not "GMEK" or "CMEK").
2. **Data flows**: Any cross-project GCS writes? Where does import/ETL data
   originate and which bucket does it land in?
3. **External services**: Are multiple listed providers equivalent peers, or is
   one a fallback? Don't label one "alt" unless confirmed.
4. **Gaps**: If the request asks for something (e.g. DLP, malware scanning, WAF)
   that isn't in the code, ask whether it's implemented elsewhere or should be
   flagged as not implemented.

### Step 3: Build the Diagram

Use `flowchart TD` with these conventions:

**Shapes by entity type:**

| Entity type               | Mermaid syntax         | Color class   |
| ------------------------- | ---------------------- | ------------- |
| Client apps (web, mobile) | `["label"]` rectangle  | `:::client`   |
| Auth / IdP                | `["label"]` rectangle  | `:::auth`     |
| Compute (Cloud Run, jobs) | `["label"]` rectangle  | `:::compute`  |
| GCS buckets               | `[("label")]` cylinder | `:::storage`  |
| Databases (Cloud SQL, BQ) | `[("label")]` cylinder | `:::db`       |
| Secrets (Secret Manager)  | `["label"]` rectangle  | `:::secrets`  |
| Queues / event triggers   | `["label"]` rectangle  | `:::queue`    |
| Observability             | `["label"]` rectangle  | `:::logging`  |
| External services         | `["label"]` rectangle  | `:::external` |

**Color palette (always include at bottom of diagram):**

```
classDef client fill:#dbeafe,stroke:#3b82f6,color:#1e3a5f
classDef auth fill:#ede9fe,stroke:#7c3aed,color:#2e1065
classDef compute fill:#dcfce7,stroke:#16a34a,color:#14532d
classDef storage fill:#fef9c3,stroke:#ca8a04,color:#713f12
classDef db fill:#fde8d8,stroke:#ea580c,color:#7c2d12
classDef secrets fill:#fce7f3,stroke:#db2777,color:#831843
classDef queue fill:#e0f2fe,stroke:#0284c7,color:#0c4a6e
classDef logging fill:#f1f5f9,stroke:#64748b,color:#1e293b
classDef external fill:#f3f4f6,stroke:#9ca3af,color:#374151
```

**Node labels:**

- Use `<br/>` for line breaks inside labels — never `\n`
- Include key config details in the node itself (region, encryption, SSL mode,
  TTL policy, etc.) rather than as separate annotation nodes
- For region: note it per-node only for regional resources; omit for global
  services (Pub/Sub, Secret Manager)
- Say "Google default encryption" for Google-managed keys; "CMEK (Cloud KMS)"
  only if a KMS key ID is actually wired up in Terraform

**Edge labels:**

- No parentheses `()` inside `|...|` edge labels — Notion's parser rejects them.
  Write "15-min expiry" not "(15 min)"
- Use `&` to fan-out identical edges: `MOB & WEB -->|SSO login| AUTH0`
- Use dotted lines `-.->` for optional, logging, or out-of-band flows
- Consolidate: if multiple similar services make the same call, merge them into
  one node rather than repeating edges

**Subgraphs:**

- One subgraph per GCP project boundary (label with project name, not region)
- Separate subgraphs for: Officer Access, Identity & Access, each GCP project,
  External Services
- Do not label a subgraph with a region — regions belong on individual nodes

**Merging similar nodes:**

- Consolidate async pipeline steps (e.g. multiple Cloud Tasks queues) into a
  single pipeline node when the individual queues aren't meaningfully distinct
  for the audience
- Consolidate equivalent peer services (e.g. two transcription providers) into
  one node listing both

### Step 4: Present the Diagram

Output the diagram in a fenced `mermaid` code block.

After the diagram, add a short notes section covering:

- Encryption status (CMEK vs Google-managed, for each storage type)
- Any security controls that were requested but are not currently implemented
- Any notable assumptions made

### Step 5: Iterate

The user will likely provide feedback. Common fixes to watch for:

- Data flow corrections (wrong direction, missing hop, wrong bucket name)
- Terminology ("Google default encryption" not "GMEK"; "SSO login" not "OIDC login")
- Removing overly-specific details the user doesn't want shown
- Clarifying ambiguous edge labels
- Renderer-specific issues (Notion rejects parentheses in edge labels)
