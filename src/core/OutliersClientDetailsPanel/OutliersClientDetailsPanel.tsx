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
import { ComponentType, useEffect, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import styled from "styled-components/macro";

import NotFound from "../../components/NotFound";
import {
  useFeatureVariants,
  useRootStore,
} from "../../components/StoreProvider";
import useIsMobile from "../../hooks/useIsMobile";
import { SupervisionClientDetailPresenter } from "../../OutliersStore/presenters/SupervisionClientDetailPresenter";
import LanternLogo from "../LanternLogo";
import ModelHydrator from "../ModelHydrator";
import { outliersUrl } from "../views";
import { OutliersClientCapsule } from "./OutliersClientCapsule";
import OutliersClientDetails from "./OutliersClientDetails";
import OutliersClientEventsTable from "./OutliersClientEventsTable";

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

type OutliersClientDetailsPanelProps = {
  presenter: SupervisionClientDetailPresenter;
};

function withPresenter(
  Component: ComponentType<OutliersClientDetailsPanelProps>
) {
  return observer(function OutliersClientDetailsPanelWrapper() {
    const {
      outliersStore: { supervisionStore },
    } = useRootStore();
    if (!supervisionStore) return null;
    const { clientPseudoId, metricId, officerPseudoId, outcomeDate } =
      supervisionStore;
    if (!clientPseudoId || !metricId || !officerPseudoId || !outcomeDate)
      return null;

    const presenter = new SupervisionClientDetailPresenter(
      supervisionStore,
      officerPseudoId,
      clientPseudoId,
      metricId,
      outcomeDate
    );
    return (
      <ModelHydrator model={presenter}>
        <Component presenter={presenter} />
      </ModelHydrator>
    );
  });
}

const OutliersClientDetailsPanel = observer(function OutliersClientPanel({
  presenter,
}: OutliersClientDetailsPanelProps) {
  const { isMobile } = useIsMobile(true);
  const { outliersClientDetail } = useFeatureVariants();

  const {
    clientInfo,
    clientEvents,
    supervisionDetails,
    clientPseudoId,
    officerPseudoId,
    metricId,
    eventsLabelSingular,
    outcomeDate,
  } = presenter;
  const [modalIsOpen, setModalIsOpen] = useState(Boolean(clientPseudoId));
  const [isRedirect, setIsRedirect] = useState(false);

  const [scrollElement, setScrollElement] = useState(null);
  const scrollElementRef = useRef(null);

  useEffect(() => {
    presenter.trackViewed();
  }, [presenter]);

  useEffect(() => {
    setModalIsOpen(Boolean(clientPseudoId));
    setIsRedirect(false);
  }, [clientPseudoId]);

  if (!outliersClientDetail || isRedirect) {
    return (
      <Navigate
        replace
        to={outliersUrl("supervisionStaffMetric", {
          officerPseudoId,
          metricId,
        })}
      />
    );
  }

  if (!clientInfo || !clientEvents) return <NotFound />;

  return (
    <StyledDrawerModal
      isOpen={modalIsOpen}
      onAfterOpen={() => setScrollElement(scrollElementRef.current)}
      onRequestClose={() => setModalIsOpen(false)}
      // this is necessary for drawer to smoothly close
      onAfterClose={() => setIsRedirect(true)}
      width={650}
      isMobile={isMobile}
    >
      <ModalHeader>
        <OutliersClientCapsule clientInfo={clientInfo} />
        <Button kind="link" onClick={() => setModalIsOpen(false)}>
          <Icon kind="Close" size="14" color={palette.pine2} />
        </Button>
      </ModalHeader>
      <Content ref={scrollElementRef}>
        <OutliersClientDetails
          client={clientInfo}
          supervisionDetails={supervisionDetails}
          eventsLabel={eventsLabelSingular}
          outcomeDate={outcomeDate}
        />
        <OutliersClientEventsTable
          events={clientEvents}
          scrollElement={scrollElement}
        />
      </Content>
      <ModalFooter>
        <LanternLogo />
      </ModalFooter>
    </StyledDrawerModal>
  );
});

export default withPresenter(OutliersClientDetailsPanel);
