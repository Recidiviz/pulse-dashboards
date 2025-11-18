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

const ClientCardGrid = styled.div<{
  $isMobile: boolean;
}>`
  display: grid;
  ${({ $isMobile }) =>
    !$isMobile &&
    `
        grid-template-columns: 1fr 1fr;
        column-gap: ${rem(18)};
      `}
  row-gap: ${rem(15)};

  margin-bottom: ${rem(spacing.lg)};
`;

// Make room for the map view button
const Spacer = styled.div`
  min-height: ${rem(20)};
`;

export const RoutePlannerClients = observer(function RoutePlannerClients({
  presenter,
  isMobile,
}: {
  presenter: RoutePlannerClientsPresenter;
  isMobile: boolean;
}) {
  const { selectedOfficers, contacts } = presenter;
  const showMapViewButton = isMobile && presenter.selectedClients.length > 0;

  const noContacts = Object.values(contacts).flat().length === 0;
  const noOfficers = selectedOfficers.length === 0;
  if (noContacts || noOfficers) {
    const emptyStateText = noOfficers
      ? "Select one or more caseloads to see a list of suggested clients with home contacts due this month."
      : "None of the selected officers have contacts due this month.";

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
              <span className="fs-exclude">{`${numContacts} contacts due this month for ${searchLabel}`}</span>
            </OfficerSectionLabel>

            {numContacts > 0 ? (
              <ClientCardGrid $isMobile={isMobile}>
                {contacts[searchId].map((task) => (
                  <ClientCard
                    key={`${task.person.pseudonymizedId}-${task.type}`}
                    task={task}
                    presenter={presenter}
                    isMobile={isMobile}
                  />
                ))}
              </ClientCardGrid>
            ) : (
              <EmptyStateWrapper>
                <EmptyStateText>
                  {"No home contacts due this month."}
                </EmptyStateText>
              </EmptyStateWrapper>
            )}
          </React.Fragment>
        );
      })}
      {showMapViewButton && <Spacer />}
    </ClientsWrapper>
  );
});
