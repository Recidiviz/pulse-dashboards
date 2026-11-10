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

import { LocationCard } from "~@idaho-th/client/components/common/LocationCard";
import type { LocationFormPatch } from "~@idaho-th/client/components/common/LocationCard/locationCard.utils";
import type { HousingProviderLocation } from "~@idaho-th/client/interfaces/common";
import { USER_ROLE } from "~@idaho-th/shared";

import { useUpdateProviderLocation } from "../../../hooks/housingApplication";
import * as Styled from "./LocationsTab.styles";

export interface LocationsTabProps {
  locations: HousingProviderLocation[];
}

export const LocationsTab: React.FC<LocationsTabProps> = ({ locations }) => {
  const [editingLocationId, setEditingLocationId] = useState<string | null>(
    null,
  );
  const updateLocation = useUpdateProviderLocation();

  if (locations.length === 0) {
    return (
      <Styled.EmptyState>
        <Styled.EmptyStateText>No locations available.</Styled.EmptyStateText>
      </Styled.EmptyState>
    );
  }

  const handleSave = (locationId: string, values: LocationFormPatch) => {
    setEditingLocationId(null);
    updateLocation.mutate({ locationId, ...values });
  };

  return (
    <Styled.List>
      {locations.map((location) => (
        <LocationCard
          key={location.id}
          location={location}
          viewerRole={USER_ROLE.PROVIDER}
          isEditing={editingLocationId === location.id}
          onStartEdit={() => setEditingLocationId(location.id)}
          onCancelEdit={() => setEditingLocationId(null)}
          onSave={(values) => handleSave(location.id, values)}
          isSaving={
            updateLocation.isPending &&
            updateLocation.variables?.locationId === location.id
          }
        />
      ))}
    </Styled.List>
  );
};
