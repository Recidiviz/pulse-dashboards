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
  typography,
} from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { now } from "mobx-utils";
import { rem } from "polished";
import { useEffect, useState } from "react";
import MarkdownView from "react-showdown";
import styled from "styled-components/macro";

import { ActionStrategyCopy } from "~datatypes";

import { useRootStore } from "../../components/StoreProvider";
import useIsMobile from "../../hooks/useIsMobile";
import { TEN_SECONDS } from "../../InsightsStore/presenters/utils";
import LanternLogo from "../LanternLogo";

export const StyledDrawerModal = styled(DrawerModal)<{
  isMobile: boolean;
  supervisorHomepage: boolean;
}>`
  ${({ supervisorHomepage }) =>
    supervisorHomepage
      ? `.ReactModal__Overlay {
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
        border-left: 1px solid ${palette.slate20};
      }`
      : `.ReactModal__Content {
        display: flex;
        flex-direction: column;
        height: 85% !important;
      }`}

  ${({ supervisorHomepage, isMobile }) =>
    supervisorHomepage &&
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

  .InsightsActionStrategyModal__close {
    grid-column: 2;
    justify-self: flex-end;
  }
`;

const ModalHeader = styled.div`
  ${typography.Sans24};
  color: ${palette.pine1};
  padding-left: ${rem(spacing.lg)};
  padding-right: ${rem(spacing.lg)};
  line-height: 1.5;
  font-weight: 600;
`;

const ModalFooter = styled.div`
  padding: ${rem(spacing.lg)} ${rem(spacing.md)};
  margin-top: auto;
  border-top: 1px solid ${palette.slate10};
`;

const StyledMarkdownView = styled(MarkdownView)`
  font-weight: 500;
  ${typography.Sans16}
  p {
    padding-left: ${rem(spacing.lg)};
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

const Wrapper = styled.div`
  padding: ${rem(spacing.lg)} ${rem(spacing.md)};
`;

type ActionStratetgyModalProps = {
  isOpen: boolean;
  onBackClick?: () => void;
  actionStrategy: ActionStrategyCopy[string];
  pseudoId: string;
  trackViewed: () => void;
  supervisorHomepage: boolean;
  insightsLanternState: boolean;
};

export const InsightsActionStrategyModal = observer(
  function InsightsActionStrategyModal({
    isOpen,
    onBackClick,
    actionStrategy,
    pseudoId,
    trackViewed,
    supervisorHomepage,
    insightsLanternState,
  }: ActionStratetgyModalProps) {
    const {
      insightsStore: { supervisionStore },
    } = useRootStore();
    const { isMobile } = useIsMobile(true);

    const [initialModalLoadTime, setModalOpenedAt] = useState<Date | undefined>(
      undefined,
    );

    // trackActionStrategyPopupViewed10Seconds every 10 seconds after the initial modal load
    if (
      initialModalLoadTime &&
      initialModalLoadTime.getTime() < now(TEN_SECONDS) - TEN_SECONDS
    ) {
      supervisionStore?.trackActionStrategyPopupViewed10Seconds({
        pseudoId,
      });
    }

    useEffect(() => {
      if (isOpen) {
        setModalOpenedAt(new Date());
        trackViewed();
      } else {
        setModalOpenedAt(undefined);
      }
    }, [isOpen, trackViewed]);

    return (
      <StyledDrawerModal
        isOpen={isOpen}
        onRequestClose={onBackClick}
        supervisorHomepage={supervisorHomepage}
        isMobile={isMobile}
      >
        <ModalControls>
          <Button
            className="InsightsActionStrategyModal__close"
            kind="link"
            onClick={onBackClick}
          >
            <Icon kind="Close" size="14" color={palette.pine2} />
          </Button>
        </ModalControls>
        <Wrapper>
          <div>
            <ModalHeader>{actionStrategy.prompt}</ModalHeader>
            <StyledMarkdownView
              markdown={actionStrategy.body}
              options={{ openLinksInNewWindow: true }}
            />
          </div>
        </Wrapper>
        {insightsLanternState && (
          <ModalFooter>
            <LanternLogo />
          </ModalFooter>
        )}
      </StyledDrawerModal>
    );
  },
);
