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
import { merge } from "lodash";

import * as coreTenants from "../../RootStore/TenantStore/coreTenants";
import { TenantId } from "../../RootStore/types";
import { ViewMethodology } from "../models/types";
import { usIdMethodology } from "./methodology/usIdMethodology";
import { usNdMethodology } from "./methodology/usNdMethodology";
import defaultMetricContent from "./metric/default";
import IdMetricContent from "./metric/us_id";
import defaultPageContent from "./page/default";
import IdPageContent from "./page/us_id";
import {
  MetricCopy,
  PageCopy,
  StateSpecificMetricCopy,
  StateSpecificPageCopy,
} from "./types";

export const pageContentOverrides: {
  [category: string]: StateSpecificPageCopy;
} = {
  US_ID: IdPageContent,
};

export const metricContentOverrides: {
  [category: string]: StateSpecificMetricCopy;
} = {
  US_ID: IdMetricContent,
};

export const getPageCopy = (currentTenantId: TenantId): PageCopy => {
  return currentTenantId in pageContentOverrides
    ? merge(defaultPageContent, pageContentOverrides[currentTenantId])
    : defaultPageContent;
};

export const getMetricCopy = (
  currentTenantId: TenantId | undefined
): MetricCopy => {
  return currentTenantId && currentTenantId in metricContentOverrides
    ? merge(defaultMetricContent, metricContentOverrides[currentTenantId])
    : defaultMetricContent;
};

export const getMethodologyCopy = (
  currentTenantId: TenantId
): ViewMethodology => {
  switch (currentTenantId) {
    case coreTenants.US_ID:
      return usIdMethodology;
    case coreTenants.US_ND:
      return usNdMethodology;
    default:
      throw new Error(
        `methodology does not exist for state code ${currentTenantId}`
      );
  }
};
