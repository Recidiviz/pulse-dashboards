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

import { intersection, xor } from "lodash";
import {
  action,
  autorun,
  computed,
  entries,
  keys,
  makeObservable,
  observable,
  remove,
  runInAction,
  set,
  values,
} from "mobx";

import { trackProfileViewed } from "../analytics";
import { FullName, JusticeInvolvedPersonRecord } from "../firestore";
import { RootStore } from "../RootStore";
import { OpportunityFactory, OpportunityType } from "./Opportunity";
import {
  JusticeInvolvedPerson,
  OpportunityMapping,
  OpportunityTypeForRecord,
  PersonClassForRecord,
  PersonRecordType,
} from "./types";

export class JusticeInvolvedPersonBase<
  RecordType extends PersonRecordType = JusticeInvolvedPersonRecord
> implements JusticeInvolvedPerson {
  record: RecordType;

  constructor(
    record: RecordType,
    rootStore: RootStore,
    opportunityFactory: OpportunityFactory<
      OpportunityTypeForRecord<RecordType>,
      PersonClassForRecord<RecordType>
    >
  ) {
    this.record = record;

    makeObservable(this, {
      record: observable,
      potentialOpportunities: observable,
      verifiedOpportunities: computed,
      opportunitiesAlmostEligible: computed,
      opportunitiesEligible: computed,
      updateRecord: action,
    });

    // Create and destroy opportunity objects as needed
    autorun(() => {
      const incomingOpps = intersection(
        this.record.allEligibleOpportunities,
        rootStore.workflowsStore.opportunityTypes
      ) as OpportunityTypeForRecord<RecordType>[];
      incomingOpps.forEach((opportunityType) => {
        runInAction(() => {
          if (!this.potentialOpportunities[opportunityType]) {
            set(
              this.potentialOpportunities,
              opportunityType,
              opportunityFactory(
                opportunityType,
                (this as unknown) as PersonClassForRecord<RecordType>
              )
            );
          }
        });
      });

      const existingOpps = keys(
        this.potentialOpportunities
      ) as OpportunityType[];
      const oppsToDelete = xor(incomingOpps, existingOpps);
      oppsToDelete.forEach((opportunityType) => {
        remove(this.potentialOpportunities, opportunityType);
      });
    });
  }

  get recordId(): string {
    return this.record.recordId;
  }

  get externalId(): string {
    return this.record.personExternalId;
  }

  get pseudonymizedId(): string {
    return this.record.pseudonymizedId;
  }

  get stateCode(): string {
    return this.record.stateCode.toUpperCase();
  }

  get fullName(): FullName {
    return this.record.personName;
  }

  get assignedStaffId(): string {
    return this.record.officerId;
  }

  get displayName(): string {
    return [this.fullName.givenNames, this.fullName.surname]
      .filter((n) => Boolean(n))
      .join(" ");
  }

  /**
   * These are all the opportunities we expect to be able to hydrate,
   * but some may be invalid or feature gated
   */
  potentialOpportunities: OpportunityMapping = {};

  /**
   * This mapping will only contain opportunities that are actually hydrated and valid;
   * in most cases these are the only ones that should ever be shown to users
   */
  get verifiedOpportunities(): OpportunityMapping {
    return entries(this.potentialOpportunities).reduce(
      (opportunities, [opportunityType, opportunity]) => {
        if (!opportunity?.isHydrated || opportunity.error) {
          return opportunities;
        }
        return {
          ...opportunities,
          [opportunityType as OpportunityType]: opportunity,
        };
      },
      {} as OpportunityMapping
    );
  }

  get allOpportunitiesLoaded(): boolean {
    return (
      values(this.potentialOpportunities).filter(
        (opp) => opp !== undefined && !(opp.isLoading === false)
      ).length === 0
    );
  }

  get opportunitiesEligible(): OpportunityMapping {
    return Object.entries(this.verifiedOpportunities).reduce(
      (opportunities, [key, opp]) => {
        if (opp && !opp.almostEligible) {
          return { ...opportunities, [key as OpportunityType]: opp };
        }
        return opportunities;
      },
      {} as OpportunityMapping
    );
  }

  get opportunitiesAlmostEligible(): OpportunityMapping {
    return Object.entries(this.verifiedOpportunities).reduce(
      (opportunities, [key, opp]) => {
        if (opp && opp.almostEligible) {
          return { ...opportunities, [key as OpportunityType]: opp };
        }
        return opportunities;
      },
      {} as OpportunityMapping
    );
  }

  updateRecord(newRecord: RecordType): void {
    this.record = newRecord;
  }

  trackProfileViewed(): void {
    trackProfileViewed({
      justiceInvolvedPersonId: this.pseudonymizedId,
    });
  }
}
