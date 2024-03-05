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

import { ascending } from "d3-array";
import {
  add,
  differenceInDays,
  format,
  parseISO,
  startOfToday,
} from "date-fns";
import { DocumentData } from "firebase/firestore";
import { action, computed, makeObservable, when } from "mobx";

import { HydrationState } from "../../core/models/types";
import { compositeHydrationState, isHydrated } from "../../core/models/utils";
import { OpportunityProfileModuleName } from "../../core/WorkflowsJusticeInvolvedPersonProfile/OpportunityProfile";
import {
  AutoSnoozeUpdate,
  Denial,
  ManualSnoozeUpdate,
  OpportunityUpdate,
  OpportunityUpdateWithForm,
  SharedSnoozeUpdate,
  UpdateLog,
} from "../../FirestoreStore";
import { RootStore } from "../../RootStore";
import { formatDateToISO } from "../../utils";
import {
  CollectionDocumentSubscription,
  DocumentSubscription,
  OpportunityUpdateSubscription,
  TransformFunction,
  UpdateFunction,
  ValidateFunction,
} from "../subscriptions";
import { JusticeInvolvedPerson } from "../types";
import {
  getSnoozeUntilDate,
  OTHER_KEY,
  snoozeUntilDateInTheFuture,
} from "../utils";
import { FormBase } from "./Forms/FormBase";
import { AutoSnoozeUntil, OpportunityType } from "./OpportunityConfigs";
import {
  Component,
  DefaultEligibility,
  DenialReasonsMap,
  FormVariant,
  Opportunity,
  OPPORTUNITY_STATUS_RANKED,
  OpportunityRequirement,
  OpportunityStatus,
  OpportunityTab,
} from "./types";

export function updateOpportunityEligibility(
  opportunityType: OpportunityType,
  recordId: string,
  rootStore: RootStore,
) {
  return async (record: DocumentData) => {
    // If the record is eligible, then no update is needed.
    const denialReasons = record.denial?.reasons ?? [];
    if (!denialReasons.length || (!record.autoSnooze && !record.manualSnooze)) {
      return;
    }

    const snoozeUntilDate = getSnoozeUntilDate({
      ...(record.manualSnooze ?? {}),
      ...(record.autoSnooze ?? {}),
    });

    if (!snoozeUntilDate) return;

    if (denialReasons.length > 0 && snoozeUntilDateInTheFuture(snoozeUntilDate))
      return;

    // If there are denial reasons and the opp should be resurfaced, reset the
    // denial reasons and the manual and auto snooze configs.
    await rootStore.firestoreStore.deleteOpportunityDenialAndSnooze(
      opportunityType,
      recordId,
    );
  };
}

/**
 * Implements functionality shared by all Opportunities, most notably the `Hydratable` interface.
 * While this is an abstract class, it provides stubs rather than abstract properties, whenever possible,
 * to facilitate incremental development of new opportunities.
 */
export abstract class OpportunityBase<
  PersonType extends JusticeInvolvedPerson,
  ReferralRecord extends DocumentData,
  UpdateRecord extends OpportunityUpdateWithForm<any> = OpportunityUpdate,
> implements Opportunity<PersonType>
{
  readonly type: OpportunityType;

  rootStore: RootStore;

  person: PersonType;

  form?: FormBase<any, any>;

  referralSubscription: DocumentSubscription<ReferralRecord>;

  updatesSubscription: DocumentSubscription<UpdateRecord>;

  readonly opportunityProfileModules: OpportunityProfileModuleName[] = [];

  /**
   * The "alert" flavor of opportunity receives a different UI treatment
   */
  readonly isAlert: boolean = false;

  /**
   * If the opportunity allows external system requests
   */
  readonly supportsExternalRequest: boolean = false;

  /**
   * Updates an ineligible opportunity to be eligible when
   * the overridden/denied time period has expired.
   */
  updateOpportunityEligibility: UpdateFunction<DocumentData>;

  constructor(
    person: PersonType,
    type: OpportunityType,
    rootStore: RootStore,
    transformReferral?: TransformFunction<ReferralRecord>,
    validateRecord?: ValidateFunction<ReferralRecord>,
  ) {
    makeObservable(this, {
      denial: computed,
      autoSnooze: computed,
      manualSnooze: computed,
      isSnoozed: computed,
      snoozeForDays: computed,
      manualSnoozeUntilDate: computed,
      hydrate: action,
      hydrationState: computed,
      record: computed,
      updates: computed,
      reviewStatus: computed,
      setCompletedIfEligible: action,
      setAutoSnooze: action,
      setManualSnooze: action,
      setDenialReasons: action,
      setOtherReasonText: action,
    });

    this.person = person;
    this.type = type;
    this.rootStore = rootStore;

    this.updateOpportunityEligibility = updateOpportunityEligibility(
      this.type,
      this.person.recordId,
      this.rootStore,
    );

    this.referralSubscription =
      new CollectionDocumentSubscription<ReferralRecord>(
        this.rootStore.firestoreStore,
        `${type}Referrals` as const,
        person.recordId,
        transformReferral,
        validateRecord,
      );
    this.updatesSubscription = new OpportunityUpdateSubscription<UpdateRecord>(
      this.rootStore.firestoreStore,
      person.recordId,
      type,
      this.updateOpportunityEligibility,
    );
  }

  get config() {
    return this.rootStore.workflowsStore.opportunityConfigurationStore
      .opportunities[this.type];
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

  get manualSnooze(): ManualSnoozeUpdate | undefined {
    if (this.updates?.manualSnooze?.snoozedBy) {
      return this.updates?.manualSnooze;
    }
  }

  get autoSnooze(): AutoSnoozeUpdate | undefined {
    if (this.updates?.autoSnooze?.snoozedBy) {
      return this.updates?.autoSnooze;
    }
  }

  get snoozedBy(): SharedSnoozeUpdate["snoozedBy"] | undefined {
    if (this.manualSnooze) return this.manualSnooze.snoozedBy;
    if (this.autoSnooze) return this.autoSnooze.snoozedBy;
  }

  get snoozedOnDate(): Date | undefined {
    if (this.manualSnooze) return parseISO(this.manualSnooze.snoozedOn);
    if (this.autoSnooze) return parseISO(this.autoSnooze.snoozedOn);
  }

  get manualSnoozeUntilDate(): Date | undefined {
    if (!this.manualSnooze || !this.snoozedOnDate) return;
    return add(this.snoozedOnDate, {
      days: this.manualSnooze.snoozeForDays,
    });
  }

  /* Returns the current number of days an opportunity will be snoozed for, taking into account the current date */
  get snoozeForDays(): number | undefined {
    if (!this.manualSnoozeUntilDate) return;
    return differenceInDays(this.manualSnoozeUntilDate, startOfToday());
  }

  get isSnoozed(): boolean {
    const snoozeUntil =
      (this.autoSnooze?.snoozeUntil &&
        parseISO(this.autoSnooze?.snoozeUntil)) ??
      this.manualSnoozeUntilDate;

    return !!snoozeUntil && snoozeUntilDateInTheFuture(snoozeUntil);
  }

  get omsSnoozeStatus() {
    return this.updates?.omsSnooze?.status;
  }

  get lastViewed(): UpdateLog | undefined {
    return this.updates?.lastViewed;
  }

  setLastViewed(): void {
    when(
      () => isHydrated(this),
      () => {
        const { currentUserEmail } = this.rootStore.workflowsStore;
        // should not happen in practice
        if (!currentUserEmail) return;

        // ignore recidiviz admins and other non-state actors in prod
        if (
          process.env.REACT_APP_DEPLOY_ENV === "production" &&
          this.rootStore.userStore.stateCode !== this.person.stateCode
        )
          return;

        this.rootStore.firestoreStore.updateOpportunityLastViewed(
          currentUserEmail,
          this.person.recordId,
          this.type,
        );
      },
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

    if (this.lastViewed || updates?.referralForm) {
      return "IN_PROGRESS";
    }
    return "PENDING";
  }

  readonly defaultEligibility: DefaultEligibility = "ELIGIBLE";

  setCompletedIfEligible(): void {
    when(
      () => isHydrated(this),
      () => {
        const { currentUserEmail } = this.rootStore.workflowsStore;
        if (!currentUserEmail) return;
        const { recordId, pseudonymizedId } = this.person;
        const { reviewStatus } = this;
        if (reviewStatus === "DENIED" || reviewStatus === "COMPLETED") return;

        this.rootStore.firestoreStore.updateOpportunityCompleted(
          currentUserEmail,
          recordId,
          this.type,
        );
        this.rootStore.analyticsStore.trackSetOpportunityStatus({
          clientId: pseudonymizedId,
          justiceInvolvedPersonId: pseudonymizedId,
          status: "COMPLETED",
          opportunityType: this.type,
        });
      },
    );
  }

  /**
   * An Opportunity is only as hydrated as its least-hydrated Subscription.
   */
  get hydrationState(): HydrationState {
    return compositeHydrationState([
      this.referralSubscription,
      this.updatesSubscription,
    ]);
  }

  /**
   * Initiates hydration for all subscriptions.
   */
  hydrate(): void {
    this.referralSubscription.hydrate();
    this.updatesSubscription.hydrate();
  }

  async deleteOpportunityDenialAndSnooze(): Promise<void> {
    await this.rootStore.firestoreStore.deleteOpportunityDenialAndSnooze(
      this.type,
      this.person.recordId,
    );
  }

  async setManualSnooze(days: number, reasons: string[]): Promise<void> {
    const { currentUserEmail } = this.rootStore.workflowsStore;
    const { recordId } = this.person;
    if (!currentUserEmail) return;

    // If there are no denial reasons selected, clear the snooze values
    const deleteSnoozeField = reasons.length === 0;

    this.rootStore.analyticsStore.trackOpportunitySnoozed({
      opportunityType: this.type,
      opportunityStatus: this.reviewStatus,
      justiceInvolvedPersonId: this.person.pseudonymizedId,
      snoozeForDays: days,
      reasons,
    });

    await this.rootStore.firestoreStore.updateOpportunityManualSnooze(
      this.type,
      recordId,
      {
        snoozedBy: currentUserEmail,
        snoozedOn: format(new Date(), "yyyy-MM-dd"),
        snoozeForDays: days,
      },
      deleteSnoozeField,
    );
  }

  async setAutoSnooze(
    defaultSnoozeUntilFn: AutoSnoozeUntil["defaultSnoozeUntilFn"],
    reasons: string[],
  ): Promise<void> {
    const { currentUserEmail } = this.rootStore.workflowsStore;
    const { recordId } = this.person;
    if (!currentUserEmail) return;

    // If there are no denial reasons selected, clear the snooze values
    const deleteSnoozeField = reasons.length === 0;

    const snoozeUntil = defaultSnoozeUntilFn(startOfToday(), this);

    this.rootStore.analyticsStore.trackOpportunitySnoozed({
      opportunityType: this.type,
      opportunityStatus: this.reviewStatus,
      justiceInvolvedPersonId: this.person.pseudonymizedId,
      snoozeUntil: formatDateToISO(snoozeUntil),
      reasons,
    });

    await this.rootStore.firestoreStore.updateOpportunityAutoSnooze(
      this.type,
      recordId,
      {
        snoozedBy: currentUserEmail,
        snoozedOn: format(new Date(), "yyyy-MM-dd"),
        snoozeUntil: formatDateToISO(snoozeUntil),
      },
      deleteSnoozeField,
    );
  }

  sortByReviewStatus(other: Opportunity): number {
    return ascending(
      OPPORTUNITY_STATUS_RANKED.indexOf(this.reviewStatus),
      OPPORTUNITY_STATUS_RANKED.indexOf(other.reviewStatus),
    );
  }

  sortByEligibilityDate(other: Opportunity): number {
    return ascending(this.eligibilityDate, other.eligibilityDate);
  }

  sortByReviewStatusThenEligibilityDate(other: Opportunity): number {
    const reviewStatusRanking = this.sortByReviewStatus(other);

    if (
      reviewStatusRanking === 0 &&
      this.eligibilityDate &&
      other.eligibilityDate
    )
      return this.sortByEligibilityDate(other);
    return reviewStatusRanking;
  }

  compare(other: Opportunity): number {
    return this.sortByReviewStatusThenEligibilityDate(other);
  }

  async setDenialReasons(reasons: string[]): Promise<void> {
    const { currentUserEmail } = this.rootStore.workflowsStore;
    if (!currentUserEmail) return;
    const { recordId, pseudonymizedId } = this.person;

    // clear irrelevant "other" text if necessary
    const deletions = reasons.includes(OTHER_KEY)
      ? undefined
      : { otherReason: true };

    await this.rootStore.firestoreStore.updateOpportunityDenial(
      currentUserEmail,
      recordId,
      { reasons },
      this.type,
      deletions,
    );

    await this.rootStore.firestoreStore.updateOpportunityCompleted(
      currentUserEmail,
      recordId,
      this.type,
      true,
    );

    if (reasons.length) {
      this.rootStore.analyticsStore.trackSetOpportunityStatus({
        clientId: pseudonymizedId,
        justiceInvolvedPersonId: pseudonymizedId,
        status: "DENIED",
        opportunityType: this.type,
        deniedReasons: reasons,
      });
    } else {
      this.rootStore.analyticsStore.trackSetOpportunityStatus({
        clientId: pseudonymizedId,
        justiceInvolvedPersonId: pseudonymizedId,
        status: "IN_PROGRESS",
        opportunityType: this.type,
      });
      this.rootStore.analyticsStore.trackOpportunityMarkedEligible({
        justiceInvolvedPersonId: pseudonymizedId,
        opportunityType: this.type,
      });
    }
  }

  async setOtherReasonText(otherReason?: string): Promise<void> {
    const { currentUserEmail } = this.rootStore.workflowsStore;
    if (currentUserEmail) {
      await this.rootStore.firestoreStore.updateOpportunityDenial(
        currentUserEmail,
        this.person.recordId,
        {
          otherReason,
        },
        this.type,
      );
    }
  }

  trackListViewed(): void {
    this.rootStore.analyticsStore.trackSurfacedInList({
      justiceInvolvedPersonId: this.person.pseudonymizedId,
      opportunityType: this.type,
    });
  }

  trackPreviewed(): void {
    this.rootStore.analyticsStore.trackOpportunityPreviewed({
      justiceInvolvedPersonId: this.person.pseudonymizedId,
      opportunityType: this.type,
    });
  }

  get deniedTabTitle(): OpportunityTab {
    return this.isAlert ? "Overridden" : "Marked ineligible";
  }

  get tabTitle(): OpportunityTab {
    if (this.denied) return this.deniedTabTitle;
    if (this.almostEligible) return "Almost Eligible";
    return "Eligible Now";
  }

  /*
   * Alert-type opportunities only have a visible status if they're denied; others are always visible
   */
  showEligibilityStatus(component: Component): boolean {
    return !this.isAlert || this.reviewStatus === "DENIED";
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

  get denied(): boolean {
    return !!this.denial;
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

  // eslint-disable-next-line class-methods-use-this
  get formVariant(): FormVariant | undefined {
    return undefined;
  }

  // eslint-disable-next-line class-methods-use-this
  get eligibleStatusMessage(): string | undefined {
    return undefined;
  }

  // eslint-disable-next-line class-methods-use-this
  get almostEligibleStatusMessage(): string | undefined {
    return undefined;
  }
}
