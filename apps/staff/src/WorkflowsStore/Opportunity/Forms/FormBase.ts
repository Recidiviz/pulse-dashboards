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

import { FieldValue } from "@google-cloud/firestore";
import { deleteField, serverTimestamp } from "firebase/firestore";
import { action, computed, makeObservable, toJS } from "mobx";

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
import { OpportunityType } from "../OpportunityType/types";

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

  updatesSubscription?: DocumentSubscription<FormUpdate<FormDisplayType>>;

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
      markDownloading: action,
      hydrate: action,
      hydrationState: computed,
    });

    if (this.shouldUseFormUpdates) {
      this.updatesSubscription = new FormUpdateSubscription<
        FormUpdate<FormDisplayType>
      >(this.rootStore.firestoreStore, this.person.recordId, this.formId);
    }
  }

  get currentUserEmail(): string | undefined {
    return this.rootStore.workflowsStore.currentUserEmail;
  }

  get type(): OpportunityType {
    return this.opportunity.type;
  }

  get updates(): FormUpdate<FormDisplayType> | undefined {
    if (!this.shouldUseFormUpdates) {
      return undefined;
    }
    return this.updatesSubscription?.data;
  }

  get formLastUpdated(): UpdateLog | undefined {
    if (this.shouldUseFormUpdates) {
      return this.updates?.updated;
    }
    return this.opportunity.updates?.referralForm?.updated;
  }

  get draftData(): Partial<FormDisplayType> {
    if (this.shouldUseFormUpdates) {
      return this.updates?.data ?? {};
    }
    return this.opportunity.updates?.referralForm?.data ?? {};
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

  recordSuccessfulDownload(): void {
    this.opportunity?.setCompletedIfEligible();
    this.rootStore.analyticsStore.trackReferralFormDownloaded({
      justiceInvolvedPersonId: this.person.pseudonymizedId,
      opportunityType: this.type,
    });
  }

  recordEdit(): void {
    this.rootStore.analyticsStore.trackReferralFormEdited({
      justiceInvolvedPersonId: this.person.pseudonymizedId,
      opportunityType: this.type,
    });
  }

  recordFirstEdit(): void {
    this.rootStore.analyticsStore.trackReferralFormFirstEdited({
      justiceInvolvedPersonId: this.person.pseudonymizedId,
      opportunityType: this.type,
    });
  }

  recordStatusInProgress(): void {
    this.rootStore.analyticsStore.trackSetOpportunityStatus({
      justiceInvolvedPersonId: this.person.pseudonymizedId,
      opportunityType: this.type,
      status: "IN_PROGRESS",
    });
  }

  /**
   * Clear all drafted data from the form.
   */
  async clearDraftData() {
    const { person } = this.opportunity;
    if (this.shouldUseFormUpdates) {
      await this.rootStore.firestoreStore.updateForm(
        person.recordId,
        { data: deleteField() },
        this.formId,
      );
    } else {
      await this.rootStore.firestoreStore.updateOpportunity(
        this.type,
        person.recordId,
        {
          referralForm: deleteField(),
        },
      );
    }
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

    if (this.shouldUseFormUpdates) {
      await this.rootStore.firestoreStore.updateForm(
        person.recordId,
        update.referralForm,
        this.formId,
      );
    } else {
      await this.rootStore.firestoreStore.updateOpportunity(
        this.type,
        person.recordId,
        update,
      );
    }

    this.recordEdit();
    if (isFirstEdit) {
      this.recordFirstEdit();
    }
    if (this.opportunity.reviewStatus === "PENDING") {
      this.recordStatusInProgress();
    }
  }

  /**
   * Returns the evaluated hydration state.
   */
  get hydrationState(): HydrationState {
    if (this.shouldUseFormUpdates && this.updatesSubscription) {
      return this.updatesSubscription.hydrationState;
    } else {
      return this.opportunity.updatesSubscription.hydrationState;
    }
  }

  /**
   * Initiates hydration for subscriptions.
   */
  hydrate(): void {
    if (this.shouldUseFormUpdates && this.updatesSubscription) {
      this.updatesSubscription.hydrate();
    }
  }

  get hydratableSubscription():
    | DocumentSubscription<FormUpdate<FormDisplayType>>
    | undefined {
    return this.updatesSubscription;
  }

  // ==========================
  // properties below this line are stubs and should usually be replaced by the subclass.
  // as such they are not annotated with MobX so subclasses can use standard annotations
  // instead of "override"
  // ==========================

  navigateToFormText = "Navigate to form";

  allowRevert = true;

  // eslint-disable-next-line class-methods-use-this
  get downloadText(): string {
    return "";
  }

  /**
   * Used to distinguish form update documents in Firestore. Typically formatted as
   * {formName}-{formInstance}, with formInstance varying between "common" (for shared
   * forms) or the opportunity type (for distinct forms).
   */
  get formId(): string {
    return "";
  }

  /**
   * Only use form updates implementation for FV users and MI RH workflows.
   */
  get shouldUseFormUpdates(): boolean {
    return false;
  }

  // eslint-disable-next-line class-methods-use-this
  get formContents(): OpportunityFormComponentName {
    // @ts-ignore
    return undefined;
  }

  prefilledDataTransformer(): Partial<FormDisplayType> {
    return this.opportunity.record?.formInformation ?? {};
  }
}
