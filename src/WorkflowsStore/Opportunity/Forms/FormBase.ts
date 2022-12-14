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

import { action, computed, makeObservable, toJS } from "mobx";

import {
  trackReferralFormPrinted,
  trackReferralFormViewed,
} from "../../../analytics";
import { OpportunityUpdateWithForm, UpdateLog } from "../../../firestore";
import { RootStore } from "../../../RootStore";
import { OpportunityBase } from "../OpportunityBase";
import { OpportunityType } from "../types";

export type PrefilledDataTransformer<
  FormInformation
> = () => Partial<FormInformation>;

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
  > = OpportunityBase<any, any, OpportunityUpdateWithForm<any>>
> {
  protected rootStore: RootStore;

  person: OpportunityModel["person"];

  opportunity: OpportunityModel;

  type: OpportunityType;

  constructor(
    type: OpportunityType,
    opportunity: OpportunityModel,
    rootStore: RootStore
  ) {
    this.type = type;
    this.opportunity = opportunity;
    this.person = opportunity.person;
    this.rootStore = rootStore;

    makeObservable(this, {
      draftData: computed,
      formData: computed,
      formLastUpdated: computed,
      prefilledData: computed,
      formIsPrinting: computed,
      print: action,
    });
  }

  get formLastUpdated(): UpdateLog | undefined {
    return this.opportunity.updates?.referralForm?.updated;
  }

  get draftData(): Partial<FormDisplayType> {
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
    trackReferralFormViewed({
      justiceInvolvedPersonId: this.person.pseudonymizedId,
      opportunityType: this.type,
    });
  }

  get formIsPrinting(): boolean {
    return this.rootStore.workflowsStore.formIsPrinting;
  }

  set formIsPrinting(value: boolean) {
    this.rootStore.workflowsStore.formIsPrinting = value;
  }

  print(): void {
    this.opportunity?.setCompletedIfEligible();

    this.formIsPrinting = true;

    trackReferralFormPrinted({
      justiceInvolvedPersonId: this.person.pseudonymizedId,
      opportunityType: this.type,
    });
  }

  // ==========================
  // properties below this line are stubs and should usually be replaced by the subclass.
  // as such they are not annotated with MobX so subclasses can use standard annotations
  // instead of "override"
  // ==========================

  navigateToFormText = "Navigate to form";

  // eslint-disable-next-line class-methods-use-this
  get printText(): string {
    return "";
  }

  prefilledDataTransformer(): Partial<FormDisplayType> {
    return this.opportunity.record?.formInformation ?? {};
  }
}
