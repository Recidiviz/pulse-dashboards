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
import { computed, makeObservable, toJS } from "mobx";

import { OpportunityUpdateWithForm, UpdateLog } from "../../firestore";
import { Client } from "../Client";
import { TransformFunction } from "../subscriptions";
import { OpportunityBase } from "./OpportunityBase";
import { BaseForm, OpportunityType } from "./types";

export type FormDataTransformer<
  ReferralRecord extends DocumentData,
  FormToDisplay
> = (client: Client, record: ReferralRecord) => Partial<FormToDisplay>;

/**
 * Implements functionality shared by all Opportunities with form automation.
 * While this is an abstract class, it provides stubs rather than abstract properties, whenever possible,
 * to facilitate incremental development of new Opportunities.
 */
export abstract class OpportunityWithFormBase<
    ReferralRecord extends DocumentData,
    FormDisplayType
  >
  extends OpportunityBase<
    ReferralRecord,
    OpportunityUpdateWithForm<FormDisplayType>
  >
  implements BaseForm<FormDisplayType> {
  constructor(
    client: Client,
    type: OpportunityType,
    transformReferral?: TransformFunction<ReferralRecord>
  ) {
    super(client, type, transformReferral);

    makeObservable(this, {
      draftData: computed,
      formData: computed,
      formLastUpdated: computed,
      prefilledData: computed,
    });
  }

  get formLastUpdated(): UpdateLog | undefined {
    return this.updates?.referralForm?.updated;
  }

  get draftData(): Partial<FormDisplayType> {
    return this.updates?.referralForm?.data ?? {};
  }

  get prefilledData(): Partial<FormDisplayType> {
    if (this.record) {
      return this.formDataTransformer(this.client, this.record);
    }

    return {};
  }

  get formData(): Partial<FormDisplayType> {
    return { ...toJS(this.prefilledData), ...toJS(this.draftData) };
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

  formDataTransformer: FormDataTransformer<ReferralRecord, FormDisplayType> = (
    client,
    record
  ) => record.formInformation;
}
