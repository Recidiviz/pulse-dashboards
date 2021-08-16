// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2021 Recidiviz, Inc.
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
import { Navigation } from "../core/views";
import { TenantId } from "../RootStore/types";
import TENANTS, { RoutePermission } from "../tenants";

export function getPathsFromNavigation(
  userAllowedNavigation: Navigation
): string[] {
  if (!userAllowedNavigation) return [];
  return Object.entries(userAllowedNavigation).flatMap((navItem) => {
    const section: string = navItem[0];
    const pages: string[] = navItem[1] || [];
    return pages.length
      ? pages.map((page) => `/${section}/${page}`)
      : [`/${section}`];
  });
}

export function getAllowedNavigation(
  tenantAllowedNavigation: Navigation | undefined,
  pagesWithRestrictions: string[] | undefined,
  routes: RoutePermission[]
): Navigation {
  if (!tenantAllowedNavigation) return {};
  const userAllowedNavigation = routes.reduce(
    (acc, route) => {
      const [fullRoute, permission] = route;
      const [section, page] = fullRoute.split("_");
      if (permission) {
        // eslint-disable-next-line no-unused-expressions
        acc[section as keyof Navigation]?.push(page);
        // eslint-disable-next-line no-unused-expressions
        acc.methodology?.push(page);
      }
      return acc;
    },
    { community: [], facilities: [], methodology: [] } as Navigation
  );
  const allowedNavigation = Object.fromEntries(
    Object.entries(tenantAllowedNavigation).map(([section, pages]) => {
      return [
        section,
        pages?.filter(
          (p) =>
            (pagesWithRestrictions && !pagesWithRestrictions.includes(p)) ||
            userAllowedNavigation[section as keyof Navigation]?.includes(p)
        ),
      ];
    })
  );

  if (allowedNavigation.methodology?.length === 0) {
    delete allowedNavigation.methodology;
  }

  return allowedNavigation;
}

export function getPathWithoutParams(pathname: string): string {
  const navItems = pathname.split("/");
  // navItems[0] is "" because of the leading /
  const section: string = navItems[1];
  const page: string = navItems[2];
  return page ? `/${section}/${page}` : `/${section}`;
}

export function convertToSlug(text: string): string {
  return text.trim().replace(/:/g, "").replace(/_|\s/g, "-").toLowerCase();
}

export function convertSlugToId(slug: string): string {
  return slug.replace(/-/g, "_").toUpperCase();
}

export function getStateNameForStateCode(stateCode: string): string {
  if (!Object.keys(TENANTS).includes(stateCode)) {
    throw new Error(`Unknown state code provided: ${stateCode}`);
  }
  return TENANTS[stateCode as TenantId].name;
}
