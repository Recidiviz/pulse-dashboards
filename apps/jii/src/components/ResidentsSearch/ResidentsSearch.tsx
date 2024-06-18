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

import { Body32, Sans14, Sans16, spacing } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import React from "react";
import { useNavigate } from "react-router-dom";
import ReactSelect from "react-select";

import { PageHydrator } from "../PageHydrator/PageHydrator";
import { useRootStore } from "../StoreProvider/useRootStore";
import { ResidentsSearchPresenter } from "./ResidentsSearchPresenter";

const ResidentsSearchWithPresenter: React.FC<{
  presenter: ResidentsSearchPresenter;
}> = observer(function ResidentsSearchWithPresenter({ presenter }) {
  const navigate = useNavigate();

  return (
    <PageHydrator hydratable={presenter}>
      <div>
        <Body32 as="h1">Select a resident</Body32>

        <Sans14 style={{ marginBottom: rem(spacing.lg) }}>
          Filter by facility:
          <ReactSelect
            options={presenter.facilityFilterOptions}
            defaultValue={presenter.facilityFilterDefaultOption}
            onChange={(o) => {
              if (o) {
                presenter.setFacilityFilter(o.value);
              }
            }}
            isClearable={false}
          />
        </Sans14>

        <Sans16>
          <ReactSelect
            options={presenter.selectOptions}
            defaultValue={presenter.defaultOption}
            onChange={(o) => {
              presenter.setActiveResident(o?.value);
              if (o) {
                // this should land you on the selected resident's homepage
                navigate("/");
              }
            }}
          />
        </Sans16>
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
