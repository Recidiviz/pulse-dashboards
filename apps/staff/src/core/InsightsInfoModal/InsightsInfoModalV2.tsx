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
  TooltipTrigger,
  typography,
} from "@recidiviz/design-system";
import { rem } from "polished";
import React from "react";
import { Link } from "react-router-dom";
import MarkdownView from "react-showdown";
import styled from "styled-components/macro";

import useIsMobile from "../../hooks/useIsMobile";
import { NAV_BAR_HEIGHT } from "../NavigationLayout";

export const StyledDrawerModalV2 = styled(DrawerModal)<{
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
    border-left: 1px solid ${palette.slate20};

    ${({ isMobile }) =>
      isMobile &&
      `max-width: unset !important;
    max-height: unset !important;
    width: 100% !important;
    height: 100% !important;
    border: unset !important;`}
  }
`;

const ModalWrapper = styled.div``;

const ModalHeader = styled.div`
  height: ${rem(NAV_BAR_HEIGHT)};
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 ${rem(spacing.lg)};
`;

const ModalBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.md)};
  ${typography.Sans14}
  color: ${palette.slate85} !important;
  padding: ${rem(spacing.xl)} ${rem(spacing.lg)};
`;

const ModalTitle = styled.div`
  ${typography.Sans24}
  color: ${palette.pine1};
`;

const StyledMarkdownView = styled(MarkdownView)`
  p {
    ${typography.Sans14}
    margin-bottom: 0;
  }
  strong {
    color: ${palette.pine1};
    font-weight: 500;
  }
  ul {
    padding-inline-start: ${rem(spacing.lg)};
  }
`;

const StyledIcon = styled(Icon)`
  color: ${palette.pine1};

  &:hover {
    cursor: pointer;
  }
`;

const StyledLink = styled(Link)`
  color: ${palette.signal.links} !important;
  border-bottom: 1px solid transparent;

  &:hover {
    border-color: ${palette.signal.links};
  }
`;

const InfoButton = styled(Button)`
  min-width: unset;
  min-height: unset;
  color: ${palette.slate60};
  padding: 3px;

  &:hover {
    background: ${palette.slate10};
  }
`;

type InsightsInfoModalType = {
  title: string;
  copy: string;
  description?: string;
  methodologyLink?: string;
  buttonText?: string;
  onClick?: () => void;
};

const InsightsInfoModalV2: React.FC<InsightsInfoModalType> = ({
  title,
  copy,
  description,
  methodologyLink,
  buttonText,
  onClick,
}) => {
  const { isMobile } = useIsMobile(true);
  const [modalIsOpen, setModalIsOpen] = React.useState(false);

  return (
    <>
      {buttonText ? (
        <Button
          aria-label={title}
          kind="link"
          onClick={() => setModalIsOpen(true)}
        >
          {buttonText}
        </Button>
      ) : (
        <TooltipTrigger contents="Click to learn more" maxWidth={300}>
          <InfoButton
            aria-label={title || "Info modal button"}
            icon="Info"
            shape="block"
            iconSize={12}
            kind="borderless"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setModalIsOpen(true);
              if (onClick) onClick();
            }}
          />
        </TooltipTrigger>
      )}

      <ModalWrapper
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <StyledDrawerModalV2
          isMobile={isMobile}
          isOpen={modalIsOpen}
          onRequestClose={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setModalIsOpen(false);
          }}
          shouldReturnFocusAfterClose={false}
        >
          <ModalHeader>
            <StyledIcon
              kind="Close"
              size={16}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setModalIsOpen(false);
              }}
            />
          </ModalHeader>
          <ModalBody>
            <ModalTitle>{title}</ModalTitle>
            {description && <StyledMarkdownView markdown={description} />}
            <StyledMarkdownView markdown={copy} />
            {methodologyLink && (
              <div>
                <StyledLink
                  to={methodologyLink}
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  target="_blank"
                >
                  See Full Methodology
                </StyledLink>
              </div>
            )}
          </ModalBody>
        </StyledDrawerModalV2>
      </ModalWrapper>
    </>
  );
};

export default InsightsInfoModalV2;
