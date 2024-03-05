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
import { SystemId } from "../../../../core/models/types";
import { FeatureVariant, TenantId } from "../../../../RootStore/types";
import { Client } from "../../../Client";
import { Resident } from "../../../Resident";
import { OpportunityBase } from "../../OpportunityBase";
import { Opportunity, OpportunityTab } from "../../types";
import { CountFormatter } from "../../utils/generateHeadersUtils";
import { SnoozeConfiguration } from "../modules/SnoozeConfiguration/interfaces/ISnoozeConfiguration";

export type OpportunityHeadersBaseType = {
  opportunityText: string;
  callToAction: string;
};

type OpportunityHeadersWithEligibilityTextType = OpportunityHeadersBaseType & {
  eligibilityText: string;
  fullText?: never;
};

type OpportunityHeadersWithFullTextType = OpportunityHeadersBaseType & {
  fullText: string;
  eligibilityText?: never;
};

export type OpportunityHydratedHeader =
  | OpportunityHeadersWithEligibilityTextType
  | OpportunityHeadersWithFullTextType;

type ExtractPersonType<T> =
  T extends OpportunityBase<infer P, any, any> ? P : never;

type ClientSystemType<T> = T extends Client
  ? Extract<SystemId, "SUPERVISION">
  : never;

type ResidentSystemType<T> = T extends Resident
  ? Extract<SystemId, "INCARCERATION">
  : never;

type SystemType<T> = ClientSystemType<T> | ResidentSystemType<T>;

export interface ILocalOpportunityConfiguration<
  OpportunityVariant extends Opportunity,
> {
  systemType: SystemType<ExtractPersonType<OpportunityVariant>>;
  stateCode: TenantId;
  urlSection: string;
  featureVariant?: FeatureVariant;
  inverseFeatureVariant?: FeatureVariant;
  label: string;
  firestoreCollection: string;
  snooze?: SnoozeConfiguration;
  tabOrder?: ReadonlyArray<OpportunityTab>;
  initialHeader?: string;
  hydratedHeader: (formattedCount: CountFormatter) => OpportunityHydratedHeader;
  denialButtonText?: string;
  eligibilityDateText?: string;
  hideDenialRevert?: boolean;
  // denialReasons: DenialReasonsMap;
}
