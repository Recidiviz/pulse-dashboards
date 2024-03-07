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

import { Navigation } from "../core/types/navigation";
import { FILTER_TYPES } from "../core/utils/constants";
import {
  DASHBOARD_VIEWS,
  INSIGHTS_PAGES,
  PATHWAYS_PAGES,
  WORKFLOWS_PAGES,
} from "../core/views";
import { TenantId } from "../RootStore/types";
import TENANTS from "../tenants";

export function getPathsFromNavigation(
  userAllowedNavigation: Navigation,
): string[] {
  if (!userAllowedNavigation) return [];
  return Object.entries(userAllowedNavigation).flatMap((navItem) => {
    const view: string = navItem[0];
    const pages: string[] = navItem[1] || [];
    return pages.length
      ? pages.map((page) => `/${view}/${page}`).concat([`/${view}`])
      : [`/${view}`];
  });
}

export function getAllowedMethodology(
  allowed: Partial<Navigation>,
): Partial<Navigation> {
  const methodologyPages = ["system", "operations"];
  const allowedMethodology = [] as string[];
  methodologyPages.forEach((page) => {
    if (Object.prototype.hasOwnProperty.call(allowed, page))
      allowedMethodology.push(page);
  });
  return {
    methodology: allowedMethodology,
  };
}

export function getPathWithoutParams(pathname: string): string {
  const viewsAndPages: string[] = [
    ...Object.values(DASHBOARD_VIEWS),
    ...Object.values(PATHWAYS_PAGES),
    ...Object.values(WORKFLOWS_PAGES),
    ...Object.values(INSIGHTS_PAGES),
  ];
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
  {},
) as QueryParamConfigMap;

export const metricQueryParams = {
  selectedMetric: StringParam,
} as QueryParamConfigMap;

export const removeUndefinedValuesFromObject = (
  obj: Record<string, string>,
): Record<string, string> => {
  const cleanObj = { ...obj };
  Object.keys(cleanObj).forEach(
    (key) => cleanObj[key] === undefined && delete cleanObj[key],
  );
  return cleanObj;
};

/* Helper function to append active class names to NavLink components */
export function appendActiveClassName(baseClassName: string) {
  return ({ isActive }: { isActive: boolean }) =>
    `${baseClassName}${isActive ? ` ${baseClassName}--active` : ""}`;
}
