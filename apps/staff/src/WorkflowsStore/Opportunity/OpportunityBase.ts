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

import {
  compositeHydrationState,
  Hydratable,
  HydrationState,
  isHydrated,
} from "~hydration-utils";

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
import { AutoSnoozeUntil } from "./OpportunityConfigs";
import { OpportunityType } from "./OpportunityType/types";
import {
  Component,
  DefaultEligibility,
  FormVariant,
  Opportunity,
  OpportunityRequirement,
  OpportunityStatus,
  OpportunityTab,
  OpportunityTabGroup,
} from "./types";
import { buildOpportunityCompareFunction } from "./utils/compareUtils";
import {
  hydrateUntypedCriteria,
  UntypedCriteriaFormatters,
} from "./utils/criteriaUtils";

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

  /**
   * If the opportunity allows external system requests
   */
  readonly supportsExternalRequest: boolean = false;

  readonly compareFunction: (a: Opportunity, b: Opportunity) => number;

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
      requirementsMet: computed,
      requirementsAlmostMet: computed,
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
        { raw: this.config.firestoreCollection },
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

    this.compareFunction = this.buildCompareFunction();
  }

  get config() {
    return this.rootStore.workflowsRootStore.opportunityConfigurationStore
      .opportunities[this.type];
  }

  get supportsDenial(): boolean {
    return Object.keys(this.config.denialReasons).length > 0;
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
        // ignore recidiviz admins and other non-state actors in prod
        if (
          import.meta.env.VITE_DEPLOY_ENV === "production" &&
          this.rootStore.userStore.stateCode !== this.person.stateCode
        )
          return;

        this.rootStore.firestoreStore.updateOpportunityLastViewed(
          this.currentUserEmail,
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
        const { recordId, pseudonymizedId } = this.person;
        const { reviewStatus } = this;
        if (reviewStatus === "DENIED" || reviewStatus === "COMPLETED") return;

        this.rootStore.firestoreStore.updateOpportunityCompleted(
          this.currentUserEmail,
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

  get currentUserEmail(): string {
    // use || instead of ?? so if userEmail is "", we fall back to "user"
    return this.rootStore.userStore.userEmail || "user";
  }

  /**
   * An Opportunity is only as hydrated as its least-hydrated Subscription.
   */
  get hydrationState(): HydrationState {
    const opportunitySubscriptions: Hydratable[] = [
      this.referralSubscription,
      this.updatesSubscription,
    ];
    // Also evaluate form subscription hydration state if applicable.
    if (this.form) {
      opportunitySubscriptions.push(this.form);
    }
    return compositeHydrationState([...opportunitySubscriptions]);
  }

  /**
   * Initiates hydration for all subscriptions.
   */
  hydrate(): void {
    this.referralSubscription.hydrate();
    this.updatesSubscription.hydrate();
    if (this.form && this.form.shouldUseFormUpdates) {
      this.form.hydrate();
    }
  }

  async deleteOpportunityDenialAndSnooze(): Promise<void> {
    await this.rootStore.firestoreStore.deleteOpportunityDenialAndSnooze(
      this.type,
      this.person.recordId,
    );
  }

  async setManualSnooze(days: number, reasons: string[]): Promise<void> {
    const { recordId } = this.person;

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
        snoozedBy: this.currentUserEmail,
        snoozedOn: format(new Date(), "yyyy-MM-dd"),
        snoozeForDays: days,
      },
      deleteSnoozeField,
    );
  }

  async setAutoSnooze(
    autoSnoozeParams: AutoSnoozeUntil["autoSnoozeParams"],
    reasons: string[],
  ): Promise<void> {
    const { recordId } = this.person;

    // If there are no denial reasons selected, clear the snooze values
    const deleteSnoozeField = reasons.length === 0;

    const snoozeUntil = autoSnoozeParams(startOfToday(), this);

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
        snoozedBy: this.currentUserEmail,
        snoozedOn: format(new Date(), "yyyy-MM-dd"),
        snoozeUntil: formatDateToISO(snoozeUntil),
      },
      deleteSnoozeField,
    );
  }

  sortByEligibilityDate(other: Opportunity): number {
    return ascending(this.eligibilityDate, other.eligibilityDate);
  }

  compare(other: Opportunity): number {
    return this.compareFunction(this, other);
  }

  buildCompareFunction(): (a: Opportunity, b: Opportunity) => number {
    const { compareBy, systemType } = this.config;
    if (compareBy) return buildOpportunityCompareFunction(compareBy);
    const sortParams = [{ field: "eligibilityDate" }];

    if (systemType === "INCARCERATION")
      sortParams.push({ field: "releaseDate" });
    else sortParams.push({ field: "expirationDate" });

    return buildOpportunityCompareFunction(sortParams);
  }

  async setDenialReasons(reasons: string[]): Promise<void> {
    const { recordId, pseudonymizedId } = this.person;

    // clear irrelevant "other" text if necessary
    const deletions = reasons.includes(OTHER_KEY)
      ? undefined
      : { otherReason: true };

    await this.rootStore.firestoreStore.updateOpportunityDenial(
      this.currentUserEmail,
      recordId,
      { reasons },
      this.type,
      deletions,
    );

    await this.rootStore.firestoreStore.updateOpportunityCompleted(
      this.currentUserEmail,
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
    await this.rootStore.firestoreStore.updateOpportunityDenial(
      this.currentUserEmail,
      this.person.recordId,
      {
        otherReason,
      },
      this.type,
    );
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
    return this.config.isAlert ? "Overridden" : "Marked Ineligible";
  }

  tabTitle(category?: OpportunityTabGroup): OpportunityTab {
    if (this.denied) return this.deniedTabTitle;
    if (this.almostEligible) return "Almost Eligible";
    return "Eligible Now";
  }

  /*
   * Alert-type opportunities only have a visible status if they're denied; others are always visible
   */
  showEligibilityStatus(component: Component): boolean {
    return !this.config.isAlert || this.reviewStatus === "DENIED";
  }

  criteriaFormatters?: UntypedCriteriaFormatters;

  get requirementsMet(): OpportunityRequirement[] {
    const {
      record,
      config: { eligibleCriteriaCopy },
    } = this;
    if (!record) return [];
    return hydrateUntypedCriteria(
      record.eligibleCriteria,
      eligibleCriteriaCopy,
      this,
      this.criteriaFormatters,
    );
  }

  get requirementsAlmostMet(): OpportunityRequirement[] {
    const {
      record,
      config: { ineligibleCriteriaCopy },
    } = this;
    if (!record) return [];
    return hydrateUntypedCriteria(
      record.ineligibleCriteria,
      ineligibleCriteriaCopy,
      this,
      this.criteriaFormatters,
    );
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
