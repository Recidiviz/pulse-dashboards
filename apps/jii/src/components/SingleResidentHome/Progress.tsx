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

import { spacing, typography } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import { FC } from "react";
import { useTypedParams } from "react-router-typesafe-routes/dom";
import styled from "styled-components/macro";

import { palette } from "~design-system";

import { ProgressModuleConfig } from "../../configs/types";
import { State } from "../../routes/routes";
import { formatFullDate } from "../../utils/date";
import { GoButton } from "../ButtonLink/GoButton";
import { useSingleResidentContext } from "../SingleResidentHydrator/context";

const ItemsWrapper = styled.dl`
  margin: 0;
  margin-bottom: ${rem(spacing.lg)};
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

export const Progress: FC<{ config: ProgressModuleConfig }> = observer(
  function Progress({ config }) {
    const { resident } = useSingleResidentContext();
    const urlParams = useTypedParams(State.Resident);

    return (
      <div>
        <ItemsWrapper>
          <ItemHeading>Current release date</ItemHeading>
          <ItemValue>
            {resident.releaseDate
              ? formatFullDate(resident.releaseDate)
              : "N/A"}
          </ItemValue>
        </ItemsWrapper>
        <GoButton
          to={State.Resident.Progress.InfoPage.buildPath({
            ...urlParams,
            pageSlug: config.progressPage.urlSlug,
          })}
        >
          {config.progressPage.linkText}
        </GoButton>
      </div>
    );
  },
);
