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

import {
  Modal,
  Sans12,
  Sans14,
  Sans16,
  Sans18,
  spacing,
  typography,
} from "@recidiviz/design-system";
import { rem } from "polished";
import React, { useEffect, useState } from "react";
import styled from "styled-components";

import { Button, Icon, IconSVG, palette } from "~design-system";

import postDownloadVisual from "../../../../../assets/static/images/us_tn_post_download_visual.png";

const MODAL_CONTENT_WIDTH = 368;

const StyledModal = styled(Modal)`
  .ReactModal__Content {
    padding: 0;
    width: ${rem(680)};
    overflow: scroll;
  }
`;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
`;

const ModalControls = styled.div`
  display: flex;
  justify-content: space-between;
  border-bottom: 1px solid ${palette.slate20};
  padding: ${rem(spacing.md)} ${rem(spacing.lg)};
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  color: ${palette.pine2};
`;

const Title = styled(Sans18)`
  margin-left: ${rem(spacing.lg)};
`;

const ModalContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  color: ${palette.pine1};
  margin: ${rem(spacing.sm)} 0 ${rem(spacing.lg)} 0;
`;

const ContentHeader = styled(Sans16)`
  margin: 0 0 ${rem(spacing.sm)} 0;
`;

const ModalImage = styled.img`
  width: ${MODAL_CONTENT_WIDTH}px;
  height: auto;
`;

const LeftAlign = styled.div`
  display: flex;
  flex-direction: column;
  align-items: start;
  justify-content: start;
  width: ${MODAL_CONTENT_WIDTH}px;
`;
const NextSteps = styled.div`
  display: flex;
  flex-direction: column;
`;

const StepNumber = styled.div`
  ${typography.Sans12}
  color: ${palette.white};
  background-color: ${palette.pine4};
  border-radius: 10px;
  min-height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
`;
const StepText = styled(Sans14)`
  font-size: 13px;
  color: ${palette.slate85};
  margin-left: ${rem(spacing.sm)};
`;

const NextStep = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  margin: 2px 0px;
`;

const LevelMappings = styled.div`
  border: 1px solid ${palette.slate20};
  border-radius: 8px;
  margin-top: ${rem(spacing.md)};
  color: ${palette.slate85};
  width: ${MODAL_CONTENT_WIDTH}px;
`;
const LevelMapping = styled.div`
  display: flex;
  flex-direction: row;
  padding: 12px ${rem(spacing.md)};
  font-weight: 500;
  &:not(:first-child) {
    border-top: 1px solid ${palette.slate20};
  }
`;

const MappingText = styled(Sans12)`
  font-weight: 500;
  &:not(:first-child) {
    margin-left: ${rem(spacing.lg)};
  }
`;

const StyledArrow = styled(Icon)`
  stroke-width: 1.5;
  margin-left: ${rem(spacing.lg)};
`;

const Notes = styled(Sans12)<{ $bold?: boolean }>`
  color: ${palette.slate85};
  ${({ $bold }) => !!$bold && `font-weight: 700;`}
  margin: ${rem(spacing.xs)} 0px;
  padding: ${rem(spacing.xs)} ${rem(spacing.md)};
  max-width: ${MODAL_CONTENT_WIDTH}px;
`;

const NEXT_STEPS: string[] = [
  "Log into TOMIS LCLN (Classification) screen",
  "Input scores of 0 throughout for the CAF",
  "Enter the Hearing Date/Time",
  "Copy and paste summary info from Recidiviz packet",
  "Enter custody level based on mappings below",
];

const LEVELS: string[] = ["Trustee", "Low", "Medium", "Close", "Max"];

/**
 * A modal containing the next classification steps for TN users that will display
 * after downloading a pilot classification form.
 */
export const PostDownloadModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const [modalIsOpen, setModalIsOpen] = useState(isOpen);

  useEffect(() => {
    setModalIsOpen(isOpen);
  }, [isOpen]);

  function handleCloseModal() {
    onClose();
    setModalIsOpen(false);
  }

  return (
    <StyledModal
      isOpen={modalIsOpen}
      onRequestClose={onClose}
      closeTimeoutMS={500}
    >
      <Wrapper>
        <ModalControls>
          <ModalHeader>
            <Icon
              kind={IconSVG.Success}
              size="20"
              color={palette.signal.highlight}
            />
            <Title>Document Downloaded</Title>
          </ModalHeader>
          <Button kind="link" onClick={() => handleCloseModal()}>
            <Icon kind="Close" size="16" color={palette.pine2} />
          </Button>
        </ModalControls>
        <ModalContent>
          <ContentHeader>Resident Moved to "Pending" Tab</ContentHeader>
          <ModalImage src={postDownloadVisual} />
          <LeftAlign>
            <ContentHeader>Next Steps</ContentHeader>
            <NextSteps>
              {NEXT_STEPS.map((step, index) => (
                <NextStep>
                  <StepNumber>{index + 1}</StepNumber>
                  <StepText>{step}</StepText>
                </NextStep>
              ))}
            </NextSteps>
          </LeftAlign>
          <LevelMappings>
            {LEVELS.map((level) => (
              <LevelMapping>
                <MappingText>{level} Scores</MappingText>
                <StyledArrow
                  kind={IconSVG.Arrow}
                  fill={palette.signal.links}
                  height={14}
                  width={14}
                />
                <MappingText>{level}</MappingText>
              </LevelMapping>
            ))}
          </LevelMappings>
          <LeftAlign>
            <Notes>
              Minimum Restrict, Minimum Direct, Minimum Trustee will not be
              used.{" "}
            </Notes>
            <Notes $bold={true}>
              Use new override code: “Overridden from Recidiviz”{" "}
            </Notes>
          </LeftAlign>
        </ModalContent>
      </Wrapper>
    </StyledModal>
  );
};
