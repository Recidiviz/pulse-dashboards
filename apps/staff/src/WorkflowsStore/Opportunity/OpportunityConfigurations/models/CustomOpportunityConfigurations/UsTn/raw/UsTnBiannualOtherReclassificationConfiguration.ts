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

export const usTnBiannualOtherReclassificationConfiguration: IApiOpportunityConfiguration =
  {
    ...usTnUntrackedEligibilityConfigBase,
    displayName: "[2026 Pilot] Bi-Annual/Other",
    firestoreCollection: "US_TN-custodyLevelDowngrade2026PolicyReferrals",
    dynamicEligibilityText:
      "[person|people] have paperwork in progress for a bi-annual or other reclassification",
    urlSection: "biannual",
    // Place at the bottom
    homepagePosition: 21,
  };

export const usTnBiannualOtherReclassificationV2Configuration: IApiOpportunityConfiguration =
  {
    ...usTnBiannualOtherReclassificationConfiguration,
    featureVariant: "usTnRcafV2",
    displayName: "[2026 Pilot V2] Bi-Annual/Other",
    firestoreCollection: "US_TN-custodyLevelDowngrade2026PolicyV2Referrals",
    urlSection: "biannualV2",
    // Place at the bottom
    homepagePosition: 24,
  };
