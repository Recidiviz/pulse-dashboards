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

import { Sans16, Serif34 } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import React, { memo } from "react";
import { useNavigate } from "react-router-dom";
import ReactSelect from "react-select";

import { PageHydrator } from "../PageHydrator/PageHydrator";
import { useResidentsStore } from "../StoreProvider/useResidentsStore";
import { PageSearchPresenter } from "./PageSearchPresenter";

const Search: React.FC<{ presenter: PageSearchPresenter }> = observer(
  function Search({ presenter }) {
    const navigate = useNavigate();

    return (
      <PageHydrator hydratable={presenter}>
        <div>
          <Serif34 as="h1">Select a resident</Serif34>
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
  },
);

export const PageSearch = memo(function PageSearch() {
  return <Search presenter={new PageSearchPresenter(useResidentsStore())} />;
});
