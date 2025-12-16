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

import { rem } from "polished";
import styled from "styled-components";

import { GoBackButton, JIIButton } from "~@jii/common-ui";
import { State } from "~@jii/paths";
import { Icon, spacing } from "~design-system";

const RNAPageFooter = styled.div`
  margin-top: ${rem(spacing.md)};
  display: flex;
  justify-content: flex-end;
`;

const PreviousPageButton = styled(GoBackButton)`
  margin-right: auto;
`;

export function NavigationButtons({
  showPrevious = true,
  showSubmit = false,
}: {
  showPrevious?: boolean;
  showSubmit?: boolean;
}) {
  return (
    <RNAPageFooter>
      {showPrevious && (
        <PreviousPageButton
          to={State.Resident.UsNcRNA.$.FormPage.buildRelativePath({})}
        >
          Previous
        </PreviousPageButton>
      )}

      {showSubmit ? (
        <JIIButton>
          <span>Submit</span>
          <Icon kind="Arrow" size={16} />
        </JIIButton>
      ) : (
        <JIIButton kind={"secondary"}>
          <span>Next</span>
          <Icon kind="Arrow" size={16} />
        </JIIButton>
      )}
    </RNAPageFooter>
  );
}
