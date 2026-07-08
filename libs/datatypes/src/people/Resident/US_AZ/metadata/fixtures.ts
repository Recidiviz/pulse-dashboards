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

import { relativeFixtureDate } from "../../../../utils/zod";
import {
  RawUsAzResidentCommon,
  RawUsAzResidentJiiData,
  RawUsAzResidentMetadata,
} from "./schema";

// Fields used by both JII and workflows products.
export const usAzResidentCommonDataFixtures: RawUsAzResidentCommon[] = [
  // res001: TPR-approved, ERCD path
  {
    stateCode: "US_AZ",
    sedDate: relativeFixtureDate({ months: 9 }),
    acisTprDate: relativeFixtureDate({ days: 5 }),
    acisDtpDate: null,
    csedDate: relativeFixtureDate({ months: 11 }),
  },
  // res002: TPR path, DPR-eligible
  {
    stateCode: "US_AZ",
    sedDate: relativeFixtureDate({ days: 518 }),
    acisTprDate: relativeFixtureDate({ days: 50 }),
    acisDtpDate: null,
    csedDate: relativeFixtureDate({ days: 777 }),
  },
  // res003: TPR path, no ACIS date yet
  {
    stateCode: "US_AZ",
    sedDate: relativeFixtureDate({ days: 442 }),
    acisTprDate: null,
    acisDtpDate: null,
    csedDate: relativeFixtureDate({ days: 600 }),
  },
  // res004: TPR path, further out
  {
    stateCode: "US_AZ",
    sedDate: relativeFixtureDate({ months: 20 }),
    acisTprDate: null,
    acisDtpDate: null,
    csedDate: relativeFixtureDate({ months: 23, days: 9 }),
  },
  // res014: DTP-approved, ADD/TrToADD path
  {
    stateCode: "US_AZ",
    sedDate: relativeFixtureDate({ months: 9 }),
    acisTprDate: relativeFixtureDate({ days: 5 }),
    acisDtpDate: relativeFixtureDate({ days: 5 }),
    csedDate: null,
  },
  // res015: DTP path
  {
    stateCode: "US_AZ",
    sedDate: relativeFixtureDate({ days: 518 }),
    acisTprDate: relativeFixtureDate({ days: 50 }),
    acisDtpDate: relativeFixtureDate({ days: 50 }),
    csedDate: null,
  },
  // res016: DTP path, no ACIS dates
  {
    stateCode: "US_AZ",
    sedDate: relativeFixtureDate({ days: 442 }),
    acisTprDate: null,
    acisDtpDate: null,
    csedDate: null,
  },
  // res017: DTP path, near-term
  {
    stateCode: "US_AZ",
    sedDate: relativeFixtureDate({ days: 277 }),
    acisTprDate: null,
    acisDtpDate: null,
    csedDate: null,
  },
  // res018: DTP path, further out
  {
    stateCode: "US_AZ",
    sedDate: relativeFixtureDate({ months: 20 }),
    acisTprDate: null,
    acisDtpDate: null,
    csedDate: null,
  },
  // res019: both TPR+DTP, DPR-eligible, no eligible opportunities
  {
    stateCode: "US_AZ",
    sedDate: relativeFixtureDate({ months: 6 }),
    acisTprDate: relativeFixtureDate({ days: 90 }),
    acisDtpDate: relativeFixtureDate({ days: 90 }),
    csedDate: null,
  },
  // res020: both TPR+DTP, DPR-eligible, no eligible opportunities
  {
    stateCode: "US_AZ",
    sedDate: relativeFixtureDate({ months: 6 }),
    acisTprDate: relativeFixtureDate({ days: 90 }),
    acisDtpDate: relativeFixtureDate({ days: 90 }),
    csedDate: null,
  },
  // res021: TPR+DTP, MINIMUM
  {
    stateCode: "US_AZ",
    sedDate: relativeFixtureDate({ months: 8 }),
    acisTprDate: relativeFixtureDate({ days: 45 }),
    acisDtpDate: relativeFixtureDate({ days: 45 }),
    csedDate: null,
  },
  // res022: TPR+DTP
  {
    stateCode: "US_AZ",
    sedDate: relativeFixtureDate({ months: 11 }),
    acisTprDate: relativeFixtureDate({ days: 60 }),
    acisDtpDate: relativeFixtureDate({ days: 60 }),
    csedDate: null,
  },
  // res023: TPR+DTP, MEDIUM
  {
    stateCode: "US_AZ",
    sedDate: relativeFixtureDate({ months: 9 }),
    acisTprDate: relativeFixtureDate({ days: 75 }),
    acisDtpDate: relativeFixtureDate({ days: 75 }),
    csedDate: null,
  },
  // res024: DTP, DPR-eligible, MINIMUM
  {
    stateCode: "US_AZ",
    sedDate: relativeFixtureDate({ months: 6 }),
    acisTprDate: relativeFixtureDate({ days: 90 }),
    acisDtpDate: relativeFixtureDate({ days: 90 }),
    csedDate: null,
  },
  // res025: DTP, MEDIUM
  {
    stateCode: "US_AZ",
    sedDate: relativeFixtureDate({ months: 7 }),
    acisTprDate: relativeFixtureDate({ days: 105 }),
    acisDtpDate: relativeFixtureDate({ days: 105 }),
    csedDate: null,
  },
  // res026: DTP, MINIMUM
  {
    stateCode: "US_AZ",
    sedDate: relativeFixtureDate({ months: 8 }),
    acisTprDate: relativeFixtureDate({ days: 120 }),
    acisDtpDate: relativeFixtureDate({ days: 120 }),
    csedDate: null,
  },
  // res027: TPR-approved
  {
    stateCode: "US_AZ",
    sedDate: relativeFixtureDate({ months: 9 }),
    acisTprDate: relativeFixtureDate({ days: -5 }),
    acisDtpDate: null,
    csedDate: relativeFixtureDate({ months: 11 }),
  },
  // res028: TPR-approved
  {
    stateCode: "US_AZ",
    sedDate: relativeFixtureDate({ months: 9 }),
    acisTprDate: relativeFixtureDate({ days: 45 }),
    acisDtpDate: null,
    csedDate: relativeFixtureDate({ months: 11 }),
  },
  // res029: TPR path, no approval
  {
    stateCode: "US_AZ",
    sedDate: relativeFixtureDate({ months: 9 }),
    acisTprDate: relativeFixtureDate({ days: 15 }),
    acisDtpDate: null,
    csedDate: relativeFixtureDate({ months: 11 }),
  },
  // res030: TPR path, no approval
  {
    stateCode: "US_AZ",
    sedDate: relativeFixtureDate({ months: 9 }),
    acisTprDate: relativeFixtureDate({ days: -5 }),
    acisDtpDate: null,
    csedDate: relativeFixtureDate({ months: 11 }),
  },
  // res031: DTP-approved, ADD/TrToADD path
  {
    stateCode: "US_AZ",
    sedDate: relativeFixtureDate({ months: 9 }),
    acisTprDate: relativeFixtureDate({ days: -5 }),
    acisDtpDate: relativeFixtureDate({ days: -5 }),
    csedDate: null,
  },
  // res032: DTP-approved, ADD/TrToADD path
  {
    stateCode: "US_AZ",
    sedDate: relativeFixtureDate({ months: 9 }),
    acisTprDate: relativeFixtureDate({ days: 45 }),
    acisDtpDate: relativeFixtureDate({ days: 45 }),
    csedDate: null,
  },
  // res033: DTP path, no approval
  {
    stateCode: "US_AZ",
    sedDate: relativeFixtureDate({ months: 9 }),
    acisTprDate: relativeFixtureDate({ days: -5 }),
    acisDtpDate: relativeFixtureDate({ days: -5 }),
    csedDate: null,
  },
  // res034: DTP path, no approval
  {
    stateCode: "US_AZ",
    sedDate: relativeFixtureDate({ months: 9 }),
    acisTprDate: relativeFixtureDate({ days: 15 }),
    acisDtpDate: relativeFixtureDate({ days: 15 }),
    csedDate: null,
  },
];

// JII-only fields (extends common).
export const usAzResidentJiiDataFixtures: RawUsAzResidentJiiData[] = [
  {
    ...usAzResidentCommonDataFixtures[0],
    lastUpdatedDate: relativeFixtureDate({ days: -1 }),
    tprApprovalStatus: "APPROVED",
    ercdDateV2: relativeFixtureDate({ days: 172 }),
    csbdDateV2: relativeFixtureDate({ days: 95 }),
    isDprEligible: false,
    hasAnyDprProgramCompleted: false,
  },
  {
    ...usAzResidentCommonDataFixtures[1],
    lastUpdatedDate: relativeFixtureDate({ days: -1 }),
    ercdDateV2: relativeFixtureDate({ days: 217 }),
    csbdDateV2: relativeFixtureDate({ days: 140 }),
    isDprEligible: true,
    hasAnyDprProgramCompleted: false,
  },
  {
    ...usAzResidentCommonDataFixtures[2],
    lastUpdatedDate: relativeFixtureDate({ days: -1 }),
    ercdDateV2: relativeFixtureDate({ days: 194 }),
    csbdDateV2: relativeFixtureDate({ days: 117 }),
    isDprEligible: false,
    hasAnyDprProgramCompleted: false,
  },
  {
    ...usAzResidentCommonDataFixtures[3],
    lastUpdatedDate: relativeFixtureDate({ days: -1 }),
    ercdDateV2: relativeFixtureDate({ days: 467 }),
    csbdDateV2: relativeFixtureDate({ days: 390 }),
    isDprEligible: false,
    hasAnyDprProgramCompleted: false,
  },
  {
    ...usAzResidentCommonDataFixtures[4],
    lastUpdatedDate: relativeFixtureDate({ days: -1 }),
    dtpApprovalStatus: "APPROVED",
    ercdDateV2: null,
    csbdDateV2: null,
    addDate: relativeFixtureDate({ days: 172 }),
    trToAddDate: relativeFixtureDate({ days: 95 }),
    isDprEligible: false,
    hasAnyDprProgramCompleted: false,
  },
  {
    ...usAzResidentCommonDataFixtures[5],
    lastUpdatedDate: relativeFixtureDate({ days: -1 }),
    ercdDateV2: relativeFixtureDate({ days: 217 }),
    csbdDateV2: relativeFixtureDate({ days: 140 }),
    isDprEligible: false,
    hasAnyDprProgramCompleted: false,
  },
  {
    ...usAzResidentCommonDataFixtures[6],
    lastUpdatedDate: relativeFixtureDate({ days: -1 }),
    ercdDateV2: relativeFixtureDate({ days: 194 }),
    csbdDateV2: relativeFixtureDate({ days: 117 }),
    isDprEligible: false,
    hasAnyDprProgramCompleted: false,
  },
  {
    ...usAzResidentCommonDataFixtures[7],
    lastUpdatedDate: relativeFixtureDate({ days: -1 }),
    ercdDateV2: relativeFixtureDate({ days: 177 }),
    csbdDateV2: relativeFixtureDate({ days: 100 }),
    isDprEligible: false,
    hasAnyDprProgramCompleted: false,
  },
  {
    ...usAzResidentCommonDataFixtures[8],
    lastUpdatedDate: relativeFixtureDate({ days: -1 }),
    ercdDateV2: relativeFixtureDate({ days: 467 }),
    csbdDateV2: relativeFixtureDate({ days: 390 }),
    isDprEligible: false,
    hasAnyDprProgramCompleted: false,
  },
  {
    ...usAzResidentCommonDataFixtures[9],
    lastUpdatedDate: relativeFixtureDate({ days: -1 }),
    ercdDateV2: relativeFixtureDate({ days: 257 }),
    csbdDateV2: relativeFixtureDate({ days: 180 }),
    isDprEligible: true,
    hasAnyDprProgramCompleted: false,
  },
  {
    ...usAzResidentCommonDataFixtures[10],
    lastUpdatedDate: relativeFixtureDate({ days: -1 }),
    ercdDateV2: relativeFixtureDate({ days: 257 }),
    csbdDateV2: relativeFixtureDate({ days: 180 }),
    isDprEligible: true,
    hasAnyDprProgramCompleted: false,
  },
  {
    ...usAzResidentCommonDataFixtures[11],
    lastUpdatedDate: relativeFixtureDate({ days: -1 }),
    ercdDateV2: relativeFixtureDate({ days: 212 }),
    csbdDateV2: relativeFixtureDate({ days: 135 }),
    isDprEligible: false,
    hasAnyDprProgramCompleted: false,
  },
  {
    ...usAzResidentCommonDataFixtures[12],
    lastUpdatedDate: relativeFixtureDate({ days: -1 }),
    ercdDateV2: relativeFixtureDate({ days: 227 }),
    csbdDateV2: relativeFixtureDate({ days: 150 }),
    isDprEligible: false,
    hasAnyDprProgramCompleted: false,
  },
  {
    ...usAzResidentCommonDataFixtures[13],
    lastUpdatedDate: relativeFixtureDate({ days: -1 }),
    ercdDateV2: relativeFixtureDate({ days: 242 }),
    csbdDateV2: relativeFixtureDate({ days: 165 }),
    isDprEligible: false,
    hasAnyDprProgramCompleted: false,
  },
  {
    ...usAzResidentCommonDataFixtures[14],
    lastUpdatedDate: relativeFixtureDate({ days: -1 }),
    ercdDateV2: relativeFixtureDate({ days: 257 }),
    csbdDateV2: relativeFixtureDate({ days: 180 }),
    isDprEligible: true,
    hasAnyDprProgramCompleted: false,
  },
  {
    ...usAzResidentCommonDataFixtures[15],
    lastUpdatedDate: relativeFixtureDate({ days: -1 }),
    ercdDateV2: relativeFixtureDate({ days: 272 }),
    csbdDateV2: relativeFixtureDate({ days: 195 }),
    isDprEligible: false,
    hasAnyDprProgramCompleted: false,
  },
  {
    ...usAzResidentCommonDataFixtures[16],
    lastUpdatedDate: relativeFixtureDate({ days: -1 }),
    ercdDateV2: relativeFixtureDate({ days: 287 }),
    csbdDateV2: relativeFixtureDate({ days: 210 }),
    isDprEligible: false,
    hasAnyDprProgramCompleted: false,
  },
  {
    ...usAzResidentCommonDataFixtures[17],
    lastUpdatedDate: relativeFixtureDate({ days: -1 }),
    tprApprovalStatus: "APPROVED",
    ercdDateV2: relativeFixtureDate({ days: 162 }),
    csbdDateV2: relativeFixtureDate({ days: 85 }),
    isDprEligible: false,
    hasAnyDprProgramCompleted: false,
  },
  {
    ...usAzResidentCommonDataFixtures[18],
    lastUpdatedDate: relativeFixtureDate({ days: -1 }),
    tprApprovalStatus: "APPROVED",
    ercdDateV2: relativeFixtureDate({ days: 212 }),
    csbdDateV2: relativeFixtureDate({ days: 135 }),
    isDprEligible: false,
    hasAnyDprProgramCompleted: false,
  },
  {
    ...usAzResidentCommonDataFixtures[19],
    lastUpdatedDate: relativeFixtureDate({ days: -1 }),
    ercdDateV2: relativeFixtureDate({ days: 182 }),
    csbdDateV2: relativeFixtureDate({ days: 105 }),
    isDprEligible: false,
    hasAnyDprProgramCompleted: false,
  },
  {
    ...usAzResidentCommonDataFixtures[20],
    lastUpdatedDate: relativeFixtureDate({ days: -1 }),
    ercdDateV2: relativeFixtureDate({ days: 162 }),
    csbdDateV2: relativeFixtureDate({ days: 85 }),
    isDprEligible: false,
    hasAnyDprProgramCompleted: false,
  },
  {
    ...usAzResidentCommonDataFixtures[21],
    lastUpdatedDate: relativeFixtureDate({ days: -1 }),
    dtpApprovalStatus: "APPROVED",
    ercdDateV2: null,
    csbdDateV2: null,
    addDate: relativeFixtureDate({ days: 162 }),
    trToAddDate: relativeFixtureDate({ days: 85 }),
    isDprEligible: false,
    hasAnyDprProgramCompleted: false,
  },
  {
    ...usAzResidentCommonDataFixtures[22],
    lastUpdatedDate: relativeFixtureDate({ days: -1 }),
    dtpApprovalStatus: "APPROVED",
    ercdDateV2: null,
    csbdDateV2: null,
    addDate: relativeFixtureDate({ days: 212 }),
    trToAddDate: relativeFixtureDate({ days: 135 }),
    isDprEligible: false,
    hasAnyDprProgramCompleted: false,
  },
  {
    ...usAzResidentCommonDataFixtures[23],
    lastUpdatedDate: relativeFixtureDate({ days: -1 }),
    ercdDateV2: null,
    csbdDateV2: null,
    addDate: relativeFixtureDate({ days: 162 }),
    trToAddDate: relativeFixtureDate({ days: 85 }),
    isDprEligible: false,
    hasAnyDprProgramCompleted: false,
  },
  {
    ...usAzResidentCommonDataFixtures[24],
    lastUpdatedDate: relativeFixtureDate({ days: -1 }),
    ercdDateV2: null,
    csbdDateV2: null,
    addDate: relativeFixtureDate({ days: 182 }),
    trToAddDate: relativeFixtureDate({ days: 105 }),
    isDprEligible: false,
    hasAnyDprProgramCompleted: false,
  },
];

// Workflows metadata (extends JII; adds workflows-only projected/combined date fields).
export const usAzResidentMetadataFixtures: Array<RawUsAzResidentMetadata> = [
  {
    ...usAzResidentJiiDataFixtures[0],
    ercdDate: relativeFixtureDate({ days: 172 }),
    csbdDate: relativeFixtureDate({ days: 95 }),
    projectedTprDate: relativeFixtureDate({ days: 5 }),
    projectedDtpDate: null,
    projectedCsbdDate: relativeFixtureDate({ days: 95 }),
  },
  {
    ...usAzResidentJiiDataFixtures[1],
    ercdDate: relativeFixtureDate({ days: 217 }),
    csbdDate: relativeFixtureDate({ days: 140 }),
    projectedTprDate: relativeFixtureDate({ days: 50 }),
    projectedDtpDate: null,
    projectedCsbdDate: relativeFixtureDate({ days: 140 }),
  },
  {
    ...usAzResidentJiiDataFixtures[2],
    ercdDate: relativeFixtureDate({ days: 194 }),
    csbdDate: relativeFixtureDate({ days: 117 }),
    projectedTprDate: relativeFixtureDate({ days: 27 }),
    projectedDtpDate: null,
    projectedCsbdDate: relativeFixtureDate({ days: 117 }),
  },
  {
    ...usAzResidentJiiDataFixtures[3],
    ercdDate: relativeFixtureDate({ days: 467 }),
    csbdDate: relativeFixtureDate({ days: 390 }),
    projectedTprDate: relativeFixtureDate({ days: 300 }),
    projectedDtpDate: null,
    projectedCsbdDate: relativeFixtureDate({ days: 390 }),
  },
  {
    ...usAzResidentJiiDataFixtures[4],
    ercdDate: relativeFixtureDate({ days: 172 }),
    csbdDate: relativeFixtureDate({ days: 95 }),
    projectedTprDate: relativeFixtureDate({ days: 5 }),
    projectedDtpDate: relativeFixtureDate({ days: 5 }),
    projectedCsbdDate: relativeFixtureDate({ days: 95 }),
  },
  {
    ...usAzResidentJiiDataFixtures[5],
    ercdDate: relativeFixtureDate({ days: 217 }),
    csbdDate: relativeFixtureDate({ days: 140 }),
    projectedTprDate: relativeFixtureDate({ days: 50 }),
    projectedDtpDate: relativeFixtureDate({ days: 50 }),
    projectedCsbdDate: relativeFixtureDate({ days: 140 }),
  },
  {
    ...usAzResidentJiiDataFixtures[6],
    ercdDate: relativeFixtureDate({ days: 194 }),
    csbdDate: relativeFixtureDate({ days: 117 }),
    projectedTprDate: relativeFixtureDate({ days: 27 }),
    projectedDtpDate: relativeFixtureDate({ days: 27 }),
    projectedCsbdDate: relativeFixtureDate({ days: 117 }),
  },
  {
    ...usAzResidentJiiDataFixtures[7],
    ercdDate: relativeFixtureDate({ days: 177 }),
    csbdDate: relativeFixtureDate({ days: 100 }),
    projectedTprDate: relativeFixtureDate({ days: 10 }),
    projectedDtpDate: relativeFixtureDate({ days: 10 }),
    projectedCsbdDate: relativeFixtureDate({ days: 100 }),
  },
  {
    ...usAzResidentJiiDataFixtures[8],
    ercdDate: relativeFixtureDate({ days: 467 }),
    csbdDate: relativeFixtureDate({ days: 390 }),
    projectedTprDate: relativeFixtureDate({ days: 300 }),
    projectedDtpDate: relativeFixtureDate({ days: 300 }),
    projectedCsbdDate: relativeFixtureDate({ days: 390 }),
  },
  {
    ...usAzResidentJiiDataFixtures[9],
    ercdDate: relativeFixtureDate({ days: 257 }),
    csbdDate: relativeFixtureDate({ days: 180 }),
    projectedTprDate: relativeFixtureDate({ days: 90 }),
    projectedDtpDate: relativeFixtureDate({ days: 90 }),
    projectedCsbdDate: relativeFixtureDate({ days: 180 }),
  },
  {
    ...usAzResidentJiiDataFixtures[10],
    ercdDate: relativeFixtureDate({ days: 257 }),
    csbdDate: relativeFixtureDate({ days: 180 }),
    projectedTprDate: relativeFixtureDate({ days: 90 }),
    projectedDtpDate: relativeFixtureDate({ days: 90 }),
    projectedCsbdDate: relativeFixtureDate({ days: 180 }),
  },
  {
    ...usAzResidentJiiDataFixtures[11],
    ercdDate: relativeFixtureDate({ days: 212 }),
    csbdDate: relativeFixtureDate({ days: 135 }),
    projectedTprDate: relativeFixtureDate({ days: 45 }),
    projectedDtpDate: relativeFixtureDate({ days: 45 }),
    projectedCsbdDate: relativeFixtureDate({ days: 135 }),
  },
  {
    ...usAzResidentJiiDataFixtures[12],
    ercdDate: relativeFixtureDate({ days: 227 }),
    csbdDate: relativeFixtureDate({ days: 150 }),
    projectedTprDate: relativeFixtureDate({ days: 60 }),
    projectedDtpDate: relativeFixtureDate({ days: 60 }),
    projectedCsbdDate: relativeFixtureDate({ days: 150 }),
  },
  {
    ...usAzResidentJiiDataFixtures[13],
    ercdDate: relativeFixtureDate({ days: 242 }),
    csbdDate: relativeFixtureDate({ days: 165 }),
    projectedTprDate: relativeFixtureDate({ days: 75 }),
    projectedDtpDate: relativeFixtureDate({ days: 75 }),
    projectedCsbdDate: relativeFixtureDate({ days: 165 }),
  },
  {
    ...usAzResidentJiiDataFixtures[14],
    ercdDate: relativeFixtureDate({ days: 257 }),
    csbdDate: relativeFixtureDate({ days: 180 }),
    projectedTprDate: relativeFixtureDate({ days: 90 }),
    projectedDtpDate: relativeFixtureDate({ days: 90 }),
    projectedCsbdDate: relativeFixtureDate({ days: 180 }),
  },
  {
    ...usAzResidentJiiDataFixtures[15],
    ercdDate: relativeFixtureDate({ days: 272 }),
    csbdDate: relativeFixtureDate({ days: 195 }),
    projectedTprDate: relativeFixtureDate({ days: 105 }),
    projectedDtpDate: relativeFixtureDate({ days: 105 }),
    projectedCsbdDate: relativeFixtureDate({ days: 195 }),
  },
  {
    ...usAzResidentJiiDataFixtures[16],
    ercdDate: relativeFixtureDate({ days: 287 }),
    csbdDate: relativeFixtureDate({ days: 210 }),
    projectedTprDate: relativeFixtureDate({ days: 120 }),
    projectedDtpDate: relativeFixtureDate({ days: 120 }),
    projectedCsbdDate: relativeFixtureDate({ days: 210 }),
  },
  {
    ...usAzResidentJiiDataFixtures[17],
    ercdDate: relativeFixtureDate({ days: 162 }),
    csbdDate: relativeFixtureDate({ days: 85 }),
    projectedTprDate: relativeFixtureDate({ days: -5 }),
    projectedDtpDate: null,
    projectedCsbdDate: relativeFixtureDate({ days: 85 }),
  },
  {
    ...usAzResidentJiiDataFixtures[18],
    ercdDate: relativeFixtureDate({ days: 212 }),
    csbdDate: relativeFixtureDate({ days: 135 }),
    projectedTprDate: relativeFixtureDate({ days: 45 }),
    projectedDtpDate: null,
    projectedCsbdDate: relativeFixtureDate({ days: 135 }),
  },
  {
    ...usAzResidentJiiDataFixtures[19],
    ercdDate: relativeFixtureDate({ days: 182 }),
    csbdDate: relativeFixtureDate({ days: 105 }),
    projectedTprDate: relativeFixtureDate({ days: 15 }),
    projectedDtpDate: null,
    projectedCsbdDate: relativeFixtureDate({ days: 105 }),
  },
  {
    ...usAzResidentJiiDataFixtures[20],
    ercdDate: relativeFixtureDate({ days: 162 }),
    csbdDate: relativeFixtureDate({ days: 85 }),
    projectedTprDate: relativeFixtureDate({ days: -5 }),
    projectedDtpDate: null,
    projectedCsbdDate: relativeFixtureDate({ days: 85 }),
  },
  {
    ...usAzResidentJiiDataFixtures[21],
    ercdDate: relativeFixtureDate({ days: 162 }),
    csbdDate: relativeFixtureDate({ days: 85 }),
    projectedTprDate: relativeFixtureDate({ days: -5 }),
    projectedDtpDate: relativeFixtureDate({ days: -5 }),
    projectedCsbdDate: relativeFixtureDate({ days: 85 }),
  },
  {
    ...usAzResidentJiiDataFixtures[22],
    ercdDate: relativeFixtureDate({ days: 212 }),
    csbdDate: relativeFixtureDate({ days: 135 }),
    projectedTprDate: relativeFixtureDate({ days: 45 }),
    projectedDtpDate: relativeFixtureDate({ days: 45 }),
    projectedCsbdDate: relativeFixtureDate({ days: 135 }),
  },
  {
    ...usAzResidentJiiDataFixtures[23],
    ercdDate: relativeFixtureDate({ days: 162 }),
    csbdDate: relativeFixtureDate({ days: 85 }),
    projectedTprDate: relativeFixtureDate({ days: -5 }),
    projectedDtpDate: relativeFixtureDate({ days: -5 }),
    projectedCsbdDate: relativeFixtureDate({ days: 85 }),
  },
  {
    ...usAzResidentJiiDataFixtures[24],
    ercdDate: relativeFixtureDate({ days: 182 }),
    csbdDate: relativeFixtureDate({ days: 105 }),
    projectedTprDate: relativeFixtureDate({ days: 15 }),
    projectedDtpDate: relativeFixtureDate({ days: 15 }),
    projectedCsbdDate: relativeFixtureDate({ days: 105 }),
  },
];
