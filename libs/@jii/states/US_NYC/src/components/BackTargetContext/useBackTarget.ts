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

import { useLayoutEffect } from "react";

import { useBackTargetContext } from "./BackTargetContext";

/**
 * Pass a path to declare it as the current CRE page's back target. Call with
 * no arguments to read whatever's currently declared. `null` means no CRE page
 * has declared a target (e.g. landing page/any page that doesn't require a back button)
 */
export function useBackTarget(path?: string): string | null {
  const { backTarget, setBackTarget } = useBackTargetContext();

  // useLayoutEffect so the back button/logo swap and any target change happen before
  // paint, instead of flashing the old state.
  useLayoutEffect(() => {
    if (path === undefined) return;
    setBackTarget(path);
    return () => setBackTarget(null);
  }, [path, setBackTarget]);

  return backTarget;
}
