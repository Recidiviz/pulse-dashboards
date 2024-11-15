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

import { TenantId } from "../../RootStore/types";
import {
  UsMoSanctionInfo,
  UsMoSolitaryAssignmentInfoPastYear,
} from "../../WorkflowsStore/Opportunity/UsMo/common";

/*****
 US_AR
 ****/

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

/*****
 US_AZ
 ****/
export type UsAzResidentMetadata = {
  stateCode: "US_AZ";
  sedDate: string | null;
  ercdDate: string | null;
  csbdDate: string | null;
  projectedCsbdDate: string | null;
  acisTprDate: string | null;
  projectedTprDate: string;
  acisDtpDate: string | null;
  projectedDtpDate: string | null;
};

/*****
 US_ID
 ****/

export type UsIdResidentMetadata = {
  stateCode: "US_ID";
  crcFacilities: string[];
  initialParoleHearingDate: string | null;
  nextParoleHearingDate: string | null;
  tentativeParoleDate: string | null;
};

/*****
 US_MO
 ****/

export type UsMoResidentMetadata = {
  stateCode: "US_MO";
  d1SanctionInfoPastYear: UsMoSanctionInfo[];
  solitaryAssignmentInfoPastYear: UsMoSolitaryAssignmentInfoPastYear[];
  numSolitaryAssignmentsPastYear: number;
  numD1SanctionsPastYear: number;
};

/*****
 US_ME
 ****/

export type UsMeResidentMetadata = {
  stateCode: "US_ME";
  portionServedNeeded: "1/2" | "2/3";
  sccpEligibilityDate: string;
};

/*****
 US_ND
 ****/

export type UsNdResidentMetadata = {
  stateCode: "US_ND";
  paroleReviewDate: string;
  paroleDate: string | null;
};

type DefinedResidentMetadata = {
  US_AR: UsArResidentMetadata;
  US_AZ: UsAzResidentMetadata;
  US_ID: UsIdResidentMetadata;
  US_ME: UsMeResidentMetadata;
  US_MO: UsMoResidentMetadata;
  US_ND: UsNdResidentMetadata;
};

export type ResidentMetadataMap = {
  [K in TenantId]: K extends keyof DefinedResidentMetadata
    ? DefinedResidentMetadata[K]
    : Record<string, never>;
};

export type ResidentMetadata = ResidentMetadataMap[TenantId];
