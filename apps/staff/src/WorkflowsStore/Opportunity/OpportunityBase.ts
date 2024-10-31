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

import { OpportunityType } from "~datatypes";
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
  DocumentSubscription,
  OpportunityUpdateSubscription,
  UpdateFunction,
} from "../subscriptions";
import { JusticeInvolvedPerson } from "../types";
import {
  getSnoozeUntilDate,
  OTHER_KEY,
  snoozeUntilDateInTheFuture,
} from "../utils";
import { FormBase } from "./Forms/FormBase";
import { SnoozeConfiguration } from "./OpportunityConfigurations/modules/SnoozeConfiguration/interfaces/ISnoozeConfiguration";
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
  hydrateReq,
  hydrateUntypedCriteria,
  UntypedCriteriaFormatters,
} from "./utils/criteriaUtils";

export function updateOpportunityEligibility(
  opportunity: Opportunity,
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
      opportunity,
    );
  };
}

/**
 * Implements functionality shared by all Opportunities, most notably the `Hydratable` interface.
 * While this is an abstract class, it provides stubs rather than abstract properties, whenever possible,
 * to facilitate incremental development of new opportunities.
 */
export class OpportunityBase<
  PersonType extends JusticeInvolvedPerson,
  ReferralRecord extends DocumentData,
  UpdateRecord extends OpportunityUpdateWithForm<any> = OpportunityUpdate,
> implements Opportunity<PersonType>
{
  form?: FormBase<any, any>;

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
    public person: PersonType,
    readonly type: OpportunityType,
    public rootStore: RootStore,
    public record: ReferralRecord,
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
      updates: computed,
      reviewStatus: computed,
      setCompletedIfEligible: action,
      setAutoSnooze: action,
      setManualSnooze: action,
      setDenialReasons: action,
      setOtherReasonText: action,
      denied: computed,
      isSubmitted: computed,
      submittedUpdate: computed,
    });

    this.updateOpportunityEligibility = updateOpportunityEligibility(
      this,
      this.rootStore,
    );

    this.updatesSubscription = new OpportunityUpdateSubscription<UpdateRecord>(
      this.rootStore.firestoreStore,
      person.recordId,
      this.firestoreUpdateDocId,
      this.updateOpportunityEligibility,
    );

    this.compareFunction = this.buildCompareFunction();
  }

  get firestoreUpdateDocId() {
    // For multi-instance opportunities, the document ID has the opportunity id
    // appended to the opportunity type. Otherwise, use just the opportunity type
    return this.opportunityId === undefined
      ? this.type
      : `${this.type}_${this.opportunityId}`;
  }

  get opportunityId() {
    return this.record.opportunityId;
  }

  get selectId() {
    // Used as the key for opportunity-specific components, i.e. CaseloadOpportunityCell
    // Also used when filtering on a list of opportunities.
    return (
      this.record.opportunityPseudonymizedId ?? this.person.pseudonymizedId
    );
  }

  get accordionKey() {
    // Used to control what opportunities are expanded in accordion components
    return this.opportunityId
      ? `${this.type}_${this.opportunityId}`
      : this.type;
  }

  get config() {
    return this.rootStore.workflowsRootStore.opportunityConfigurationStore
      .opportunities[this.type];
  }

  get supportsDenial(): boolean {
    return Object.keys(this.config.denialReasons).length > 0;
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

  get submittedUpdate(): UpdateLog | undefined {
    return this.updates?.submitted;
  }

  get isSubmitted(): boolean {
    return !!this.submittedUpdate;
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
          this,
        );
      },
    );
  }

  get reviewStatus(): OpportunityStatus {
    const { updates, denial, isSubmitted } = this;
    if (denial) {
      return "DENIED";
    }

    if (updates?.completed) {
      return "COMPLETED";
    }

    if (isSubmitted) {
      return "SUBMITTED";
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
        const { pseudonymizedId } = this.person;
        const { reviewStatus } = this;
        if (reviewStatus === "DENIED" || reviewStatus === "COMPLETED") return;

        this.rootStore.firestoreStore.updateOpportunityCompleted(
          this.currentUserEmail,
          this,
        );
        this.rootStore.analyticsStore.trackSetOpportunityStatus({
          justiceInvolvedPersonId: pseudonymizedId,
          status: "COMPLETED",
          opportunityType: this.type,
          opportunityId: this.sentryTrackingId,
        });
      },
    );
  }

  get currentUserEmail(): string {
    // use || instead of ?? so if userEmail is "", we fall back to "user"
    return this.rootStore.userStore.userEmail || "user";
  }

  /**
   * Text displayed as a header when this opportunity is previewed
   */
  get previewBannerText(): string | undefined {
    switch (this.person.stateCode) {
      case "US_AZ":
      case "US_MI":
      case "US_ME":
      case "US_OR":
      case "US_TN":
        return "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed eiusmod temor. With longer text, the profile link stays on one line";
      default:
        return;
    }
  }

  /**
   * An Opportunity is only as hydrated as its least-hydrated Subscription.
   */
  get hydrationState(): HydrationState {
    const opportunitySubscriptions: Hydratable[] = [this.updatesSubscription];
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
    this.updatesSubscription.hydrate();
    if (this.form) {
      this.form.hydrate();
    }
  }

  async deleteSubmitted(): Promise<void> {
    await this.rootStore.firestoreStore.deleteOpportunitySubmitted(this);

    this.rootStore.analyticsStore.trackOpportunityUnsubmitted({
      justiceInvolvedPersonId: this.person.pseudonymizedId,
      opportunityType: this.type,
      opportunityId: this.sentryTrackingId,
    });
  }

  async deleteOpportunityDenialAndSnooze(): Promise<void> {
    await this.rootStore.firestoreStore.deleteOpportunityDenialAndSnooze(this);

    this.rootStore.analyticsStore.trackSetOpportunityStatus({
      justiceInvolvedPersonId: this.person.pseudonymizedId,
      status: this.reviewStatus,
      opportunityType: this.type,
      opportunityId: this.sentryTrackingId,
    });
  }

  async setManualSnooze(days: number, reasons: string[]): Promise<void> {
    // If there are no denial reasons selected, clear the snooze values
    const deleteSnoozeField = reasons.length === 0;

    this.rootStore.analyticsStore.trackOpportunitySnoozed({
      opportunityType: this.type,
      opportunityStatus: this.reviewStatus,
      justiceInvolvedPersonId: this.person.pseudonymizedId,
      snoozeForDays: days,
      reasons,
      opportunityId: this.sentryTrackingId,
    });

    // If someone goes from being submitted to being snoozed,
    // they should no longer be submitted
    if (this.isSubmitted) {
      await this.deleteSubmitted();
    }

    await this.rootStore.firestoreStore.updateOpportunityManualSnooze(
      this,
      {
        snoozedBy: this.currentUserEmail,
        snoozedOn: format(new Date(), "yyyy-MM-dd"),
        snoozeForDays: days,
      },
      deleteSnoozeField,
    );
  }

  async setAutoSnooze(
    autoSnoozeParams: NonNullable<SnoozeConfiguration["autoSnoozeParams"]>,
    reasons: string[],
  ): Promise<void> {
    // If there are no denial reasons selected, clear the snooze values
    const deleteSnoozeField = reasons.length === 0;

    const snoozeUntil = autoSnoozeParams(startOfToday(), this);

    this.rootStore.analyticsStore.trackOpportunitySnoozed({
      opportunityType: this.type,
      opportunityStatus: this.reviewStatus,
      justiceInvolvedPersonId: this.person.pseudonymizedId,
      snoozeUntil: formatDateToISO(snoozeUntil),
      reasons,
      opportunityId: this.sentryTrackingId,
    });

    // If someone goes from being submitted to being snoozed,
    // they should no longer be submitted
    if (this.isSubmitted) {
      await this.deleteSubmitted();
    }

    await this.rootStore.firestoreStore.updateOpportunityAutoSnooze(
      this,
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

  async markSubmitted(): Promise<void> {
    await this.rootStore.firestoreStore.updateOpportunitySubmitted(
      this.currentUserEmail,
      this,
    );

    this.rootStore.analyticsStore.trackOpportunityMarkedSubmitted({
      justiceInvolvedPersonId: this.person.pseudonymizedId,
      opportunityType: this.type,
      opportunityId: this.sentryTrackingId,
    });

    // If someone is now submitted, they should not be denied/snoozed
    if (this.denial) {
      await this.deleteOpportunityDenialAndSnooze();
    }
  }

  async setDenialReasons(reasons: string[]): Promise<void> {
    if (reasons.length === 0) {
      // If the reasons are empty, this is equivalent to deleting the denial
      await this.deleteOpportunityDenialAndSnooze();
      return;
    }

    const { pseudonymizedId } = this.person;

    // If someone goes from being submitted to being denied,
    // they should no longer be submitted
    if (this.isSubmitted) {
      await this.deleteSubmitted();
    }

    // clear irrelevant "other" text if necessary
    const deletions = reasons.includes(OTHER_KEY)
      ? undefined
      : { otherReason: true };

    await this.rootStore.firestoreStore.updateOpportunityDenial(
      this.currentUserEmail,
      this,
      { reasons },
      deletions,
    );

    await this.rootStore.firestoreStore.updateOpportunityCompleted(
      this.currentUserEmail,
      this,
      true,
    );

    this.rootStore.analyticsStore.trackSetOpportunityStatus({
      justiceInvolvedPersonId: pseudonymizedId,
      status: "DENIED",
      opportunityType: this.type,
      deniedReasons: reasons,
      opportunityId: this.sentryTrackingId,
    });
  }

  async setOtherReasonText(otherReason?: string): Promise<void> {
    await this.rootStore.firestoreStore.updateOpportunityDenial(
      this.currentUserEmail,
      this,
      {
        otherReason,
      },
    );
  }

  trackListViewed(): void {
    // Pseudonymize staff IDs
    // (emit undefined if we don't know the search field
    // to avoid emitting outputting a non-pseudonymized staff id)
    const pseudoSearchId =
      this.person.searchField === undefined
        ? undefined
        : this.person.searchField === "officerId"
          ? this.person.assignedStaffPseudoId
          : this.person.searchIdValue;

    this.rootStore.analyticsStore.trackSurfacedInList({
      justiceInvolvedPersonId: this.person.pseudonymizedId,
      opportunityType: this.type,
      searchIdValue: pseudoSearchId,
      searchField: this.person.searchField,
      tabTitle: this.tabTitle(),
      opportunityId: this.sentryTrackingId,
    });
  }

  trackPreviewed(): void {
    this.rootStore.analyticsStore.trackOpportunityPreviewed({
      justiceInvolvedPersonId: this.person.pseudonymizedId,
      opportunityType: this.type,
      opportunityId: this.sentryTrackingId,
    });
  }

  get submittedTabTitle(): OpportunityTab {
    return this.config.submittedTabTitle;
  }

  get deniedTabTitle(): OpportunityTab {
    return this.config.deniedTabTitle;
  }

  tabTitle(category?: OpportunityTabGroup): OpportunityTab {
    if (this.denied) return this.deniedTabTitle;
    if (this.isSubmitted) return this.submittedTabTitle;
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

  get nonOMSRequirements(): OpportunityRequirement[] {
    const {
      config: { nonOMSCriteria },
    } = this;

    // Because these criteria aren't associated with a referral record, they don't have reasons
    return nonOMSCriteria.map((req) =>
      hydrateReq({
        raw: req,
        opportunity: this,
        formatters: this.criteriaFormatters,
      }),
    );
  }

  get almostEligible(): boolean {
    return !!Object.keys(this.record?.ineligibleCriteria || {}).length;
  }

  get denied(): boolean {
    return !!this.denial;
  }

  get sentryTrackingId(): string {
    return this.record?.opportunityPseudonymizedId ?? null;
  }

  // ===============================
  // properties below this line are stubs and in most cases should be overridden
  // in a subclass. Given their triviality they are not annotated by MobX either,
  // so subclasses can use normal annotations instead of having to use `override`.
  // ===============================

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

  // Used to optionally display an opportunity-specific id in OpportunityCapsule
  get instanceDetails(): string | undefined {
    return undefined;
  }

  get highlightCalloutText(): string {
    throw Error(`Implement highlightCalloutText for ${this.type}`);
  }

  // Used to optionally display information appended to an opportunity label
  get labelAddendum(): string | undefined {
    return undefined;
  }
}
