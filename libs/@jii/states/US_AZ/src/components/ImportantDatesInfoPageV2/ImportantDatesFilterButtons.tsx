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

import { observer } from "mobx-react-lite";
import { rem } from "polished";
import styled from "styled-components";

import { SlateCopy } from "~@jii/common-ui";
import { useUsAzTranslations } from "~@jii/translation";
import { Button, palette, spacing } from "~design-system";

import { ImportantDatesFAQPresenter } from "./ImportantDatesFAQPresenter";

const FilterButtonContainer = styled.div`
  width: 100%;
  display: flex;
  gap: ${rem(spacing.md)};
  margin: ${rem(spacing.lg)} 0;
`;

const FilterButton = styled(Button)<{ $selected: boolean }>`
  flex: 1;
  height: ${rem(49)};
  border: 1px solid;

  ${({ $selected }) =>
    $selected
      ? `
          background-color: ${palette.pine2};
          border-color: ${palette.pine2};
          color: ${palette.marble1};

          &:hover, &:active {
            background-color: ${palette.pine1};
            border-color: ${palette.pine1};
          }
        `
      : `
          background-color: ${palette.marble1};
          border-color: ${palette.slate60};
          color: ${palette.slate85};

          &:hover, &:active {
            background-color: ${palette.marble2};
            border-color: ${palette.slate60};
          }
        `}
`;

export const ImportantDatesFilterButtons = observer(
  function ImportantDatesFilterButtons({
    presenter,
  }: {
    presenter: ImportantDatesFAQPresenter;
  }) {
    const { t } = useUsAzTranslations();

    return (
      <>
        <SlateCopy>
          {t(($) => $.importantDatesInfoPage.filterContent)}
        </SlateCopy>

        <FilterButtonContainer>
          <FilterButton
            shape={"block"}
            $selected={!presenter.isViewingAllDates}
            onClick={() => {
              presenter.isViewingAllDates = false;
            }}
          >
            {t(($) => $.importantDatesInfoPage.personalDates)} (
            {presenter.personalDates.length})
          </FilterButton>
          <FilterButton
            shape={"block"}
            $selected={presenter.isViewingAllDates}
            onClick={() => {
              presenter.isViewingAllDates = true;
            }}
          >
            {t(($) => $.importantDatesInfoPage.allDates)}
          </FilterButton>
        </FilterButtonContainer>
      </>
    );
  },
);
