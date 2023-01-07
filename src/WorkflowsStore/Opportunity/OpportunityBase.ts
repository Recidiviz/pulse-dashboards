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
import { action, computed, makeObservable, when } from "mobx";

import {
  trackOpportunityMarkedEligible,
  trackOpportunityPreviewed,
  trackSetOpportunityStatus,
  trackSurfacedInList,
} from "../../analytics";
import {
  Denial,
  OpportunityUpdate,
  OpportunityUpdateWithForm,
  UpdateLog,
  updateOpportunityCompleted,
  updateOpportunityDenial,
  updateOpportunityFirstViewed,
} from "../../firestore";
import { RootStore } from "../../RootStore";
import {
  CollectionDocumentSubscription,
  DocumentSubscription,
  OpportunityUpdateSubscription,
  TransformFunction,
  ValidateFunction,
} from "../subscriptions";
import { JusticeInvolvedPerson } from "../types";
import { OTHER_KEY } from "../utils";
import { FormBase } from "./Forms/FormBase";
import {
  DefaultEligibility,
  DenialReasonsMap,
  Opportunity,
  OpportunityRequirement,
  OpportunityStatus,
  OpportunityType,
} from "./types";

/**
 * Implements functionality shared by all Opportunities, most notably the `Hydratable` interface.
 * While this is an abstract class, it provides stubs rather than abstract properties, whenever possible,
 * to facilitate incremental development of new opportunities.
 */
export abstract class OpportunityBase<
  PersonType extends JusticeInvolvedPerson,
  ReferralRecord extends DocumentData,
  UpdateRecord extends OpportunityUpdateWithForm<any> = OpportunityUpdate
> implements Opportunity<PersonType>
{
  readonly type: OpportunityType;

  rootStore: RootStore;

  person: PersonType;

  form?: FormBase<any, any>;

  referralSubscription: DocumentSubscription<ReferralRecord>;

  updatesSubscription: DocumentSubscription<UpdateRecord>;

  /**
   * The "alert" flavor of opportunity receives a different UI treatment
   */
  readonly isAlert: boolean = false;

  constructor(
    person: PersonType,
    type: OpportunityType,
    rootStore: RootStore,
    transformReferral?: TransformFunction<ReferralRecord>,
    validateRecord?: ValidateFunction<ReferralRecord>
  ) {
    makeObservable(this, {
      denial: computed,
      error: computed,
      hydrate: action,
      isLoading: computed,
      record: computed,
      updates: computed,
      reviewStatus: computed,
      isHydrated: computed,
      setCompletedIfEligible: action,
    });

    this.person = person;
    this.type = type;
    this.rootStore = rootStore;

    this.referralSubscription =
      new CollectionDocumentSubscription<ReferralRecord>(
        `${type}Referrals` as const,
        person.recordId,
        transformReferral,
        validateRecord
      );
    this.updatesSubscription = new OpportunityUpdateSubscription<UpdateRecord>(
      person.recordId,
      person.externalId,
      type
    );
  }

  get supportsDenial(): boolean {
    return Object.keys(this.denialReasonsMap).length > 0;
  }

  get record(): ReferralRecord | undefined {
    return this.referralSubscription.data;
  }

  get updates(): UpdateRecord | undefined {
    return this.updatesSubscription.data;
  }

  get denial(): Denial | undefined {
    if (this.updates?.denial?.reasons.length) {
      return this.updates?.denial;
    }
  }

  get firstViewed(): UpdateLog | undefined {
    return this.updates?.firstViewed;
  }

  get currentUserEmail(): string | null | undefined {
    return this.rootStore.workflowsStore.user?.info.email;
  }

  /**
   * If this.firstViewed is not yet set, this sets it by writing to Firestore.
   */
  setFirstViewedIfNeeded(): void {
    when(
      () => this.isHydrated,
      () => {
        if (this.firstViewed) return;
        const { currentUserEmail } = this;
        // should not happen in practice
        if (!currentUserEmail) return;

        // ignore recidiviz admins and other non-state actors in prod
        if (
          process.env.REACT_APP_DEPLOY_ENV === "production" &&
          this.rootStore.userStore.stateCode !== this.person.stateCode
        )
          return;

        updateOpportunityFirstViewed(
          currentUserEmail,
          this.person.recordId,
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

  setCompletedIfEligible(): void {
    when(
      () => this.isHydrated,
      () => {
        const { currentUserEmail } = this;
        if (!currentUserEmail) return;
        const { recordId, pseudonymizedId } = this.person;
        const { reviewStatus } = this;
        if (reviewStatus === "DENIED" || reviewStatus === "COMPLETED") return;

        updateOpportunityCompleted(currentUserEmail, recordId, this.type);
        trackSetOpportunityStatus({
          clientId: pseudonymizedId,
          justiceInvolvedPersonId: pseudonymizedId,
          status: "COMPLETED",
          opportunityType: this.type,
        });
      }
    );
  }

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

  get error(): Error | undefined {
    return this.referralSubscription.error || this.updatesSubscription.error;
  }

  async setDenialReasons(reasons: string[]): Promise<void> {
    const { currentUserEmail } = this;
    if (!currentUserEmail) return;
    const { recordId, pseudonymizedId } = this.person;

    // clear irrelevant "other" text if necessary
    const deletions = reasons.includes(OTHER_KEY)
      ? undefined
      : { otherReason: true };

    await updateOpportunityDenial(
      currentUserEmail,
      recordId,
      { reasons },
      this.type,
      deletions
    );

    await updateOpportunityCompleted(
      currentUserEmail,
      recordId,
      this.type,
      true
    );

    if (reasons.length) {
      trackSetOpportunityStatus({
        clientId: pseudonymizedId,
        justiceInvolvedPersonId: pseudonymizedId,
        status: "DENIED",
        opportunityType: this.type,
        deniedReasons: reasons,
      });
    } else {
      trackSetOpportunityStatus({
        clientId: pseudonymizedId,
        justiceInvolvedPersonId: pseudonymizedId,
        status: "IN_PROGRESS",
        opportunityType: this.type,
      });
      trackOpportunityMarkedEligible({
        justiceInvolvedPersonId: pseudonymizedId,
        opportunityType: this.type,
      });
    }
  }

  async setOtherReasonText(otherReason?: string): Promise<void> {
    if (this.currentUserEmail) {
      await updateOpportunityDenial(
        this.currentUserEmail,
        this.person.recordId,
        {
          otherReason,
        },
        this.type
      );
    }
  }

  trackListViewed(): void {
    trackSurfacedInList({
      justiceInvolvedPersonId: this.person.pseudonymizedId,
      opportunityType: this.type,
    });
  }

  trackPreviewed(): void {
    trackOpportunityPreviewed({
      justiceInvolvedPersonId: this.person.pseudonymizedId,
      opportunityType: this.type,
    });
  }

  // ===============================
  // properties below this line are stubs and in most cases should be overridden
  // in a subclass. Given their triviality they are not annotated by MobX either,
  // so subclasses can use normal annotations instead of having to use `override`.
  // ===============================

  // eslint-disable-next-line class-methods-use-this
  get almostEligible(): boolean {
    return false;
  }

  readonly policyOrMethodologyUrl: string = "OVERRIDE_ME";

  denialReasonsMap: DenialReasonsMap = {};

  // eslint-disable-next-line class-methods-use-this
  get requirementsMet(): OpportunityRequirement[] {
    return [];
  }

  // eslint-disable-next-line class-methods-use-this
  get requirementsAlmostMet(): OpportunityRequirement[] {
    return [];
  }

  // eslint-disable-next-line class-methods-use-this
  get eligibilityDate(): Date | undefined {
    return undefined;
  }
}
