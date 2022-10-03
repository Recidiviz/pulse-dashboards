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

import { DocumentData } from "firebase/firestore";
import { action, computed, makeObservable, observable, when } from "mobx";

import {
  Denial,
  OpportunityUpdate,
  UpdateLog,
  updateOpportunityFirstViewed,
} from "../../firestore";
import { Client } from "../Client";
import {
  CollectionDocumentSubscription,
  DocumentSubscription,
  OpportunityUpdateSubscription,
  TransformFunction,
} from "../subscriptions";
import {
  DefaultEligibility,
  DenialReasonsMap,
  Opportunity,
  OpportunityRequirement,
  OpportunityStatus,
  OpportunityType,
} from "./types";
import { rankByReviewStatus } from "./utils";

/**
 * Implements functionality shared by all Opportunities, most notably the `Hydratable` interface.
 * While this is an abstract class, it provides stubs rather than abstract properties, whenever possible,
 * to facilitate incremental development of new opportunities.
 */
export abstract class OpportunityBase<
  ReferralRecord extends DocumentData,
  UpdateRecord extends DocumentData = OpportunityUpdate
> implements Opportunity {
  readonly type: OpportunityType;

  client: Client;

  protected referralSubscription: DocumentSubscription<ReferralRecord>;

  protected updatesSubscription: DocumentSubscription<UpdateRecord>;

  constructor(
    client: Client,
    type: OpportunityType,
    transformReferral?: TransformFunction<ReferralRecord>
  ) {
    makeObservable(this, {
      denial: computed,
      error: observable,
      hydrate: action,
      isLoading: computed,
      rank: computed,
      record: computed,
      reviewStatus: computed,
      isHydrated: computed,
    });

    this.client = client;
    this.type = type;

    this.referralSubscription = new CollectionDocumentSubscription<ReferralRecord>(
      `${type}Referrals` as const,
      client.recordId,
      transformReferral
    );
    this.updatesSubscription = new OpportunityUpdateSubscription<UpdateRecord>(
      client.recordId,
      client.id,
      type
    );
  }

  get record(): ReferralRecord | undefined {
    return this.referralSubscription.data;
  }

  get updates(): UpdateRecord | undefined {
    return this.updatesSubscription.data;
  }

  get rank(): number {
    return rankByReviewStatus(this);
  }

  get denial(): Denial | undefined {
    if (this.updates?.denial?.reasons.length) {
      return this.updates?.denial;
    }
  }

  get firstViewed(): UpdateLog | undefined {
    return this.updates?.firstViewed;
  }

  /**
   * If this.firstViewed is not yet set, this sets it by writing to Firestore.
   */
  setFirstViewedIfNeeded(): void {
    when(
      () => this.isHydrated,
      () => {
        if (this.firstViewed) return;
        const userEmail = this.client.rootStore.workflowsStore.user?.info.email;
        // should not happen in practice
        if (!userEmail) return;

        // ignore recidiviz admins and other non-state actors in prod
        if (
          process.env.REACT_APP_DEPLOY_ENV === "production" &&
          this.client.rootStore.userStore.stateCode !== this.client.stateCode
        )
          return;

        updateOpportunityFirstViewed(
          userEmail,
          this.client.recordId,
          this.type
        );
      }
    );
  }

  get reviewStatus(): OpportunityStatus {
    const { updates, denial } = this;
    if (denial) {
      return "DENIED";
    }

    if (updates?.completed) {
      return "COMPLETED";
    }

    if (updates?.firstViewed || updates?.referralForm) {
      return "IN_PROGRESS";
    }
    return "PENDING";
  }

  readonly defaultEligibility: DefaultEligibility = "ELIGIBLE";

  get isHydrated(): boolean {
    return (
      this.referralSubscription.isHydrated &&
      this.updatesSubscription.isHydrated
    );
  }

  /**
   * Initiates hydration for all subscriptions.
   */
  hydrate(): void {
    this.referralSubscription.hydrate();
    this.updatesSubscription.hydrate();
  }

  /**
   * An Opportunity is only as hydrated as its least-hydrated Subscription.
   */
  get isLoading(): boolean | undefined {
    if (
      this.referralSubscription.isLoading === undefined ||
      this.updatesSubscription.isLoading === undefined
    ) {
      return undefined;
    }
    return (
      this.referralSubscription.isLoading || this.updatesSubscription.isLoading
    );
  }

  error: Error | undefined = undefined;

  // ===============================
  // properties below this line are stubs and in most cases should be overridden
  // in a subclass. Given their triviality they are not annotated by MobX either,
  // so subclasses can use normal annotations instead of having to use `override`.
  // ===============================

  // TODO(#2263): Refactor isValid into a pipeline hydrate -> validate -> aggregate
  // eslint-disable-next-line class-methods-use-this
  get isValid(): boolean {
    return true;
  }

  // eslint-disable-next-line class-methods-use-this
  get almostEligible(): boolean {
    return false;
  }

  denialReasonsMap: DenialReasonsMap = {};

  // eslint-disable-next-line class-methods-use-this
  get requirementsMet(): OpportunityRequirement[] {
    return [];
  }

  // eslint-disable-next-line class-methods-use-this
  get requirementsAlmostMet(): OpportunityRequirement[] {
    return [];
  }
}
