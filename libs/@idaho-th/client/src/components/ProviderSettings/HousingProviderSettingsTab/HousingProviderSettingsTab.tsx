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

import React, { useState } from "react";

import { ProviderDetails } from "../../../hooks/housingApplication";
import { useUpdateHousingProvider } from "../../../hooks/providerSettings";
import { FieldRow, FieldStyled } from "../FieldRow";
import { SettingsSection } from "../SettingsSection";

export interface HousingProviderSettingsTabProps {
  provider: ProviderDetails;
}

/**
 * The organization half of settings. The mutation carries no organization id,
 * so these edits always land on the organization the portal is acting as.
 */
export const HousingProviderSettingsTab: React.FC<
  HousingProviderSettingsTabProps
> = ({ provider }) => {
  const [isEditing, setIsEditing] = useState(false);
  const updateHousingProvider = useUpdateHousingProvider();

  const handleSave = (housingProviderName: string) => {
    setIsEditing(false);
    updateHousingProvider.mutate({ housingProviderName });
  };

  return (
    <SettingsSection title="Provider settings">
      <FieldStyled.FieldList>
        <FieldRow
          fieldKey="housingProviderName"
          label="Provider name"
          value={provider.housingProviderName}
          editable
          isEditing={isEditing}
          isSaving={updateHousingProvider.isPending}
          onStartEdit={() => setIsEditing(true)}
          onCancelEdit={() => setIsEditing(false)}
          onSave={handleSave}
        />
      </FieldStyled.FieldList>
    </SettingsSection>
  );
};
