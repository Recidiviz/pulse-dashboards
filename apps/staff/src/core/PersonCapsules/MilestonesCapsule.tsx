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
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import styled from "styled-components/macro";

import { palette } from "~design-system";
import { PersonInitialsAvatar } from "~ui";

import { JusticeInvolvedPerson } from "../../WorkflowsStore";

export type MilestonesCapsuleProps = {
  person: JusticeInvolvedPerson;
};

const PersonName = styled.span`
  ${typography.Sans16}
  color: ${palette.pine2};
`;

const PersonId = styled.span`
  ${typography.Sans12}
  color: ${palette.slate70};
`;

const PersonInfo = styled.div`
  display: flex;
  flex-flow: column nowrap;
`;
const Wrapper = styled.div`
  align-items: center;
  column-gap: ${rem(spacing.sm)};
  display: flex;
  flex-flow: row nowrap;
`;

export const MilestonesCapsule = observer(function MilestonesCapsule({
  person,
}: MilestonesCapsuleProps): JSX.Element {
  return (
    <Wrapper>
      <PersonInitialsAvatar name={person.displayPreferredName} size={40} />
      <PersonInfo>
        <PersonName className="PersonName fs-exclude">
          {person.displayName}
        </PersonName>
        <PersonId className="fs-exclude">{person.displayId}</PersonId>
      </PersonInfo>
    </Wrapper>
  );
});
