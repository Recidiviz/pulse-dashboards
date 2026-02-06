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
import { rem } from "polished";
import styled from "styled-components";

import { palette, spacing } from "~design-system";

import { Resident } from "../../../WorkflowsStore/Resident";
import PersonId from "../../PersonId";
import { WorkflowsBackButton } from "../../WorkflowsLayouts/WorkflowsBackButton";
import { RNABadge } from "../RNABadge";
import { RNAMarkSubmittedButton } from "../RNAMarkSubmittedButton";
import { PaddedRNAContent } from "../UsNcRNASingleResident";

const HeaderContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.sm)};
  background-color: ${palette.marble3};
  padding-bottom: ${rem(spacing.sm)};
`;

const Heading = styled(Sans18).attrs({ as: "h2" })`
  margin-top: ${rem(spacing.xl)};
  color: ${palette.slate85};
`;

const MainInfo = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: ${rem(spacing.sm)};
`;

const Name = styled(Serif34).attrs({ as: "span" })`
  color: ${palette.pine1};
  margin-right: ${rem(spacing.sm)};
`;

const IdText = styled(Sans24).attrs({ as: "span" })`
  color: ${palette.data.teal2};
`;

export const RNAResultsHeader = ({ resident }: { resident: Resident }) => {
  return (
    <HeaderContainer>
      <PaddedRNAContent>
        <WorkflowsBackButton />
        <Heading>RNA Assessment Results</Heading>
        <MainInfo>
          <div>
            <Name>{resident.displayName}</Name>
            <PersonId
              personId={resident.displayId}
              pseudoId={resident.pseudonymizedId}
            >
              <IdText>{resident.displayId}</IdText>
            </PersonId>
          </div>
          <RNAMarkSubmittedButton />
        </MainInfo>
        <RNABadge kind={"residentComplete"} />
      </PaddedRNAContent>
    </HeaderContainer>
  );
};
