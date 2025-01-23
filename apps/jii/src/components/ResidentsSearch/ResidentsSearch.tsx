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
import { useNavigate } from "react-router-dom";
import { useTypedParams } from "react-router-typesafe-routes/dom";
import styled from "styled-components/macro";

import { withPresenterManager } from "~hydration-utils";

import { State } from "../../routes/routes";
import { MainContentHydrator } from "../PageHydrator/MainContentHydrator";
import { useResidentsContext } from "../ResidentsHydrator/context";
import { Selector } from "../Selector/Selector";
import { useRootStore } from "../StoreProvider/useRootStore";
import { ResidentsSearchPresenter } from "./ResidentsSearchPresenter";

const FacilityLabel = styled.label`
  ${typography.Sans14}

  display: block;
  margin-bottom: ${rem(spacing.lg)};
`;

function usePresenter() {
  const { uiStore } = useRootStore();
  const { residentsStore } = useResidentsContext();
  return new ResidentsSearchPresenter(residentsStore, uiStore);
}

const ManagedComponent: FC<{ presenter: ResidentsSearchPresenter }> = observer(
  function ResidentsSearch({ presenter }) {
    const navigate = useNavigate();
    const residentLabelId = useId();
    const facilityLabelId = useId();
    const urlParams = useTypedParams(State.Search);

    return (
      <div>
        <Header34 as="h1">Look up a resident</Header34>

        <FacilityLabel id={facilityLabelId}>
          Filter by facility:
          <Selector
            labelId={facilityLabelId}
            options={presenter.facilityFilterOptions}
            onChange={(v) => presenter.setFacilityFilter(v)}
            placeholder=""
            defaultValue={presenter.facilityFilterDefaultOption}
          />
        </FacilityLabel>

        <Body16 as="p" id={residentLabelId}>
          Search for a resident to explore what they will see in Opportunities.
        </Body16>
        <Selector
          labelId={residentLabelId}
          options={presenter.selectOptions}
          onChange={(value) => {
            // this should land you on the selected resident's homepage
            navigate(
              State.Resident.buildPath({
                ...urlParams,
                personPseudoId: value.pseudonymizedId,
              }),
            );
          }}
          placeholder="Start typing a resident's name or DOC ID …"
        />
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
