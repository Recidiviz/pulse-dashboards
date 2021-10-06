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
import { QueryParamConfigMap, StringParam } from "use-query-params";

import {
  Navigation,
  NavigationSection,
  RoutePermission,
} from "../core/types/navigation";
import { FILTER_TYPES } from "../core/utils/constants";
import {
  CORE_PAGES,
  CORE_VIEWS,
  PATHWAYS_PAGES,
  PATHWAYS_VIEWS,
} from "../core/views";
import { TenantId } from "../RootStore/types";
import TENANTS from "../tenants";

export function getPathsFromNavigation(
  userAllowedNavigation: Navigation
): string[] {
  if (!userAllowedNavigation) return [];
  return Object.entries(userAllowedNavigation).flatMap((navItem) => {
    const view: string = navItem[0];
    const pages: string[] = navItem[1] || [];
    return pages.length
      ? pages.map((page) => `/${view}/${page}`)
      : [`/${view}`];
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
      const [view, page] = fullRoute.split("_");

      if (permission) {
        // eslint-disable-next-line no-unused-expressions
        acc[view as keyof Navigation]?.push(page);
        if (Object.keys(CORE_VIEWS).includes(view)) {
          // eslint-disable-next-line no-unused-expressions
          acc.methodology?.push(page);
        }
        if (Object.keys(PATHWAYS_VIEWS).includes(view)) {
          // eslint-disable-next-line no-unused-expressions
          acc["pathways-methodology"]?.push(view);
        }
        if (view === PATHWAYS_VIEWS.practices) {
          acc[PATHWAYS_VIEWS.practices as NavigationSection] = [];
        }
      }
      return acc;
    },
    {
      community: [],
      facilities: [],
      methodology: [],
      pathways: [],
      prison: [],
      supervision: [],
      pathwaysMethodology: [],
    } as Navigation
  );

  const allowedNavigation = Object.fromEntries(
    Object.entries(tenantAllowedNavigation).map(([view, pages]) => {
      // eslint-disable-next-line no-nested-ternary
      return !pagesWithRestrictions?.includes(view)
        ? [
            view,
            pages?.filter(
              (p) =>
                (pagesWithRestrictions && !pagesWithRestrictions.includes(p)) ||
                userAllowedNavigation[view as keyof Navigation]?.includes(p)
            ),
          ]
        : Object.keys(userAllowedNavigation).includes(view)
        ? [view, []]
        : [];
    })
  );

  if (allowedNavigation.methodology?.length === 0) {
    delete allowedNavigation.methodology;
  }

  return allowedNavigation;
}

export function getPathWithoutParams(pathname: string): string {
  const viewsAndPages = Object.values(CORE_VIEWS)
    .concat(Object.values(CORE_PAGES))
    .concat(Object.values(PATHWAYS_VIEWS))
    .concat(Object.values(PATHWAYS_PAGES));
  const basePath = pathname
    .split("/")
    .filter((p) => viewsAndPages.includes(p))
    .join("/");
  return `/${basePath}`;
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

export const filterQueryParams = Object.values(FILTER_TYPES).reduce(
  (acc, filter) => ({ ...acc, [filter]: StringParam }),
  {}
) as QueryParamConfigMap;

export const metricQueryParams = {
  selectedMetricId: StringParam,
} as QueryParamConfigMap;

export const removeUndefinedValuesFromObject = (
  obj: Record<string, string>
): Record<string, string> => {
  const cleanObj = { ...obj };
  Object.keys(cleanObj).forEach(
    (key) => cleanObj[key] === undefined && delete cleanObj[key]
  );
  return cleanObj;
};
