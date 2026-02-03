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

export const cpaRootPath = "cpa";

type RouteParams = {
  caseloadOverview: { staffPseudoId: string };
};

/** Relative route patterns for use with react-router */
export const ROUTES = {
  caseloadOverview: "staff/:staffPseudoId",
} as const satisfies Record<keyof RouteParams, string>;

type RouteName = keyof typeof ROUTES;

/**
 * Generates a URL for a CPA route with the given parameters.
 */
export function cpaUrl<T extends RouteName>(
  routeName: T,
  params: RouteParams[T],
): string {
  let path: string = ROUTES[routeName];
  for (const [key, value] of Object.entries(params)) {
    path = path.replace(`:${key}`, value as string);
  }
  return path;
}
