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

import {
  palette,
  spacing,
  TooltipTrigger,
  typography,
} from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import styled from "styled-components/macro";

import { PersonInitialsAvatar } from "~ui";

import { useRootStore } from "../../components/StoreProvider";
import useIsMobile from "../../hooks/useIsMobile";
import { SupervisionOfficersPresenter } from "../../InsightsStore/presenters/SupervisionOfficersPresenter";
import ModelHydrator from "../ModelHydrator";

const PillsWrapper = styled.div`
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: ${rem(spacing.sm)};
`;

const Pill = styled.div`
  display: flex;
  align-items: center;
  gap: ${rem(spacing.sm)};
  padding: ${rem(spacing.sm)};
  border-radius: ${rem(spacing.sm)};
  border: 1px solid ${palette.slate20};
`;

const SupervisorName = styled.div<{ isMobile: boolean }>`
  ${({ isMobile }) => (isMobile ? typography.Sans14 : typography.Sans18)};
  min-width: max-content;
  color: ${palette.slate80};
`;

export const TooltipContentWrapper = styled.div`
  padding: ${rem(spacing.sm)};
`;

const TooltipTitle = styled.div`
  ${typography.Sans14};
  color: ${palette.white};
  margin-bottom: ${rem(spacing.sm)};
`;

const TooltipText = styled.div`
  ${typography.Sans12};
  color: ${palette.white80};
`;

const WarningMessage = styled.div`
  ${typography.Sans16};
  color: ${palette.signal.error};
`;

const StaffPills = observer(function StaffPills({
  presenter,
}: {
  presenter: SupervisionOfficersPresenter;
}) {
  const { isMobile } = useIsMobile(true);

  const { allOfficers } = presenter;
  const officerNames = allOfficers?.map((o) => o.displayName);

  if (!officerNames)
    return (
      <WarningMessage>
        We don't currently see any staff members assigned to you in our roster.
      </WarningMessage>
    );

  return (
    <TooltipTrigger
      contents={
        <TooltipContentWrapper>
          <TooltipTitle>Someone missing?</TooltipTitle>
          <TooltipText>You can report errors after onboarding.</TooltipText>
        </TooltipContentWrapper>
      }
    >
      <PillsWrapper>
        {officerNames.map((name) => (
          <Pill key={name}>
            <PersonInitialsAvatar square size={24} name={name} />
            <SupervisorName isMobile={isMobile}>{name}</SupervisorName>
          </Pill>
        ))}
      </PillsWrapper>
    </TooltipTrigger>
  );
});

const OutliersStaff = observer(function OutliersStaff({
  supervisorPseudoId,
}: {
  supervisorPseudoId: string | undefined;
}) {
  const {
    insightsStore: { supervisionStore },
  } = useRootStore();

  if (!supervisionStore) return null;
  if (!supervisorPseudoId) return null;

  const presenter = new SupervisionOfficersPresenter(
    supervisionStore,
    supervisorPseudoId,
  );

  return (
    <ModelHydrator hydratable={presenter}>
      <StaffPills presenter={presenter} />
    </ModelHydrator>
  );
});

export default OutliersStaff;
