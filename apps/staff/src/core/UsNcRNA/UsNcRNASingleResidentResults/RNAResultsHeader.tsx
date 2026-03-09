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

import { Sans18, Sans24, Serif34 } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import styled from "styled-components";

import { palette, spacing } from "~design-system";

import PersonId from "../../PersonId";
import { WorkflowsBackButton } from "../../WorkflowsLayouts/WorkflowsBackButton";
import { RNABadge } from "../RNABadge";
import { RNAMarkSubmittedButton } from "../RNAMarkSubmittedButton";
import { PaddedRNAContent } from "./ResultsPage";
import { ResultsPagePresenter } from "./ResultsPagePresenter";
import { RNAPrintButton } from "./RNAPrintButton";
import { SubmissionDateandUndo } from "./SubmissionDateAndUndo";

const HeaderContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.sm)};
  background-color: ${palette.marble3};
  padding-bottom: ${rem(spacing.sm)};
`;

const Columns = styled.div`
  margin-top: ${rem(spacing.xl)};
  display: grid;
  grid-template-columns: 1fr auto;
  column-gap: ${rem(spacing.sm)};
  align-items: end;
  row-gap: ${rem(spacing.md)};
`;

const Left = styled.div`
  grid-area: auto / 1;
`;
const MiddleRight = styled.div`
  grid-area: auto / 2;
`;
const Right = styled.div`
  grid-area: auto / 3;
`;

const Heading = styled(Sans18).attrs({ as: "h2" })`
  color: ${palette.slate85};
`;

const Name = styled(Serif34).attrs({ as: "span" })`
  color: ${palette.pine1};
  margin-right: ${rem(spacing.sm)};
`;

const IdText = styled(Sans24).attrs({ as: "span" })`
  color: ${palette.data.teal2};
`;

export const RNAResultsHeader = observer(function RNAResultsHeader({
  presenter,
}: {
  presenter: ResultsPagePresenter;
}) {
  const { resident, status } = presenter;

  return (
    <HeaderContainer>
      <PaddedRNAContent>
        <WorkflowsBackButton />
        <Columns>
          <Left>
            <Heading>RNA Self-Report Results</Heading>
            <div>
              <Name>{resident.displayName}</Name>
              <PersonId
                personId={resident.displayId}
                pseudoId={resident.pseudonymizedId}
              >
                <IdText>{resident.displayId}</IdText>
              </PersonId>
            </div>
          </Left>
          <MiddleRight>
            <RNAPrintButton presenter={presenter} />
          </MiddleRight>
          <Right>
            <RNAMarkSubmittedButton presenter={presenter} />
          </Right>
          <Left>
            <RNABadge kind={status} />
          </Left>
          <Right>
            <SubmissionDateandUndo presenter={presenter} />
          </Right>
        </Columns>
      </PaddedRNAContent>
    </HeaderContainer>
  );
});
