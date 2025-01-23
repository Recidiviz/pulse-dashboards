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

import { palette, spacing, typography } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import styled from "styled-components/macro";

import { formatFullDate } from "../../utils/date";
import { useSingleResidentContext } from "../SingleResidentHydrator/context";

const ItemsWrapper = styled.dl`
  margin: 0;
`;

const ItemHeading = styled.dt`
  ${typography.Sans14}

  color: ${palette.slate85};
  margin-bottom: ${rem(spacing.sm)};
`;

const ItemValue = styled.dd`
  ${typography.Sans24}

  margin: 0;
`;

export const Progress = observer(function Progress() {
  const { resident } = useSingleResidentContext();

  return (
    <ItemsWrapper>
      <ItemHeading>Current release date</ItemHeading>
      <ItemValue>
        {resident.releaseDate
          ? formatFullDate(resident.releaseDate)
          : "Unknown"}
      </ItemValue>
    </ItemsWrapper>
  );
});
