// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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

import { IApiOpportunityConfiguration } from "../../../../interfaces";
import { usTnUntrackedEligibilityConfigBase } from "../utils";

export const usTnSeriousMisconductUpgradeConfiguration: IApiOpportunityConfiguration =
  {
    ...usTnUntrackedEligibilityConfigBase,
    displayName:
      "[2026 Pilot] Special Reclassification: Upgrade for Serious Misconduct",
    firestoreCollection: "US_TN-custodyLevelDowngrade2026PolicyReferrals",
    dynamicEligibilityText:
      "[person|people] have paperwork in progress for an upgrade due to serious misconduct",
    urlSection: "specialUpgradeMisconduct",
    // Place at the bottom
    homepagePosition: 22,
  };

export const usTnSeriousMisconductUpgradeV2Configuration: IApiOpportunityConfiguration =
  {
    ...usTnSeriousMisconductUpgradeConfiguration,
    featureVariant: "usTnRcafV2",
    displayName:
      "[2026 Pilot V2] Special Reclassification: Upgrade for Serious Misconduct",
    firestoreCollection: "US_TN-custodyLevelDowngrade2026PolicyV2Referrals",
    urlSection: "specialUpgradeMisconductV2",
    // Place at the bottom
    homepagePosition: 25,
  };
