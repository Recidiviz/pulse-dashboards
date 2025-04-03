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

import { toTitleCase } from "@artsy/to-title-case";
import {
  Button,
  Modal,
  palette,
  spacing,
  typography,
} from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import pluralize from "pluralize";
import { rem, rgba } from "polished";
import React from "react";
import styled from "styled-components/macro";

import useIsMobile from "../../hooks/useIsMobile";
import { SupervisionSupervisorRosterModalPresenter } from "../../InsightsStore/presenters/SupervisionSupervisorRosterModalPresenter";
import ModelHydrator from "../ModelHydrator";
import { InsightsRosterChangeRequestForm } from "./InsightsRosterChangeRequestForm/InsightsRosterChangeRequestForm";

export const StyledDrawerModalV2 = styled(Modal)<{
  isMobile: boolean;
}>`
  .ReactModal__Overlay--after-open {
    background-color: ${rgba("#000", 0.5)};
  }

  .ReactModal__Content--after-open {
    display: flex;
    flex-direction: column;
    padding: 0;
    overflow: hidden;

    width: ${rem(524)};
    max-width: ${rem(524)};
    max-height: ${rem(601)};
    height: ${rem(601)};
    ${({ isMobile }) =>
      isMobile &&
      `max-width: unset !important;
        border-radius: 0%;
    max-height: 100% !important;
    width: 100% !important;
    height: 100% !important;
    border: unset !important;`}
  }
`;

const ModalWrapper = styled.div``;

const ModalHeader = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: ${rem(16)} ${rem(40)};
  border-bottom: ${rem(1)} solid ${rgba("#000", 0.15)};
`;

const ModalBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.md)};
  ${typography.Sans14}
  color: ${palette.slate85} !important;
  padding: ${rem(spacing.lg)} ${rem(spacing.xl)};
  height: 100%;
  max-height: 100%;
  overflow-y: auto;
  scrollbar-width: thin;
`;

const ModalTitle = styled.div`
  ${typography.Sans14}
  color: ${palette.pine1};
`;

const CloseButton = styled(Button)`
  color: ${palette.pine1};
`;

type RosterModalType = {
  presenter: SupervisionSupervisorRosterModalPresenter;
};

const InsightsSupervisorRosterModal: React.FC<RosterModalType> = ({
  presenter,
  presenter: {
    trackViewed,
    view,
    closeModal,
    openModal,
    isModalOpen,
    officersOnSupervisorTeam,
    labels: { supervisionOfficerLabel },
  },
}) => {
  const { isMobile } = useIsMobile(true);
  const title = `${officersOnSupervisorTeam?.length} ${toTitleCase(pluralize(supervisionOfficerLabel, officersOnSupervisorTeam?.length))} on Your Team`;

  return (
    <>
      <Button
        aria-label={title}
        kind="link"
        onClick={() => {
          trackViewed();
          openModal();
        }}
        color={palette.pine1}
      >
        View
      </Button>
      <ModalWrapper
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <StyledDrawerModalV2
          isMobile={isMobile}
          isOpen={isModalOpen}
          onRequestClose={(e) => {
            e.preventDefault();
            e.stopPropagation();
            closeModal();
          }}
          shouldReturnFocusAfterClose={false}
          shouldCloseOnOverlayClick={true}
        >
          <ModalHeader>
            {view === "ROSTER" ? (
              <ModalTitle>{title}</ModalTitle>
            ) : (
              <Button
                name="Back" // TODO (#7858): Add Left-Chevron icon to the design-system library to use here
                kind="link"
                role="button"
                color={rgba("#00113380", 0.5)}
                onClick={() => {
                  presenter.view = "ROSTER";
                }}
              >
                Back
              </Button>
            )}
            <CloseButton
              name="Close"
              role="button"
              kind="link"
              icon="Close"
              iconSize={14}
              color={rgba("#00113380", 0.5)}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                presenter.view = "ROSTER";
                presenter.closeModal();
              }}
            />
          </ModalHeader>
          <ModalBody>
            <ModelHydrator hydratable={presenter}>
              <InsightsRosterChangeRequestForm presenter={presenter} />
            </ModelHydrator>
          </ModalBody>
        </StyledDrawerModalV2>
      </ModalWrapper>
    </>
  );
};

export default observer(InsightsSupervisorRosterModal);
