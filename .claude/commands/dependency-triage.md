# /dependency-triage

Analyze Dependabot security alerts, assess reachability in this codebase, and
open draft PRs for actionable upgrades. This command is invoked by the
`claude-dependency-triage` GitHub Action on a schedule, or locally by a
developer.

The security rules in `@.claude/rules/security.md` apply — in particular the
dependency security section and the policy on pinned versions.

---

## Inputs

The `DEPENDABOT_ALERTS` environment variable contains a JSON array of alerts,
each with: `number`, `severity`, `cve`, `summary`, `package`, `ecosystem`,
`vulnerable_range`, `first_patched`, `manifest`.

---

## Procedure

For each alert, execute these steps in order:

### 1. Understand the vulnerability

- Read the CVE/GHSA summary from the alert.
- Fetch the full advisory for context:
  ```
  gh api /repos/{owner}/{repo}/dependabot/alerts/{number}
  ```
- Identify the **affected API surface** — which functions, methods, or code
  paths in the vulnerable package trigger the issue. Be specific: "the C
  response header parser" not "aiohttp".

### 2. Determine the dependency path

- Read the manifest file (`manifest` field — e.g., `apps/@reentry/backend/uv.lock`,
  `package.json`, `yarn.lock`).
- Determine whether the vulnerable package is a **direct** or **transitive**
  dependency.
- If transitive, identify the full import chain (e.g.,
  `cloud-sql-python-connector → aiohttp`).

### 3. Assess reachability

This is the most important step. Search the codebase for actual usage of the
affected API surface.

**For Python (uv/pip) packages:**

```bash
# Find imports of the vulnerable package
rg "import <package>" --type py
rg "from <package>" --type py

# Search for the specific vulnerable function/method
rg "<vulnerable_function>" --type py
```

**For npm packages:**

```bash
# Find imports
rg "from ['\"]<package>" --type ts --type tsx
rg "require\(['\"]<package>" --type js

# Search for specific vulnerable API
rg "<vulnerable_function>" --type ts --type tsx
```

**Classify reachability as one of:**

| Classification         | Meaning                                                                       | Action                              |
| ---------------------- | ----------------------------------------------------------------------------- | ----------------------------------- |
| **Direct**             | Our code calls the vulnerable function                                        | Upgrade urgently                    |
| **Transitive-active**  | A dependency we actively use calls the vulnerable function on data we pass it | Upgrade soon                        |
| **Transitive-passive** | The vuln is in a transitive dep but the triggering code path is not exercised | Upgrade during maintenance          |
| **Not reachable**      | Static analysis confirms the vulnerable code path cannot be reached           | Upgrade at convenience, or suppress |

For each classification, cite the specific grep results or file:line references
that support your conclusion. Never claim "not reachable" without evidence.

### 4. Check for existing fixes

Before opening a PR:

```bash
# Check if Dependabot already opened a PR for this
gh pr list --search "in:title <package>" --state open
# Check if someone already fixed it
gh pr list --search "in:title <cve>" --state merged
```

Skip alerts that already have an open PR or merged fix.

### 5. Attempt the upgrade

**For Python packages (uv.lock):**

```bash
cd <directory containing pyproject.toml>
# If direct dependency, update the version constraint in pyproject.toml
# Then regenerate the lock:
uv lock
```

**For npm packages (yarn.lock):**

```bash
# If direct dependency:
yarn up <package>@<patched_version>
# If transitive, try a resolution override in package.json:
# "resolutions": { "<package>": "<patched_version>" }
yarn install
```

**Guardrails (default lockfile-only mode, `ALLOW_CODE_CHANGES=false`):**

- Do NOT edit application source code — only manifests and lockfiles
- Do NOT remove or downgrade other packages
- Do NOT change anything outside the affected manifest's directory
- Do NOT force-resolve if the parent package has an incompatible version
  constraint (file an issue instead)

**If `ALLOW_CODE_CHANGES=true`**, the guardrails above are relaxed — see the
"Code changes mode" section below. In particular, you MAY upgrade parent
packages and make code changes to resolve incompatible version constraints.

### 6. Verify the upgrade

After modifying the lockfile:

```bash
# Verify the vulnerable version is gone
rg "<package>.*<vulnerable_version>" <lockfile>

# For Python: check the lock resolved correctly
uv lock --check 2>&1 || echo "Lock verification failed"

# For npm: verify no resolution conflicts
yarn install --check-cache 2>&1 || echo "Install verification failed"
```

If verification fails, do not open a PR. Instead, note the failure in your
output and move to the next alert.

### 6b. Run tests and capture results (MANDATORY)

**This step is NOT optional.** You MUST run tests for EVERY alert before
opening a PR. Do not skip this step to save time. A PR without test results
is incomplete.

Save the test output to a file so you can include it in the PR body later:

**For Tier 1 npm lockfile-only changes (no code changes):**

The CI pipeline on the PR will run the full test suite. Your job is to verify
the lockfile is consistent and the vulnerable version is gone:

```bash
# Verify the lockfile regenerated correctly (no install needed)
grep "<package>@npm:<patched_version>" yarn.lock | head -5 > /tmp/test-results-<package>.txt

# Verify no vulnerable versions remain
echo "Vulnerable version check:" >> /tmp/test-results-<package>.txt
grep "<package>@npm:<vulnerable_version>" yarn.lock >> /tmp/test-results-<package>.txt || echo "No vulnerable versions found" >> /tmp/test-results-<package>.txt

cat /tmp/test-results-<package>.txt
```

Do NOT run `yarn install`, `nx affected -t test`, or `nx affected -t typecheck`
for lockfile-only changes. These take too long in large monorepos (30+ min)
and CI will validate them on the PR. Focus on lockfile correctness.

**For Tier 2+ npm changes (code modified):**

```bash
# Run tests for the specific projects where code was modified
yarn nx test <affected-project> --output-style static 2>&1 | tail -50 > /tmp/test-results-<package>.txt
cat /tmp/test-results-<package>.txt
```

**For Python packages (uv.lock changes):**

```bash
cd <project directory containing pyproject.toml>
# For lockfile-only: just verify the lock is consistent
uv lock --check 2>&1 | tail -20 > /tmp/test-results-<package>.txt

# For code changes: run the test suite
uv run pytest -v --timeout=60 2>&1 | tail -50 >> /tmp/test-results-<package>.txt

cat /tmp/test-results-<package>.txt
```

**Capture the output** — paste the actual test results (pass/fail summary and
any failures) into the PR body under "Test results." Don't just write
"tests pass" — show the command you ran and the actual output.

If tests fail, still open the PR but mark it clearly in the risk assessment
and "Known issues" section. A PR with documented test failures is more useful
than no PR at all — the reviewer can decide whether the failures are related.

### 7. Open a draft PR (or report)

If `DRY_RUN` is true, skip PR creation and output your analysis to stdout.

**Important: Bias toward opening PRs.** If the upgrade succeeds and
verification passes, ALWAYS open a PR — even if the vulnerability is classified
as "Not reachable." A clean dependency bump is low risk and keeps dependencies
current. The only reasons to skip PR creation are:

- The upgrade fails and cannot be fixed
- An existing open PR already covers this exact upgrade
- `DRY_RUN` is true

If you can fix some but not all instances of a vulnerable package (e.g., 5 of 7
versions in the lockfile), open a PR for the partial fix and document the
remaining instances in the PR body.

Otherwise, for each successful upgrade:

```bash
# Create a branch
git checkout -b security/fix-<cve>-<package> main

# Stage only the manifest and lockfile changes
git add <manifest> <lockfile>

# Commit
git commit -m "[Security] Fix <cve>: Upgrade <package> to <patched_version>

<one-line summary of the vulnerability>

Reachability: <classification>
<brief justification with file:line references>

Generated by Claude Dependency Triage"

# Push and open draft PR
git push -u origin security/fix-<cve>-<package>
```

Then open the PR:

```bash
gh pr create --draft --title "[Security] Fix <cve>: Upgrade <package> to <patched_version>" --body "$(cat <<'PREOF'
## Vulnerability

| Field | Value |
|---|---|
| **CVE** | <cve> |
| **Severity** | <severity> |
| **Package** | <package> |
| **Current version** | <current> |
| **Patched version** | <patched> |
| **Ecosystem** | <ecosystem> |
| **Manifest** | `<manifest>` |

## Advisory summary

<summary from the GHSA/CVE>

## Reachability analysis

**Classification: <Direct | Transitive-active | Transitive-passive | Not reachable>**

<Detailed explanation with file:line references and grep evidence>

### Dependency chain

```

<your app> → <parent package> → <vulnerable package>

```

### Affected API surface

<Which functions/methods in the vulnerable package are the issue>

### Usage in this codebase

<Grep results showing whether/how those functions are called>

## Changes

- Updated `<manifest>` to require `<package> >= <patched_version>`
- Regenerated `<lockfile>`

## Test plan

- [ ] CI passes (lockfile-only change, no app code modified)
- [ ] Verify patched version resolves: `rg "<package>" <lockfile>` shows `<patched_version>`
- [ ] Review reachability classification above

🤖 Generated by Claude Dependency Triage
PREOF
)"
```

---

## Output format (for dry run or logging)

For each alert, output:

```
### <cve> — <package> (<severity>)

**Summary:** <one-line advisory summary>
**Manifest:** <manifest path>
**Dependency path:** <chain>
**Reachability:** <classification>
**Evidence:** <file:line references or "no imports found">
**Recommendation:** <Upgrade to X / File issue for parent dep / Suppress>
**Existing PR:** <link or "none">
```

---

## Grouping

If multiple CVEs affect the same package at the same version and all fix to the
same patched version, combine them into a single PR. List all CVEs in the PR
title and body.

Example: `[Security] Fix CVE-2026-34520 + 9 others: Upgrade aiohttp to 3.13.5`

---

## Code changes mode

**This section only applies when `ALLOW_CODE_CHANGES=true`.** In default mode,
skip this section entirely.

When enabled, you may edit application source code to fix compatibility issues
caused by the dependency upgrade. This is useful for major version bumps or
packages that change their API surface between the vulnerable and patched
versions.

### Risk tiers

Approach upgrades in order from lowest to highest risk. Always try the
lowest-risk tier first. Only escalate when the lower tier doesn't resolve the
vulnerability.

#### Tier 1 — Lockfile only (Risk: Low)

Semver-compatible bump or resolution override. No code changes. Examples:

- `dompurify@^3.3.2` already allows 3.4.0 — just regenerate lockfile
- Add `"protobufjs": ">=7.5.5"` to `resolutions` to pin transitive deps

**Always attempt this first.** If it works, open the PR — done.

#### Tier 2 — Parent package minor/patch bump (Risk: Low–Medium)

A parent package needs a minor or patch bump to accept the patched version.
The parent's API is unchanged. Examples:

- Bump `get-uri@6.0.5` → `6.0.7` so it pulls `basic-ftp@5.3.0`
- Bump `google-gax@4.4.1` → `4.4.5` which pins `protobufjs@^7.5.5`

These are usually safe. Check the parent's changelog for breaking changes.

#### Tier 3 — Parent package major version bump (Risk: Medium–High)

A parent package needs a major version bump. API changes are likely. Examples:

- `@cucumber/cucumber` v7 → v10 (drops protobufjs v6 dep)
- `axios` v1 → v2

**Before attempting:** Count how many files import the parent package. If the
change is isolated (< 5 files), attempt it. If it touches > 10 files or core
infrastructure, stop and open an issue instead with your analysis of what the
upgrade would require.

#### Tier 4 — Ecosystem-wide upgrade (Risk: High)

Multiple interconnected packages need upgrading together. Examples:

- Upgrading the entire `@google-cloud/*` suite
- React major version bump affecting dozens of packages

**Do not attempt.** Open an issue with a detailed migration plan instead.

### Risk assessment label

Every PR MUST include a **Risk Assessment** in the PR body. This helps
reviewers calibrate how much scrutiny is needed.

```
## Risk assessment

| Dimension | Value |
|---|---|
| **Risk level** | 🟢 Low / 🟡 Medium / 🟠 High |
| **Tier** | 1 (lockfile only) / 2 (parent minor bump) / 3 (parent major bump) |
| **Compatibility** | <percentage> — <explanation> |
| **Files changed** | <N> files (<list of non-lockfile files if any>) |
| **Reachability** | <classification from step 3> |
| **Confidence** | <High/Medium/Low> — <why> |
```

**Compatibility score guidance:**

- **95–100%** — Lockfile-only or patch bump. No API changes. Drop-in replacement.
- **80–95%** — Minor version bump. API is compatible but some deprecations or
  new defaults. Changelog reviewed, no breaking changes found.
- **60–80%** — Major version bump but limited surface area. Few files affected.
  Migration guide exists and was followed.
- **Below 60%** — Extensive changes needed. Open an issue instead of a PR.

### What you may do

- Fix **import path changes** (e.g., `from pkg.old_module` → `from pkg.new_module`)
- Update **function signatures** that changed between versions (added/removed
  parameters, renamed arguments)
- Replace **removed or deprecated API calls** with their documented replacements
- Update **type annotations** that reference changed types from the upgraded package
- Fix **configuration format changes** (e.g., a config key was renamed)
- **Upgrade parent packages** that pin an incompatible version of the vulnerable
  package, including updating their version constraints in package.json or
  pyproject.toml

### What you still must NOT do

- Refactor, clean up, or "improve" code beyond what the upgrade requires
- Change application logic or behavior — the app should do the same thing after
  your changes, just with the new package version
- Modify tests to make them pass by weakening assertions — if a test fails after
  the upgrade, fix the code to preserve the original behavior, or flag it for
  human review
- Touch files unrelated to the upgraded package's API surface
- Guess at replacements — if the migration path is unclear or undocumented,
  stop and file an issue instead of guessing

### Verification and testing

#### Always run existing tests

After any upgrade (even Tier 1), run the relevant test suite:

```bash
# For Python packages
cd <project directory>
uv run pytest <relevant test path> 2>&1 | tail -30

# For npm packages
nx test <affected project> --testPathPattern="<relevant pattern>" 2>&1 | tail -30
```

#### When to add tests

Add a focused test ONLY when:

- **Tier 2+** changes modify application code (not just lockfiles/manifests)
- The upgraded package is directly imported and used in application code
- There isn't already a test covering the affected code path

Do NOT add tests for:

- Lockfile-only changes (Tier 1)
- Transitive deps with no direct imports
- Code paths already covered by existing tests

When adding a test:

- Place it alongside existing tests using the project's test conventions
- Keep it minimal — verify the specific behavior that the upgrade could break
- Use the existing test infrastructure (Vitest, pytest, etc.) — don't introduce
  new test frameworks or patterns
- Name it clearly: `<feature>.security-upgrade.test.ts` or similar

Example: if upgrading `dompurify` and the app calls `DomPurify.sanitize()`:

```typescript
// Only if no existing test covers sanitize behavior
it("sanitizes HTML after dompurify upgrade", () => {
  const result = DomPurify.sanitize('<script>alert("xss")</script><p>safe</p>');
  expect(result).toBe("<p>safe</p>");
});
```

#### If tests fail

If existing tests fail and the fix is not obvious, do NOT attempt to fix them.
Note the failures in the PR body under "Known issues" and request human review.

### PR body format

Every PR (including Tier 1 lockfile-only changes) MUST include:

```
## Vulnerability

| Field | Value |
|---|---|
| **CVE** | <cve> |
| **Severity** | <severity> |
| **Package** | <package> |
| **Current version** | <current> |
| **Patched version** | <patched> |

## Risk assessment

| Dimension | Value |
|---|---|
| **Risk level** | 🟢 Low / 🟡 Medium / 🟠 High |
| **Tier** | 1 / 2 / 3 |
| **Compatibility** | <score>% — <explanation> |
| **Files changed** | <N> files |
| **Reachability** | <classification> |
| **Confidence** | <High/Medium/Low> — <why> |

## Reachability analysis

<Detailed explanation with file:line references and grep evidence>

## Changes

<What was changed and why — brief for Tier 1, detailed for Tier 2+>

## Code changes (Tier 2+ only)

| File | Change | Reason |
|---|---|---|
| `path/to/file.ts:42` | Updated `foo()` call to `bar()` | `foo` removed in v2.0 per migration guide |

## Test results

<For each test suite run, include the command and actual output>

```

$ <exact command run>
<last 30-50 lines of output, including pass/fail summary>

```

## Tests added (if any)

- `path/to/test.ts` — Verifies <specific behavior> after upgrade

## Known issues (if any)

- <description of any test failure or behavioral change that needs human review>

## Remaining work (for partial fixes)

- <instances that couldn't be upgraded and why>
```
