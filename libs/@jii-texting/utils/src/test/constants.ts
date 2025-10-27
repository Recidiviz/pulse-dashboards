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

import { faker } from "@faker-js/faker";
import { Prisma, StateCode, Status } from "@prisma/jii-texting/client";

// WORKFLOW EXECUTIONS
export const fakeWorkflowExecutionOne = {
  stateCode: StateCode.US_ID,
  workflowExecutionTime: new Date("2025-03-01"),
  id: "workflow-id1",
} satisfies Prisma.WorkflowExecutionCreateInput;

export const fakeWorkflowExecutionTwo = {
  stateCode: StateCode.US_ID,
  workflowExecutionTime: new Date("2025-03-02"),
  id: "workflow-id2",
} satisfies Prisma.WorkflowExecutionCreateInput;

export const fakeWorkflowExecutionThree = {
  stateCode: StateCode.US_ID,
  workflowExecutionTime: new Date("2025-03-03"),
  id: "workflow-id3",
} satisfies Prisma.WorkflowExecutionCreateInput;

// GROUPS
export const fakeTrustedTesterGroup = {
  groupName: "TRUSTED_TESTER",
  messageCopyTemplate: "Hi, this is a message.",
  status: Status.ACTIVE,
};

export const fakeFullyEligibleGroup = {
  groupName: "FULLY_ELIGIBLE",
  messageCopyTemplate: "Hi, this is a message.",
  status: Status.ACTIVE,
};

export const fakeMissingFinesFeesGroup = {
  groupName: "ELIGIBLE_MISSING_FINES_AND_FEES",
  messageCopyTemplate: "Hi, this is a message.",
  status: Status.ACTIVE,
};

export const fakeMissingIncomeVerification = {
  groupName: "MISSING_INCOME_VERIFICATION",
  messageCopyTemplate: "Hi, this is a message.",
  status: Status.ACTIVE,
};

export const fakeMissingDA = {
  groupName: "MISSING_DA",
  messageCopyTemplate: "Hi, this is a message.",
  status: Status.ACTIVE,
};

export const fakeTwoMissingCriteria = {
  groupName: "TWO_MISSING_CRITERIA",
  messageCopyTemplate: "Hi, this is a message.",
  status: Status.ACTIVE,
};

// TOPICS
export const fakeTopic = {
  topicName: "LSU",
  stateCode: StateCode.US_ID,
  status: Status.ACTIVE,
} satisfies Prisma.TopicCreateInput;

// PERSON
export const fakePersonOne = {
  stateCode: StateCode.US_ID,
  pseudonymizedId: "pseudo-id-1",
  personId: "person-id-1",
  stableExternalId: "person-ext-id-1",
  givenName: "JANE",
  middleName: faker.person.middleName(),
  surname: faker.person.lastName(),
  nameSuffix: faker.person.suffix(),
  phoneNumber: faker.string.numeric({ length: 11 }),
  officerId: faker.string.uuid(),
  poName: "JOHN DOE",
  district: "District 1",
  receivedWelcomeText: false,
};

export const fakePersonTwo = {
  stateCode: StateCode.US_ID,
  pseudonymizedId: "pseudo-id-2",
  personId: "person-id-2",
  stableExternalId: "person-ext-id-2",
  givenName: faker.person.firstName(),
  middleName: faker.person.middleName(),
  surname: faker.person.lastName(),
  nameSuffix: faker.person.suffix(),
  phoneNumber: faker.string.numeric({ length: 11 }),
  officerId: faker.string.uuid(),
  poName: faker.person.fullName(),
  district: faker.location.county(),
};

export const fakePersonThree = {
  stateCode: StateCode.US_ID,
  pseudonymizedId: "pseudo-id-3",
  personId: "person-id-3",
  stableExternalId: "person-ext-id-3",
  givenName: faker.person.firstName(),
  middleName: faker.person.middleName(),
  surname: faker.person.lastName(),
  nameSuffix: faker.person.suffix(),
  phoneNumber: faker.string.numeric({ length: 11 }),
  officerId: faker.string.uuid(),
  poName: faker.person.fullName(),
  district: faker.location.county(),
};
//fake person that corresponds to fakeContactOne
export const fakeUsTxPersonOne = {
  stateCode: StateCode.US_TX,
  pseudonymizedId: "pseudo-id-1",
  personId: "person-id-1",
  stableExternalId: "person-ext-id-1",
  givenName: faker.person.firstName(),
  middleName: faker.person.middleName(),
  surname: faker.person.lastName(),
  nameSuffix: faker.person.suffix(),
  phoneNumber: faker.string.numeric({ length: 11 }),
  officerId: faker.string.uuid(),
  poName: faker.person.fullName(),
  district: "District 1",
  receivedWelcomeText: false,
};
export const fakeUsTxPersonTwo = {
  stateCode: StateCode.US_TX,
  pseudonymizedId: "pseudo-id-2",
  personId: "person-id-2",
  stableExternalId: "person-ext-id-2",
  givenName: faker.person.firstName(),
  middleName: faker.person.middleName(),
  surname: faker.person.lastName(),
  nameSuffix: faker.person.suffix(),
  phoneNumber: faker.string.numeric({ length: 11 }),
  officerId: faker.string.uuid(),
  poName: faker.person.fullName(),
  district: faker.location.county(),
};

export const fakeUsTxPersonThree = {
  stateCode: StateCode.US_TX,
  pseudonymizedId: "pseudo-id-3",
  personId: "person-id-3",
  stableExternalId: "person-ext-id-3",
  givenName: faker.person.firstName(),
  middleName: faker.person.middleName(),
  surname: faker.person.lastName(),
  nameSuffix: faker.person.suffix(),
  phoneNumber: faker.string.numeric({ length: 11 }),
  officerId: faker.string.uuid(),
  poName: faker.person.fullName(),
  district: faker.location.county(),
};
export const fakeUsTxPersonFour = {
  stateCode: StateCode.US_TX,
  pseudonymizedId: "pseudo-id-4",
  personId: "person-id-4",
  stableExternalId: "person-ext-id-4",
  givenName: faker.person.firstName(),
  middleName: faker.person.middleName(),
  surname: faker.person.lastName(),
  nameSuffix: faker.person.suffix(),
  phoneNumber: faker.string.numeric({ length: 11 }),
  officerId: faker.string.uuid(),
  poName: faker.person.fullName(),
  district: faker.location.county(),
};

// CONTACTS
export const fakeContactOne = {
  externalId: "contact-id-1",
  contactingOfficerId: faker.string.uuid(),
  contactingPoName: "JOHN DOE",
  locationType: "HOME",
  method: "IN_PERSON",
  address: "123 North Pole",
  datetime: new Date("2025-04-14T12:00:00Z"),
  updateDatetime: new Date("2025-04-14T08:00:00Z"),
  reminderType: "WITHIN_ONE_DAY",
};

export const fakeContactTwo = {
  externalId: "contact-id-2",
  contactingOfficerId: faker.string.uuid(),
  contactingPoName: faker.person.fullName().toUpperCase(),
  locationType: "OFFICE",
  method: "VIRTUAL",
  address: faker.location.streetAddress(),
  datetime: new Date("2025-01-16T14:00:00Z"),
  updateDatetime: new Date("2025-01-16T14:00:00Z"),
  reminderType: null,
};

export const fakeContactThree = {
  externalId: faker.string.uuid(),
  contactingOfficerId: faker.string.uuid(),
  contactingPoName: faker.person.fullName().toUpperCase(),
  locationType: "OFFICE",
  method: "IN_PERSON",
  address: faker.location.streetAddress(),
  datetime: new Date("2025-04-14T12:00:00Z"),
  updateDatetime: new Date("2025-04-14T08:00:00Z"),
  reminderType: "WITHIN_ONE_DAY",
};
