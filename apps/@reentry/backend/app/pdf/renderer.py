# Recidiviz - a data platform for criminal justice reform
# Copyright (C) 2026 Recidiviz, Inc.
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program.  If not, see <https://www.gnu.org/licenses/>.
# =============================================================================

import ipaddress
import socket
from pathlib import Path
from urllib.parse import urlparse

import jinja2
import weasyprint
from weasyprint import CSS, HTML

_BLOCKED_HOSTS = frozenset({"metadata.google.internal", "metadata", "169.254.169.254"})


def _is_blocked_ip(addr_str: str) -> bool:
    try:
        addr = ipaddress.ip_address(addr_str)
        return addr.is_private or addr.is_loopback or addr.is_link_local
    except ValueError:
        return False


def _safe_url_fetcher(
    url: str, timeout: int = 10, ssl_context: object = None
) -> object:
    """URL fetcher for WeasyPrint that blocks internal/metadata endpoints.

    Resolves DNS before allowing requests to prevent DNS rebinding attacks
    where attacker-controlled domains point to internal IPs.
    """
    parsed = urlparse(url)
    hostname = parsed.hostname or ""

    if hostname in _BLOCKED_HOSTS:
        raise ValueError(f"URL fetch blocked: {hostname}")

    if _is_blocked_ip(hostname):
        raise ValueError(f"URL fetch blocked: private IP {hostname}")

    try:
        resolved_ips = socket.getaddrinfo(
            hostname, parsed.port or 80, proto=socket.IPPROTO_TCP
        )
        for family, _, _, _, sockaddr in resolved_ips:
            ip_str = sockaddr[0]
            if _is_blocked_ip(ip_str):
                raise ValueError(
                    f"URL fetch blocked: {hostname} resolves to private IP {ip_str}"
                )
    except socket.gaierror:
        raise ValueError(f"URL fetch blocked: cannot resolve {hostname}")

    return weasyprint.default_url_fetcher(url, timeout=timeout, ssl_context=ssl_context)


class PDFRenderer:
    def __init__(self) -> None:
        base = Path(__file__).parent
        self._env = jinja2.Environment(
            loader=jinja2.FileSystemLoader(str(base / "templates")),
            autoescape=False,
        )
        self._styles_dir = base / "styles"

    def render(self, template_name: str, context: dict, css_file: str) -> bytes:
        html_string = self._env.get_template(template_name).render(**context)
        css = CSS(filename=str(self._styles_dir / css_file))
        return HTML(string=html_string, url_fetcher=_safe_url_fetcher).write_pdf(
            stylesheets=[css],
            presentational_hints=True,
            optimize_images=True,
            pdf_version="1.7",
        )


pdf_renderer = PDFRenderer()
