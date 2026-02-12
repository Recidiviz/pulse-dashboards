// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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

import { Sans18, spacing } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import styled from "styled-components";

import { palette } from "~design-system";

import { RNAMarkSubmittedButton } from "../RNAMarkSubmittedButton";
import { ResultsPagePresenter } from "./ResultsPagePresenter";
import { SubmissionDateandUndo } from "./SubmissionDateAndUndo";

const FooterContainer = styled.div`
  background-color: ${palette.marble3};
  padding: ${rem(spacing.xxl)};
  margin-bottom: ${rem(spacing.lg)};

  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.xl)};
  align-items: center;
  justify-content: center;
`;

const ButtonContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.sm)};
  align-items: center;
  justify-content: center;
`;

const FooterText = styled(Sans18)`
  color: black;
  max-width: 60%;
  text-align: center;
  text-wrap: balance;
`;

export const RNAResultsFooter = observer(function RNAResultsFooter({
  presenter,
}: {
  presenter: ResultsPagePresenter;
}) {
  return (
    <FooterContainer>
      <FooterText>
        You've reached the end of {presenter.resident.preferredGivenName}'s RNA
        assessment results. Make sure you've copied all of the information into
        OPUS.
      </FooterText>
      <ButtonContainer>
        <RNAMarkSubmittedButton presenter={presenter} />
        <SubmissionDateandUndo presenter={presenter} />
      </ButtonContainer>
    </FooterContainer>
  );
});
