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
import { Button, spacing } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { darken, rem } from "polished";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components/macro";

import { BrandedLink } from "../../components/BrandedLink";
import { Opportunity } from "../../WorkflowsStore";
import { OpportunityCapsule } from "../ClientCapsule";
import { workflowsUrl } from "../views";
import { STATUS_COLORS } from "../WorkflowsClientProfile/common";

const ListItem = styled.li`
  padding: ${rem(spacing.md)} ${rem(spacing.md)} 0 0;
`;

const ClientLink = styled(BrandedLink)`
  display: flex;
  gap: ${rem(spacing.lg)};
`;

const ClientItemWrapper = styled.div`
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  justify-content: space-between;
`;

const NavigateToFormButton = styled(Button)`
  background: ${STATUS_COLORS.eligible.buttonFill};
  border-radius: 4px;
  border: 1px solid ${STATUS_COLORS.eligible.buttonFill};
  max-height: 32px;
  min-height: 32px;
  max-width: ${rem(175)};

  &:hover,
  &:focus {
    background: ${darken(0.1, STATUS_COLORS.eligible.buttonFill)};
    border: 1px solid ${darken(0.1, STATUS_COLORS.eligible.buttonFill)};
  }
`;

type ClientListItemProps = {
  opportunity: Opportunity;
};

const ButtonSpacer = styled.div`
  flex: 1 0 16px;
`;

export const ClientListItem = observer(
  ({ opportunity }: ClientListItemProps) => {
    const [showButton, setShowButton] = useState(false);
    const { client } = opportunity;

    return (
      <ListItem key={client.id}>
        <ClientItemWrapper
          onMouseEnter={() => setShowButton(true)}
          onMouseLeave={() => setShowButton(false)}
        >
          <ClientLink
            to={workflowsUrl("clientPreview", {
              opportunityType: opportunity.type,
              clientId: client.pseudonymizedId,
            })}
          >
            <OpportunityCapsule
              avatarSize="lg"
              opportunity={opportunity}
              textSize="sm"
              hideId
            />
          </ClientLink>
          <ButtonSpacer />
          {showButton && opportunity.navigateToFormText && (
            <Link
              to={workflowsUrl("opportunityAction", {
                opportunityType: opportunity.type,
                clientId: client.pseudonymizedId,
              })}
            >
              <NavigateToFormButton>
                {opportunity.navigateToFormText}
              </NavigateToFormButton>
            </Link>
          )}
        </ClientItemWrapper>
      </ListItem>
    );
  }
);
