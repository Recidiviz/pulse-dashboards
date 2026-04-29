#!/usr/bin/env python3
"""
gather.py <pr-number-or-url> [repo]

Collects all PR context needed by the review-pr skill and prints JSON to stdout.
Also checks out the PR branch into a git worktree so the skill can read files
as they exist in the PR (including new files not on the current branch).

Worktree is written to /tmp/pr-<number>-worktree. The caller is responsible
for cleaning it up (the skill does this after HTML generation).
"""

import concurrent.futures
import hashlib
import json
import os
import re
import subprocess
import sys


def run(*args, cwd=None, check=True):
    """Run a command and return stdout as text, or '' on failure or timeout.

    With check=True (default), a non-zero exit code raises CalledProcessError,
    which is caught here and returns ''. With check=False, stdout from a failing
    command is returned as-is (may be non-empty).
    """
    try:
        r = subprocess.run(list(args), capture_output=True, text=True, check=check, cwd=cwd, timeout=120)
        return r.stdout
    except (subprocess.CalledProcessError, subprocess.TimeoutExpired):
        return ""


def gh_json(*args):
    """Run a gh command and return parsed JSON, or None on failure."""
    try:
        r = subprocess.run(["gh", *args], capture_output=True, text=True, check=True, timeout=60)
        return json.loads(r.stdout)
    except (subprocess.CalledProcessError, json.JSONDecodeError, subprocess.TimeoutExpired):
        return None


def file_hash(path):
    return hashlib.sha256(path.encode()).hexdigest()


def extract_pr_number(arg):
    m = re.search(r"(\d+)(?:/[^/]*)?$", arg)
    if not m:
        print(f"Could not parse PR number from: {arg!r}", file=sys.stderr)
        sys.exit(1)
    return m.group(1)


def detect_repo():
    out = run("gh", "repo", "view", "--json", "nameWithOwner", "-q", ".nameWithOwner", check=False).strip()
    return out or None


def repo_root():
    return run("git", "rev-parse", "--show-toplevel").strip()


def setup_worktree(pr_number, base_ref, repo_root_path, repo):
    repo_slug = repo.replace("/", "-")
    worktree_path = f"/tmp/pr-{repo_slug}-{pr_number}-worktree"
    # Remove stale worktree if it exists
    if os.path.exists(worktree_path):
        run("git", "worktree", "remove", "--force", worktree_path, cwd=repo_root_path, check=False)
    # Fetch the PR's head ref and capture its SHA immediately, before any other fetch
    # changes FETCH_HEAD.
    run("git", "fetch", "origin", f"pull/{pr_number}/head", cwd=repo_root_path, check=False)
    pr_sha = run("git", "rev-parse", "FETCH_HEAD", cwd=repo_root_path).strip()
    if not pr_sha:
        return None
    # Fetch the base branch so git log range queries (origin/{base}..HEAD) work in
    # the worktree.  This overwrites FETCH_HEAD, so we use pr_sha below.
    run("git", "fetch", "origin", base_ref, cwd=repo_root_path, check=False)
    # Create worktree at the captured SHA (not FETCH_HEAD, which now points to base_ref)
    run("git", "worktree", "add", worktree_path, pr_sha, cwd=repo_root_path, check=False)
    # A successfully initialized worktree always contains a .git file (not directory)
    if os.path.isfile(os.path.join(worktree_path, ".git")):
        return worktree_path
    return None


def get_commits_with_files(worktree_path, base_ref):
    """Return commits with their changed files using a single local git log call.

    Replaces per-commit GitHub API calls: one fast local command gets the same data.
    Commits are returned oldest-first to match the API order.
    """
    output = run(
        "git", "log", f"origin/{base_ref}..HEAD",
        "--format=COMMIT_DELIM %H %s", "--name-only",
        cwd=worktree_path, check=False,
    )
    commits = []
    current = None
    for line in output.splitlines():
        if line.startswith("COMMIT_DELIM "):
            if current is not None:
                commits.append(current)
            rest = line[len("COMMIT_DELIM "):]
            sha, _, msg = rest.partition(" ")
            current = {"sha": sha, "message": msg, "files": []}
        elif line.strip() and current is not None:
            current["files"].append(line.strip())
    if current is not None:
        commits.append(current)
    commits.reverse()  # oldest-first, consistent with API order
    return commits


def base_chain(repo, base_ref, depth=0, max_depth=5):
    """Find the PR whose HEAD is base_ref, then recurse up."""
    if base_ref in ("main", "master") or depth >= max_depth:
        return []
    for state in ("open", "merged"):
        prs = gh_json("pr", "list", "--repo", repo, "--head", base_ref,
                      "--state", state, "--json",
                      "number,title,url,baseRefName,headRefName", "--limit", "1")
        if prs:
            parent = prs[0]
            return [parent] + base_chain(repo, parent["baseRefName"], depth + 1, max_depth)
    return []


def main():
    if len(sys.argv) < 2:
        print("Usage: gather.py <pr-number-or-url> [repo]", file=sys.stderr)
        sys.exit(1)

    pr_arg = sys.argv[1]
    repo = sys.argv[2] if len(sys.argv) > 2 else detect_repo()

    if not repo:
        print("Could not detect repo. Pass it as the second argument.", file=sys.stderr)
        sys.exit(1)

    pr_number = extract_pr_number(pr_arg)
    root = repo_root()

    # ── PR metadata ────────────────────────────────────────────────────────────
    print(f"Fetching PR #{pr_number} from {repo}…", file=sys.stderr)
    pr = gh_json("pr", "view", pr_number, "--repo", repo, "--json",
                 "number,title,body,author,url,baseRefName,headRefName,"
                 "isDraft,state")
    if not pr:
        print(f"Could not fetch PR #{pr_number} from {repo}", file=sys.stderr)
        sys.exit(1)

    # ── Parallel fetches: checks, diff, PR relations, and worktree ─────────────
    # All four are independent of each other; run them concurrently.
    print("Fetching checks, diff, PR relations, and worktree…", file=sys.stderr)
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as ex:
        f_checks = ex.submit(
            gh_json, "pr", "checks", pr_number, "--repo", repo,
            "--json", "name,state,link",
        )
        f_diff = ex.submit(
            lambda: run("gh", "pr", "diff", pr_number, "--repo", repo, check=False)
        )
        f_chain = ex.submit(base_chain, repo, pr["baseRefName"])
        f_children = ex.submit(
            gh_json, "pr", "list", "--repo", repo, "--base", pr["headRefName"],
            "--json", "number,title,url,state", "--limit", "10",
        )
        f_worktree = ex.submit(
            lambda: setup_worktree(pr_number, pr["baseRefName"], root, repo) if root else None
        )

    checks = f_checks.result() or []
    diff = f_diff.result()
    chain = f_chain.result()
    children = f_children.result() or []
    worktree_path = f_worktree.result()

    # ── Changed files + hashes ────────────────────────────────────────────────
    changed_files = re.findall(r"^diff --git a/.+ b/(.+)$", diff, re.MULTILINE)
    hashes = {f: file_hash(f) for f in changed_files}

    # ── Commits with per-commit file lists ────────────────────────────────────
    # Prefer local git log (one command, no API calls) once the worktree is ready.
    # Fall back to the API without file info if the worktree could not be set up;
    # commit badges simply won't appear in that case.
    print("Building commit history…", file=sys.stderr)
    if worktree_path:
        commits = get_commits_with_files(worktree_path, pr["baseRefName"])
    else:
        commits_raw = gh_json("pr", "view", pr_number, "--repo", repo, "--json", "commits") or {}
        commits = [
            {"sha": c.get("oid", ""), "message": c.get("messageHeadline", ""), "files": []}
            for c in commits_raw.get("commits", [])
        ]

    output = {
        "repo": repo,
        "repoRoot": root,
        "worktreePath": worktree_path,
        "pr": pr,
        "checks": checks,
        "diff": diff,
        "changedFiles": changed_files,
        "fileHashes": hashes,
        "commits": commits,
        "baseChain": chain,
        "childPrs": children,
    }
    print(json.dumps(output, indent=2))


if __name__ == "__main__":
    main()
