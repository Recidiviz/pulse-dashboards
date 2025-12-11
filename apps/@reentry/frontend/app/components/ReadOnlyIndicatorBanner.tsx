// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

"use client";

import { useAuthUserCapabilities } from "~@reentry/frontend/contexts/AuthUserCapabilitiesContext";

export default function ReadOnlyIndicatorBanner() {
  const { isReadOnlyUser } = useAuthUserCapabilities();

  if (!isReadOnlyUser) return null;

  return (
    <div
      className="w-full bg-amber-50 text-amber-700 text-xs font-medium py-1 text-center border-b border-amber-200
        sticky top-0 z-[9999] shadow-sm"
    >
      You are in read-only mode
    </div>
  );
}
