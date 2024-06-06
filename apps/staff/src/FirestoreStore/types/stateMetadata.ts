/*
 * Recidiviz - a data platform for criminal justice reform
 * Copyright (C) 2024 Recidiviz, Inc.
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
 */

import { TenantId } from "../../RootStore/types";
import {
  UsMoSanctionInfo,
  UsMoSolitaryAssignmentInfoPastYear,
} from "../../WorkflowsStore/Opportunity/UsMo/common";

export type UsMoStateMetadata = {
  stateCode: "US_MO";
  d1SanctionInfoInPastYear: UsMoSanctionInfo[];
  solitaryAssignmentInfoPastYear: UsMoSolitaryAssignmentInfoPastYear[];
  numSolitaryAssignmentsPastYear: number;
  numD1SanctionsPastYear: number;
};

type DefinedStateMetadata = {
  US_MO: UsMoStateMetadata;
};

export type StateMetadataMap = {
  [K in TenantId]: K extends keyof DefinedStateMetadata
    ? DefinedStateMetadata[K]
    : Record<string, never>;
};

export type StateMetadata = StateMetadataMap[TenantId];
