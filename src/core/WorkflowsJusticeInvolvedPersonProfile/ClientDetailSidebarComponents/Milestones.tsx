// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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

import { ReactComponent as GoldStar } from "../../../assets/static/images/goldStar.svg";
import {
  DetailsHeading,
  DetailsSection,
  MilestonesItem,
  MilestonesList,
  SecureDetailsContent,
} from "../styles";
import { ClientProfileProps } from "../types";

export function Milestones({ client }: ClientProfileProps): React.ReactElement {
  if (client.profileMilestones.length > 0) {
    return (
      <DetailsSection>
        <DetailsHeading>Milestones</DetailsHeading>
        <SecureDetailsContent>
          {client.profileMilestones?.map((milestone) => {
            return (
              <MilestonesList
                key={`${client.pseudonymizedId}-${milestone.type}`}
              >
                <GoldStar height="12" width="12" />
                <MilestonesItem>{milestone.text}</MilestonesItem>
              </MilestonesList>
            );
          })}
        </SecureDetailsContent>
      </DetailsSection>
    );
  }

  return <div />;
}
