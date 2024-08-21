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
  Button,
  DrawerModal,
  Icon,
  palette,
  spacing,
} from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import { ComponentType, useEffect, useRef, useState } from "react";
import {
  matchPath,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import styled from "styled-components/macro";

import NotFound from "../../components/NotFound";
import { useRootStore } from "../../components/StoreProvider";
import useIsMobile from "../../hooks/useIsMobile";
import { SupervisionClientDetailPresenter } from "../../InsightsStore/presenters/SupervisionClientDetailPresenter";
import { StyledDrawerModalV2 } from "../InsightsInfoModal/InsightsInfoModalV2";
import LanternLogo from "../LanternLogo";
import ModelHydrator from "../ModelHydrator";
import { NAV_BAR_HEIGHT } from "../NavigationLayout";
import { insightsUrl } from "../views";
import { InsightsClientCapsule } from "./InsightsClientCapsule";
import InsightsClientDetails from "./InsightsClientDetails";
import InsightsClientEventsTable from "./InsightsClientEventsTable";

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

const CloseButtonWrapper = styled.div`
  height: ${rem(NAV_BAR_HEIGHT)};
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 ${rem(spacing.lg)};
  border-bottom: 1px solid ${palette.slate10};
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

type InsightsClientDetailsPanelProps = {
  presenter: SupervisionClientDetailPresenter;
};

function withPresenter(
  Component: ComponentType<InsightsClientDetailsPanelProps>,
) {
  return observer(function InsightsClientDetailsPanelWrapper() {
    const {
      insightsStore: { supervisionStore },
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
      outcomeDate,
    );
    return (
      <ModelHydrator model={presenter}>
        <Component presenter={presenter} />
      </ModelHydrator>
    );
  });
}

const InsightsClientDetailsPanel = observer(function InsightsClientPanel({
  presenter,
}: InsightsClientDetailsPanelProps) {
  const { isMobile } = useIsMobile(true);
  const {
    insightsStore: { shouldUseSupervisorHomepageUI: supervisorHomepage },
  } = useRootStore();
  const [initialPageLoad, setInitialPageLoad] = useState<boolean>(true);

  const {
    clientInfo,
    clientEvents,
    supervisionDetails,
    clientPseudoId,
    officerPseudoId,
    metricId,
    eventsLabelSingular,
    outcomeDate,
    labels,
    isInsightsLanternState,
  } = presenter;

  const [modalIsOpen, setModalIsOpen] = useState(Boolean(clientPseudoId));
  const navigate = useNavigate();
  const location = useLocation();

  const scrollElementRef = useRef(null);

  useEffect(() => {
    setModalIsOpen(Boolean(clientPseudoId));
  }, [clientPseudoId]);

  if (!isInsightsLanternState) {
    return (
      <Navigate
        to={insightsUrl("supervisionStaffMetric", {
          officerPseudoId,
          metricId,
        })}
      />
    );
  }

  if (!clientInfo || !clientEvents) return <NotFound />;

  if (initialPageLoad) {
    presenter.trackViewed();
    setInitialPageLoad(false);
  }

  const DrawerComponent = supervisorHomepage
    ? StyledDrawerModalV2
    : StyledDrawerModal;

  return (
    <DrawerComponent
      isOpen={modalIsOpen}
      onRequestClose={() => {
        setModalIsOpen(false);
      }}
      // this is necessary for drawer to smoothly close
      onAfterClose={() => {
        // If navigating from the staff page, go back
        if (
          location?.state &&
          matchPath(
            location.state?.from,
            insightsUrl("supervisionStaffMetric", {
              officerPseudoId,
              metricId,
            }),
          )
        )
          navigate(-1);
        // Otherwise, navigate to the staff page on modal close
        else
          navigate(
            insightsUrl("supervisionStaffMetric", {
              officerPseudoId,
              metricId,
            }),
            { replace: true },
          );
      }}
      width={650}
      isMobile={isMobile}
    >
      {supervisorHomepage && (
        <CloseButtonWrapper>
          <Button kind="link" onClick={() => setModalIsOpen(false)}>
            <Icon kind="Close" size="16" color={palette.pine1} />
          </Button>
        </CloseButtonWrapper>
      )}
      <ModalHeader>
        <InsightsClientCapsule
          clientInfo={clientInfo}
          docLabel={labels.docLabel}
        />
        {!supervisorHomepage && (
          <Button kind="link" onClick={() => setModalIsOpen(false)}>
            <Icon kind="Close" size="14" color={palette.pine2} />
          </Button>
        )}
      </ModalHeader>
      <Content ref={scrollElementRef}>
        <InsightsClientDetails
          client={clientInfo}
          supervisionDetails={supervisionDetails}
          eventsLabel={eventsLabelSingular}
          outcomeDate={outcomeDate}
        />
        <InsightsClientEventsTable
          events={clientEvents}
          supervisorHomepage={supervisorHomepage}
        />
      </Content>
      <ModalFooter>
        <LanternLogo />
      </ModalFooter>
    </DrawerComponent>
  );
});

export default withPresenter(InsightsClientDetailsPanel);
