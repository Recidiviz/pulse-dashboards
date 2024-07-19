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
import { SortParamObject } from "../../OpportunityConfigs";
import { DenialReasonsMap, OpportunityTabGroups } from "../../types";
import { SnoozeConfiguration } from "../modules/SnoozeConfiguration/interfaces/ISnoozeConfiguration";
import { CriteriaCopy } from "./shared";
export interface OpportunityConfiguration {
  systemType: SystemId;
  stateCode: TenantId;
  urlSection: string;
  priority: string;
  featureVariant?: FeatureVariant;
  inverseFeatureVariant?: FeatureVariant;
  label: string;
  firestoreCollection: string;
  snooze?: SnoozeConfiguration;
  tabGroups: Readonly<Partial<OpportunityTabGroups>>;
  initialHeader?: string;
  callToAction: string;
  subheading?: string;
  eligibilityTextForCount: (count: number) => string;
  denialButtonText?: string;
  eligibilityDateText?: string;
  hideDenialRevert?: boolean;
  isEnabled: boolean;
  methodologyUrl: string;
  denialReasons: DenialReasonsMap;
  sidebarComponents: string[];
  isAlert?: boolean;
  tooltipEligibilityText?: string;
  eligibleCriteriaCopy: CriteriaCopy;
  ineligibleCriteriaCopy: CriteriaCopy;
  compareBy: SortParamObject<string>[] | undefined;
}
