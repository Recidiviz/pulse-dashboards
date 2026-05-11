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

"""Unit tests for the PDF renderer's SSRF protection."""

import socket
from unittest.mock import patch

import pytest

from app.pdf.renderer import _safe_url_fetcher


class TestSafeUrlFetcher:
    # Blocked by hostname allowlist
    @pytest.mark.parametrize(
        "url",
        [
            "http://metadata.google.internal/computeMetadata/v1/",
            "http://metadata/",
            "http://169.254.169.254/latest/meta-data/",
        ],
    )
    def test_blocks_known_metadata_hosts(self, url):
        with pytest.raises(ValueError, match="URL fetch blocked"):
            _safe_url_fetcher(url)

    # Blocked by literal private IP
    @pytest.mark.parametrize(
        "url",
        [
            "http://10.0.0.1/internal",
            "http://192.168.1.1/admin",
            "http://127.0.0.1/",
            "http://172.16.0.1/",
        ],
    )
    def test_blocks_private_ip_literals(self, url):
        with pytest.raises(ValueError, match="URL fetch blocked"):
            _safe_url_fetcher(url)

    # DNS resolves to private IP (rebinding attack)
    def test_blocks_dns_resolving_to_private_ip(self):
        private_ip = "10.0.0.1"
        mock_result = [(socket.AF_INET, None, None, None, (private_ip, 80))]
        with patch("app.pdf.renderer.socket.getaddrinfo", return_value=mock_result):
            with pytest.raises(ValueError, match="resolves to private IP"):
                _safe_url_fetcher("http://evil.example.com/resource")

    # Unresolvable host
    def test_blocks_unresolvable_hostname(self):
        with patch(
            "app.pdf.renderer.socket.getaddrinfo",
            side_effect=socket.gaierror("Name not resolved"),
        ):
            with pytest.raises(ValueError, match="cannot resolve"):
                _safe_url_fetcher("http://not-a-real-host.invalid/")

    # Legitimate external URL passes through to weasyprint
    def test_allows_legitimate_external_url(self):
        public_ip = "93.184.216.34"  # example.com
        mock_result = [(socket.AF_INET, None, None, None, (public_ip, 80))]
        with patch("app.pdf.renderer.socket.getaddrinfo", return_value=mock_result):
            with patch("app.pdf.renderer.weasyprint.default_url_fetcher") as mock_fetch:
                mock_fetch.return_value = {"content": b"", "mime_type": "image/png"}
                result = _safe_url_fetcher("http://example.com/image.png")
                mock_fetch.assert_called_once()
                assert result is not None
