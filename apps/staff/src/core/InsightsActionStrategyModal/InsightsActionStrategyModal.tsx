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

import { Button, DrawerModal, Icon, spacing, typography } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { now } from "mobx-utils";
import { rem } from "polished";
import { ComponentType, useEffect, useState } from "react";
import MarkdownView from "react-showdown";
import styled from "styled-components/macro";

import { ActionStrategyCopy } from "~datatypes";
import { palette } from "~design-system";

import { useRootStore } from "../../components/StoreProvider";
import useIsMobile from "../../hooks/useIsMobile";
import { SupervisionActionStrategyPresenter } from "../../InsightsStore/presenters/SupervisionActionStrategyPresenter";
import { TEN_SECONDS } from "../../InsightsStore/presenters/utils";
import LanternLogo from "../LanternLogo";
import ModelHydrator from "../ModelHydrator";
import { NavigationBackButton } from "../NavigationBackButton";
import { NAV_BAR_HEIGHT } from "../NavigationLayout";
import { useInsightsActionStrategyModal } from "./InsightsActionStrategyModalContext";

export const StyledDrawerModal = styled(DrawerModal)<{
  isMobile: boolean;
}>`
  .ReactModal__Overlay {
    background-color: unset;
    backdrop-filter: unset;
  }

  .ReactModal__Content {
    height: 100vh !important;
    right: 0 !important;
    border-radius: unset !important;
    box-shadow: unset !important;
    display: flex;
    flex-direction: column;
    border-left: ${rem(1)} solid ${palette.slate20};
  }

  ${({ isMobile }) =>
    isMobile &&
    `.ReactModal__Content {
        max-width: unset !important;
        max-height: unset !important;
        width: 100% !important;
        height: 100% !important;
        border: unset !important;
      }`}
`;

const ModalControls = styled.div`
  position: sticky;
  top: 0;
  z-index: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  justify-content: space-between;
  background: white;
  padding: 1rem;
  height: ${rem(NAV_BAR_HEIGHT)};
  border-bottom: ${rem(1)} solid ${palette.slate10};

  .InsightsActionStrategyModal__close {
    grid-column: 2;
    justify-self: flex-end;
  }
  }
`;

const StyledNavigationBackButton = styled(NavigationBackButton)`
  grid-column: 1;
  justify-self: flex-start;
  color: ${palette.pine2};

  & i {
    font-size: 1.75rem;
  }
`;

const ModalHeader = styled.div`
  ${typography.Sans24};
  color: ${palette.pine1};
  padding: 0 ${rem(spacing.sm)};
  line-height: 1.5;
  font-weight: 600;
`;

const ModalFooter = styled.div`
  padding: ${rem(spacing.lg)} ${rem(spacing.md)};
  margin-top: auto;
  border-top: ${rem(1)} solid ${palette.slate10};
`;

const StyledMarkdownView = styled(MarkdownView)`
  font-weight: 500;
  ${typography.Sans16}
  p {
    padding-left: ${rem(spacing.sm)};
    margin-top: ${rem(spacing.lg)};
    margin-bottom: ${rem(spacing.lg)};
    color: ${palette.slate85};
  }
  ol {
    ${typography.Sans14};
    line-height: ${rem(spacing.lg)};
    margin-left: ${rem(spacing.md)};
    padding-left: ${rem(spacing.lg)};
    padding-right: ${rem(spacing.lg)};
    color: ${palette.slate85};
    ${typography.Sans16}
    line-height: 1.8;
  }
  a {
    color: ${palette.signal.links} !important;
    padding-top: ${rem(spacing.sm)};
    &:hover {
      text-decoration: underline;
    }
  }
`;

const List = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0 ${rem(spacing.sm)};
  margin-top: ${rem(spacing.lg)};
`;

const ListItem = styled.div`
  ${typography.Sans14};
  color: ${palette.pine2};
  align-self: stretch;
  display: flex;
  align-items: center;
  padding: ${rem(spacing.xl)} ${rem(spacing.sm)};
  gap: ${rem(spacing.sm)};
  border-top: ${rem(1)} solid ${palette.slate10};

  &:last-child {
    border-bottom: 1px solid ${palette.slate10};
  }

  &:hover {
    background-color: ${palette.slate10};
    cursor: pointer;
  }
`;

const Wrapper = styled.div`
  padding: ${rem(spacing.lg)} ${rem(spacing.md)};
`;

const ActionStrategyList = ({
  actionStrategies,
  onActionStrategySelect,
  insightsLanternState,
}: {
  actionStrategies: ActionStrategyCopy;
  onActionStrategySelect: (item: ActionStrategyCopy[string]) => void;
  insightsLanternState: boolean;
}): React.ReactElement | null => {
  const actionStrategiesList = Object.entries(actionStrategies);

  const title = insightsLanternState
    ? "Lantern Action Strategies"
    : "Action Strategies";

  return (
    <>
      <ModalHeader>{title}</ModalHeader>
      <List>
        {actionStrategiesList.map(([key, value]) => {
          return (
            <ListItem key={key} onClick={() => onActionStrategySelect(value)}>
              {value.prompt}
            </ListItem>
          );
        })}
      </List>
    </>
  );
};

const ActionStrategy = ({
  actionStrategy,
}: {
  actionStrategy: ActionStrategyCopy[string] | undefined;
}): React.ReactElement | null => {
  return (
    <div>
      <ModalHeader>{actionStrategy?.prompt}</ModalHeader>
      <StyledMarkdownView
        markdown={actionStrategy?.body ?? ""}
        options={{ openLinksInNewWindow: true }}
      />
    </div>
  );
};

type ActionStrategyModalProps = {
  presenter: SupervisionActionStrategyPresenter;
};

export const InsightsActionStrategyModal = withPresenter(
  observer(function InsightsActionStrategyModal({
    presenter,
  }: ActionStrategyModalProps) {
    const {
      insightsStore: { supervisionStore },
    } = useRootStore();
    const { isMobile } = useIsMobile(true);
    const {
      isModalOpen: isOpen,
      closeModal,
      showList,
      toggleShowList,
      selectActionStrategy,
      selectedActionStrategy,
      viewedFromList,
    } = useInsightsActionStrategyModal();

    const {
      surfacedActionStrategy,
      pseudoId,
      trackActionStrategyPopupViewed: trackViewed,
      trackActionStrategyPopupViewedFromList: trackViewedFromList,
      trackActionStrategyListViewed: trackListViewed,
      isInsightsLanternState,
      allActionStrategies,
      getActionStrategyNameByValue: getName,
    } = presenter;

    const [initialModalLoadTime, setModalOpenedAt] = useState<Date | undefined>(
      undefined,
    );

    // trackActionStrategyPopupViewed10Seconds every 10 seconds after load of action
    // strategy detail
    if (
      initialModalLoadTime &&
      initialModalLoadTime.getTime() < now(TEN_SECONDS) - TEN_SECONDS
    ) {
      supervisionStore?.trackActionStrategyPopupViewed10Seconds({
        pseudoId: !viewedFromList ? pseudoId : undefined,
        actionStrategy: getName(selectedActionStrategy),
      });
    }

    useEffect(() => {
      if (isOpen) {
        if (showList) {
          setModalOpenedAt(undefined);
          trackListViewed();
        } else {
          setModalOpenedAt(new Date());
          if (!viewedFromList) {
            trackViewed();
          } else {
            trackViewedFromList(getName(selectedActionStrategy));
          }
        }
      } else {
        setModalOpenedAt(undefined);

        // when closing the modal, reset the `selectedActionStrategy` to the surfaced one
        selectActionStrategy(surfacedActionStrategy);
      }
    }, [
      isOpen,
      trackViewed,
      trackListViewed,
      surfacedActionStrategy,
      selectActionStrategy,
      showList,
      selectedActionStrategy,
      viewedFromList,
      trackViewedFromList,
      getName,
    ]);

    return (
      <StyledDrawerModal
        isOpen={isOpen}
        onRequestClose={closeModal}
        isMobile={isMobile}
      >
        <ModalControls>
          {!showList && (
            <StyledNavigationBackButton action={{ onClick: toggleShowList }} />
          )}
          <Button
            className="InsightsActionStrategyModal__close"
            kind="link"
            onClick={closeModal}
          >
            <Icon kind="Close" size="14" color={palette.pine2} />
          </Button>
        </ModalControls>
        <Wrapper>
          {showList ? (
            <ActionStrategyList
              actionStrategies={allActionStrategies}
              onActionStrategySelect={selectActionStrategy}
              insightsLanternState={isInsightsLanternState}
            />
          ) : (
            <ActionStrategy actionStrategy={selectedActionStrategy} />
          )}
        </Wrapper>
        {isInsightsLanternState && (
          <ModalFooter>
            <LanternLogo />
          </ModalFooter>
        )}
      </StyledDrawerModal>
    );
  }),
);

function withPresenter(Component: ComponentType<ActionStrategyModalProps>) {
  return observer(function InsightsActionStrategyModalWrapper() {
    const {
      insightsStore: { supervisionStore },
    } = useRootStore();
    if (!supervisionStore) return null;
    const { supervisorPseudoId, officerPseudoId } = supervisionStore;

    const pseudoId = supervisorPseudoId ?? officerPseudoId;

    if (!pseudoId) return null;

    const presenter = new SupervisionActionStrategyPresenter(
      supervisionStore,
      pseudoId,
    );
    return (
      <ModelHydrator hydratable={presenter}>
        <Component presenter={presenter} />
      </ModelHydrator>
    );
  });
}
