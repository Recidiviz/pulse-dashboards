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

import { useEffect } from "react";

/**
 * Sets the current page's title to the provided string.
 */
function useTitle(title: string) {
  useEffect(() => {
    document.title = title;
  }, [title]);
}

/**
 * Creates an appropriately structured string based on the provided title
 * and sets the HTML document title accordingly.
 * @param pageTitle - the title you want to assign to the current page. DO NOT
 * include supplemental information such as the name of the website, etc.; this hook
 * will handle that for you. Falls back to a default value if an empty or undefined title
 * is passed.
 */
export function usePageTitle(pageTitle: string | undefined) {
  useTitle(`${pageTitle ?? ""}${pageTitle ? " – " : ""}Opportunities`);
}
