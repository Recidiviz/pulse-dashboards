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

import { spacing, typography } from "@recidiviz/design-system";
import { rem } from "polished";
import styled from "styled-components/macro";

import { palette } from "~design-system";

const NoteContainer = styled.div<{
  numNotes: number;
}>`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  background-color: #ecf1f0;
  padding: ${rem(spacing.md)};
  margin-bottom: ${rem(spacing.md)};
  border-radius: 4px;
  height: ${({ numNotes }) => (numNotes > 1 ? "10em" : "auto")};
  @media (max-width: 320px) {
    height: auto;
  }
`;

const NoteLabelContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  width: 100%;
`;

const NoteLabel = styled.div`
  color: ${palette.pine1};
  ${typography.Sans16};
`;

const NoteText = styled.div`
  ${typography.Sans14};
  color: ${palette.slate85};
  margin-top: ${rem(spacing.sm)};
  line-height: 1.5;
`;

const PageNumber = styled.div`
  ${typography.Sans14};
  color: ${palette.slate60};
`;

const FooterContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  width: 100%;
  margin-top: ${rem(spacing.sm)};
`;

const FooterButtonsContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: right;
  width: 100%;
  align-items: right;
`;

const FooterText = styled.div<{ disabled: boolean; previousButton: boolean }>`
  display: flex;
  margin-left: 1rem;
  ${typography.Sans14};
  color: ${({ previousButton }) =>
    previousButton ? palette.slate60 : palette.signal.links};
  &:hover {
    color: ${({ previousButton }) =>
      previousButton ? palette.slate85 : palette.signal.highlight};
    cursor: pointer;
  }
`;

interface NoteProps {
  showFooter: boolean;
  onNext: () => void;
  onPrevious: () => void;
  index: number;
  numNotes: number;
  label: string;
  text: JSX.Element;
}

const NoteComponent: React.FC<NoteProps> = ({
  showFooter,
  onNext,
  onPrevious,
  index,
  numNotes,
  label,
  text,
}) => {
  return (
    <NoteContainer numNotes={numNotes}>
      <NoteLabelContainer>
        <NoteLabel>{label}</NoteLabel>
      </NoteLabelContainer>
      <NoteText>{text}</NoteText>
      {showFooter && (
        <FooterContainer>
          <PageNumber>
            {index + 1}/{numNotes}
          </PageNumber>
          <FooterButtonsContainer>
            <FooterText
              onClick={onPrevious}
              disabled={index === 0}
              previousButton={true}
            >
              Previous
            </FooterText>
            {!(index === numNotes - 1) && (
              <FooterText
                onClick={onNext}
                disabled={index === numNotes - 1}
                previousButton={false}
              >
                Next
              </FooterText>
            )}
          </FooterButtonsContainer>
        </FooterContainer>
      )}
    </NoteContainer>
  );
};

export default NoteComponent;
