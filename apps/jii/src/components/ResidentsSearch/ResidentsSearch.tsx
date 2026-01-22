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

import {
  Body16,
  Header34,
  spacing,
  typography,
} from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import { FC, useId } from "react";
import styled from "styled-components";

import { Selector } from "~@jii/common-ui";
import { useResidentsContext, useRootStore } from "~@jii/data";
import { MainContentHydrator } from "~@jii/layout";
import { withPresenterManager } from "~hydration-utils";

import { ResidentSelector } from "./ResidentSelector";
import { ResidentsSearchPresenter } from "./ResidentsSearchPresenter";

const FilterLabel = styled.label`
  ${typography.Sans14}

  display: block;
  margin-bottom: ${rem(spacing.lg)};
`;

function usePresenter() {
  const { uiStore, userStore } = useRootStore();
  const { residentsStore } = useResidentsContext();

  return new ResidentsSearchPresenter(residentsStore, uiStore, userStore);
}

const ManagedComponent: FC<{ presenter: ResidentsSearchPresenter }> = observer(
  function ResidentsSearch({ presenter }) {
    const filterLabelId = useId();

    return (
      <div>
        <Header34 as="h1">Look up a resident</Header34>

        {presenter.residentFilterOptions.length > 1 ? (
          <FilterLabel id={filterLabelId}>
            Select a location to filter by:
            <Selector
              labelId={filterLabelId}
              options={presenter.residentFilterOptions}
              onChange={(v) => presenter.setResidentsFilter(v)}
              placeholder=""
              defaultValue={presenter.residentFilterDefaultOption}
            />
          </FilterLabel>
        ) : (
          <Body16 as="p">
            Showing residents in {presenter.residentFilterDefaultOption?.value}
          </Body16>
        )}

        {presenter.residentFilterDefaultOption?.value && (
          <ResidentSelector
            key={presenter.residentFilterDefaultOption.value}
            facilityId={presenter.residentFilterDefaultOption.value}
          />
        )}
      </div>
    );
  },
);

export const ResidentsSearch = withPresenterManager({
  usePresenter,
  managerIsObserver: false,
  ManagedComponent,
  HydratorComponent: MainContentHydrator,
});
