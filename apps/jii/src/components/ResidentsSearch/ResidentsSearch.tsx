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
import React, { useId } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components/macro";

import { PageHydrator } from "../PageHydrator/PageHydrator";
import { Selector } from "../Selector/Selector";
import { useRootStore } from "../StoreProvider/useRootStore";
import { ResidentsSearchPresenter } from "./ResidentsSearchPresenter";

const FacilityLabel = styled.label`
  ${typography.Sans14}

  display: block;
  margin-bottom: ${rem(spacing.lg)};
`;

const ResidentsSearchWithPresenter: React.FC<{
  presenter: ResidentsSearchPresenter;
}> = observer(function ResidentsSearchWithPresenter({ presenter }) {
  const navigate = useNavigate();
  const residentLabelId = useId();
  const facilityLabelId = useId();

  return (
    <PageHydrator hydratable={presenter}>
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
          defaultValue={presenter.defaultOption}
          onChange={(value) => {
            presenter.setActiveResident(value);
            // this should land you on the selected resident's homepage
            navigate("/");
          }}
          placeholder="Start typing a resident's name or DOC ID …"
        />
      </div>
    </PageHydrator>
  );
});

export const ResidentsSearch = observer(function ResidentsSearch() {
  const { residentsStore, uiStore } = useRootStore();
  if (!residentsStore) return null;

  return (
    <ResidentsSearchWithPresenter
      presenter={new ResidentsSearchPresenter(residentsStore, uiStore)}
    />
  );
});
