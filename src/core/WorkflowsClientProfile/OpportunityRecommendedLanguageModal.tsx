// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2022 Recidiviz, Inc.
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
  Body16,
  Button,
  Icon,
  Modal,
  palette,
  Sans14,
  Sans16,
  Sans24,
  spacing,
} from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem, rgba } from "polished";
import React, { useState } from "react";
import useClipboard from "react-use-clipboard";
import styled from "styled-components/macro";

import { Opportunity } from "../../WorkflowsStore";

// we want this to display inline, which a <button> cannot do
const TriggerButton = styled.a.attrs({
  role: "button",
  tabIndex: 0,
})`
  color: ${palette.signal.links};

  &:hover,
  &:focus {
    color: ${palette.pine4};
    text-decoration: underline;
  }
`;

const StyledModal = styled(Modal)`
  .ReactModal__Content {
    padding: 0;
    max-width: 85vw;
    width: ${rem(600)};
  }
`;

const ModalControls = styled.div`
  padding: ${rem(spacing.lg)} ${rem(spacing.md)};
  text-align: right;
`;

const ModalTitle = styled(Sans24)`
  border-bottom: 1px solid ${rgba(palette.slate, 0.15)};
  color: ${palette.pine2};
  padding: ${rem(spacing.sm)} ${rem(spacing.md)};
`;

const LanguagePrompt = styled(Sans16)`
  color: ${palette.slate70};
  padding: ${rem(spacing.lg)} ${rem(spacing.md)} ${rem(spacing.md)};
`;

const RecommendedLanguage = styled(Body16)`
  color: ${palette.pine2};
  padding: 0 ${rem(spacing.md)} ${rem(spacing.xl)};
`;

const CopyButtonWrapper = styled.div`
  align-items: center;
  display: flex;
  gap: ${rem(spacing.md)};
  padding: ${rem(spacing.sm)} ${rem(spacing.md)} ${rem(spacing.lg)};
`;

type OpportunityRecommendedLanguageModalProps = {
  opportunity: Opportunity;
  children: string;
};

export const OpportunityRecommendedLanguageModal = observer(
  ({ opportunity, children }: OpportunityRecommendedLanguageModalProps) => {
    const [showModal, setShowModal] = useState(false);
    const [isCopied, copyToClipboard] = useClipboard(
      opportunity.almostEligibleRecommendedNote?.text ?? "",
      { successDuration: 5000 }
    );

    // if no note specified then this component should just be a noop
    if (!opportunity.almostEligibleRecommendedNote) return <>{children}</>;

    return (
      <>
        <TriggerButton
          onClick={() => setShowModal(!showModal)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              setShowModal(!showModal);
              event.preventDefault();
            }
          }}
        >
          {children}
        </TriggerButton>
        <StyledModal
          isOpen={showModal}
          onRequestClose={() => setShowModal(false)}
        >
          <ModalControls>
            <Button kind="link" onClick={() => setShowModal(false)}>
              <Icon kind="Close" size="14" color={palette.pine2} />
            </Button>
          </ModalControls>
          <ModalTitle>
            {opportunity.almostEligibleRecommendedNote.title}
          </ModalTitle>
          <LanguagePrompt>
            Let {opportunity.person.fullName.givenNames} know they are almost
            eligible:
          </LanguagePrompt>
          <RecommendedLanguage>
            {opportunity.almostEligibleRecommendedNote.text}
          </RecommendedLanguage>
          <CopyButtonWrapper>
            <Button
              kind="primary"
              shape="pill"
              onClick={() => copyToClipboard()}
            >
              Copy to clipboard
            </Button>{" "}
            {isCopied ? <Sans14>Note text copied</Sans14> : null}
          </CopyButtonWrapper>
        </StyledModal>
      </>
    );
  }
);
