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
  Icon,
  Modal,
  palette,
  spacing,
  typography,
} from "@recidiviz/design-system";
import { rem } from "polished";
import React from "react";
import { Link } from "react-router-dom";
import MarkdownView from "react-showdown";
import styled from "styled-components/macro";

import { useFeatureVariants } from "../../components/StoreProvider";
import { InsightsTooltip } from "../InsightsPageLayout/InsightsPageLayout";

export const StyledModal = styled(Modal)`
  .ReactModal__Overlay {
    background-color: rgba(0, 0, 0, 0.3);
  }
  .ReactModal__Content {
    padding: ${rem(spacing.xl)};
  }
`;

const ModalWrapper = styled.div``;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${rem(spacing.sm)};
`;

const ModalTitle = styled.div`
  ${typography.Sans18}
  color: ${palette.pine1};
`;

const ModalBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.lg)};
  ${typography.Sans14}
  color: ${palette.pine1} !important;
`;

const StyledMarkdownView = styled(MarkdownView)`
  p {
    ${typography.Sans14}
    line-height: 18px;
    margin-bottom: 0;
    font-weight: 400;
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
  &:hover {
    text-decoration: underline;
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

const StyledButton = styled(Button).attrs({ kind: "link" })<{
  supervisorHomepage: boolean;
}>`
  ${({ supervisorHomepage }) =>
    supervisorHomepage &&
    `color: ${palette.slate85};
      text-decoration: none !important;`}
`;

type InsightsInfoModalType = {
  title: string;
  copy: string;
  methodologyLink?: string;
  buttonText?: string;
  onClick?: () => void;
};

const InsightsInfoModal: React.FC<InsightsInfoModalType> = ({
  title,
  copy,
  methodologyLink,
  buttonText,
  onClick,
}) => {
  const { supervisorHomepage } = useFeatureVariants();
  const [modalIsOpen, setModalIsOpen] = React.useState(false);

  return (
    <>
      {buttonText ? (
        <StyledButton
          aria-label={title}
          supervisorHomepage={!!supervisorHomepage}
          onClick={() => setModalIsOpen(true)}
        >
          {buttonText}
        </StyledButton>
      ) : (
        <InsightsTooltip contents="Click to learn more" maxWidth={300}>
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
        </InsightsTooltip>
      )}

      <ModalWrapper
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <StyledModal
          isOpen={modalIsOpen}
          onRequestClose={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setModalIsOpen(false);
          }}
          shouldReturnFocusAfterClose={false}
        >
          <ModalHeader>
            <ModalTitle>{title}</ModalTitle>
            <StyledIcon
              kind="Close"
              size={12}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setModalIsOpen(false);
              }}
            />
          </ModalHeader>
          <ModalBody>
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
                  See Methodology for more.
                </StyledLink>
              </div>
            )}
          </ModalBody>
        </StyledModal>
      </ModalWrapper>
    </>
  );
};

export default InsightsInfoModal;
