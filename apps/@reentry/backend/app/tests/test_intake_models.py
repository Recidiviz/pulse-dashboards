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

"""Tests for intake models."""

import uuid

import pytest

from app.models.intake import ClientAddress


class TestClientAddressAsFormattedString:
    @pytest.mark.parametrize(
        "street_address,city,state,expected",
        [
            ("123 Main St", "Springfield", "IL", "123 Main St, Springfield, IL"),
            (None, "Springfield", "IL", "Springfield, IL"),
            ("", "Springfield", "IL", "Springfield, IL"),
        ],
    )
    def test_formats_address(self, street_address, city, state, expected):
        address = ClientAddress(
            intake_id=uuid.uuid4(),
            street_address=street_address,
            city=city,
            state=state,
        )
        assert address.as_formatted_string() == expected
