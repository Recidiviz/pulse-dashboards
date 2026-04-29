#!/usr/bin/env python3
"""
generate.py --context <context.json> --analysis <analysis.json> --output <out.html>

Combines factual PR context (from gather.py) with Claude's analysis (from the skill)
to produce a reviewer-optimized HTML diff page.

Analysis JSON schema:
{
  "narrative": "prose paragraph",
  "clusters": [
    {
      "label": "Tab Type Definition",
      "description": "one sentence",
      "files": ["relative/path/to/file.ts"],
      "fileDescriptions": {
        "relative/path/to/file.ts": "one sentence about this file's role"
      },
      "testGaps": [
        {
          "sourceFile": "relative/path/to/source.ts",
          "testFile": "relative/path/to/test.ts",
          "note": "human-readable explanation"
        }
      ],
      "relevantUnchanged": [
        {
          "path": "relative/path/to/file.ts",
          "note": "why it's relevant"
        }
      ]
    }
  ]
}
"""

import argparse
import hashlib
import html
import json
import re


def js_safe_json(obj):
    """Serialize obj to JSON safe for embedding in a <script> tag.

    Python's json.dumps does not escape '<' or '>', so a string value containing
    '</script>' would terminate the enclosing script tag and enable HTML injection.
    """
    return json.dumps(obj).replace("</", "<\\/")


# ── Diff splitting ────────────────────────────────────────────────────────────

def split_diff(full_diff):
    """Split a unified diff into a dict of {filepath: diff_chunk}."""
    chunks = {}
    current_file = None
    current_lines = []
    for line in full_diff.splitlines(keepends=True):
        m = re.match(r"diff --git a/.+ b/(.+)", line)
        if m:
            if current_file:
                chunks[current_file] = "".join(current_lines)
            current_file = m.group(1).strip()
            current_lines = [line]
        elif current_file:
            current_lines.append(line)
    if current_file:
        chunks[current_file] = "".join(current_lines)
    return chunks


# ── Commit attribution ────────────────────────────────────────────────────────

def commit_for_file(path, commits):
    """Return the most recent commit that touched path."""
    for c in reversed(commits):
        if path in c.get("files", []):
            return c
    return None


def commit_badge_html(path, commits):
    c = commit_for_file(path, commits)
    if not c:
        return ""
    sha = c["sha"][:7]
    msg = html.escape(c["message"][:72]) + ("…" if len(c["message"]) > 72 else "")
    return f'<div class="commit-badge">commit <code>{sha}</code> — {msg}</div>'


# ── HTML generation ───────────────────────────────────────────────────────────

def make_diff_id(file_path, cluster_idx):
    """Return an HTML-id-safe element id for a file diff within a specific cluster."""
    h = hashlib.sha256(file_path.encode()).hexdigest()[:12]
    return f"diff-{h}-{cluster_idx}"


def cluster_html(cluster, idx, ctx):
    repo = ctx["repo"]
    head = ctx["pr"]["headRefName"]
    commits = ctx["commits"]

    label = html.escape(cluster.get("label") or f"Cluster {idx+1}")
    description = html.escape(cluster.get("description") or "")
    files = cluster.get("files", [])
    file_descs = cluster.get("fileDescriptions", {})
    test_gaps = cluster.get("testGaps", [])
    relevant = cluster.get("relevantUnchanged", [])

    parts = []

    # Header
    parts.append(f"""
    <div class="cluster">
      <div class="cluster-header">
        <span class="cluster-number">{idx+1}</span>
        <span class="cluster-label">{label}</span>
        <span class="cluster-desc">{description}</span>
      </div>""")

    # Test gap callouts
    for gap in test_gaps:
        test_file = gap.get("testFile") or ""
        note = html.escape(gap.get("note") or "")
        test_url = html.escape(f"https://github.com/{repo}/blob/{head}/{test_file}")
        parts.append(f"""
      <div class="callout callout-warning">
        <span class="callout-icon">⚠️</span>
        <div><strong>Test gap:</strong>
          <a href="{test_url}" target="_blank">{html.escape(test_file)}</a>
          {"— " + note if note else ""}
        </div>
      </div>""")

    # Relevant unchanged file callouts
    for rel in relevant:
        path = rel.get("path") or ""
        note = html.escape(rel.get("note") or "")
        file_url = html.escape(f"https://github.com/{repo}/blob/{head}/{path}")
        parts.append(f"""
      <div class="callout callout-info">
        <span class="callout-icon">👁</span>
        <div><strong>Relevant unchanged file:</strong>
          <a href="{file_url}" target="_blank">{html.escape(path)}</a>
          {"— " + note if note else ""}
        </div>
      </div>""")

    # Per-file diffs
    for file_path in files:
        diff_id = make_diff_id(file_path, idx)
        file_desc = html.escape(file_descs.get(file_path) or "")
        badge = commit_badge_html(file_path, commits)
        filename = html.escape(file_path.split("/")[-1])
        parts.append(f"""
      {badge}
      <div class="file-context">
        <strong>{filename}</strong>{"  —  " + file_desc if file_desc else ""}
      </div>
      <div class="diff-wrapper" id="{diff_id}"></div>""")

    parts.append("    </div>")  # close .cluster
    return "\n".join(parts)


def generate_html(ctx, analysis):
    pr = ctx["pr"]
    repo = ctx["repo"]
    checks = ctx["checks"]
    file_hashes = ctx["fileHashes"]
    file_diffs = split_diff(ctx["diff"])
    base_chain = ctx.get("baseChain", [])
    children = ctx.get("childPrs", [])

    pr_url = pr["url"]
    pr_base_files = f"{pr_url}/files"
    pr_title_esc = html.escape(pr["title"])
    pr_author_esc = html.escape((pr.get("author") or {}).get("login", "unknown"))
    narrative = html.escape(analysis.get("narrative") or "")
    clusters = analysis.get("clusters", [])

    # ── Checks summary HTML ───────────────────────────────────────────────────
    checks_html = ""
    if checks:
        items = []
        for c in checks:
            state = c.get("state", "").lower()
            css = {"success": "pass", "failure": "fail", "error": "fail"}.get(state, "pending")
            icon = {"pass": "✓", "fail": "✗", "pending": "○"}.get(css, "○")
            link = c.get("link") or ""
            name = html.escape(c.get("name", ""))
            if link:
                items.append(f'<a class="check {css}" href="{html.escape(link)}" target="_blank">{icon} {name}</a>')
            else:
                items.append(f'<span class="check {css}">{icon} {name}</span>')
        checks_html = f'<div class="checks">{"".join(items)}</div>'

    # ── Base chain HTML ───────────────────────────────────────────────────────
    chain_html = ""
    if base_chain:
        parts = ["<div class='chain'>based on →"]
        for p in base_chain:
            base = p.get("baseRefName", "")
            parts.append(
                f' <a href="{html.escape(p["url"])}" target="_blank">#{p["number"]} {html.escape(p["title"])}</a>'
                + (f" → based on → " if base not in ("main", "master") else "")
            )
        parts.append("</div>")
        chain_html = "".join(parts)

    # ── Child PRs HTML ────────────────────────────────────────────────────────
    children_html = ""
    if children:
        links = ", ".join(
            f'<a href="{html.escape(c["url"])}" target="_blank">#{c["number"]} {html.escape(c["title"])}</a>'
            for c in children
        )
        children_html = f'<div class="chain">PRs based on this one: {links}</div>'

    # ── State badge ───────────────────────────────────────────────────────────
    state = pr.get("state", "OPEN")
    is_draft = pr.get("isDraft", False)
    state_css = "draft" if is_draft else ("merged" if state == "MERGED" else "open")
    state_label = "Draft" if is_draft else state.capitalize()

    # ── Clusters HTML ─────────────────────────────────────────────────────────
    clusters_html = "\n".join(
        cluster_html(c, i, ctx) for i, c in enumerate(clusters)
    )

    # ── JS: diff rendering data ────────────────────────────────────────────────
    # Collect all (diff_id, diff_str) pairs across all clusters so the JS can
    # re-render them all when the view toggle changes.
    diff_registry = {}
    for i, cluster in enumerate(clusters):
        for file_path in cluster.get("files", []):
            diff_registry[make_diff_id(file_path, i)] = file_diffs.get(file_path, "")

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>PR #{pr["number"]} — {pr_title_esc}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/diff2html/bundles/css/diff2html.min.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/highlight.js@11/styles/github.min.css">
  <style>
    *, *::before, *::after {{ box-sizing: border-box; }}
    body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            background: #f6f8fa; margin: 0; padding: 24px; color: #24292f; }}
    a {{ color: #0969da; }}

    .card {{ background: white; border: 1px solid #d0d7de; border-radius: 8px;
             padding: 20px 24px; margin-bottom: 20px; }}

    .pr-meta {{ color: #57606a; font-size: 13px; margin-bottom: 6px; }}
    .pr-title {{ font-size: 20px; font-weight: 600; margin: 0 0 10px; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }}
    .pr-title a {{ color: #24292f; text-decoration: none; }}
    .pr-title a:hover {{ color: #0969da; }}
    .pr-state {{ padding: 2px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; white-space: nowrap; }}
    .pr-state.open   {{ background: #dafbe1; color: #116329; border: 1px solid #82cfaa; }}
    .pr-state.merged {{ background: #e5d9f9; color: #5e35b1; border: 1px solid #c4a0f5; }}
    .pr-state.draft  {{ background: #f6f8fa; color: #57606a; border: 1px solid #d0d7de; }}

    .checks {{ display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px; font-size: 12px; }}
    .check {{ display: flex; align-items: center; gap: 4px; padding: 3px 8px; border-radius: 6px;
              background: #f6f8fa; border: 1px solid #d0d7de; text-decoration: none; color: inherit; }}
    .check.pass {{ color: #116329; }} .check.fail {{ color: #82071e; }} .check.pending {{ color: #9a6700; }}

    .pr-description {{ font-size: 14px; line-height: 1.6; border-top: 1px solid #d0d7de;
                       padding-top: 14px; margin-top: 14px; }}
    .pr-description h2, .pr-description h3 {{ font-size: 14px; margin: 12px 0 4px; color: #57606a; }}
    .pr-description ul {{ margin: 4px 0 4px 20px; padding: 0; }}
    .pr-description li {{ margin: 2px 0; }}
    .pr-description code {{ background: #f6f8fa; border: 1px solid #d0d7de; border-radius: 4px;
                             padding: 1px 5px; font-family: ui-monospace, monospace; font-size: 12px; }}
    .pr-description p {{ margin: 6px 0; }}
    .pr-description input[type=checkbox] {{ pointer-events: none; }}

    .chain {{ font-size: 13px; color: #57606a; margin-top: 8px; }}

    .narrative {{ font-size: 14px; line-height: 1.7; margin: 0; }}

    .cluster {{ margin-bottom: 32px; }}
    .cluster-header {{ display: flex; align-items: baseline; gap: 10px; margin-bottom: 10px; flex-wrap: wrap; }}
    .cluster-number {{ display: inline-flex; align-items: center; justify-content: center;
                       width: 22px; height: 22px; border-radius: 50%; background: #0969da;
                       color: white; font-size: 11px; font-weight: 700; flex-shrink: 0; }}
    .cluster-label {{ font-size: 16px; font-weight: 600; }}
    .cluster-desc {{ font-size: 13px; color: #57606a; }}

    .file-context {{ font-size: 12px; color: #57606a; padding: 6px 12px; background: #f6f8fa;
                     border: 1px solid #d0d7de; border-bottom: none;
                     border-radius: 6px 6px 0 0; margin-top: 4px; }}
    .diff-wrapper {{ border-radius: 0 0 6px 6px; overflow: hidden;
                     border: 1px solid #d0d7de; margin-bottom: 16px; }}

    .callout {{ display: flex; gap: 8px; align-items: flex-start; padding: 10px 12px;
                border-radius: 6px; font-size: 13px; margin-bottom: 10px; line-height: 1.5; }}
    .callout-warning {{ background: #fff8c5; border: 1px solid #d4a72c; color: #7d4e00; }}
    .callout-info    {{ background: #ddf4ff; border: 1px solid #54aeff; color: #0550ae; }}
    .callout-icon {{ font-size: 15px; flex-shrink: 0; }}
    .callout a {{ color: inherit; font-weight: 600; }}

    .commit-badge {{ font-size: 12px; color: #57606a; margin-bottom: 4px; margin-top: 2px; }}
    .commit-badge code {{ background: #f6f8fa; border: 1px solid #d0d7de; border-radius: 4px;
                          padding: 1px 5px; font-family: ui-monospace, monospace; }}

    .controls {{ display: flex; gap: 8px; margin-bottom: 20px; }}
    .controls button {{ padding: 6px 14px; border: 1px solid #d0d7de; border-radius: 6px;
                        background: white; cursor: pointer; font-size: 13px; color: #24292f; }}
    .controls button.active {{ background: #0969da; color: white; border-color: #0969da; }}

    .hljs {{ background: transparent !important; }}
    .d2h-code-linenumber a, .d2h-code-side-linenumber a {{ color: inherit; text-decoration: none; display: block; width: 100%; }}
    .d2h-code-linenumber a:hover, .d2h-code-side-linenumber a:hover {{ text-decoration: underline; color: #0969da; }}
  </style>
</head>
<body>

<div class="card">
  <div class="pr-meta"><strong>{repo}</strong> · PR #{pr["number"]} · by {pr_author_esc}</div>
  <div class="pr-title">
    <a href="{html.escape(pr_url)}" target="_blank">{pr_title_esc}</a>
    <span class="pr-state {state_css}">{state_label}</span>
  </div>
  {chain_html}
  {children_html}
  {checks_html}
  <div class="pr-description" id="pr-body"></div>
</div>

<div class="card">
  <p class="narrative">{narrative}</p>
</div>

<div class="controls">
  <button id="btn-unified" onclick="setView('line-by-line')">Unified</button>
  <button id="btn-split" class="active" onclick="setView('side-by-side')">Side by side</button>
</div>

{clusters_html}

<script src="https://cdn.jsdelivr.net/npm/diff2html/bundles/js/diff2html-ui.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/dompurify/dist/purify.min.js"></script>
<script>
// ── Markdown-render the PR body ───────────────────────────────────────────────
const rawBody = {js_safe_json(pr.get("body") or "")};

// Linkify Linear tickets and PR refs before passing to marked
function linkifyBody(text) {{
  // Linear tickets: OBT-NNN only
  // Negative lookbehind for '[' avoids re-linking already-linked text like [OBT-123](url)
  text = text.replace(/(?<!\\[)\\bOBT-(\\d+)\\b/g,
    (_, num) => `[OBT-${{num}}](https://linear.app/recidiviz/issue/OBT-${{num}})`);
  // GitHub PR/issue refs (#NNN) — only bare refs, not already inside a link
  text = text.replace(/(?<!\\/)#(\\d+)/g,
    (_, num) => `[#${{num}}](https://github.com/{repo}/issues/${{num}})`);
  return text;
}}

// Strip boilerplate template sections
function stripBoilerplate(text) {{
  return text
    .replace(/\\n## Type of change[\\s\\S]*/m, '')
    .replace(/\\n## Related issues[\\s\\S]*/m, '')
    .trim();
}}

document.getElementById('pr-body').innerHTML =
  DOMPurify.sanitize(marked.parse(linkifyBody(stripBoilerplate(rawBody))));

// ── Diff rendering ────────────────────────────────────────────────────────────
const PR_BASE = {js_safe_json(pr_base_files)};
const FILE_HASHES = {js_safe_json(file_hashes)};
const DIFF_REGISTRY = {js_safe_json(diff_registry)};

function addLineLinks(container) {{
  container.querySelectorAll('.d2h-file-wrapper').forEach(wrapper => {{
    const nameEl = wrapper.querySelector('.d2h-file-name');
    if (!nameEl) return;
    const hash = FILE_HASHES[nameEl.textContent.trim()];
    if (!hash) return;

    // Unified mode: each row has one .d2h-code-linenumber cell with .line-num1 and .line-num2 children
    wrapper.querySelectorAll('tr').forEach(tr => {{
      const cell = tr.querySelector('.d2h-code-linenumber');
      if (!cell) return;
      [[cell.querySelector('.line-num1'), 'L'],
       [cell.querySelector('.line-num2'), 'R']].forEach(([el, side]) => {{
        if (!el) return;
        const n = parseInt(el.textContent.trim(), 10);
        if (!n) return;
        const a = document.createElement('a');
        a.href = `${{PR_BASE}}#diff-${{hash}}${{side}}${{n}}`;
        a.target = '_blank';
        a.textContent = el.textContent;
        el.textContent = '';
        el.appendChild(a);
      }});
    }});

    // Side-by-side mode: two .d2h-file-side-diff panels; first = L, second = R
    wrapper.querySelectorAll('.d2h-file-side-diff').forEach((panel, panelIdx) => {{
      const side = panelIdx === 0 ? 'L' : 'R';
      panel.querySelectorAll('.d2h-code-side-linenumber').forEach(cell => {{
        if (cell.querySelector('a')) return; // already linked
        const n = parseInt(cell.textContent.trim(), 10);
        if (!n) return;
        const a = document.createElement('a');
        a.href = `${{PR_BASE}}#diff-${{hash}}${{side}}${{n}}`;
        a.target = '_blank';
        a.textContent = cell.textContent;
        cell.textContent = '';
        cell.appendChild(a);
      }});
    }});
  }});
}}

let currentView = 'side-by-side';

function renderDiff(containerId, diffStr) {{
  const el = document.getElementById(containerId);
  if (!el || !diffStr) return;
  el.innerHTML = '';
  const ui = new Diff2HtmlUI(el, diffStr, {{
    drawFileList: false,
    matching: 'lines',
    outputFormat: currentView,
    highlight: true,
    fileContentToggle: false,
  }});
  ui.draw();
  ui.highlightCode();
  addLineLinks(el);
}}

function renderAll() {{
  Object.entries(DIFF_REGISTRY).forEach(([id, diffStr]) => {{
    renderDiff(id, diffStr);
  }});
}}

function setView(view) {{
  currentView = view;
  document.getElementById('btn-unified').classList.toggle('active', view === 'line-by-line');
  document.getElementById('btn-split').classList.toggle('active', view === 'side-by-side');
  renderAll();
}}

renderAll();
</script>
</body>
</html>"""


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--context", required=True)
    parser.add_argument("--analysis", required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()

    with open(args.context) as f:
        ctx = json.load(f)
    with open(args.analysis) as f:
        analysis = json.load(f)

    html_content = generate_html(ctx, analysis)
    with open(args.output, "w") as f:
        f.write(html_content)
    print(f"Written to {args.output}")


if __name__ == "__main__":
    main()
