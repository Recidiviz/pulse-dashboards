# Client Status View - Full Database Solution Research

## Overview

This document outlines the research and design for implementing client status computation, filtering, and sorting entirely in SQL using a database view. This represents the "maximum performance" approach where all logic is pushed to the database layer.

## Previous Implementation

### Existing `client_view`

The current `client_view` (created in migration `0d0e9f7b252d_create_client_view.py`) provides:
- `client_pseudo_id` - Client identifier
- `intake_id` - Intake ID (for intake stage only)
- `intake_status` - Intake status (for intake stage only)
- `intake_order` - Ordering within intake statuses (1-10)
- `process_stage_order` - Overall process position (10-90)
  - 10-30: Intake stage
  - 40-60: Assessment stage
  - 70-90: Plan stage

### Current Python Status Computation


``` apps/@reentry/backend/app/routes/shared_models.py
class ProcessingStatus(StrEnum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    NEEDS_RETRY = "needs_retry"
```

The `compute_processing_status()` function (in `app/utils/processing_status_utils.py`) computes a `ProcessingStatus` enum value based on:

1. **Recording/Transcription Status** (for transcription-based intakes)
   - Checks if recording execution is stuck or failed
   - Checks if recording_session.status is 'error'

2. **Assessment Execution Status**
   - Checks for stuck assessments executions
   - Checks for failed assessments

3. **Plan Creation Status**
   - Checks if plan_create execution is stuck or failed
   - Checks plan create_status

4. **Plan Generation Status** (latest generation only)
   - Checks if latest generation execution is stuck or failed

5. **In-Progress Detection**
   - Plan/generations with status 'in_progress' or 'pending'
   - Assessments task in progress
   - Recording processing task in progress

6. **Completion and Failure Logic**
   - COMPLETED: Plan create_status = 'completed'
   - NEEDS_RETRY: Various failure conditions

### Frontend Status Mapping

The `compute_frontend_status()` function maps intake status and processing status to user-facing statuses:

| Frontend Status | Criteria |
|----------------|----------|
| `new` | No intake exists |
| `intake_enabled` | intake.status = 'created' |
| `intake_in_progress` | intake.status = 'in_progress' |
| `processing` | intake completed + processing IN_PROGRESS/NOT_STARTED |
| `intake_complete` | intake completed + processing COMPLETED |
| `error` | intake.status = 'error' OR processing FAILED/NEEDS_RETRY |

## Current Implementation

The client list filtering system (`get_paginated_client_list` in `app/crud/client.py`) routes to three different handler functions based on filter complexity.

### Status Filter Enum

```python
class ClientStatusFilter(StrEnum):
    """All possible client status filter values."""
    NEW = "new"
    INTAKE_ENABLED = "intake_enabled"
    INTAKE_IN_PROGRESS = "intake_in_progress"
    PROCESSING = "processing"
    INTAKE_COMPLETE = "intake_complete"
    ERROR = "error"
```

### Handler Routing

```python
# Path 1: SQL-based filtering
if status_filter in [None, ClientStatusFilter.INTAKE_ENABLED, ClientStatusFilter.INTAKE_IN_PROGRESS]:
    return await handle_simple_status_filter(...)

# Path 2: New client detection
if status_filter == ClientStatusFilter.NEW:
    return await handle_new_client_filter(...)

# Path 3: Processing status computation
if status_filter in [ClientStatusFilter.PROCESSING, ClientStatusFilter.INTAKE_COMPLETE, ClientStatusFilter.ERROR]:
    return await handle_complex_status_filter(...)
```

### Path 1: SQL-Based Filtering

**Filters:** `None`, `INTAKE_ENABLED`, `INTAKE_IN_PROGRESS`
**Handler:** `handle_simple_status_filter()`

Uses SQL aggregation to query intakes directly. Single query returns clients with matching intake status, `intake_count`, and `last_completed_date`. When no filter is provided, includes all BQ clients (even those without intakes, shown with `intake_count: 0`).

### Path 2: New Client Detection

**Filter:** `NEW`
**Handler:** `handle_new_client_filter()`

Identifies clients with no intakes in the database. Queries for existing client_pseudo_ids, then returns BQ clients not found in the database.

### Path 3: Processing Status Computation

**Filters:** `PROCESSING`, `INTAKE_COMPLETE`, `ERROR`
**Handler:** `handle_complex_status_filter()`

Computes processing status for each completed intake:

1. **Fetch all intakes** for clients
2. **Fetch related entities** (plans, assessments, recordings, generations) by `intake_id` for completed intakes
3. **Compute processing status** for each completed intake using `compute_processing_status()`
4. **Map to frontend status** using `compute_frontend_status()`
5. **Filter intakes** by frontend status
6. **Group to clients** with matching intake counts

**Key principle:** Filter individual intakes, not clients. A client appears if they have at least one matching intake. The `intake_count` reflects only matching intakes.

**Special case for ERROR:** Includes both completed intakes with error processing status AND intakes with `status="error"`.

### Type Safety

Functions use `Literal` types to enforce accepted filter values:

```python
from typing import Literal

async def handle_simple_status_filter(
    status_filter: Literal[ClientStatusFilter.INTAKE_ENABLED, ClientStatusFilter.INTAKE_IN_PROGRESS] | None,
    ...
)

async def handle_complex_status_filter(
    status_filter: Literal[ClientStatusFilter.PROCESSING, ClientStatusFilter.INTAKE_COMPLETE, ClientStatusFilter.ERROR],
    ...
)
```

### Performance Characteristics

- **Path 1 (SQL):** ~50ms, single query with aggregation
- **Path 2 (New clients):** ~50ms, single exclusion query
- **Path 3 (Processing status):** ~100-300ms, 4-6 queries with Python computation

## Future Optimization: Extended Client View

### Architecture

Create an extended view `client_status_view` that includes:

1. Intake aggregations (`intake_count`, `last_completed_date`)
2. Computed `processing_status` (matches Python logic)
5. Computed `frontend_status` (for filtering)

### Complete SQL Implementation

```sql
-- Migration: Replace the client_view
-- This view computes processing status entirely in SQL, matching the Python compute_processing_status() logic

CREATE OR REPLACE VIEW client_status_view AS

WITH
-- CTE 1: Identify stuck executions based on time elapsed
execution_status AS (
    SELECT
        id,
        status,
        updated_at,
        -- An execution is "stuck" if:
        -- - PENDING for > 3 hours
        -- - IN_PROGRESS for > 30 minutes
        CASE
            WHEN status = 'pending'
                 AND (NOW() - updated_at) > INTERVAL '3 hours'
            THEN TRUE
            WHEN status = 'in_progress'
                 AND (NOW() - updated_at) > INTERVAL '30 minutes'
            THEN TRUE
            ELSE FALSE
        END as is_stuck,
        -- Actively in progress (not stuck, not complete)
        CASE
            WHEN status IN ('pending', 'in_progress')
                 AND NOT (
                     (status = 'pending' AND (NOW() - updated_at) > INTERVAL '3 hours') OR
                     (status = 'in_progress' AND (NOW() - updated_at) > INTERVAL '30 minutes')
                 )
            THEN TRUE
            ELSE FALSE
        END as is_actively_in_progress
    FROM execution
),

-- CTE 2: Recording session status per intake
recording_status AS (
    SELECT
        rs.intake_id,
        rs.status as recording_status,
        e.status as execution_status,
        e.is_stuck as execution_stuck,
        e.is_actively_in_progress as execution_in_progress
    FROM recording_session rs
    LEFT JOIN execution_status e ON rs.execution_id = e.id
),

-- CTE 3: Aggregate assessment statuses per client
assessment_status AS (
    SELECT
        a.client_pseudo_id,
        -- Check if ANY assessment execution is stuck
        BOOL_OR(e.is_stuck) as any_assessment_stuck,
        -- Check if ANY assessment is in progress
        BOOL_OR(a.status IN ('in_progress', 'pending')) as any_assessment_in_progress,
        -- Check if ANY assessment completed
        BOOL_OR(a.status = 'completed') as has_completed_assessment,
        -- Check if ANY assessment failed
        BOOL_OR(a.status = 'failed') as has_failed_assessment,
        -- Check if ALL assessments failed
        BOOL_AND(a.status = 'failed') as all_assessments_failed
    FROM assessment a
    LEFT JOIN execution_status e ON a.execution_id = e.id
    GROUP BY a.client_pseudo_id
),

-- CTE 4: Plan status per client (one plan per client)
plan_status AS (
    SELECT
        p.client_pseudo_id,
        p.create_status,
        e.is_stuck as plan_execution_stuck,
        CASE
            WHEN p.create_status IN ('in_progress', 'pending')
            THEN TRUE
            ELSE FALSE
        END as plan_in_progress
    FROM plan p
    LEFT JOIN execution_status e ON p.create_execution_id = e.id
),

-- CTE 5: Get LATEST plan generation status per client
-- Only the most recent generation matters for status computation
latest_generation_status AS (
    SELECT DISTINCT ON (p.client_pseudo_id)
        p.client_pseudo_id,
        pg.id as generation_id,
        pg.created_at,
        e.status as generation_execution_status,
        e.is_stuck as generation_stuck,
        CASE
            WHEN e.status IN ('in_progress', 'pending')
            THEN TRUE
            ELSE FALSE
        END as generation_in_progress
    FROM plan p
    INNER JOIN plan_generation pg ON pg.plan_id = p.id
    LEFT JOIN execution_status e ON pg.execution_id = e.id
    ORDER BY p.client_pseudo_id, pg.created_at DESC
),

-- CTE 6: Intake aggregate statistics
intake_stats AS (
    SELECT
        client_pseudo_id,
        COUNT(*) as intake_count,
        MAX(completed_at) as last_completed_date
    FROM intake
    GROUP BY client_pseudo_id
),

-- CTE 7: Get latest intake per client for status checks
latest_intake AS (
    SELECT DISTINCT ON (client_pseudo_id)
        client_pseudo_id,
        id as intake_id,
        status as intake_status,
        completed_at,
        updated_at
    FROM intake
    ORDER BY client_pseudo_id, created_at DESC
)

-- Main Query: Compute processing_status and frontend_status
SELECT
    li.client_pseudo_id,
    li.intake_id,
    li.intake_status,
    COALESCE(ist.intake_count, 0) as intake_count,
    ist.last_completed_date,

    -- PROCESSING STATUS COMPUTATION
    -- This matches the logic in compute_processing_status() line-by-line
    CASE
        -- NOT_STARTED: No intake or intake not completed (lines 44-73)
        WHEN li.intake_id IS NULL THEN 'not_started'
        WHEN li.intake_status != 'completed' THEN 'not_started'

        -- NEEDS_RETRY: Recording stuck or failed (lines 49-69)
        WHEN rs.execution_stuck = TRUE THEN 'needs_retry'
        WHEN rs.execution_status = 'failed' THEN 'needs_retry'
        WHEN rs.recording_status = 'error' THEN 'needs_retry'

        -- NEEDS_RETRY: Assessment stuck (lines 75-82)
        WHEN ast.any_assessment_stuck = TRUE THEN 'needs_retry'

        -- NEEDS_RETRY: Plan execution stuck (lines 84-87)
        WHEN ps.plan_execution_stuck = TRUE THEN 'needs_retry'

        -- NEEDS_RETRY: Latest generation stuck or failed (lines 89-109)
        WHEN lgs.generation_stuck = TRUE THEN 'needs_retry'
        WHEN lgs.generation_execution_status = 'failed' THEN 'needs_retry'

        -- IN_PROGRESS: Plan or generations in progress (lines 111-164)
        WHEN ps.plan_in_progress = TRUE THEN 'in_progress'
        WHEN lgs.generation_in_progress = TRUE THEN 'in_progress'

        -- IN_PROGRESS: Assessments in progress (lines 165-167)
        WHEN ast.any_assessment_in_progress = TRUE THEN 'in_progress'

        -- IN_PROGRESS: Recording in progress (not stuck) (lines 168-170)
        WHEN rs.execution_in_progress = TRUE THEN 'in_progress'

        -- COMPLETED: Plan creation completed (lines 172-177)
        WHEN ps.create_status = 'completed' THEN 'completed'

        -- NEEDS_RETRY: Plan failed but have completed assessments (lines 189-191)
        WHEN ast.has_completed_assessment = TRUE AND ps.create_status = 'failed' THEN 'needs_retry'

        -- NEEDS_RETRY: All assessments failed (lines 193-195)
        WHEN ast.all_assessments_failed = TRUE THEN 'needs_retry'

        -- NEEDS_RETRY: Any assessments failed (lines 197-200)
        WHEN ast.has_failed_assessment = TRUE THEN 'needs_retry'

        -- NEEDS_RETRY: Have completed assessments but no plan (lines 202-204)
        WHEN ast.has_completed_assessment = TRUE AND ps.client_pseudo_id IS NULL THEN 'needs_retry'

        -- NEEDS_RETRY: Default for completed intake without processing (lines 206-207)
        ELSE 'needs_retry'
    END as processing_status,

    -- FRONTEND STATUS COMPUTATION
    -- This matches compute_frontend_status() logic
    CASE
        -- New: handled outside view (no intake exists)

        -- intake_enabled: intake created (line 50-51)
        WHEN li.intake_status = 'created' THEN 'intake_enabled'

        -- intake_in_progress: intake in progress (line 53-54)
        WHEN li.intake_status = 'in_progress' THEN 'intake_in_progress'

        -- error: intake error status (line 69-70)
        WHEN li.intake_status IN ('error', 'system_error', 'needs_human') THEN 'error'

        -- For completed intakes, map processing_status to frontend_status (lines 56-67)
        WHEN li.intake_status = 'completed' THEN
            CASE processing_status
                WHEN 'in_progress' THEN 'processing'
                WHEN 'not_started' THEN 'processing'
                WHEN 'completed' THEN 'intake_complete'
                WHEN 'failed' THEN 'error'
                WHEN 'needs_retry' THEN 'error'
                ELSE 'error'
            END

        -- unknown: fallback (line 72)
        ELSE 'unknown'
    END as frontend_status

FROM latest_intake li
LEFT JOIN recording_status rs ON li.intake_id = rs.intake_id
LEFT JOIN assessment_status ast ON li.client_pseudo_id = ast.client_pseudo_id
LEFT JOIN plan_status ps ON li.client_pseudo_id = ps.client_pseudo_id
LEFT JOIN latest_generation_status lgs ON li.client_pseudo_id = lgs.client_pseudo_id
LEFT JOIN intake_stats ist ON li.client_pseudo_id = ist.client_pseudo_id;
```

### Indexes for Performance

```sql
-- Indexes to support the view queries
CREATE INDEX IF NOT EXISTS idx_execution_status_updated
    ON execution(status, updated_at);

CREATE INDEX IF NOT EXISTS idx_recording_session_intake
    ON recording_session(intake_id, status);

CREATE INDEX IF NOT EXISTS idx_assessment_client_status
    ON assessment(client_pseudo_id, status);

CREATE INDEX IF NOT EXISTS idx_plan_client_status
    ON plan(client_pseudo_id, create_status);

CREATE INDEX IF NOT EXISTS idx_plan_generation_plan_created
    ON plan_generation(plan_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_intake_client_completed
    ON intake(client_pseudo_id, completed_at);
```

### Using the View in Application Code

```python
async def get_paginated_client_list(
    session: AsyncSession,
    page: int = 1,
    page_size: int = 20,
    pseudonymized_staff_id: str | None = None,
    sort_by: ClientSort | None = None,
    sort_order: str = "asc",
    search: str | None = None,
    status_filter: str | None = None,
):
    """
    Returns a paginated list of clients with filtering and sorting.
    Uses client_status_view for all computation.
    """
    if not pseudonymized_staff_id:
        return empty_paginated_response(page, page_size)

    # Step 1: Get BQ client list
    bq_clients = Queries.get_clients_by_pseudonymized_staff_id(pseudonymized_staff_id)
    if not bq_clients:
        return empty_paginated_response(page, page_size)

    # Apply search filter on BQ data
    if search:
        bq_clients = apply_search_filter(bq_clients, search)

    bq_client_ids = [c.pseudonymized_client_id for c in bq_clients]

    # Handle "new" status filter - clients not in view
    if status_filter == "new":
        # Query view to get clients that exist
        stmt = sqlalchemy.text("""
            SELECT DISTINCT client_pseudo_id
            FROM client_status_view
            WHERE client_pseudo_id = ANY(:client_ids)
        """)
        result = await session.exec(stmt, {"client_ids": bq_client_ids})
        existing_ids = set(row[0] for row in result)

        # Filter to only new clients (not in view)
        new_clients = [c for c in bq_clients if c.pseudonymized_client_id not in existing_ids]

        # Sort by name only (other sorts meaningless for new clients)
        sorted_clients = sort_clients_by_name(new_clients, sort_order)
        return await build_response_for_clients(sorted_clients, session, page, page_size)

    # Step 2: Query the view with filter and sort
    placeholders = ", ".join([f"'{cid}'" for cid in bq_client_ids])

    # Build ORDER BY clause
    order_clause = "ORDER BY "
    if sort_by == ClientSort.NAME:
        # Name sorting needs BQ data, do in-memory
        order_clause = ""
    elif sort_by == ClientSort.INTAKE_COUNT:
        order_clause += f"intake_count {sort_order.upper()}"
    elif sort_by == ClientSort.LAST_ASSESSMENT_DATE:
        order_clause += f"last_completed_date {sort_order.upper()} NULLS LAST"
    else:
        order_clause = ""

    # Build WHERE clause
    where_clause = f"WHERE client_pseudo_id IN ({placeholders})"
    if status_filter:
        where_clause += f" AND frontend_status = '{status_filter}'"

    stmt = sqlalchemy.text(f"""
        SELECT
            client_pseudo_id,
            intake_count,
            last_completed_date,
            frontend_status,
            processing_status
        FROM client_status_view
        {where_clause}
        {order_clause}
    """)

    result = await session.exec(stmt)
    view_results = [
        {
            "client_pseudo_id": row[0],
            "intake_count": row[1],
            "last_completed_date": row[2],
            "frontend_status": row[3],
            "processing_status": row[4],
        }
        for row in result
    ]

    # If sorting by name, do it in-memory with BQ data
    if sort_by == ClientSort.NAME:
        # Create lookup for view data
        view_lookup = {r["client_pseudo_id"]: r for r in view_results}

        # Filter BQ clients to those in view results
        filtered_clients = [
            c for c in bq_clients
            if c.pseudonymized_client_id in view_lookup
        ]

        # Sort by name
        sorted_clients = sort_clients_by_name(filtered_clients, sort_order)

        # Paginate
        paginated_clients = paginate(sorted_clients, page, page_size)

        # Build response with view data
        items = []
        for client in paginated_clients:
            view_data = view_lookup[client.pseudonymized_client_id]
            items.append({
                "client_pseudo_id": client.pseudonymized_client_id,
                "client": client,
                "intake_count": view_data["intake_count"],
                "last_completed_date": view_data["last_completed_date"],
            })

        return {
            "items": items,
            "total": len(filtered_clients),
            "page": page,
            "size": page_size,
            "pages": (len(filtered_clients) + page_size - 1) // page_size,
        }

    # For non-name sorts, already sorted by SQL
    # Match with BQ data
    client_lookup = {c.pseudonymized_client_id: c for c in bq_clients}

    # Paginate the sorted results
    paginated_results = paginate(view_results, page, page_size)

    items = []
    for row in paginated_results:
        client = client_lookup.get(row["client_pseudo_id"])
        items.append({
            "client_pseudo_id": row["client_pseudo_id"],
            "client": client,
            "intake_count": row["intake_count"],
            "last_completed_date": row["last_completed_date"],
        })

    return {
        "items": items,
        "total": len(view_results),
        "page": page,
        "size": page_size,
        "pages": (len(view_results) + page_size - 1) // page_size,
    }
```


## Benefits

1. **Performance**: All filtering and sorting in database
2. **Scalability**: Handles large client lists efficiently
3. **Single Query**: Minimal round-trips to database
4. **Indexable**: Can add indexes on computed columns
5. **Consistent**: Single source of truth for status

## Risks
1. **Complexity**: 150+ lines of SQL with CTEs
2. **Debugging**: Harder to debug SQL than Python
3. **Testing**: Need comprehensive test coverage to ensure SQL matches Python
4. **Migration**: Schema change requires careful rollout

## References

- Python implementation: `app/utils/processing_status_utils.py:compute_processing_status()`
- Frontend status mapping: `app/crud/client.py:compute_frontend_status()`
- Stuck execution logic: `app/utils/execution_utils.py:is_execution_stuck()`
- Initial view: `alembic/versions/0d0e9f7b252d_create_client_view.py` - Modified after.
