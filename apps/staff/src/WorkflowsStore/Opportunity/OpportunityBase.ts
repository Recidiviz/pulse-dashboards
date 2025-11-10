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
import { DocumentData, Timestamp } from "firebase/firestore";
import { isEmpty, pick, pickBy } from "lodash";
import { action, computed, makeObservable, when } from "mobx";

import { OpportunityType } from "~datatypes";
import { HydrationState, isHydrated } from "~hydration-utils";

import {
  reasonsIncludesOtherKey,
  StatusPalette,
} from "../../core/utils/workflowsUtils";
import {
  AutoSnoozeUpdate,
  Denial,
  ManualSnoozeUpdate,
  OfficerAction,
  OfficerApprovalAction,
  OfficerDenialAction,
  OpportunityUpdate,
  OpportunityUpdateWithForm,
  SharedSnoozeUpdate,
  Submission,
  SupervisorAction,
  UpdateLog,
} from "../../FirestoreStore";
import { RootStore } from "../../RootStore";
import { OpportunityApprovalActionsMetadata } from "../../RootStore/AnalyticsStore/AnalyticsStore";
import { formatDateToISO, toTitleCase } from "../../utils";
import {
  DocumentSubscription,
  OpportunityUpdateSubscription,
  UpdateFunction,
} from "../subscriptions";
import { JusticeInvolvedPerson } from "../types";
import {
  getPersonDaysToRelease,
  getSnoozeUntilDate,
  snoozeUntilDateInTheFuture,
} from "../utils";
import { FormBase } from "./Forms/FormBase";
import { SnoozeConfiguration } from "./OpportunityConfigurations/modules/SnoozeConfiguration/interfaces/ISnoozeConfiguration";
import {
  Component,
  DefaultEligibility,
  DenialReasonsMap,
  FormVariant,
  Opportunity,
  OpportunityBannerInfo,
  OpportunityRequirement,
  OpportunityStatus,
  OpportunityTab,
  OpportunityTabGroup,
  RevertConfirmationCopy,
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
      submittedButtonText: computed,
      undoSubmittedButtonText: computed,
      bannerInfo: computed,
      isInSupervisorReview: computed,
      isInGrantReview: computed,
      isInSnoozeReview: computed,
      latestAction: computed,
      actionHistory: computed,
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

  get denialReasons() {
    return this.config.denialReasons;
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
    if (this.isIndefinitelySnoozed) {
      return this.denial?.updated?.by;
    }
  }

  get submittedButtonText(): string {
    return `Mark ${this.config.submittedTabTitle}`;
  }

  get undoSubmittedButtonText(): string {
    return `Revert from ${this.config.submittedTabTitle}`;
  }

  get snoozedOnDate(): Date | undefined {
    if (this.manualSnooze) return parseISO(this.manualSnooze.snoozedOn);
    if (this.autoSnooze) return parseISO(this.autoSnooze.snoozedOn);
    if (this.isIndefinitelySnoozed) {
      return this.denial?.updated?.date.toDate();
    }
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

  get submittedUpdate(): Submission | undefined {
    return this.updates?.submitted;
  }

  get isSubmitted(): boolean {
    return this.config.supportsSubmitted && !!this.submittedUpdate;
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

    if (this.isInRevisionsRequests) {
      return "REVISIONS_REQUESTED";
    }

    if (this.isGrantApproved) {
      return "GRANT_APPROVED";
    }

    if (this.isInGrantReview) {
      return "GRANT_REVIEW";
    }

    if (this.isInSnoozeReview) {
      return "SNOOZE_REVIEW";
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
    return;
  }

  /**
   * Information shown in the OpportunityBanner.
   * The banner will only be displayed when previewBannerText is defined.
   * OpportunityBase.previewBannerText is undefined by default and overridden in child
   * opportunity classes with the relevant text for the opportunities where the banner
   * is to be displayed.
   */
  get bannerInfo(): OpportunityBannerInfo | undefined {
    return this.previewBannerText
      ? {
          previewBannerText: this.previewBannerText,
          link: this.person.profileUrl,
          linkText: `See ${toTitleCase(this.rootStore.workflowsStore.justiceInvolvedPersonTitle)} Profile`,
          onLinkClick: () =>
            this.rootStore.analyticsStore.trackNavigateToPersonProfileLinkClicked(
              {
                justiceInvolvedPersonId: this.person.pseudonymizedId,
                opportunityType: this.type,
              },
            ),
        }
      : undefined;
  }

  /**
   * Opportunity hydration covers only the updates subscription:
   * The opportunity record is provided to the constructor, and the form
   * is hydrated separately.
   */
  get hydrationState(): HydrationState {
    return this.updatesSubscription.hydrationState;
  }

  hydrate(): void {
    this.updatesSubscription.hydrate();
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

  async markSubmitted(newSubcategory?: string): Promise<void> {
    await this.rootStore.firestoreStore.updateOpportunitySubmitted(
      this.currentUserEmail,
      this,
      newSubcategory,
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

  /**
   * Mark this opportunity as Submitted. If newSubcategory is provided, switch this
   * opportunity to that subcategory. Return a message that can be displayed to the user
   * about the status change (this method does not itself handle displaying the message)
   * or return undefined if the opportunity's status did not change.
   */
  async markSubmittedAndGenerateToast(
    newSubcategory?: string,
    customToast?: string,
  ): Promise<string | undefined> {
    // Do nothing if this opportunity doesn't support the submitted status
    if (!this.config.supportsSubmitted) return;

    // Return no toast if marking the opportunity as submitted would do nothing,
    // or throw an error in egregious cases
    if (newSubcategory) {
      // trying to submit a submitted opportunity with its current subcategory
      // (we cannot just check if the opportunity is submitted because it is valid to
      // change the subcategory of an opportunity within the submitted status)
      if (newSubcategory === this.subcategory) return;

      // provided a subcategory that isn't valid for the submitted status
      if (!this.submittedSubcategories) {
        throw new Error(
          `Tried to mark as ${newSubcategory}, but there are no subcategories of ${this.submittedTabTitle} for this opportunity type`,
        );
      }
      if (!this.submittedSubcategories.includes(newSubcategory)) {
        throw new Error(
          `Tried to mark as ${newSubcategory}, but the only valid subcategories are ${this.submittedSubcategories}`,
        );
      }
    } else {
      // trying to submit an already submitted opportunity
      if (this.isSubmitted) return;
      // not provided a subcategory, but submitted opportunities have subcategories
      if (this.submittedSubcategories) {
        throw new Error(
          `Tried to mark as ${this.submittedTabTitle}, but a subcategory needed to be provided for this opportunity type`,
        );
      }
    }

    await this.markSubmitted(newSubcategory);

    const toastStatus = newSubcategory
      ? this.subcategoryHeadingFor(newSubcategory)
      : this.submittedTabTitle;

    if (customToast) {
      return customToast;
    }

    return newSubcategory
      ? `Marked ${this.person.displayName} as ${this.submittedTabTitle}:"${toastStatus}" for ${this.config.label}`
      : `Marked ${this.person.displayName} as "${toastStatus}" for ${this.config.label}`;
  }

  async setDenialReasons(
    reasons: string[],
    updatedUserInput?: Record<string, string>,
  ): Promise<void> {
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

    // clear irrelevant reason text if necessary
    const deletions = {
      otherReason: !reasonsIncludesOtherKey(reasons),
      userInput: isEmpty(updatedUserInput),
    };

    await this.rootStore.firestoreStore.updateOpportunityDenial(
      this.currentUserEmail,
      this,
      { reasons, userInput: updatedUserInput },
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

    // Snoozing ends the approval lifecycle, so we'll mark the action history stale.
    if (this.latestAction) {
      await this.markActionHistoryStale();
    }
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
    const { selectedSearchIds } = this.rootStore.workflowsStore.searchStore;

    // These are all of the possible search id values by search field, even if that search id value is not in selectedSearchIds,
    // broken out by searchField.
    Object.entries(this.person.searchIdValuesBySearchField).forEach(
      ([searchField, searchIdValues]) => {
        // These are all of the search Id values for a person, that are also present in selectedSearchIds
        const activeSearchIdValues = searchIdValues.filter((id) =>
          selectedSearchIds?.includes(id),
        );

        const modifiedSearchIds = activeSearchIdValues.map((value) => {
          // Remove the CRC prefix from facility id if it exists
          const withoutPrefix =
            this.rootStore.currentTenantId === "US_ID"
              ? value.replace(/^CRC /, "")
              : value;
          // Pseudonymize staff IDs
          return withoutPrefix === this.person.assignedStaffId
            ? this.person.assignedStaffPseudoId
            : withoutPrefix;
        });

        // For each searchField, if the person matches based on that searchField fire the event
        if (modifiedSearchIds.length > 0) {
          this.rootStore.analyticsStore.trackSurfacedInList({
            justiceInvolvedPersonId: this.person.pseudonymizedId,
            opportunityType: this.type,
            searchIdValue: modifiedSearchIds.join(","),
            searchField: searchField,
            tabTitle: this.tabTitle(),
            opportunityId: this.sentryTrackingId,
          });
        }
      },
    );
  }

  trackPreviewed(): void {
    this.rootStore.analyticsStore.trackOpportunityPreviewed({
      justiceInvolvedPersonId: this.person.pseudonymizedId,
      opportunityType: this.type,
      opportunityId: this.sentryTrackingId,
      tabTitle: this.tabTitle(),
    });
  }

  get subcategory(): string | undefined {
    return undefined;
  }

  subcategoryHeadingFor(subcategory: string): string {
    return this.config.subcategoryHeadings?.[subcategory] ?? subcategory;
  }

  // Copy to display for the opportuinty's current subcategory
  get subcategoryCopy(): string | undefined {
    if (!this.subcategory) return undefined;
    return this.subcategoryHeadingFor(this.subcategory);
  }

  // The possible subcategories of the Submitted status that this opportunity can
  // logically transition INTO from its current state
  get submittedSubcategories(): string[] | undefined {
    // From all the possible options, filter out this opportunity's current subcategory, if any
    const possibleSubcategories =
      this.config.markSubmittedOptionsByTab?.[this.tabTitle()];
    return possibleSubcategories?.filter(
      (subcategory) => subcategory !== this.subcategory,
    );
  }

  get submittedTabTitle(): OpportunityTab {
    return this.config.submittedTabTitle;
  }

  get deniedTabTitle(): OpportunityTab {
    return this.config.deniedTabTitle;
  }

  get supervisorReviewTabTitle(): OpportunityTab {
    return this.config.supervisorReviewTabTitle;
  }

  /**
   * Returns true when an officer has taken an action requiring supervisor approval and there is
   * not yet a supervisor response for that action.
   */
  get isInSupervisorReview(): boolean {
    return (
      !!this.latestAction &&
      !this.latestAction.isStale &&
      !this.latestAction.supervisorResponse
    );
  }

  get isInSnoozeReview(): boolean {
    return this.isInSupervisorReview && this.latestAction?.type === "DENIAL";
  }

  get isInGrantReview(): boolean {
    return this.isInSupervisorReview && this.latestAction?.type === "APPROVAL";
  }

  get isIndefinitelySnoozed(): boolean {
    return this.denied && !this.manualSnooze && !this.autoSnooze;
  }

  /**
   * Returns true when an officer has requested a snooze, and the supervisor
   * has denied that snooze with suggested revisisons to the snooze request.
   *
   * Only relevant for Iowa at this time.
   */
  get isInRevisionsRequests(): boolean {
    return (
      !!this.latestAction &&
      !this.latestAction.isStale &&
      this.latestAction?.type === "DENIAL" &&
      this.latestAction.supervisorResponse?.type === "DENIAL" &&
      !!this.latestAction.supervisorResponse.revisionRequest
    );
  }

  get isGrantApproved(): boolean {
    return (
      !!this.latestAction &&
      !this.latestAction.isStale &&
      this.latestAction?.type === "APPROVAL" &&
      this.latestAction.supervisorResponse?.type === "APPROVAL"
    );
  }

  tabTitle(category?: OpportunityTabGroup): OpportunityTab {
    if (this.denied) return this.deniedTabTitle;
    if (this.isSubmitted) return this.submittedTabTitle;
    if (this.isInSupervisorReview) return this.supervisorReviewTabTitle;
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
    ).filter((req) => req.text);
  }

  get requirementsAlmostMet(): OpportunityRequirement[] {
    const {
      record,
      isIneligible,
      config: { ineligibleCriteriaCopy, strictlyIneligibleCriteriaCopy },
    } = this;
    if (!record) return [];

    return hydrateUntypedCriteria(
      record.ineligibleCriteria,
      isIneligible ? pickBy(ineligibleCriteriaCopy, (_, key) => !(key in strictlyIneligibleCriteriaCopy)) : ineligibleCriteriaCopy,
      this,
      this.criteriaFormatters,
    );
  }

  get requirementsNotMet(): OpportunityRequirement[] {
    const {
      record,
      isIneligible,
      config: { strictlyIneligibleCriteriaCopy },
    } = this;
    if (!isIneligible || !record) return [];


    return hydrateUntypedCriteria(
      record.ineligibleCriteria,
      strictlyIneligibleCriteriaCopy,
      this,
      this.criteriaFormatters,
    ).filter((req) => req.text);
  }

  get nonOMSRequirements(): OpportunityRequirement[] {
    const {
      config: { nonOmsCriteria },
    } = this;

    // Because these criteria aren't associated with a referral record, they don't have reasons
    return nonOmsCriteria
      .map((req) =>
        hydrateReq({
          raw: req,
          opportunity: this,
          formatters: this.criteriaFormatters,
        }),
      )
      .filter((req) => req.text);
  }

  /**
   * Returns true if the opportunity record is almost eligible (isAlmostEligible is true).
   */
  get almostEligible(): boolean {
    return this.record.isAlmostEligible;
  }

  /**
   * Returns true if the opportunity record is ineligible (isEligible is false) and not almost eligible
   */
  get isIneligible(): boolean {
    return !this.record.isEligible && !this.almostEligible;
  }

  get denied(): boolean {
    return !!this.denial;
  }

  get sentryTrackingId(): string {
    return this.record?.opportunityPseudonymizedId ?? null;
  }

  get eligibilityDate(): Date | undefined {
    return this.record?.eligibleDate ?? undefined;
  }

  /**
   * Returns the manual max snooze length in days based on the given reasons and their
   * configured max snooze lengths.
   *
   * Undefined if auto snooze is enabled for this opportunity.
   * Undefined if an indefinite snooze reason is selected.
   * Otherwise, returns the maximum max snooze length across the selected reasons,
   * cappedy by the person's release date.
   *
   */
  maxManualSnoozeDays(selectedReasons: string[]): number | undefined {
    // Return undefined for auto snooze.
    if (!this.config.snooze?.maxSnoozeDays) return undefined;

    const selectedMaxSnoozeDays = Object.values(
      pick(this.config.maxSnoozeDaysByDenialReason, selectedReasons),
    );

    if (selectedMaxSnoozeDays.some((maxSnooze) => maxSnooze === undefined))
      // Return undefined if indefinite snooze reason is selected.
      return undefined;
    else {
      // Calculate the maximum max snooze of all selected reasons
      // OR if no reasons are selected, use the default config max.
      const calculatedMaxSnoozeDays =
        selectedReasons.length > 0
          ? Math.max(
              ...selectedMaxSnoozeDays.filter(
                (maxSnooze) => maxSnooze !== undefined,
              ),
            )
          : this.config.snooze?.maxSnoozeDays;

      // Cap the max snooze length to the person's release date.
      return Math.min(
        getPersonDaysToRelease(this.person),
        calculatedMaxSnoozeDays,
      );
    }
  }

  /**
   * Returns the default snooze length in days based on the given reasons. Returns
   * undefined if auto snooze is enabled for this opportunity.
   */
  defaultManualSnoozeDays(denialReasons: string[]): number | undefined {
    const configuredDefaultSnoozeDays = this.config.snooze?.defaultSnoozeDays;
    if (configuredDefaultSnoozeDays === undefined) return;

    const maxManualSnoozeDays = this.maxManualSnoozeDays(denialReasons);
    if (maxManualSnoozeDays === undefined) return configuredDefaultSnoozeDays;

    return Math.min(maxManualSnoozeDays, configuredDefaultSnoozeDays);
  }

  /**
   * The history of officer actions requiring supervisor approval that have been
   * taken on an opportunity .
   */
  get actionHistory(): OfficerAction[] | undefined {
    return this.updates?.actionHistory;
  }

  get latestAction() {
    return this.actionHistory?.at(-1);
  }

  /**
   * Push a new officer action requiring supervisor approval onto the action history
   * timeline.
   */
  async setOfficerAction(
    officerActionParams: OfficerApprovalAction | OfficerDenialAction,
  ): Promise<void> {
    const officerAction = {
      date: Timestamp.fromDate(new Date()),
      by: this.userName,
      isStale: false,
      ...officerActionParams,
    };
    const updatedActionHistory = (this.actionHistory ?? []).concat(
      officerAction,
    );

    const actionMetadata: OpportunityApprovalActionsMetadata["action"] =
      officerAction.type === "DENIAL"
        ? {
            type: officerAction.type,
            actionPlan: officerAction.actionPlan,
            requestedDenialReasons: officerAction.denialReasons,
          }
        : { type: officerAction.type, additionalNotes: officerAction.notes };

    const originalStatus = this.reviewStatus;

    await this.rootStore.firestoreStore.updateOpportunityActionHistory(
      this,
      updatedActionHistory,
    );

    this.rootStore.analyticsStore.trackOpportunityApprovalActions({
      opportunityType: this.type,
      opportunityId: this.sentryTrackingId,
      staffId: this.rootStore.userStore.userPseudoId ?? this.currentUserEmail,
      justiceInvolvedPersonId: this.person.pseudonymizedId,
      action: actionMetadata,
      currentStatus: originalStatus,
      subsequentStatus: this.reviewStatus,
    });
  }

  /**
   * Mark the latest officer action as stale. A stale action should not be relied upon
   * when determining client status, as staleness signifies that some other action has
   * broken the client out of the supervisor approval cycle. Some examples of when an
   * officer action should be marked stale are:
   *   - when a client is successfully snoozed
   *   - when an indefinite snooze is denied
   */
  async markActionHistoryStale(): Promise<void> {
    if (this.actionHistory && this.latestAction && !this.latestAction.isStale) {
      const originalStatus = this.reviewStatus;

      const updatedOfficerAction = {
        ...this.latestAction,
        isStale: true,
      };

      const updatedActionHistory = this.actionHistory
        .slice(0, -1)
        .concat(updatedOfficerAction);

      await this.rootStore.firestoreStore.updateOpportunityActionHistory(
        this,
        updatedActionHistory,
      );

      this.rootStore.analyticsStore.trackOpportunityApprovalActions({
        opportunityType: this.type,
        opportunityId: this.sentryTrackingId,
        staffId: this.rootStore.userStore.userPseudoId ?? this.currentUserEmail,
        justiceInvolvedPersonId: this.person.pseudonymizedId,
        currentStatus: originalStatus,
        subsequentStatus: this.reviewStatus,
      });
    }
  }

  /**
   * Clears all actions requiring supervisor approval.
   */
  async deleteActionHistory(): Promise<void> {
    const originalStatus = this.reviewStatus;

    await this.rootStore.firestoreStore.deleteOpportunityActionHistory(this);
    this.rootStore.analyticsStore.trackOpportunityApprovalActions({
      opportunityType: this.type,
      opportunityId: this.sentryTrackingId,
      staffId: this.rootStore.userStore.userPseudoId ?? this.currentUserEmail,
      justiceInvolvedPersonId: this.person.pseudonymizedId,
      currentStatus: originalStatus,
      subsequentStatus: this.reviewStatus,
    });
  }

  /**
   * Set the supervisor's `DENIAL` or `APPROVAL` of the latest officer action.
   */
  async setSupervisorResponse(
    supervisorResponseParams: Omit<SupervisorAction, "date" | "by">,
  ): Promise<void> {
    const supervisorResponse = {
      date: Timestamp.fromDate(new Date()),
      by: this.userName,
      ...supervisorResponseParams,
    };

    if (!this.actionHistory || !this.latestAction) {
      throw new Error(
        `Supervisor with id [${this.rootStore.userStore.userPseudoId}] cannot respond when there is no existing Action History for client with id [${this.person.pseudonymizedId}]`,
      );
    }

    const actionMetadata: OpportunityApprovalActionsMetadata["action"] = {
      type: this.latestAction.type,
      supervisorResponseType: supervisorResponse.type,
      revisionRequest: supervisorResponse.revisionRequest,
    };

    const originalStatus = this.reviewStatus;

    const updatedOfficerAction = {
      ...this.latestAction,
      supervisorResponse,
    };

    const updatedActionHistory = this.actionHistory
      .slice(0, -1)
      .concat(updatedOfficerAction);

    await this.rootStore.firestoreStore.updateOpportunityActionHistory(
      this,
      updatedActionHistory,
    );

    this.rootStore.analyticsStore.trackOpportunityApprovalActions({
      opportunityType: this.type,
      opportunityId: this.sentryTrackingId,
      staffId: this.rootStore.userStore.userPseudoId ?? this.currentUserEmail,
      justiceInvolvedPersonId: this.person.pseudonymizedId,
      action: actionMetadata,
      currentStatus: originalStatus,
      subsequentStatus: this.reviewStatus,
    });
  }

  get userName(): string {
    // We'll fall back to the user's email
    return this.rootStore.userStore.userFullName ?? this.currentUserEmail;
  }

  get denialViewPrompt(): string {
    return this.config.isAlert
      ? `Please select the reason(s) ${this.person?.displayPreferredName} should be overridden:`
      : `Which of the following requirements has ${this.person?.displayPreferredName} not met${this.instanceDetails ? ` [${this.instanceDetails}]` : ""}?`;
  }

  get snoozeReviewStatusMessage(): string {
    return this.config.snoozeReviewStatusMessage;
  }

  get grantReviewStatusMessage(): string {
    return this.config.grantReviewStatusMessage;
  }

  // ===============================
  // properties below this line are stubs and in most cases should be overridden
  // in a subclass. Given their triviality they are not annotated by MobX either,
  // so subclasses can use normal annotations instead of having to use `override`.
  // ===============================

  get indefiniteDenialReasons(): DenialReasonsMap {
    return this.config.indefiniteDenialReasons;
  }

  get formVariant(): FormVariant | undefined {
    return undefined;
  }

  get eligibleStatusMessage(): string | undefined {
    return undefined;
  }

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

  // Used to implement custom logic for the palette to use for this opportunity
  get customStatusPalette(): StatusPalette | undefined {
    return undefined;
  }

  // Used to get opportunities to be concurrently snoozed when the primary opportunity is snoozed
  get snoozeCompanionOpportunities() {
    if (!this.rootStore.userStore.activeFeatureVariants.snoozeCompanions) {
      return [];
    }

    const snoozeCompanionOpportunityTypes =
      this.config.snoozeCompanionOpportunityTypes ?? [];
    return this.person.flattenedOpportunities.filter((opp) =>
      snoozeCompanionOpportunityTypes.includes(opp.type),
    );
  }

  // Used to determine whether or not an included opportunity requires a "Revert Changes" confirmation step
  requiresRevertConfirmation = false;

  // Returns custom copy for the "Revert Changes" confirmation step
  revertConfirmationCopy: RevertConfirmationCopy = {
    headerText: "Are you sure you want to revert changes?",
    descriptionText: "This action cannot be undone.",
  };

  // TODO(#9952): Clean up custom behavior related to supervisor approvals. Remove this handler.
  // Used to execute additional opportunity-specific actions when the "Revert Changes" confirmation is triggered
  async handleAdditionalUndoActions(): Promise<void> {
    return undefined;
  }

  // Used to supplement the default revert link display logic and show the "Revert Changes" link based on opportunity-specific
  // custom logic when default conditions fail
  get showRevertLinkFallback(): boolean {
    return false;
  }

  get caseNoteHeaders() {
    return this.config.caseNoteHeaders;
  }

  get caseNotesTitle() {
    return this.config.caseNotesTitle;
  }

  eligibilityStatusLabel(includeReasons?: boolean): string | null {
    const {
      almostEligible,
      almostEligibleStatusMessage,
      eligibleStatusMessage,
      defaultEligibility,
      denial,
      isSubmitted,
      config: { isAlert, submittedTabTitle },
      isInSnoozeReview,
      isInGrantReview,
      grantReviewStatusMessage,
      snoozeReviewStatusMessage,
      isIndefinitelySnoozed,
    } = this;

    if (!isHydrated(this)) return null;

    if (this.isIneligible) return "Ineligible";

    if (denial?.reasons.length) {
      const statusText = isAlert
        ? "Override"
        : `${isIndefinitelySnoozed ? "Indefinitely" : "Currently"} ineligible`;
      const withReasons = includeReasons
        ? ` (${denial.reasons.join(", ")})`
        : "";

      return `${statusText}${withReasons}`;
    }

    if (isSubmitted) {
      return submittedTabTitle;
    }

    if (almostEligible) {
      return includeReasons && almostEligibleStatusMessage
        ? almostEligibleStatusMessage
        : "Almost eligible";
    }

    if (isInSnoozeReview) {
      return snoozeReviewStatusMessage;
    }

    if (isInGrantReview) {
      return grantReviewStatusMessage;
    }

    if (defaultEligibility === "MAYBE") return "May be eligible";

    return eligibleStatusMessage ?? "Eligible";
  }
}
