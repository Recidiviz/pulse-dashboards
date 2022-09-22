// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2022 Recidiviz, Inc.
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

import { observer } from "mobx-react-lite";
import React from "react";

import { ActionButtons, Title, useStatusColors, Wrapper } from "../common";
import { CriteriaList } from "../CriteriaList";
import { OpportunityDenial } from "../OpportunityDenial";
import { ClientProfileProps } from "../types";

export const LSUModule = observer(({ client }: ClientProfileProps) => {
  if (!client.opportunities.LSU) return null;

  const colors = useStatusColors(client.opportunities.LSU);

  return (
    <Wrapper {...colors}>
      <Title
        titleText="Limited Supervision Unit"
        statusMessage={client.opportunities.LSU?.statusMessageShort}
      />
      <CriteriaList opportunity={client.opportunities.LSU} colors={colors} />
      <ActionButtons>
        <OpportunityDenial
          client={client}
          opportunity={client.opportunities.LSU}
        />
      </ActionButtons>
    </Wrapper>
  );
});
