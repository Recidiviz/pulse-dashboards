// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

export const psiRootPath = "psi";

export const PSI_PATHS: Record<PSIPage, string> = {
  psi: `/${psiRootPath}`,
  dashboard: `/${psiRootPath}/dashboard/:staffPseudoId`,
  caseDetails: `/${psiRootPath}/dashboard/:staffPseudoId/case/:caseId`,
};

export type PSIPage = keyof typeof PSI_PAGES;

export const PSI_PAGES = {
  psi: psiRootPath,
  dashboard: "dashboard",
  caseDetails: "caseDetails",
} as const;

/** @returns the relative route template string for a PSI page */
export const psiRoute = ({ routeName }: { routeName: PSIPage }): string => {
  return PSI_PATHS[routeName].replace(PSI_PATHS.psi, "");
};

export type PSIRouteParams = {
  staffPseudoId: string;
  caseId?: string;
};

export const psiUrl = (routeName: PSIPage, params: PSIRouteParams): string => {
  if (params) {
    let path = PSI_PATHS[routeName];
    Object.entries(params).forEach(([key, value]) => {
      path = path.replace(`:${key}`, value);
    });
    return path;
  }
  return PSI_PATHS[routeName];
};
