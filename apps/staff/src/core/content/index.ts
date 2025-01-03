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

import { merge } from "lodash";

import * as pathwaysTenants from "../../RootStore/TenantStore/pathwaysTenants";
import { TenantId } from "../../RootStore/types";
import { ViewMethodology } from "../models/types";
import { usIdMethodology } from "./methodology/usIdMethodology";
import { usMoMethodology } from "./methodology/usMoMethodology";
import { usNdMethodology } from "./methodology/usNdMethodology";
import { usTnMethodology } from "./methodology/usTnMethodology";
import defaultMetricContent from "./metric/default";
import IdMetricContent from "./metric/us_id";
import MoMetricContent from "./metric/us_mo";
import NdMetricContent from "./metric/us_nd";
import TnMetricContent from "./metric/us_tn";
import defaultPageContent from "./page/default";
import IdPageContent from "./page/us_id";
import MoPageContent from "./page/us_mo";
import NdPageContent from "./page/us_nd";
import TnPageContent from "./page/us_tn";
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
  US_TN: TnPageContent,
  US_ND: NdPageContent,
  US_MO: MoPageContent,
};

export const metricContentOverrides: {
  [category: string]: StateSpecificMetricCopy;
} = {
  US_ID: IdMetricContent,
  US_TN: TnMetricContent,
  US_ND: NdMetricContent,
  US_MO: MoMetricContent,
};

export const getPageCopy = (currentTenantId: TenantId): PageCopy => {
  const copyOfContent = JSON.parse(JSON.stringify(defaultPageContent));
  return currentTenantId in pageContentOverrides
    ? merge(copyOfContent, pageContentOverrides[currentTenantId])
    : defaultPageContent;
};

export const getMetricCopy = (
  currentTenantId: TenantId | undefined,
): MetricCopy => {
  return currentTenantId && currentTenantId in metricContentOverrides
    ? merge(defaultMetricContent, metricContentOverrides[currentTenantId])
    : defaultMetricContent;
};

export const getMethodologyCopy = (
  currentTenantId: TenantId,
): ViewMethodology => {
  switch (currentTenantId) {
    case pathwaysTenants.US_ID:
      return usIdMethodology;
    case pathwaysTenants.US_ND:
      return usNdMethodology;
    case pathwaysTenants.US_MO:
      return usMoMethodology;
    case pathwaysTenants.US_TN:
      return usTnMethodology;
    default:
      throw new Error(
        `methodology does not exist for state code ${currentTenantId}`,
      );
  }
};
