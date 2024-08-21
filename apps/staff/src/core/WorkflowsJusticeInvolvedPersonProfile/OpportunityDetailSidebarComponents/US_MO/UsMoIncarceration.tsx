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

import React from "react";

import {
  DetailsHeading,
  DetailsList,
  DetailsSection,
  DetailsSubheading,
  SecureDetailsContent,
} from "../../styles";
import { ResidentProfileProps } from "../../types";

// We haven't decided yet what end dates we want to show for MO individuals. To keep the sidebar
// simple, we've opted not to hydrate start or end dates in the MO resident record.
// MO workflows also currently treat facilities as staff, so we don't want to show a heading for
// case manager (since our record will actually show the facility ID there). Since this is different
// enough from other facilities workflows, add a separate component for MO Incarceration instead of
// the generic Incarceration one.
export function UsMoIncarceration({
  resident,
}: ResidentProfileProps): React.ReactElement {
  return (
    <DetailsSection>
      <DetailsHeading>Incarceration</DetailsHeading>
      <SecureDetailsContent>
        <DetailsList>
          <DetailsSubheading>Facility</DetailsSubheading>
          <SecureDetailsContent>{resident.facilityId}</SecureDetailsContent>
        </DetailsList>
      </SecureDetailsContent>
    </DetailsSection>
  );
}
