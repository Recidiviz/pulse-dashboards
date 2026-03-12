// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.
// =============================================================================

// NOTE: Temporary for user testing and will be removed entirely after user testing

import { Link } from "react-router-dom";

export function TransportDemoLink() {
  if (!window.location.hostname.endsWith(".edovo.com")) {
    return null;
  }

  return (
    <Link
      to="/transport-demo"
      style={{
        position: "fixed",
        bottom: 12,
        right: 12,
        padding: "4px 10px",
        borderRadius: 6,
        background: "#f0f0f0",
        color: "#999",
        fontSize: "0.65rem",
        textDecoration: "none",
        zIndex: 9999,
      }}
    >
      Transport Test
    </Link>
  );
}
