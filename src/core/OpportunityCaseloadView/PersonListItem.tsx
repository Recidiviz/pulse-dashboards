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

import { useRootStore } from "../../components/StoreProvider";
import { Opportunity } from "../../WorkflowsStore";
import { OpportunityCapsule } from "../PersonCapsules";
import { OPPORTUNITY_STATUS_COLORS } from "../utils/workflowsUtils";
import { workflowsUrl } from "../views";

const ListItem = styled.li`
  padding: ${rem(spacing.md)} ${rem(spacing.md)} 0 0;
`;

const PersonLink = styled.button`
  border: none;
  text-align: left;
  background: none;

  &:hover,
  &:focus {
    cursor: pointer;
  }
`;

const PersonItemWrapper = styled.div`
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  justify-content: space-between;
`;

const NavigateToFormButton = styled(Button)`
  background: ${OPPORTUNITY_STATUS_COLORS.eligible.buttonFill};
  border-radius: 4px;
  border: 1px solid ${OPPORTUNITY_STATUS_COLORS.eligible.buttonFill};
  max-height: 32px;
  min-height: 32px;
  max-width: ${rem(175)};

  &:hover,
  &:focus {
    background: ${darken(0.1, OPPORTUNITY_STATUS_COLORS.eligible.buttonFill)};
    border: 1px solid
      ${darken(0.1, OPPORTUNITY_STATUS_COLORS.eligible.buttonFill)};
  }
`;

type PersonListItemProps = {
  opportunity: Opportunity;
};

const ButtonSpacer = styled.div`
  flex: 1 0 16px;
`;

export const PersonListItem = observer(
  ({ opportunity }: PersonListItemProps) => {
    const [showButton, setShowButton] = useState(false);
    const { person } = opportunity;
    const { workflowsStore } = useRootStore();

    return (
      <ListItem key={person.externalId}>
        <PersonItemWrapper
          onMouseEnter={() => setShowButton(true)}
          onMouseLeave={() => setShowButton(false)}
        >
          <PersonLink
            onClick={() =>
              workflowsStore.updateSelectedPerson(person.pseudonymizedId)
            }
          >
            <OpportunityCapsule
              avatarSize="lg"
              opportunity={opportunity}
              textSize="sm"
              hideId
            />
          </PersonLink>
          <ButtonSpacer />
          {showButton && opportunity.form?.navigateToFormText && (
            <Link
              to={workflowsUrl("opportunityAction", {
                opportunityType: opportunity.type,
                clientId: person.pseudonymizedId,
              })}
            >
              <NavigateToFormButton>
                {opportunity.form.navigateToFormText}
              </NavigateToFormButton>
            </Link>
          )}
        </PersonItemWrapper>
      </ListItem>
    );
  }
);
