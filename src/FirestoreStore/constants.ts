// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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

import {
  OPPORTUNITY_CONFIGS,
  OpportunityType,
} from "../WorkflowsStore/Opportunity/OpportunityConfigs";
import { FirestoreCollectionKey, FirestoreCollectionsMap } from "./types";

// =============================================================================
export const FIRESTORE_GENERAL_COLLECTION_MAP = {
  staff: "staff",
  userUpdates: "userUpdates",
  clients: "clients",
  residents: "residents",
  clientUpdates: "clientUpdates",
  clientUpdatesV2: "clientUpdatesV2",
  clientOpportunityUpdates: "clientOpportunityUpdates",
  locations: "locations",
  milestonesMessages: "milestonesMessages",
  taskUpdates: "taskUpdates",
  usIdSupervisionTasks: "US_ID-supervisionTasks",
} as const;

// TODO: Enforce a new standardized naming convention for collections so we can generate them
const generateFirestoreCollectionsMap = (): FirestoreCollectionsMap => {
  const mapping = {
    ...FIRESTORE_GENERAL_COLLECTION_MAP,
  } as FirestoreCollectionsMap;

  for (const configKey in OPPORTUNITY_CONFIGS) {
    if (Object.prototype.hasOwnProperty.call(OPPORTUNITY_CONFIGS, configKey)) {
      const config = OPPORTUNITY_CONFIGS[configKey as OpportunityType];
      const { firestoreCollection: collection } = config;
      mapping[`${configKey}Referrals` as FirestoreCollectionKey] = collection;
    }
  }

  return mapping;
};

export const FIRESTORE_COLLECTIONS_MAP: FirestoreCollectionsMap =
  generateFirestoreCollectionsMap();
