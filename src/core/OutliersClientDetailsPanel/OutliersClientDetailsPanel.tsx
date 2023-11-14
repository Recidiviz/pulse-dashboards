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

import {
  Button,
  DrawerModal,
  Icon,
  palette,
  spacing,
} from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import { useEffect, useState } from "react";
import { Redirect } from "react-router-dom";
import styled from "styled-components/macro";

import lanternLogo from "../../assets/static/images/lantern_logo.png";
import { useRootStore } from "../../components/StoreProvider";
import useIsMobile from "../../hooks/useIsMobile";
import { SupervisionOfficerMetricEventsPresenter } from "../../OutliersStore/presenters/SupervisionOfficerMetricEventsPresenter";
import { outliersUrl } from "../views";
import { OutliersClientCapsule } from "./OutliersClientCapsule";
import OutliersClientDetails from "./OutliersClientDetails";

export const StyledDrawerModal = styled(DrawerModal)<{
  isMobile: boolean;
}>`
  .ReactModal__Content {
    display: flex;
    flex-direction: column;

    ${({ isMobile }) =>
      isMobile &&
      `max-width: unset !important;
    max-height: unset !important;
    width: 100% !important;
    height: 100% !important;
    right: 0 !important;
    border-radius: 0 !important;`}
  }
`;

const ModalHeader = styled.div`
  display: flex;
  padding: ${rem(spacing.lg)} ${rem(spacing.md)};
  z-index: 10;
  border-bottom: 1px solid ${palette.slate10};

  button {
    margin-left: auto;
  }
`;

const ModalFooter = styled.div`
  padding: ${rem(spacing.lg)} ${rem(spacing.md)};
  margin-top: auto;
  border-top: 1px solid ${palette.slate10};
`;

const Content = styled.div`
  overflow-y: auto;
`;

const OutliersClientDetailsPanel = observer(function OutliersClientPanel({
  presenter,
}: {
  presenter: SupervisionOfficerMetricEventsPresenter;
}) {
  const { isMobile } = useIsMobile(true);
  const {
    userStore: {
      activeFeatureVariants: { outliersClientDetail },
    },
  } = useRootStore();

  const {
    officerPseudoId,
    metricId,
    clientId,
    officerMetricEvents,
    eventsLabel,
  } = presenter;

  const [modalIsOpen, setModalIsOpen] = useState(Boolean(clientId));
  const [isRedirect, setIsRedirect] = useState(false);

  useEffect(() => {
    setModalIsOpen(Boolean(clientId));
    setIsRedirect(false);
  }, [clientId]);

  if (!outliersClientDetail || isRedirect) {
    return (
      <Redirect
        to={outliersUrl("supervisionStaffMetric", {
          officerPseudoId,
          metricId,
        })}
      />
    );
  }

  // TODO Update this once client presenter is implemented
  const currentEvent = officerMetricEvents.find((d) => d.clientId === clientId);
  const clientName = `${currentEvent?.clientName.givenNames} ${currentEvent?.clientName.surname}`;

  return (
    <StyledDrawerModal
      isOpen={modalIsOpen}
      onRequestClose={() => setModalIsOpen(false)}
      // this is necessary for drawer to smoothly close
      onAfterClose={() => setIsRedirect(true)}
      width={650}
      isMobile={isMobile}
    >
      <ModalHeader>
        <OutliersClientCapsule
          clientName={clientName}
          clientId={currentEvent?.clientId}
        />
        <Button kind="link" onClick={() => setModalIsOpen(false)}>
          <Icon kind="Close" size="14" color={palette.pine2} />
        </Button>
      </ModalHeader>
      <Content>
        <OutliersClientDetails event={currentEvent} eventsLabel={eventsLabel} />
      </Content>
      <ModalFooter>
        <img height={15} src={lanternLogo} alt="Lantern" />
      </ModalFooter>
    </StyledDrawerModal>
  );
});

export default OutliersClientDetailsPanel;
