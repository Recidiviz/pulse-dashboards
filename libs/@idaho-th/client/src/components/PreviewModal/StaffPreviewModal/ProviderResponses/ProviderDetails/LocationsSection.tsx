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
import type { HousingProviderLocation } from "~@idaho-th/client/interfaces/common";
import { USER_ROLE } from "~@idaho-th/shared";

import * as Styled from "./ProviderDetailView.styles";

interface LocationsSectionProps {
  location: HousingProviderLocation;
}

export const LocationsSection: React.FC<LocationsSectionProps> = ({
  location,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Styled.Section>
      <Styled.LocationsSectionHeader
        type="button"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        <Styled.LocationsSectionTitle>Location</Styled.LocationsSectionTitle>
        <Styled.ChevronIcon $open={isOpen}>
          <Styled.ArrowDown />
        </Styled.ChevronIcon>
      </Styled.LocationsSectionHeader>

      {isOpen && (
        <Styled.LocationsSectionContent>
          <Styled.LocationsList>
            <LocationCard location={location} viewerRole={USER_ROLE.STAFF} />
          </Styled.LocationsList>
        </Styled.LocationsSectionContent>
      )}
    </Styled.Section>
  );
};
