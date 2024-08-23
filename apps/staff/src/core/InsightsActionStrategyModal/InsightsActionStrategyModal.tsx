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
import { rem } from "polished";
import MarkdownView from "react-showdown";
import styled from "styled-components/macro";

import { ActionStrategyCopy } from "../../InsightsStore/models/offlineFixtures/constants";
import LanternLogo from "../LanternLogo";

export const StyledDrawerModal = styled(DrawerModal)`
  .ReactModal__Content {
    display: flex;
    flex-direction: column;
    height: 85% !important;
  }
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
  }
  a {
    color: ${palette.signal.links} !important;
    padding-top: ${rem(spacing.sm)};
    text-decoration: underline;
  }
`;

const Wrapper = styled.div`
  padding: ${rem(spacing.lg)} ${rem(spacing.md)};
`;

type PreviewModalProps = {
  isOpen: boolean;
  onBackClick?: () => void;
  actionStrategy: ActionStrategyCopy;
};

export function InsightsActionStrategyModal({
  isOpen,
  onBackClick,
  actionStrategy,
}: PreviewModalProps): JSX.Element {
  return (
    <StyledDrawerModal isOpen={isOpen} onRequestClose={onBackClick}>
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
          <StyledMarkdownView markdown={actionStrategy.body} />
        </div>
      </Wrapper>
      <ModalFooter>
        <LanternLogo />
      </ModalFooter>
    </StyledDrawerModal>
  );
}
