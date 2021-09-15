/*
 * Recidiviz - a data platform for criminal justice reform
 * Copyright (C) 2021 Recidiviz, Inc.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 * =============================================================================
 *
 */

import { useRootStore } from "../../components/StoreProvider";
import { PageContent, StateSpecificPageCopy } from "../content/types";
import defaultContent from "../content/view/default";
import IdContent from "../content/view/us_id";
import { PathwaysPageId } from "../views";

const contentOverrides: { [category: string]: StateSpecificPageCopy } = {
  US_ID: IdContent,
};

export default function usePageContent(viewName: PathwaysPageId): PageContent {
  const { currentTenantId } = useRootStore();

  if (
    currentTenantId in contentOverrides &&
    viewName in contentOverrides[currentTenantId]
  ) {
    return {
      ...defaultContent[viewName],
      ...contentOverrides[currentTenantId][viewName],
    };
  }

  return defaultContent[viewName];
}
