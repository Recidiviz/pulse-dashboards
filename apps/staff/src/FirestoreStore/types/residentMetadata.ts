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

type UsArProgramAchievement = {
  programLocation: string;
  programEvaluationScore: string | null;
  programAchievementDate: string;
  programType: string;
};

type UsArCurrentSentences = {
  sentenceId: number;
  startDate: string;
  endDate: string;
  personId: number;
  initialTimeServedDays: number;
};

export type UsArResidentMetadata = {
  stateCode: "US_AR";
  currentCustodyClassification: string;
  currentGtEarningClass: string;
  currentLocation: string;
  currentSentences: UsArCurrentSentences[];
  gedCompletionDate: string | null;
  maxFlatReleaseDate: string;
  noIncarcerationSanctionsWithin6Months: boolean;
  noIncarcerationSanctionsWithin12Months: boolean;
  paroleEligibilityDate: string;
  programAchievement: UsArProgramAchievement[];
  projectedReleaseDate: string;
};

export type UsMoResidentMetadata = {
  stateCode: "US_MO";
  d1SanctionInfoInPastYear: UsMoSanctionInfo[];
  solitaryAssignmentInfoPastYear: UsMoSolitaryAssignmentInfoPastYear[];
  numSolitaryAssignmentsPastYear: number;
  numD1SanctionsPastYear: number;
};

type DefinedResidentMetadata = {
  US_MO: UsMoResidentMetadata;
  US_AR: UsArResidentMetadata;
};

export type ResidentMetadataMap = {
  [K in TenantId]: K extends keyof DefinedResidentMetadata
    ? DefinedResidentMetadata[K]
    : Record<string, never>;
};

export type ResidentMetadata = ResidentMetadataMap[TenantId];
