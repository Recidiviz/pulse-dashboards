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

import React from "react";

import { ProviderDetails } from "../../../hooks/housingApplication";
import { PROVIDER_SETTINGS_TAB, ProviderSettingsTab } from "../constants";
import { HousingProviderSettingsTab } from "../HousingProviderSettingsTab";
import { LocationsTab } from "../LocationsTab";
import { PersonalDetailsTab } from "../PersonalDetailsTab";

export interface ActiveProviderSettingsTabProps {
  activeTab: ProviderSettingsTab;
  provider: ProviderDetails;
}

export const ActiveProviderSettingsTab: React.FC<
  ActiveProviderSettingsTabProps
> = ({ activeTab, provider }) => {
  switch (activeTab) {
    case PROVIDER_SETTINGS_TAB.HOUSING_PROVIDER:
      return <HousingProviderSettingsTab provider={provider} />;
    case PROVIDER_SETTINGS_TAB.LOCATIONS:
      return <LocationsTab locations={provider.locations} />;
    case PROVIDER_SETTINGS_TAB.PERSONAL:
      return <PersonalDetailsTab provider={provider} />;
    default:
      return null;
  }
};
