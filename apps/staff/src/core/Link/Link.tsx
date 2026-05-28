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

import { forwardRef, useMemo } from "react";
import {
  Link as RouterLink,
  LinkProps,
  parsePath,
  To,
  useLocation,
} from "react-router-dom";

/**
 * A drop-in replacement for react-router's `Link` that, by default:
 *
 * - **Appends the current URL's `tenantId`** to its `to` destination, unless
 *   `to` already specifies a `tenantId` (an explicit value in `to` wins). This
 *   keeps the active tenant context across navigation without each caller
 *   re-plumbing it.
 * - **Stamps `{ previousPage: <current URL> }`** as router state, so a
 *   destination's back control can return to where the user came from. Passing
 *   a `state` prop overrides this (use `state={null}` to omit it entirely).
 *
 * Props are exactly react-router `LinkProps`, so it can be swapped in directly
 * and styled via `styled(Link)`.
 */
export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  { to, state, ...rest },
  ref,
) {
  const { pathname, search } = useLocation();

  const resolvedTo = useMemo<To>(() => {
    const currentTenantId = new URLSearchParams(search).get("tenantId");
    const path = typeof to === "string" ? parsePath(to) : { ...to };
    const params = new URLSearchParams(path.search ?? "");
    if (currentTenantId && !params.has("tenantId")) {
      params.set("tenantId", currentTenantId);
    }
    const nextSearch = params.toString();
    return { ...path, search: nextSearch ? `?${nextSearch}` : "" };
  }, [to, search]);

  const resolvedState = useMemo(
    () =>
      state !== undefined ? state : { previousPage: `${pathname}${search}` },
    [state, pathname, search],
  );

  return (
    <RouterLink ref={ref} {...rest} to={resolvedTo} state={resolvedState} />
  );
});
