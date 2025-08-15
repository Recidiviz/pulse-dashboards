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

import { DocumentData } from "firebase/firestore";
import moment from "moment";

import { OpportunityType } from "~datatypes";
import { isHydrated } from "~hydration-utils";

import FirestoreStore from "../../../FirestoreStore";
import { JusticeInvolvedPerson } from "../../types";
import { WorkflowsStore } from "../../WorkflowsStore";

export const defaultFormValueJoiner = (
  ...items: (string | undefined)[]
): string => items.filter((item) => item && item !== "").join("\n");

export const formatFormValueDateMMDDYYYYY = (date: string | Date): string =>
  moment(date).format("MM/DD/YYYY");

/**
 * Returns whether or not a given client has ever been eligible (either now, almost, or was but
 * then marked ineligible) for a given opportunityType
 */
export function isEligibleOrAlmostEligible(
  person: JusticeInvolvedPerson,
  oppType: OpportunityType,
): boolean {
  if (!isHydrated(person.opportunityManager)) {
    throw new Error("isEligibleOrAlmostEligible: unhydrated person passed in.");
  }
  
  return (
    person.opportunities?.[oppType]?.find((opp) => opp.type === oppType) !==
    undefined
  );
}

/**
 * Returns record for a person for a given opportunityType. Used for TEPE form generation for ineligible clients
 * (both to generate record and to check if there is record in first place).
 */
export async function getRecordForIneligible(
  person: JusticeInvolvedPerson,
  oppType: OpportunityType,
  workflowsStore: WorkflowsStore,
  firestoreStore: FirestoreStore,
): Promise<DocumentData | undefined> {
  const { firestoreCollection, supportsAlmostEligible } =
    workflowsStore.opportunityConfigurationStore.opportunities[oppType];

  const records: DocumentData[] =
    await firestoreStore.getOpportunitiesForJIIAndOpportunityType(
      person.externalId,
      firestoreCollection,
      person.stateCode,
      supportsAlmostEligible,
      true,
    );

  // assumes 1 record per opptype for a person
  if (records.length > 1) {
    throw new Error("getRecordForInelgiible: more than one record for person");
  }
  
  return records[0];
}
