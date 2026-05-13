# PDF Generation

The `app/pdf/` module owns all PDF rendering for CPA. The frontend sends only a plan or intake ID; the backend fetches data, renders a Jinja2 template, and returns bytes.

## Structure

```
app/pdf/
  renderer.py          # PDFRenderer singleton + _safe_url_fetcher
  templates/
    intake_summary.html
    action_plan.html
    chat_history.html
  styles/
    intake_summary.pdf.css
    action_plan.pdf.css
    chat_history.pdf.css
```

Each document type has one template and one CSS file. They are standalone — no shared base stylesheet — so debugging any document means reading one file.

## How it works

```
GET /plans/{id}/action-plan-pdf
        ↓
Fetch data from DB
        ↓
Python markdown lib  →  HTML fragment   (for markdown-based documents)
        ↓
Jinja2 fills template (loops, conditionals, variable slots)  →  full HTML document
        ↓
WeasyPrint(HTML document, static CSS file on disk)
        ↓
PDF bytes
```

`PDFRenderer.render(template_name, context, css_file)` handles the Jinja2 + WeasyPrint steps. It is instantiated once as a module-level singleton (`pdf_renderer`) and imported by routers.

## Adding a new PDF endpoint

1. Add a template in `templates/` and a CSS file in `styles/`.
2. In the relevant router, inject `pdf_renderer` and call:
   ```python
   pdf_bytes = pdf_renderer.render("my_doc.html", context_dict, "my_doc.pdf.css")
   return Response(content=pdf_bytes, media_type="application/pdf")
   ```
3. Pass only already-safe content into the context (see **Security** below).

## Security

### URL fetcher

`PDFRenderer` passes `_safe_url_fetcher` to every `HTML()` call. This blocks WeasyPrint from making outbound requests to private IPs, loopback addresses, and cloud metadata endpoints (e.g. `169.254.169.254`). It also resolves DNS before allowing requests to guard against DNS rebinding.

**Do not** call `HTML(string=...)` without `url_fetcher=_safe_url_fetcher`. The legacy `POST /generate-pdf` endpoint in `plan_router.py` imports `_safe_url_fetcher` from this module for the same reason.

### Content escaping

The Jinja2 environment uses `autoescape=False` because content flowing into the action plan and intake summary templates is already-converted HTML from the Python `markdown` library, which HTML-encodes user input. Turning on autoescape would double-escape those tags.

**This assumption does not hold for `chat_history.html`.** Chat messages are raw client-typed strings. They must be escaped with `html.escape()` in the router _before_ being passed into the template context — not in the template itself. See `intake_admin_router.py` for the pattern.

If you add a new template that receives any raw user-supplied strings, escape them in Python before passing them to `render()`.

## Markdown preprocessing (action plan / intake summary)

LLM-generated markdown has several quirks that the Python `markdown` library does not handle by default. `_preprocess_action_plan_markdown` in `plan_router.py` normalises these before conversion:

- **`•` bullet lines** (U+2022): the LLM writes these on separate lines. Converted to `- ` list items preserving indentation.
- **`_BOLD_LABELS` normalization**: labels like `Goal:` may be partially bolded in inconsistent ways across generations. The preprocessor strips any partial bolding and re-applies it uniformly.
- XML tag stripping, blank line insertion before headers, and other minor fixes.

If the PDF output looks wrong for a specific markdown pattern, start with `_preprocess_action_plan_markdown` before touching the template or CSS.

## CSS notes

- Page size, margins, and the AI disclosure footer are defined in `@page` in each CSS file.
- `orphans: 2; widows: 2;` prevents aggressive page-pushing of short blocks.
- Nested list items (`ul ul`, `ol ol`, etc.) are explicitly set to `disc` because WeasyPrint does not inherit list-style-type through nesting the way browsers do.
- The three CSS files share ~70 lines of typography rules by duplication rather than inheritance. This is intentional: each file is authoritative for its document and can be read without cross-referencing.
