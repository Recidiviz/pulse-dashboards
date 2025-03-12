// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { supervisionOfficerFixture } from "../../people/Staff/Supervision/Insights/SupervisionOfficer/fixture";
import { supervisionOfficerSupervisorsFixture } from "../../people/Staff/Supervision/Insights/SupervisionOfficerSupervisor/fixture";
import {
  RawRosterChangeRequestResponse,
  RosterChangeRequest,
  rosterChangeRequestResponseSchema,
  rosterChangeRequestSchema,
} from "./schema";

export const rawRosterChangeRequestFixtures: Record<
  string,
  RosterChangeRequest
> = {
  // ================================
  // REMOVAL REQUEST CASES
  // ================================

  // 1 Officer (Remove)
  [supervisionOfficerSupervisorsFixture[0].pseudonymizedId]: {
    affectedOfficersExternalIds: [supervisionOfficerFixture[0].externalId],
    requestChangeType: "REMOVE",
    requestNote: "Officer reassigned.\nEffective immediately.",
    requesterName: supervisionOfficerSupervisorsFixture[0].displayName,
  },

  // 2+ Officers (Remove)
  [supervisionOfficerSupervisorsFixture[1].pseudonymizedId]: {
    affectedOfficersExternalIds: supervisionOfficerFixture
      .slice(1, 3)
      .map((o) => o.externalId),
    requestChangeType: "REMOVE",
    requestNote:
      "Two officers reassigned to balance workload.\n\nApproval needed ASAP.",
    requesterName: supervisionOfficerSupervisorsFixture[1].displayName,
  },

  // Short Message (Remove)
  [supervisionOfficerSupervisorsFixture[3].pseudonymizedId]: {
    affectedOfficersExternalIds: [supervisionOfficerFixture[4].externalId],
    requestChangeType: "REMOVE",
    requestNote: "Shift in staffing.\nThis is temporary.",
    requesterName: supervisionOfficerSupervisorsFixture[3].displayName,
  },

  // Long Message (Remove)
  [supervisionOfficerSupervisorsFixture[2].pseudonymizedId + "_remove2"]: {
    affectedOfficersExternalIds: supervisionOfficerFixture
      .slice(5, 7)
      .map((o) => o.externalId),
    requestChangeType: "REMOVE",
    requestNote:
      "Due to recent operational changes and workload rebalancing, these officers need to be reassigned.\n\n" +
      "We appreciate the quick processing of this request and will coordinate as needed to ensure a smooth transition.\n" +
      "Let us know if you have any questions.",
    requesterName: supervisionOfficerSupervisorsFixture[2].displayName,
  },

  // ================================
  // ADDITION REQUEST CASES
  // ================================

  // 1 Officer (Add)
  [supervisionOfficerSupervisorsFixture[3].pseudonymizedId]: {
    affectedOfficersExternalIds: [supervisionOfficerFixture[0].externalId],
    requestChangeType: "ADD",
    requestNote:
      "Officer reassigned to assist with caseload.\nExpected to start next week.",
    requesterName: supervisionOfficerSupervisorsFixture[3].displayName,
  },

  // 2+ Officers (Add)
  [supervisionOfficerSupervisorsFixture[2].pseudonymizedId]: {
    affectedOfficersExternalIds: supervisionOfficerFixture
      .slice(1, 3)
      .map((o) => o.externalId),
    requestChangeType: "ADD",
    requestNote:
      "Two officers reassigned to balance caseload and coverage.\n\nUrgent processing requested.",
    requesterName: supervisionOfficerSupervisorsFixture[2].displayName,
  },

  // Short Message (Add)
  [supervisionOfficerSupervisorsFixture[1].pseudonymizedId]: {
    affectedOfficersExternalIds: [supervisionOfficerFixture[4].externalId],
    requestChangeType: "ADD",
    requestNote: "Needed for case support.\n\nPlease confirm receipt.",
    requesterName: supervisionOfficerSupervisorsFixture[1].displayName,
  },

  // Long Message (Add)
  [supervisionOfficerSupervisorsFixture[2].pseudonymizedId]: {
    affectedOfficersExternalIds: supervisionOfficerFixture
      .slice(5, 7)
      .map((o) => o.externalId),
    requestChangeType: "ADD",
    requestNote:
      "To better align resources with increasing casework demands, these officers are being added to the caseload.\n" +
      "Their skills and experience make them well-suited for the current needs, and we appreciate the processing of this update.\n\n" +
      "If any issues arise, please notify us as soon as possible.",
    requesterName: supervisionOfficerSupervisorsFixture[2].displayName,
  },
};

export const rosterChangeRequestFixtures = Object.values(
  rawRosterChangeRequestFixtures,
).map((request) => rosterChangeRequestSchema.parse(request));

export const rawRosterChangeRequestResponseFixture: RawRosterChangeRequestResponse =
  {
    id: "1",
    email: "test@testdomain.com",
  };

export const rosterChangeRequestResponseFixture =
  rosterChangeRequestResponseSchema.parse(
    rawRosterChangeRequestResponseFixture,
  );
