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

import { FieldValue } from "@google-cloud/firestore";
import { deleteField, serverTimestamp } from "firebase/firestore";
import { action, computed, makeObservable, runInAction, toJS } from "mobx";

import { OpportunityType } from "~datatypes";
import { HydrationState } from "~hydration-utils";

import { OpportunityFormComponentName } from "../../../core/WorkflowsLayouts";
import {
  FormUpdate,
  OpportunityUpdateWithForm,
  UpdateLog,
} from "../../../FirestoreStore";
import { RootStore } from "../../../RootStore";
import { DocumentSubscription } from "../../subscriptions";
import { FormUpdateSubscription } from "../../subscriptions/FormUpdateSubscription";
import { OpportunityBase } from "../OpportunityBase";

export type PrefilledDataTransformer<FormInformation> =
  () => Partial<FormInformation>;

/**
 * Implements functionality shared by all Opportunities with form automation.
 * While this is an abstract class, it provides stubs rather than abstract properties, whenever possible,
 * to facilitate incremental development of new Opportunities.
 */

export class FormBase<
  FormDisplayType,
  OpportunityModel extends OpportunityBase<
    any,
    any,
    OpportunityUpdateWithForm<any>
  > = OpportunityBase<any, any, OpportunityUpdateWithForm<any>>,
> {
  protected rootStore: RootStore;
  person: OpportunityModel["person"];

  opportunity: OpportunityModel;

  updatesSubscription: DocumentSubscription<FormUpdate<FormDisplayType>>;

  formIsReverting = false; // Reactive inputs will observe this and cancel their updates

  constructor(opportunity: OpportunityModel, rootStore: RootStore) {
    this.opportunity = opportunity;
    this.person = opportunity.person;
    this.rootStore = rootStore;

    makeObservable(this, {
      draftData: computed,
      formData: computed,
      formLastUpdated: computed,
      prefilledData: computed,
      currentUserEmail: computed,
      formIsDownloading: computed,
      formIsReverting: true,
      revert: action,
      markDownloading: action,
      hydrate: action,
      hydrationState: computed,
    });

    this.updatesSubscription = new FormUpdateSubscription<
      FormUpdate<FormDisplayType>
    >(this.rootStore.firestoreStore, this.person.recordId, this.formId);
  }

  get currentUserEmail(): string | undefined {
    return this.rootStore.workflowsStore.currentUserEmail;
  }

  get type(): OpportunityType {
    return this.opportunity.type;
  }

  get updates(): FormUpdate<FormDisplayType> | undefined {
    return this.updatesSubscription.data;
  }

  get sentryTrackingId(): string {
    return this.opportunity.sentryTrackingId;
  }

  get formLastUpdated(): UpdateLog | undefined {
    return this.updates?.updated;
  }

  get draftData(): Partial<FormDisplayType> {
    return this.updates?.data ?? {};
  }

  get prefilledData(): Partial<FormDisplayType> {
    if (this.opportunity.record) {
      return this.prefilledDataTransformer();
    }

    return {};
  }

  get formData(): Partial<FormDisplayType> {
    return { ...toJS(this.prefilledData), ...toJS(this.draftData) };
  }

  trackViewed(): void {
    this.rootStore.analyticsStore.trackReferralFormViewed({
      justiceInvolvedPersonId: this.person.pseudonymizedId,
      opportunityType: this.type,
      opportunityId: this.sentryTrackingId,
    });
  }

  get formIsDownloading(): boolean {
    return this.rootStore.workflowsStore.formIsDownloading;
  }

  set formIsDownloading(value: boolean) {
    this.rootStore.workflowsStore.formIsDownloading = value;
  }

  markDownloading(): void {
    this.formIsDownloading = true;
  }

  async recordSuccessfulDownload(): Promise<string | undefined> {
    this.opportunity?.setCompletedIfEligible();
    this.rootStore.analyticsStore.trackReferralFormDownloaded({
      justiceInvolvedPersonId: this.person.pseudonymizedId,
      opportunityType: this.type,
      opportunityId: this.sentryTrackingId,
    });

    // return early for IA ED due to their customized opportunity submission flow
    if (this.opportunity.type === "usIaEarlyDischarge") {
      return;
    }
    // only automatically mark an opportunity as submitted upon form download if there
    // are no subcategories of submitted, because the user should manually pick
    // a subcategory of the submitted status if there exist subcategories
    if (!this.opportunity.submittedSubcategories)
      return this.opportunity?.markSubmittedAndGenerateToast();
  }

  recordEdit(): void {
    this.rootStore.analyticsStore.trackReferralFormEdited({
      justiceInvolvedPersonId: this.person.pseudonymizedId,
      opportunityType: this.type,
      opportunityId: this.sentryTrackingId,
    });
  }

  recordFirstEdit(): void {
    this.rootStore.analyticsStore.trackReferralFormFirstEdited({
      justiceInvolvedPersonId: this.person.pseudonymizedId,
      opportunityType: this.type,
      opportunityId: this.sentryTrackingId,
    });
  }

  recordStatusInProgress(): void {
    this.rootStore.analyticsStore.trackSetOpportunityStatus({
      justiceInvolvedPersonId: this.person.pseudonymizedId,
      opportunityType: this.type,
      status: "IN_PROGRESS",
      opportunityId: this.sentryTrackingId,
    });
  }

  // Records when  a non-referral form is downloaded, for example Approved Visitors forms
  recordDirectDownloadFormDownloaded(): void {
    this.rootStore.analyticsStore.trackDirectDownloadFormDownloaded({
      justiceInvolvedPersonId: this.opportunity.person.pseudonymizedId,
      opportunityType: this.type,
      opportunityId: this.sentryTrackingId,
      formId: this.formId,
    });
  }

  /**
   * Clear all drafted data from the form.
   */
  async revert() {
    this.formIsReverting = true;
    await this.waitForPendingUpdates();

    await this.rootStore.firestoreStore.updateForm(
      this.opportunity.person.recordId,
      { data: deleteField() },
      this.formId,
    );
    runInAction(() => {
      this.formIsReverting = false;
    });
  }

  /**
   * Clear draft data for a specific field in the form.
   */
  async clearDraftData(name: string) {
    const { person } = this.opportunity;

    const update = {
      referralForm: {
        updated: {
          by: this.currentUserEmail,
          date: serverTimestamp(),
        },
        data: { [name]: deleteField() },
      },
    };

    await this.rootStore.firestoreStore.updateForm(
      person.recordId,
      update.referralForm,
      this.formId,
    );

    this.recordEdit();
  }

  /**
   * Update drafted data for the form.
   */
  async updateDraftData(
    name: string,
    value: FieldValue | string | number | boolean,
  ) {
    const { person } = this.opportunity;

    const update = {
      referralForm: {
        updated: {
          by: this.currentUserEmail,
          date: serverTimestamp(),
        },
        data: { [name]: value },
      },
    };
    const isFirstEdit = !this.formLastUpdated;

    await this.rootStore.firestoreStore.updateForm(
      person.recordId,
      update.referralForm,
      this.formId,
    );

    this.recordEdit();
    if (isFirstEdit) {
      this.recordFirstEdit();
    }
    if (this.opportunity.reviewStatus === "PENDING") {
      this.recordStatusInProgress();
    }
  }

  waitForPendingUpdates(): Promise<void> {
    // This waits for all firestore updates (not just ours) but doing it this way
    // avoids fussy bookkeeping and shouldn't differ in practice.
    return this.rootStore.firestoreStore.waitForPendingUpdates();
  }

  /**
   * Returns the evaluated hydration state.
   */
  get hydrationState(): HydrationState {
    return this.updatesSubscription.hydrationState;
  }

  /**
   * Initiates hydration for subscriptions.
   */
  hydrate(): void {
    this.updatesSubscription.hydrate();
  }

  get hydratableSubscription(): DocumentSubscription<
    FormUpdate<FormDisplayType>
  > {
    return this.updatesSubscription;
  }

  /**
   * Used to distinguish form update documents in Firestore. Typically formatted as
   * {formName}-{formInstance}, with formInstance varying between "common" (for shared
   * forms) or the opportunity type (for distinct forms).
   */
  get formId(): string {
    const formInstance = this.shareFormUpdates ? "common" : this.type;
    return `${this.formType}-${formInstance}`;
  }

  /**
   * Whether the form updates should be shared across opportunities that use this
   * form type.
   */
  get shareFormUpdates(): boolean {
    return false;
  }

  // ==========================
  // properties below this line are stubs and should usually be replaced by the subclass.
  // as such they are not annotated with MobX so subclasses can use standard annotations
  // instead of "override"
  // ==========================

  navigateToFormText = "Navigate to form";

  allowRevert = true;

  get downloadText(): string {
    return "";
  }

  get formType(): string {
    return "";
  }

  get formContents(): OpportunityFormComponentName {
    // @ts-ignore
    return undefined;
  }

  prefilledDataTransformer(): Partial<FormDisplayType> {
    return this.opportunity.record?.formInformation ?? {};
  }
}
