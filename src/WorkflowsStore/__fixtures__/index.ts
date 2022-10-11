// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2022 Recidiviz, Inc.
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

import { ClientRecord, CombinedUserRecord, StaffRecord } from "../../firestore";
import { dateToTimestamp } from "../utils";

export const mockOfficer: CombinedUserRecord = {
  info: {
    id: "OFFICER1",
    district: "DISTRICT 1",
    stateCode: "US_XX",
    email: "test-officer@example.com",
    hasCaseload: true,
    givenNames: "Test",
    surname: "Officer",
  },
};

export const mockSupervisor: CombinedUserRecord = {
  info: {
    id: "SUPERVISOR1",
    district: "DISTRICT 1",
    stateCode: "US_XX",
    email: "test-supervisor@example.com",
    hasCaseload: false,
    givenNames: "Test",
    surname: "Supervisor",
  },
};

export const mockDirector: CombinedUserRecord = {
  info: {
    id: "DIRECTOR1",
    stateCode: "US_XX",
    email: "test-director@example.com",
    hasCaseload: false,
    givenNames: "Test",
    surname: "Director",
  },
};

export const ineligibleClient: ClientRecord = {
  recordId: "us_xx_100",
  personName: {
    givenNames: "TONYE",
    middleName: "BARBY",
    surname: "THOMPSON",
  },
  personExternalId: "100",
  pseudonymizedId: "p100",
  stateCode: "US_XX",
  officerId: "OFFICER1",
  supervisionType: "TN PAROLEE",
  supervisionLevel: "STANDARD: MEDIUM",
  supervisionLevelStart: dateToTimestamp("2020-12-20"),
  address: "123 Main St, Nashville, TN 12345",
  phoneNumber: "5555555678",
  expirationDate: dateToTimestamp("2025-12-31"),
  currentBalance: 0,
  lastPaymentAmount: 50,
  lastPaymentDate: dateToTimestamp("2021-11-15"),
  specialConditions: ["SPECIAL CONDITIONS TEST TEST"],
};

export const compliantReportingReferralRecord = {
  stateCode: "US_XX",
  tdocId: "101",
  eligibilityCategory: "c1",
  remainingCriteriaNeeded: 0,
  eligibleLevelStart: dateToTimestamp("2019-12-20"),
  judicialDistrict: "A",
  finesFeesEligible: "regular_payments",
  drugScreensPastYear: [],
  sanctionsPastYear: [],
  currentOffenses: ["EXAMPLE"],
  pastOffenses: [],
  zeroToleranceCodes: [],
  lifetimeOffensesExpired: ["EXAMPLE"],
  specialConditionsFlag: "current",
};

export const eligibleClient: ClientRecord = {
  recordId: "us_xx_101",
  personName: { givenNames: "LINET", surname: "HANSEN" },
  personExternalId: "101",
  pseudonymizedId: "p101",
  stateCode: "US_XX",
  officerId: "OFFICER1",
  supervisionType: "TN PROBATIONER",
  supervisionLevel: "STANDARD: MEDIUM",
  supervisionLevelStart: dateToTimestamp("2019-12-20"),
  address: "123 Main St, Nashville, TN 12345",
  phoneNumber: "5555555678",
  expirationDate: dateToTimestamp("2024-12-31"),
  currentBalance: 221.88,
  specialConditions: ["EXAMPLE OF SPECIAL CONDITIONS HERE"],
  compliantReportingEligible: true,
  earlyTerminationEligible: false,
  earnedDischargeEligible: false,
  LSUEligible: false,
  pastFTRDEligible: false,
};

export const mockClients = [ineligibleClient, eligibleClient];

export const mockOfficers: StaffRecord[] = [
  {
    id: "OFFICER2",
    stateCode: mockOfficer.info.stateCode,
    district: "1",
    hasCaseload: true,
    email: null,
    givenNames: "Foo",
    surname: "Fakename",
  },
  {
    id: "OFFICER3",
    stateCode: mockOfficer.info.stateCode,
    district: "1",
    hasCaseload: true,
    email: null,
    givenNames: "Bar",
    surname: "Realname",
  },
];
