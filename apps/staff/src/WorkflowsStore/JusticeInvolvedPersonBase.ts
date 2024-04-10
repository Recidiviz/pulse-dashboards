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

import { FullName } from "~datatypes";

import { isHydrated, isHydrationFinished } from "../core/models/utils";
import {
  ContactMethodType,
  MilestonesMessage,
  PersonUpdateRecord,
  PersonUpdateType,
  StaffRecord,
  WorkflowsJusticeInvolvedPersonRecord,
} from "../FirestoreStore";
import { RootStore } from "../RootStore";
import { humanReadableTitleCase } from "../utils";
import { TaskFactory } from "./Client";
import { OpportunityFactory, OpportunityType } from "./Opportunity";
import { CollectionDocumentSubscription } from "./subscriptions";
import { MilestonesMessageUpdateSubscription } from "./subscriptions/MilestonesMessageUpdateSubscription";
import { SupervisionTaskInterface } from "./Task/types";
import {
  JusticeInvolvedPerson,
  OpportunityMapping,
  OpportunityTypeForRecord,
  PersonClassForRecord,
  PersonRecordType,
} from "./types";

export class JusticeInvolvedPersonBase<
  RecordType extends PersonRecordType = WorkflowsJusticeInvolvedPersonRecord,
> implements JusticeInvolvedPerson
{
  rootStore: RootStore;

  record: RecordType;

  // Subscription to the `clientUpdatesV2` collection.
  // All JusticeInvolvedPerson updates (both Clients and Residents) are stored in `clientUpdatesv2`,
  // so the name of the collection is misleading, all person updates are stored here.
  personUpdatesSubscription?: CollectionDocumentSubscription<PersonUpdateRecord>;

  milestonesMessageUpdatesSubscription?: MilestonesMessageUpdateSubscription<MilestonesMessage>;

  constructor(
    record: RecordType,
    rootStore: RootStore,
    opportunityFactory: OpportunityFactory<
      OpportunityTypeForRecord<RecordType>,
      PersonClassForRecord<RecordType>
    >,
    taskFactory?: TaskFactory<PersonClassForRecord<RecordType>>,
  ) {
    this.rootStore = rootStore;

    this.record = record;

    makeObservable(this, {
      record: observable,
      supervisionTasks: observable,
      potentialOpportunities: observable,
      verifiedOpportunities: computed,
      opportunitiesAlmostEligible: computed,
      opportunitiesEligible: computed,
      updateRecord: action,
      updates: computed,
      displayPreferredName: computed,
      preferredContactMethod: computed,
    });

    this.personUpdatesSubscription =
      new CollectionDocumentSubscription<PersonUpdateRecord>(
        this.rootStore.firestoreStore,
        { key: "clientUpdatesV2" },
        record.recordId,
      );

    this.milestonesMessageUpdatesSubscription =
      new MilestonesMessageUpdateSubscription(
        this.rootStore.firestoreStore,
        record.recordId,
      );

    this.supervisionTasks = taskFactory
      ? taskFactory(this as unknown as PersonClassForRecord<RecordType>)
      : undefined;

    // Create and destroy opportunity objects as needed
    autorun(() => {
      const incomingOpps = intersection(
        this.record.allEligibleOpportunities,
        rootStore.workflowsStore.opportunityTypes,
      ) as OpportunityTypeForRecord<RecordType>[];
      incomingOpps.forEach((opportunityType) => {
        runInAction(() => {
          if (!this.potentialOpportunities[opportunityType]) {
            set(
              this.potentialOpportunities,
              opportunityType,
              opportunityFactory(
                opportunityType,
                this as unknown as PersonClassForRecord<RecordType>,
              ),
            );
          }
        });
      });

      const existingOpps = keys(
        this.potentialOpportunities,
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

  get displayId(): string {
    return this.record.displayId;
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

  get assignedStaff(): StaffRecord | undefined {
    return this.rootStore.workflowsStore?.availableOfficers.find(
      (o) => o.id === this.assignedStaffId,
    );
  }

  get district(): string | undefined {
    return this.assignedStaff?.district;
  }

  get assignedStaffFullName(): string {
    return [
      this.assignedStaff?.givenNames ?? "",
      this.assignedStaff?.surname ?? "",
    ]
      .join(" ")
      .trim();
  }

  get displayName(): string {
    return humanReadableTitleCase(
      [this.fullName.givenNames, this.fullName.surname]
        .filter((n) => Boolean(n))
        .join(" "),
    );
  }

  get displayPreferredName(): string {
    if (this.preferredName) {
      return [
        this.fullName.givenNames,
        this.preferredName && this.preferredName !== this.fullName.givenNames
          ? `(${humanReadableTitleCase(this.preferredName)})`
          : undefined,
        this.fullName.surname,
      ]
        .filter((n) => Boolean(n))
        .join(" ");
    }
    return this.displayName;
  }

  get updates(): PersonUpdateRecord | undefined {
    return this.personUpdatesSubscription?.data;
  }

  get preferredName(): string | undefined {
    return this.updates?.preferredName;
  }

  get preferredContactMethod(): ContactMethodType | undefined {
    return this.updates?.preferredContactMethod;
  }

  updatePerson(
    type: PersonUpdateType,
    update: string | ContactMethodType,
  ): Promise<void> {
    return this.rootStore.firestoreStore.updatePerson(this.recordId, {
      [type]: update,
    } as Record<PersonUpdateType, string | ContactMethodType>);
  }

  /**
   * These are all the opportunities we expect to be able to hydrate,
   * but some may be invalid or feature gated
   */
  potentialOpportunities: OpportunityMapping = {};

  supervisionTasks?: SupervisionTaskInterface | undefined;

  /**
   * This mapping will only contain opportunities that are actually hydrated and valid;
   * in most cases these are the only ones that should ever be shown to users
   */
  get verifiedOpportunities(): OpportunityMapping {
    return entries(this.potentialOpportunities).reduce(
      (opportunities, [opportunityType, opportunity]) => {
        if (!opportunity || !isHydrated(opportunity)) {
          return opportunities;
        }
        return {
          ...opportunities,
          [opportunityType as OpportunityType]: opportunity,
        };
      },
      {} as OpportunityMapping,
    );
  }

  get allOpportunitiesLoaded(): boolean {
    return (
      values(this.potentialOpportunities).filter(
        (opp) => opp !== undefined && !isHydrationFinished(opp),
      ).length === 0
    );
  }

  get hasVerifiedOpportunities(): boolean {
    return (
      Object.values(this.verifiedOpportunities).filter((o) => o !== undefined)
        .length > 0
    );
  }

  get opportunitiesEligible(): OpportunityMapping {
    return Object.entries(this.verifiedOpportunities).reduce(
      (opportunities, [key, opp]) => {
        if (opp && !opp.almostEligible && !opp.denied) {
          return { ...opportunities, [key as OpportunityType]: opp };
        }
        return opportunities;
      },
      {} as OpportunityMapping,
    );
  }

  get opportunitiesAlmostEligible(): OpportunityMapping {
    return Object.entries(this.verifiedOpportunities).reduce(
      (opportunities, [key, opp]) => {
        if (opp && opp.almostEligible && !opp.denied) {
          return { ...opportunities, [key as OpportunityType]: opp };
        }
        return opportunities;
      },
      {} as OpportunityMapping,
    );
  }

  get opportunitiesDenied(): OpportunityMapping {
    return Object.entries(this.verifiedOpportunities).reduce(
      (opportunities, [key, opp]) => {
        if (opp && opp.denied) {
          return { ...opportunities, [key as OpportunityType]: opp };
        }
        return opportunities;
      },
      {} as OpportunityMapping,
    );
  }

  updateRecord(newRecord: RecordType): void {
    this.record = newRecord;
  }

  trackProfileViewed(): void {
    this.rootStore.analyticsStore.trackProfileViewed({
      justiceInvolvedPersonId: this.pseudonymizedId,
    });
  }

  get searchIdValue(): any {
    return this.assignedStaffId;
  }
}
