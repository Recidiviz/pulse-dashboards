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

import { action, computed, makeObservable, observable } from "mobx";

import { FullName, OpportunityType, StaffRecord, WorkflowsJusticeInvolvedPersonRecord } from "~datatypes";

import { SearchField } from "../core/models/types";
import { workflowsUrl } from "../core/views";
import {
  ContactMethodType,
  PersonUpdateRecord,
  PersonUpdateType,
} from "../FirestoreStore";
import { RootStore } from "../RootStore";
import { TaskFactory } from "./Client";
import {
  Opportunity,
  OpportunityManagerInterface,
  OpportunityMapping,
} from "./Opportunity";
import { OpportunityManager } from "./Opportunity/OpportunityManager";
import { CollectionDocumentSubscription } from "./subscriptions";
import { SupervisionTaskInterface } from "./Task/types";
import {
  JusticeInvolvedPerson,
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

  opportunityManager: OpportunityManagerInterface;

  constructor(
    record: RecordType,
    rootStore: RootStore,
    taskFactory?: TaskFactory<PersonClassForRecord<RecordType>>,
  ) {
    this.rootStore = rootStore;

    this.record = record;

    makeObservable(this, {
      record: observable,
      supervisionTasks: observable,
      opportunityManager: observable,
      opportunities: computed,
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

    this.supervisionTasks = taskFactory
      ? taskFactory(this as unknown as PersonClassForRecord<RecordType>)
      : undefined;

    this.opportunityManager = new OpportunityManager(
      rootStore,
      this,
      this.record.allEligibleOpportunities,
    );
  }

  get profileUrl(): string {
    return workflowsUrl("residentProfile", {
      justiceInvolvedPersonId: this.pseudonymizedId,
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

  get assignedStaffId(): string | undefined {
    return this.record.officerId ?? undefined;
  }

  get lastDataFromState(): Date {
    return new Date("July 25, 2024");
  }

  get assignedStaff(): StaffRecord | undefined {
    return this.rootStore.workflowsStore?.availableOfficers.find(
      (o) => o.id === this.assignedStaffId,
    );
  }

  get district(): string | undefined {
    return this.assignedStaff?.district ?? undefined;
  }

  get assignedStaffFullName(): string {
    return [
      this.assignedStaff?.givenNames ?? "",
      this.assignedStaff?.surname ?? "",
    ]
      .join(" ")
      .trim();
  }

  get assignedStaffPseudoId(): string | undefined {
    return this.assignedStaff?.pseudonymizedId;
  }

  get displayName(): string {
    return [this.fullName.givenNames, this.fullName.surname]
      .filter((n) => Boolean(n))
      .join(" ");
  }

  get displayPreferredName(): string {
    if (this.preferredName) {
      return [
        this.fullName.givenNames,
        this.preferredName && this.preferredName !== this.fullName.givenNames
          ? `(${this.preferredName})`
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

  supervisionTasks?: SupervisionTaskInterface | undefined;

  /**
   * This mapping will only contain opportunities that are actually hydrated and valid;
   * in most cases these are the only ones that should ever be shown to users
   */
  get opportunities(): OpportunityMapping {
    return this.opportunityManager.opportunities;
  }

  get flattenedOpportunities(): Opportunity[] {
    return Object.values(this.opportunities).flat();
  }

  getFilteredOpportunityMapping(
    filterFn: (opp: Opportunity) => boolean,
  ): OpportunityMapping {
    return Object.entries(this.opportunities).reduce(
      (opportunities, [key, oppList]) => {
        const filteredOpps = oppList.filter(filterFn);
        if (filteredOpps.length) {
          return { ...opportunities, [key as OpportunityType]: filteredOpps };
        }
        return opportunities;
      },
      {} as OpportunityMapping,
    );
  }

  get opportunitiesEligible(): OpportunityMapping {
    return this.getFilteredOpportunityMapping(
      (opp) => opp && !opp.isSubmitted && !opp.almostEligible && !opp.denied,
    );
  }

  get opportunitiesAlmostEligible(): OpportunityMapping {
    return this.getFilteredOpportunityMapping(
      (opp) => opp && opp.almostEligible && !opp.isSubmitted && !opp.denied,
    );
  }

  get opportunitiesDenied(): OpportunityMapping {
    return this.getFilteredOpportunityMapping((opp) => opp && opp.denied);
  }

  updateRecord(newRecord: RecordType): void {
    this.record = newRecord;
  }

  trackProfileViewed(): void {
    this.rootStore.analyticsStore.trackProfileViewed({
      justiceInvolvedPersonId: this.pseudonymizedId,
    });
  }

  get searchField(): SearchField | undefined {
    return undefined;
  }

  get searchIdValue(): string | undefined {
    return this.assignedStaffId;
  }
}
