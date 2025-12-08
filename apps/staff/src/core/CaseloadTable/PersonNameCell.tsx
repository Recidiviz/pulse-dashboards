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

import { spacing } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import styled from "styled-components";

import useIsMobile from "../../hooks/useIsMobile";
import { JusticeInvolvedPerson } from "../../WorkflowsStore";
import { WorkflowsStatusPill } from "../WorkflowsStatusPill/WorkflowsStatusPill";

const PersonNameElement = styled.div.attrs({
  className: "fs-exclude",
})<{ $isMobile: boolean }>`
  display: flex;
  flex-direction: ${({ $isMobile }) => ($isMobile ? "column" : "row")};
  align-items: ${({ $isMobile }) => ($isMobile ? "flex-start" : "center")};
  text-wrap: nowrap;
  gap: ${({ $isMobile }) => rem($isMobile ? spacing.xs : spacing.sm)};
`;

export const PersonNameCell = observer(function PersonNameCell({
  person,
}: {
  person: JusticeInvolvedPerson;
}) {
  const { isMobile } = useIsMobile(true);
  const displayName =
    person.stateCode === "US_TX"
      ? person.displayPreferredNameLastFirst
      : person.displayPreferredName;
  return (
    <PersonNameElement $isMobile={isMobile}>
      {displayName} <WorkflowsStatusPill person={person} />
    </PersonNameElement>
  );
});
