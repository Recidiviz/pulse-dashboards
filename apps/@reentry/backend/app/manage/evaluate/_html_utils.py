import json
from pathlib import Path

import structlog

logger = structlog.get_logger(__name__)


def write_html_report(template: str, data: list, report_file: str) -> None:
    """Safely embed JSON data into an HTML template and write to a file.

    Escapes </script> sequences in the serialized JSON to prevent script tag
    breakout if database content contains that literal string.
    """
    safe_data = json.dumps(data).replace("</script>", "<\\/script>")
    html = template.replace("__DATA__", safe_data)
    Path(report_file).write_text(html)
    logger.info("HTML report written", path=report_file)
