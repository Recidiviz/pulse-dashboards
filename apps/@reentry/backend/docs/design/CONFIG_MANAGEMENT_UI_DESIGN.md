# Config Management Module - Design Document

**Status:** Implemented v2.1 (UI Enhancements)
**Author:** Engineering Team
**Date:** January 2026
**Last Updated:** January 29, 2026
**Stakeholders:** Engineering, Product Management

> **Note:** This document reflects the simplified lifecycle model (DRAFT → ACTIVE → INACTIVE)
> and recent UI enhancements including syntax highlighting, real-time validation, and
> improved user experience for config management operations.

---

## 1. Executive Summary

This document proposes a **Config Management module** within the existing Reentry application to replace the current developer-centric YAML/migration workflow. The new module will be accessible via a "Config" or "Settings" section in the staff dashboard, enabling Product Managers and other non-technical stakeholders to create, edit, and deploy assessment and output configurations without requiring Git access, YAML editing skills, or running CLI commands.

### Goals

1. **Democratize config management** - Enable PMs to create and modify configs independently
2. **Maintain data integrity** - Preserve immutability, version tracking, and audit trails
3. **Simplify multi-environment deployment** - Export/import YAML to move configs between environments
4. **Reduce deployment friction** - Decouple config changes from code deployments
5. **Improve visibility** - Dashboard for config status and version history

### Non-Goals

- Real-time config changes (configs still require explicit activation)
- Self-service environment creation
- Config templating/inheritance (future consideration)

---

## 2. Current System Analysis

### How It Works Today

```
Developer → Edit YAML → Run migration generator → Git commit → Deploy → Alembic migration runs
```

### Pain Points

| Issue | Impact |
|-------|--------|
| Requires developer involvement | PMs blocked on engineering capacity |
| YAML syntax errors | Config failures discovered late in process |
| Git/CLI knowledge required | High barrier to entry for non-devs |
| Tied to code deployments | Can't update configs without full deploy |
| No environment visibility | Hard to know which config is active where |
| No preview/testing in UI | Must deploy to test changes |

### What Works Well (Preserve These)

| Principle | Why It Matters |
|-----------|----------------|
| **Immutability** | Historical intakes always reference their exact original config |
| **Version tracking** | Audit trail of all changes over time |
| **Code normalization** | Consistent lookups regardless of input format |
| **Active version control** | Only one version active per state/code combination |
| **Validation before activation** | Catches errors early |

---

## 3. Proposed Architecture

### 3.1 Integration with Existing App

The Config Management module will be built as an **internal feature** within the existing Reentry application:

```
apps/@reentry/
├── backend/
│   └── app/
│       ├── routes/
│       │   ├── config_management_router.py    ← NEW: Config CRUD & activation
│       │   └── ... (existing routers)
│       ├── services/
│       │   └── config_management/             ← NEW: Business logic
│       │       ├── __init__.py
│       │       ├── validation.py
│       │       ├── import_export.py
│       │       └── audit.py
│       └── models/
│           ├── assessment_config.py           ← MODIFIED: Add status, audit fields
│           └── output_config.py               ← MODIFIED: Add status, audit fields
│
└── frontend/
    └── app/
        ├── (protected)/
        │   └── config/                        ← NEW: Config management pages
        │       ├── page.tsx                   # List/dashboard view
        │       ├── [id]/
        │       │   └── page.tsx               # Detail/edit view
│       └── components/
│           ├── ConfigEditor.tsx
│           ├── ConfigList.tsx
│           ├── ImportDropzone.tsx
│           └── AuditLog.tsx
        └── components/
            └── Navbar/
                └── Navbar.tsx                 ← MODIFIED: Add "Config" link
```

### 3.2 High-Level Data Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     Reentry Staff Dashboard                              │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────────────────────┐ │
│  │ Clients │  │ Intakes │  │ Plans   │  │ Config Management (NEW)    │ │
│  └─────────┘  └─────────┘  └─────────┘  │  • Assessment Configs      │ │
│                                          │  • Output Configs          │ │
│                                          │  • Import/Export           │ │
│                                          │  • Audit Log               │ │
│                                          └─────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                   Reentry Backend (FastAPI)                              │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ /api/config-management/*   (NEW routes)                          │   │
│  │  • CRUD for assessment & output configs                          │   │
│  │  • Validation service                                            │   │
│  │  • Import/Export as YAML                                         │   │
│  │  • Audit logging                                                 │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Existing routes (unchanged)                                      │   │
│  │  • /intake/* • /clients/* • /plans/* • etc.                     │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         PostgreSQL Database                              │
│  ┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐   │
│  │ assessmentconfig  │  │ outputconfig      │  │ config_audit_log  │   │
│  │ (modified)        │  │ (modified)        │  │ (NEW)             │   │
│  └───────────────────┘  └───────────────────┘  └───────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.3 Authentication & Authorization

Uses the **existing Auth0 integration**:

```python
# Backend: app/routes/config_management_router.py
from app.auth.auth_core import get_auth_user_context

router = APIRouter(prefix="/config-management", tags=["Config Management"])

@router.get("/assessments")
async def list_assessment_configs(
    auth_user_context=Depends(get_auth_user_context),
    session: AsyncSession = Depends(get_session),
):
    # Check if internal user (Recidiviz staff only)
    if not auth_user_context.email.endswith("@recidiviz.org"):
        raise HTTPException(status_code=403, detail="Access denied")
    ...
```

```typescript
// Frontend: app/(protected)/config/page.tsx
import { useAuth } from "@/lib/auth/authContext";
import { isInternalUser } from "@/lib/auth/permissions";

export default function ConfigManagementPage() {
  const { userEmail } = useAuth();

  if (!isInternalUser(userEmail)) {
    return <AccessDeniedState message="Config management is only available to Recidiviz staff." />;
  }

  return <ConfigDashboard />;
}
```

### 3.4 Core Concepts

#### Config Lifecycle States (Simplified)

The config lifecycle uses a simple three-state model:

```
┌──────────┐                  ┌──────────┐
│  DRAFT   │────Activate────▶│  ACTIVE  │
└──────────┘                  └──────────┘
                                   │
                                   │ Superseded by new version
                                   │ or manually deactivated
                                   ▼
                              ┌──────────┐
                              │ INACTIVE │
                              └──────────┘
                                   │
                                   │ Can be reactivated
                                   ▼
                              ┌──────────┐
                              │  ACTIVE  │
                              └──────────┘
```

| State | Meaning | Editable | In Use by Application |
|-------|---------|----------|----------------------|
| `DRAFT` | Work in progress | ✅ Yes | ❌ No |
| `ACTIVE` | Currently used by application | ❌ No | ✅ Yes |
| `INACTIVE` | Previously active, now replaced | ❌ No | ❌ No |

**Key behaviors:**
- Only **one version per config code** can be `ACTIVE` at a time
- When you activate a new version, the previous active version automatically becomes `INACTIVE`
- `INACTIVE` versions can be reactivated if needed (e.g., rollback scenario)
- Deactivating an active config will leave **no active config** for that code (use with caution)

#### Environment Model (Import/Export)

Each environment is **fully isolated** with its own database. Configs move between environments via YAML export/import:

```
┌─────────────────────────────────────────────────────────────┐
│              STAGING Environment                             │
│  Config: UT-CCCI                                            │
│  ┌──────────┬────────────┬──────────────────────────────┐  │
│  │ Version  │ Status     │ Notes                        │  │
│  ├──────────┼────────────┼──────────────────────────────┤  │
│  │ v0       │ inactive   │ Superseded by v1             │  │
│  │ v1       │ active ✓   │ Currently serving            │  │
│  │ v2       │ draft      │ Work in progress             │  │
│  └──────────┴────────────┴──────────────────────────────┘  │
│                                                             │
│  [Export v1 as YAML] ─────────────────┐                    │
└───────────────────────────────────────┼─────────────────────┘
                                        │
                                  ┌─────▼─────┐
                                  │ YAML File │
                                  │UT-CCCI-v1 │
                                  └─────┬─────┘
                                        │
┌───────────────────────────────────────┼─────────────────────┐
│              PRODUCTION Environment   │                      │
│                                       │                      │
│  [Import YAML] ◀──────────────────────┘                     │
│                                                             │
│  Config: UT-CCCI                                            │
│  ┌──────────┬────────────┬──────────────────────────────┐  │
│  │ Version  │ Status     │ Notes                        │  │
│  ├──────────┼────────────┼──────────────────────────────┤  │
│  │ v0       │ active ✓   │ Currently serving            │  │
│  │ v1       │ draft      │ Just imported, review needed │  │
│  └──────────┴────────────┴──────────────────────────────┘  │
│                                                             │
│  ── After activating v1 ──                                  │
│  ┌──────────┬────────────┬──────────────────────────────┐  │
│  │ v0       │ inactive   │ Superseded                   │  │
│  │ v1       │ active ✓   │ Now serving                  │  │
│  └──────────┴────────────┴──────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**Key principle:** Environments don't "know" about each other. The YAML file is the bridge.

### 3.5 Database Schema Changes

These changes are applied to the **existing Reentry database** via standard Alembic migrations.

With the YAML import/export approach, the schema changes are minimal - no complex activation tables needed.

#### Modified Tables

```sql
-- Add status and audit fields to assessmentconfig
ALTER TABLE assessmentconfig ADD COLUMN status VARCHAR(20) DEFAULT 'active';
-- Possible values: 'draft', 'active', 'inactive'
-- Note: Existing configs default to 'active' based on is_active flag

-- Add audit/tracking fields
ALTER TABLE assessmentconfig ADD COLUMN created_by_email VARCHAR(255);
ALTER TABLE assessmentconfig ADD COLUMN activated_at TIMESTAMP;
ALTER TABLE assessmentconfig ADD COLUMN activated_by_email VARCHAR(255);

-- Import tracking (optional, for audit purposes)
ALTER TABLE assessmentconfig ADD COLUMN imported_from_env VARCHAR(50);  -- 'staging', 'dev', etc.
ALTER TABLE assessmentconfig ADD COLUMN import_hash VARCHAR(64);        -- SHA256 of source YAML

-- Same changes for outputconfig
ALTER TABLE outputconfig ADD COLUMN status VARCHAR(20) DEFAULT 'active';
ALTER TABLE outputconfig ADD COLUMN created_by_email VARCHAR(255);
ALTER TABLE outputconfig ADD COLUMN activated_at TIMESTAMP;
ALTER TABLE outputconfig ADD COLUMN activated_by_email VARCHAR(255);
ALTER TABLE outputconfig ADD COLUMN imported_from_env VARCHAR(50);
ALTER TABLE outputconfig ADD COLUMN import_hash VARCHAR(64);
```

#### New Tables

```sql
-- Simple audit log for tracking all config operations
CREATE TABLE config_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_type VARCHAR(20) NOT NULL,        -- 'assessment' or 'output'
    config_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL,             -- 'created', 'updated', 'activated',
                                             -- 'deactivated', 'imported', 'exported'
    performed_by_email VARCHAR(255) NOT NULL,
    details JSONB,                           -- { source_env, import_hash, previous_version, etc. }
    created_at TIMESTAMP DEFAULT NOW()
);

-- Index for efficient queries
CREATE INDEX idx_config_audit_log_config ON config_audit_log(config_type, config_id);
CREATE INDEX idx_config_audit_log_action ON config_audit_log(action, created_at);
```

#### Key Points

- **No new tables for activation** - uses existing `is_active` column on config tables
- **Environments are isolated** - each environment has its own database, no cross-env tables
- **Existing `is_active` column unchanged** - backward compatible with current ConfigLoader
- **Email instead of user UUID** - simpler, works across environments without shared user table
- **YAML import/export** - the bridge between environments, no cross-env API calls needed

---

## 4. API Design

All endpoints are added to the existing FastAPI app under `/config-management/*` prefix.

**Router registration in `main.py`:**
```python
from app.routes import config_management_router

app.include_router(
    config_management_router.router,
    prefix="/config-management",
    tags=["Config Management"]
)
```

### 4.1 Assessment Config Endpoints

```
# List & Search
GET    /config-management/assessments
       ?state_code=US_UT
       &code=CCCI
       &status=draft,active,inactive

# Get single config
GET    /config-management/assessments/{id}

# Get currently active config
GET    /config-management/assessments/active
       ?state_code=US_UT
       &code=CCCI

# Create new draft
POST   /config-management/assessments
       Body: { state_code, code, display_name, description, config_yaml }

# Create new version from existing
POST   /config-management/assessments/{id}/new-version
       Body: { config_yaml }  # Optional, copies from source if not provided

# Update draft
PATCH  /config-management/assessments/{id}
       Body: { display_name?, description?, config_yaml? }
       Note: Only allowed for DRAFT status

# Validate config (without saving)
POST   /config-management/assessments/validate
       Body: { config_yaml }

# Activate (sets status=active, previous active version becomes inactive)
POST   /config-management/assessments/{id}/activate
       Note: Can activate from DRAFT or INACTIVE status

# Deactivate (sets status=inactive, leaves NO active config!)
POST   /config-management/assessments/{id}/deactivate
       Note: Use with caution - emergency only

# Get version history
GET    /config-management/assessments/{id}/history

# Compare two versions
GET    /config-management/assessments/compare
       ?source={id}&target={id}

# Export as YAML file
GET    /config-management/assessments/{id}/export
```

### 4.2 Output Config Endpoints

```
# Same pattern as assessment configs
GET    /config-management/outputs
POST   /config-management/outputs
GET    /config-management/outputs/{id}
PATCH  /config-management/outputs/{id}
POST   /config-management/outputs/{id}/activate
POST   /config-management/outputs/{id}/deactivate
GET    /config-management/outputs/{id}/export
POST   /config-management/outputs/import
POST   /config-management/outputs/import/validate
```

### 4.3 Import/Export Endpoints

```
# Export config as YAML file download
GET    /config-management/assessments/{id}/export
       Response: YAML file download
       Headers: Content-Disposition: attachment; filename="UT-CCCI-v2.yaml"

# Validate import (preview without saving)
POST   /config-management/assessments/import/validate
       Body: multipart/form-data with YAML file
       Response: {
           "valid": true,
           "parsed_config": { state_code, code, version, ... },
           "existing_config": { id, version } | null,
           "warnings": ["Version 2 already exists, will create v3"],
           "errors": []
       }

# Import and create draft
POST   /config-management/assessments/import
       Body: multipart/form-data with YAML file
       Query: ?auto_activate=false
       Response: {
           "id": "...",
           "status": "draft",
           "version": 3,
           "message": "Imported as draft. Review and activate when ready."
       }

# Import and activate in one step (for prod deployments)
POST   /config-management/assessments/import?auto_activate=true
       Body: multipart/form-data with YAML file
       Response: {
           "id": "...",
           "status": "active",
           "version": 3,
           "previous_active_version": 2
       }
```

### 4.4 Audit Endpoints

```
# Get audit log
GET    /config-management/audit
       ?config_type=assessment
       &config_id={id}
       &action=activated
       &from_date=2026-01-01
       &to_date=2026-01-31
```

---

## 5. UI Design

### 5.1 Navigation Integration

Add "Config" link to existing Navbar (visible only to Recidiviz staff):

**File: `apps/@reentry/frontend/app/components/Navbar/Navbar.tsx`**
```tsx
// Add to navigation items (conditionally shown)
{isInternalUser(userEmail) && (
  <NavLink href="/config" icon={<SettingsIcon />}>
    Config
  </NavLink>
)}
```

### 5.2 Main Dashboard (`/config`)

**File: `apps/@reentry/frontend/app/(protected)/config/page.tsx`**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ← Dashboard    Config Management              [Import YAML] [+ New Config] │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Current Environment: STAGING                                               │
│                                                                             │
│  Filter: [All States ▼] [All Codes ▼] [All Status ▼]    🔍 Search...       │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Assessment Configs                                                   │   │
│  ├──────────────────┬─────────┬────────────┬───────────────────────┬───┤   │
│  │ Name             │ Version │ Status     │ Actions               │   │   │
│  ├──────────────────┼─────────┼────────────┼───────────────────────┼───┤   │
│  │ UT-CCCI          │ v3      │ 🟡 Draft   │ Edit                  │ ▶ │   │
│  │ UT-CCCI          │ v2      │ 🟢 Active  │ Export                │ ▶ │   │
│  │ UT-CCCI          │ v1      │ ⚪ Archived │ Export                │ ▶ │   │
│  │ ID-FACR          │ v1      │ 🟢 Active  │ Export                │ ▶ │   │
│  │ AZ-default       │ v0      │ 🟢 Active  │ Export                │ ▶ │   │
│  └──────────────────┴─────────┴────────────┴───────────────────────┴───┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Output Configs                                                       │   │
│  ├──────────────────┬─────────┬────────────┬───────────────────────┬───┤   │
│  │ Name             │ Version │ Type       │ Actions               │   │   │
│  ├──────────────────┼─────────┼────────────┼───────────────────────┼───┤   │
│  │ summary-default  │ v0      │ Summary    │ Export                │ ▶ │   │
│  │ plan-default     │ v0      │ Action Plan│ Export                │ ▶ │   │
│  │ plan-UT-APP      │ v0      │ Action Plan│ Export                │ ▶ │   │
│  └──────────────────┴─────────┴────────────┴───────────────────────┴───┘   │
│                                                                             │
│  💡 To deploy a config to another environment:                             │
│     Export as YAML → Open that environment's Config Management → Import    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.3 Config Editor View (`/config/[id]`)

**File: `apps/@reentry/frontend/app/(protected)/config/[id]/page.tsx`**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ← Back    UT-CCCI v3 (Draft)                     [Save Draft] [Publish]   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Metadata                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ State Code: [US_UT    ▼]    Code: [CCCI        ]                    │   │
│  │ Display Name: [Community Correctional Center Intake               ] │   │
│  │ Description: [Intake assessment for clients at Utah CCCs          ] │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Config Editor                              [Visual] [YAML] [Preview]      │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ metadata:                                                            │   │
│  │   state_code: US_UT                                                  │   │
│  │   code: CCCI                                                         │   │
│  │   version: 3                                                         │   │
│  │   display_name: Community Correctional Center Intake                 │   │
│  │                                                                      │   │
│  │ intake:                                                              │   │
│  │   intake_type: conversation                                          │   │
│  │   prompts:                                                           │   │
│  │     role: |                                                          │   │
│  │       Role: You are a social worker conducting...                    │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Validation                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ ✅ YAML syntax valid                                                 │   │
│  │ ✅ Schema validation passed                                          │   │
│  │ ✅ Output config references valid (summary-default-v0, plan-UT-APP) │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Referenced Output Configs                                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ • summary-default v0 (Active ✓)                                     │   │
│  │ • plan-UT-APP v0 (Active ✓)                                         │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.4 Config Detail View with Import/Export

**File: `apps/@reentry/frontend/app/(protected)/config/[id]/page.tsx`**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ← Back    UT-CCCI v2 (Active)              [Export YAML] [Deactivate]     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Version Info                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Created: Jan 15, 2026 by jane.doe@recidiviz.org                     │   │
│  │ Published: Jan 16, 2026 by jane.doe@recidiviz.org                   │   │
│  │ Activated: Jan 17, 2026 by john.smith@recidiviz.org                 │   │
│  │ Imported from: staging (hash: a1b2c3d4...)                          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Actions                                                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                      │   │
│  │  📤 Export as YAML                                                  │   │
│  │     Download this config to import into another environment         │   │
│  │     [Download UT-CCCI-v2.yaml]                                      │   │
│  │                                                                      │   │
│  │  📋 Create New Version                                              │   │
│  │     Copy this config as a new draft (v3) to make changes           │   │
│  │     [Create v3 Draft]                                               │   │
│  │                                                                      │   │
│  │  📊 Compare with Previous                                           │   │
│  │     View diff between v2 and v1                                     │   │
│  │     [View Diff]                                                     │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Config Content (read-only)                                [View YAML]     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ metadata:                                                            │   │
│  │   state_code: US_UT                                                  │   │
│  │   code: CCCI                                                         │   │
│  │   version: 2                                                         │   │
│  │   ...                                                                │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  History                                                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Jan 17, 2026 10:30 - Activated by john.smith@recidiviz.org          │   │
│  │ Jan 17, 2026 10:28 - Imported from staging by john.smith@recidiviz  │   │
│  │ Jan 16, 2026 14:00 - Exported by jane.doe@recidiviz.org (staging)   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.5 Import Config View

**File: `apps/@reentry/frontend/app/(protected)/config/import/page.tsx`**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ← Back    Import Config                                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Upload YAML File                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                      │   │
│  │     ┌─────────────────────────────────────────┐                     │   │
│  │     │                                         │                     │   │
│  │     │   📄 Drop YAML file here                │                     │   │
│  │     │      or click to browse                 │                     │   │
│  │     │                                         │                     │   │
│  │     └─────────────────────────────────────────┘                     │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ─────────────────────────── After file upload ───────────────────────────  │
│                                                                             │
│  Validation Results                                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ ✅ YAML syntax valid                                                 │   │
│  │ ✅ Schema validation passed                                          │   │
│  │ ✅ Output config references found                                    │   │
│  │ ✅ Version 3 does not exist yet                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Parsed Config Preview                                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ State: US_UT                                                         │   │
│  │ Code: CCCI                                                           │   │
│  │ Version: 3 (previous: v2)                                           │   │
│  │ Display Name: Community Correctional Center Intake                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Import Options                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ ○ Import as draft (review before activating)                        │   │
│  │ ● Import and activate immediately                                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│                                            [Cancel]  [Import Config]       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.6 YAML Editor Features

The YAML editor includes several developer-friendly features:

**Syntax Highlighting:**
- Keys are highlighted in red
- Strings are highlighted in green
- Numbers are highlighted in orange
- Booleans are highlighted in cyan
- Comments are highlighted in gray (italic)

**Copy to Clipboard:**
- One-click copy button in the top-right corner
- Visual feedback (green checkmark) when copied

**Real-time Validation (Draft Mode):**
- Debounced validation (500ms after typing stops)
- Shows "Validating YAML..." indicator while checking
- Displays detailed errors with specific line/field information
- Save button disabled until validation passes

**Tab Support:**
- Tab key inserts 2 spaces for proper YAML indentation

### 5.7 Confirmation Dialogs

Critical actions use styled modals instead of browser dialogs:

**Deactivate Config Modal:**
- Warning icon and clear title
- Explanation of consequences (no active config for this code)
- Amber warning box for emergency use case
- Cancel and "Yes, Deactivate" buttons with loading state

### 5.8 Export Filenames

Exported configs use descriptive filenames:
- Assessment configs: `assessment-{STATE}-{CODE}-v{VERSION}.yaml` (e.g., `assessment-UT-CCCI-v2.yaml`)
- Output configs: `output-{CODE}-v{VERSION}.yaml` (e.g., `output-cccap-v0.yaml`)

### 5.9 Version Sync

When creating a new version via the UI:
- The database version is auto-incremented (e.g., v1 → v2)
- The YAML metadata is automatically updated to match (version: 2)
- This keeps the YAML content and database in sync

### 5.10 Visual Editor (Future Enhancement)

For non-technical users, a visual editor that abstracts away YAML:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Config Editor                              [Visual] [YAML] [Preview]      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  📋 Intake Settings                                                [Edit]  │
│  ├── Type: Conversation                                                     │
│  │                                                                          │
│  ├── 💬 Prompts                                                    [Edit]  │
│  │   ├── Role: Social worker conducting structured intake...               │
│  │   ├── Tone: Warm, trauma-informed, professional...                      │
│  │   └── Opening Remarks: Welcome message template...                      │
│  │                                                                          │
│  └── 📑 Sections                                            [+ Add Section]│
│      ├── 1. Personal Background                                    [Edit]  │
│      │   └── Topics: family, relationships, support_system                 │
│      ├── 2. Education & Employment                                 [Edit]  │
│      │   └── Topics: education, work_history, skills                       │
│      ├── 3. Housing                                                [Edit]  │
│      │   └── Topics: current_housing, housing_history, needs               │
│      └── 4. Health & Wellness                                      [Edit]  │
│          └── Topics: physical_health, mental_health, substances            │
│                                                                             │
│  📤 Output Configs                                                         │
│  ├── Summary: summary-default v0                              [Change]     │
│  └── Action Plan: plan-UT-APP v0                              [Change]     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Access Control & Permissions

### 6.1 Simple Role Model

For MVP, use existing `isInternalUser()` check - all Recidiviz staff have full access.

| User Type | Access |
|-----------|--------|
| External users | No access to Config Management |
| Recidiviz staff (`@recidiviz.org`) | Full access |

### 6.2 Future: Granular Roles (if needed)

| Role | Description |
|------|-------------|
| `config_viewer` | Can view configs, audit logs, and export |
| `config_editor` | Can create, edit, publish, import, activate |
| `config_admin` | Can archive configs, delete drafts |

### 6.3 Production Safeguards

Since each environment is independent, safeguards are configured via environment settings:

**Production environments (`IS_PRODUCTION=true`):**
1. **Confirmation dialog** - require typing "ACTIVATE" to confirm
2. **Impact summary** - show number of active intakes that will use new config
3. **Notification** - Slack/email on config activation

**Non-production environments:**
- Standard confirmation dialog only

```python
# app/core/settings.py
class Settings(BaseSettings):
    ENV_NAME: str = "dev"
    IS_PRODUCTION: bool = False  # Set true in prod deployment
    CONFIG_CHANGE_SLACK_WEBHOOK: str | None = None
```

---

## 7. Implementation Strategy

This is an incremental addition to the existing Reentry app, not a separate system migration.

### 7.1 Phase 1: Database Schema

**Alembic migration to add new columns and audit table:**

1. Add status and audit columns to existing tables
2. Create simple audit log table
3. Keep existing `is_active` column (unchanged)

**Migration file: `alembic/versions/xxxx_add_config_management_tables.py`**

```sql
-- Add status and audit fields to assessmentconfig
ALTER TABLE assessmentconfig ADD COLUMN status VARCHAR(20) DEFAULT 'published';
ALTER TABLE assessmentconfig ADD COLUMN created_by_email VARCHAR(255);
ALTER TABLE assessmentconfig ADD COLUMN published_at TIMESTAMP;
ALTER TABLE assessmentconfig ADD COLUMN published_by_email VARCHAR(255);
ALTER TABLE assessmentconfig ADD COLUMN imported_from_env VARCHAR(50);
ALTER TABLE assessmentconfig ADD COLUMN import_hash VARCHAR(64);

-- Same for outputconfig
ALTER TABLE outputconfig ADD COLUMN status VARCHAR(20) DEFAULT 'published';
ALTER TABLE outputconfig ADD COLUMN created_by_email VARCHAR(255);
ALTER TABLE outputconfig ADD COLUMN published_at TIMESTAMP;
ALTER TABLE outputconfig ADD COLUMN published_by_email VARCHAR(255);
ALTER TABLE outputconfig ADD COLUMN imported_from_env VARCHAR(50);
ALTER TABLE outputconfig ADD COLUMN import_hash VARCHAR(64);

-- Create audit log table
CREATE TABLE config_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_type VARCHAR(20) NOT NULL,
    config_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL,
    performed_by_email VARCHAR(255) NOT NULL,
    details JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_config_audit_log_config ON config_audit_log(config_type, config_id);

-- Existing configs are already published and active - mark them accordingly
UPDATE assessmentconfig
SET status = 'published',
    published_at = updated_at
WHERE is_active = true AND status IS NULL;

UPDATE outputconfig
SET status = 'published',
    published_at = updated_at
WHERE is_active = true AND status IS NULL;
```

### 7.2 Phase 2: Backend API

**New files to create:**

```
app/routes/config_management_router.py    # API endpoints
app/services/config_management/
├── __init__.py
├── validation.py                          # YAML validation, reference checking
├── import_export.py                       # Import/export logic
└── audit.py                               # Audit logging
app/schemas/config_management.py           # Pydantic request/response models
```

**Key endpoints to implement:**
1. CRUD endpoints (list, get, create, update, delete draft)
2. Lifecycle endpoints (publish, activate, deactivate, archive)
3. **Import/Export endpoints** (validate import, import, export as YAML)
4. Audit log endpoint

Note: Activation logic is simple - just toggle `is_active` on the config and deactivate the previous active version. No separate service file needed.

**Register router in `main.py`:**
```python
from app.routes import config_management_router
app.include_router(config_management_router.router, prefix="/config-management")
```

### 7.3 Phase 3: Frontend UI

**New files to create:**

```
app/(protected)/config/
├── page.tsx                               # List/dashboard view
├── [id]/
│   └── page.tsx                           # Detail/edit view
├── new/
│   └── page.tsx                           # Create new config
├── import/
│   └── page.tsx                           # Import YAML file
└── components/
    ├── ConfigList.tsx
    ├── ConfigEditor.tsx
    ├── YamlEditor.tsx                     # Monaco or CodeMirror editor
    ├── ImportDropzone.tsx                 # Drag-and-drop YAML upload
    ├── ImportPreview.tsx                  # Show parsed config before import
    ├── ValidationStatus.tsx
    └── AuditLog.tsx
```

**Add Navbar link in `components/Navbar/Navbar.tsx`:**
```tsx
{isInternalUser(userEmail) && (
  <NavLink href="/config">Config</NavLink>
)}
```

### 7.4 Phase 4: Deprecate Old CLI Workflow

Once the UI is stable and PMs are trained:

1. Mark migration generator scripts as deprecated
2. Update `app/core/data_config/README.md` to point to UI
3. Keep YAML files in repo as reference/backup
4. Eventually remove `app/manage/generate_*_migration.py` scripts

---

## 8. Technical Considerations

### 8.1 Multi-Environment Architecture: YAML Import/Export

**Approach: YAML as the Interchange Format**

Each environment is fully isolated with its own database. YAML files serve as the portable format for moving configs between environments - the same format already used by developers today.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Staging Environment                              │
│  ┌─────────────────┐                                                    │
│  │ Config Mgmt UI  │──── Create/Edit ────▶ Database                     │
│  │                 │                                                    │
│  │                 │◀─── Export YAML ─────┐                             │
│  └─────────────────┘                      │                             │
└───────────────────────────────────────────┼─────────────────────────────┘
                                            │
                                      ┌─────▼─────┐
                                      │  YAML     │  ← Portable config file
                                      │  File     │    (same format as today)
                                      └─────┬─────┘
                                            │
┌───────────────────────────────────────────┼─────────────────────────────┐
│                         Production Environment                           │
│  ┌─────────────────┐                      │                             │
│  │ Config Mgmt UI  │◀─── Import YAML ─────┘                             │
│  │                 │                                                    │
│  │                 │──── Validate & Save ──▶ Database                   │
│  └─────────────────┘                                                    │
└─────────────────────────────────────────────────────────────────────────┘
```

**Benefits:**
- **No cross-environment networking** - environments are fully isolated
- **Familiar format** - same YAML structure developers already use
- **Version control friendly** - exported YAMLs can be committed to Git
- **Offline capable** - export, review, import at different times
- **Backward compatible** - existing YAML files can be imported directly
- **Auditable** - import creates audit log entry with source file hash

**Workflow Example:**

```
1. PM creates new config in STAGING via UI
2. PM tests config in STAGING
3. PM exports config as YAML file (downloads to their machine)
4. PM opens PROD environment's Config Management UI
5. PM imports the YAML file
6. System validates YAML, shows diff from current active version
7. PM reviews and activates in PROD
```

### 8.2 Import/Export API

```python
# Export endpoint - returns YAML file download
GET /config-management/assessments/{id}/export
    Response: YAML file download with proper filename
    Headers: Content-Disposition: attachment; filename="UT-CCCI-v2.yaml"

# Export endpoint for output configs
GET /config-management/outputs/{id}/export

# Import endpoint - accepts YAML file upload
POST /config-management/assessments/import
    Body: multipart/form-data with YAML file
    Response: {
        "valid": true,
        "config": { ... parsed config ... },
        "existing_version": 1,  # if same state_code+code exists
        "warnings": [],
        "errors": []
    }

# Import with auto-create draft
POST /config-management/assessments/import?create_draft=true
    Body: multipart/form-data with YAML file
    Response: { "id": "...", "status": "draft", ... }
```

### 8.3 Import Validation

On import, the system validates:

1. **YAML syntax** - parseable YAML
2. **Schema validation** - matches `AssessmentConfigFile` or `OutputConfigFile` Pydantic model
3. **Reference validation** - output configs referenced in assessment exist (in current env)
4. **Version conflict check** - **fail** if same state_code+code+version already exists (must increment version in YAML before importing)
5. **Content diff** - show what changed compared to previous version of same config family

```python
# app/services/config_management/import_export.py

async def validate_import(
    yaml_content: str,
    config_type: Literal["assessment", "output"],
    session: AsyncSession,
) -> ImportValidationResult:
    """Validate imported YAML without saving."""

    # 1. Parse YAML
    try:
        data = yaml.safe_load(yaml_content)
    except yaml.YAMLError as e:
        return ImportValidationResult(valid=False, errors=[f"Invalid YAML: {e}"])

    # 2. Validate against schema
    try:
        if config_type == "assessment":
            config = AssessmentConfigFile(**data)
        else:
            config = parse_output_config(data)
    except ValidationError as e:
        return ImportValidationResult(valid=False, errors=format_validation_errors(e))

    # 3. Check output config references (for assessment configs)
    if config_type == "assessment":
        missing_refs = await check_output_references(config.outputs.codes, session)
        if missing_refs:
            return ImportValidationResult(
                valid=False,
                errors=[f"Missing output configs: {', '.join(missing_refs)}"]
            )

    # 4. Check for existing version
    existing = await find_existing_config(config, session)

    return ImportValidationResult(
        valid=True,
        config=config,
        existing_version=existing.version if existing else None,
        warnings=generate_warnings(config, existing),
    )
```

### 8.4 Export Format

Exported YAML is **identical** to the current config format - clean YAML with no extra metadata:

```yaml
metadata:
  state_code: US_UT
  code: CCCI
  version: 2
  display_name: Community Correctional Center Intake
  description: Intake assessment for clients at Utah CCCs

intake:
  intake_type: conversation
  prompts:
    role: |
      Role: You are a social worker...
    # ... rest of config
```

This ensures exported configs are directly compatible with existing YAML files and can be committed to Git if desired.

### 8.5 Backward Compatibility

**Existing YAML files work directly:**
- Developers can import existing `app/core/data_config/` YAML files via UI
- No format changes required
- Migration generator scripts continue to work (deprecated but functional)

**ConfigLoader unchanged:**
- Existing `ConfigLoader.get_active_assessment_config()` works as-is
- Uses existing `is_active` column (no activation table needed for MVP)

### 8.6 Simplified Database Schema

With import/export approach, we can simplify the schema - no per-environment activation tables needed:

```sql
-- Just add status and audit fields to existing tables
ALTER TABLE assessmentconfig ADD COLUMN status VARCHAR(20) DEFAULT 'published';
ALTER TABLE assessmentconfig ADD COLUMN created_by_email VARCHAR(255);
ALTER TABLE assessmentconfig ADD COLUMN published_at TIMESTAMP;
ALTER TABLE assessmentconfig ADD COLUMN imported_from VARCHAR(50);  -- source environment
ALTER TABLE assessmentconfig ADD COLUMN import_hash VARCHAR(64);    -- SHA256 of imported YAML

-- Simple audit log
CREATE TABLE config_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_type VARCHAR(20) NOT NULL,        -- 'assessment' or 'output'
    config_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL,             -- 'created', 'updated', 'published', 'activated', 'imported', 'exported'
    performed_by_email VARCHAR(255) NOT NULL,
    details JSONB,                           -- source_env, import_hash, etc.
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 8.7 Caching Strategy

```python
class ConfigLoader:
    _assessment_cache: dict[UUID, AssessmentConfigFile] = {}

    @classmethod
    def invalidate_cache(cls, config_id: UUID):
        """Call this when a config is activated/deactivated."""
        cls._assessment_cache.pop(config_id, None)

    @classmethod
    def invalidate_all_caches(cls):
        """Call this on app startup or after bulk changes."""
        cls._assessment_cache.clear()
        cls._summary_cache.clear()
        cls._plan_cache.clear()
```

---

## 9. Testing Strategy

### 9.1 Unit Tests

- Validation service tests (valid/invalid YAML, reference checking)
- Permission checks for each action
- State transition tests (draft → published → active)
- Import validation tests (valid YAML, invalid YAML, missing references)

### 9.2 Integration Tests

- Full workflow: create → edit → publish → activate → deactivate
- Import/export round-trip: export from one config, import into new version
- Audit log verification

### 9.3 E2E Tests

- UI workflow tests (create, edit, publish, activate)
- Import workflow tests (upload, validate, preview, import)
- Permission denied scenarios
- Production safeguard dialogs

---

## 10. Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Time to deploy new config | ~2 hours (dev involvement) | ~15 minutes (self-service) |
| Config-related support tickets | ~5/week | ~1/week |
| PM self-service config changes | 0% | 80%+ |
| Config deployment errors | ~10% | <2% |

---

## 11. Design Decisions

| Decision | Resolution |
|----------|------------|
| **Version handling on import** | Preserve original version from YAML; fail if duplicate exists |
| **Diff viewer** | Both line-by-line YAML diff AND semantic diff (show what prompts/sections changed) |
| **Export format** | Clean YAML only, no metadata comments |
| **Notifications** | Slack/email only when config activated in production |
| **Bulk operations** | Not needed for MVP |

## 12. Open Questions

1. **Testing integration:** Should we integrate the existing `test-conversation` and `evaluate-summary` commands into the UI for testing before activation? (Nice-to-have, not blocking)

---

## 13. Future Enhancements

- **Visual editor** - Form-based editing without YAML knowledge
- **Config templates** - Inheritance for common patterns
- **A/B testing** - Multiple active versions with traffic splitting
- **Scheduled activations** - Deploy at specific times
- **Config analytics** - Track which configs perform better
- **Git integration** - Auto-commit exported configs to a repo for backup
- **Bulk import/export** - Zip file with multiple configs for environment setup

---

## Appendix A: Glossary

| Term | Definition |
|------|------------|
| **Config** | An assessment or output configuration stored in the database |
| **Version** | An immutable snapshot of a config (v0, v1, v2...) |
| **Draft** | An editable config that hasn't been activated yet |
| **Active** | A config that's currently serving new intakes |
| **Inactive** | A config that was previously active but has been superseded or deactivated |
| **Export** | Download a config as a YAML file for transfer to another environment |
| **Import** | Upload a YAML file to create a config in the current environment |

---

## Appendix B: Example API Responses

### List Assessment Configs

```json
GET /config-management/assessments?state_code=US_UT

{
  "items": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "state_code": "US_UT",
      "code": "ccci",
      "version": 2,
      "display_name": "Community Correctional Center Intake",
      "status": "active",
      "is_active": true,
      "created_at": "2026-01-15T10:00:00Z",
      "created_by_email": "jane.doe@recidiviz.org",
      "published_at": "2026-01-16T14:00:00Z",
      "imported_from_env": "staging",
      "import_hash": "a1b2c3d4e5f6..."
    }
  ],
  "total": 1,
  "page": 1,
  "page_size": 20
}
```

### Import Config (Validate) - Success

```json
POST /config-management/assessments/import/validate
Content-Type: multipart/form-data
file: UT-CCCI-v3.yaml

Response:
{
  "valid": true,
  "parsed_config": {
    "state_code": "US_UT",
    "code": "CCCI",
    "version": 3,
    "display_name": "Community Correctional Center Intake"
  },
  "previous_version": {
    "id": "existing-uuid",
    "version": 2
  },
  "warnings": [],
  "errors": []
}
```

### Import Config (Validate) - Duplicate Version Error

```json
POST /config-management/assessments/import/validate
Content-Type: multipart/form-data
file: UT-CCCI-v2.yaml

Response:
{
  "valid": false,
  "parsed_config": {
    "state_code": "US_UT",
    "code": "CCCI",
    "version": 2
  },
  "errors": ["Version 2 already exists for US_UT/CCCI. Please increment the version in your YAML file."]
}
```

### Import Config (Create)

```json
POST /config-management/assessments/import?auto_activate=true
Content-Type: multipart/form-data
file: UT-CCCI-v3.yaml

Response:
{
  "id": "new-config-uuid",
  "state_code": "US_UT",
  "code": "ccci",
  "version": 3,
  "status": "active",
  "is_active": true,
  "previous_active_version": 2,
  "message": "Config imported and activated. Previous active version (v2) has been deactivated."
}
```

### Export Config

```
GET /config-management/assessments/550e8400-e29b-41d4-a716-446655440000/export

Response Headers:
  Content-Type: application/x-yaml
  Content-Disposition: attachment; filename="UT-CCCI-v2.yaml"

Response Body:
  (YAML file content)
```
