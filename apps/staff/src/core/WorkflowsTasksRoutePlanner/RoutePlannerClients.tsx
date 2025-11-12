// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { spacing } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import React from "react";
import styled from "styled-components/macro";

import {
  EmptyStateText,
  EmptyStateWrapper,
} from "../OpportunityCaseloadView/HydratedOpportunityPersonList";
import { SectionLabelText } from "../sharedComponents";
import { ClientCard } from "./RoutePlannerClientCard";
import { RoutePlannerClientsPresenter } from "./RoutePlannerClientsPresenter";

const ClientsWrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const OfficerSectionLabel = styled(SectionLabelText)`
  &:first-child {
    margin-top: 0;
  }

  margin-bottom: ${rem(spacing.sm)};
  text-transform: uppercase;
`;

const ClientCardGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  column-gap: ${rem(18)};
  row-gap: ${rem(15)};

  margin-bottom: ${rem(spacing.lg)};
`;

export const RoutePlannerClients = observer(function RoutePlannerClients({
  presenter,
}: {
  presenter: RoutePlannerClientsPresenter;
}) {
  const { selectedOfficers, contacts } = presenter;

  const noContacts = Object.values(contacts).flat().length === 0;
  const noOfficers = selectedOfficers.length === 0;
  if (noContacts || noOfficers) {
    const emptyStateText = noOfficers
      ? "Select a caseload to show results."
      : "None of the selected officers have contacts available.";

    return (
      <ClientsWrapper>
        <EmptyStateWrapper>
          <EmptyStateText>{emptyStateText}</EmptyStateText>
        </EmptyStateWrapper>
      </ClientsWrapper>
    );
  }

  return (
    <ClientsWrapper>
      {selectedOfficers.map(({ searchId, searchLabel }) => {
        if (!contacts[searchId]) return null;

        const numContacts = contacts[searchId].length;
        return (
          <React.Fragment key={searchId}>
            <OfficerSectionLabel>
              <span className="fs-exclude">{`${numContacts} suggested contacts for ${searchLabel}`}</span>
            </OfficerSectionLabel>

            {numContacts > 0 ? (
              <ClientCardGrid>
                {contacts[searchId].map((task) => (
                  <ClientCard
                    key={`${task.person.pseudonymizedId}-${task.type}`}
                    task={task}
                    presenter={presenter}
                  />
                ))}
              </ClientCardGrid>
            ) : (
              <EmptyStateWrapper>
                <EmptyStateText>
                  {"No home contacts available on this caseload."}
                </EmptyStateText>
              </EmptyStateWrapper>
            )}
          </React.Fragment>
        );
      })}
    </ClientsWrapper>
  );
});
