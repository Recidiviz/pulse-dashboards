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

import { DetailsSection } from "../OpportunityProfile";
import { UsNdIncarcerationDetails } from "../ResidentDetailSidebarComponents/US_ND/UsNdIncarcerationDetails";
import { DetailsHeading } from "../styles";
import { ResidentProfileProps } from "../types";

export function UsNdResidentInformation({
  resident,
}: ResidentProfileProps): React.ReactElement | null {
  const { stateCode } = resident;

  if (stateCode !== "US_ND") return null;

  return (
    <DetailsSection>
      <DetailsHeading>Parole Dates</DetailsHeading>
      <UsNdIncarcerationDetails resident={resident} />
    </DetailsSection>
  );
}
