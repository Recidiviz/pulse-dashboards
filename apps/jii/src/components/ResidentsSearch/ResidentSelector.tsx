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

import { Body16 } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { FC, useId } from "react";
import { useNavigate } from "react-router-dom";
import { useTypedParams } from "react-router-typesafe-routes/dom";

import { withPresenterManager } from "~hydration-utils";

import { State } from "../../routes/routes";
import { MainContentHydrator } from "../PageHydrator/MainContentHydrator";
import { useResidentsContext } from "../ResidentsHydrator/context";
import { Selector } from "../Selector/Selector";
import { ResidentSelectorPresenter } from "./ResidentSelectorPresenter";

function usePresenter({ facilityId }: { facilityId: string }) {
  const { residentsStore } = useResidentsContext();
  return new ResidentSelectorPresenter(residentsStore, facilityId);
}

const ManagedComponent: FC<{ presenter: ResidentSelectorPresenter }> = observer(
  function ResidentSelector({ presenter }) {
    const navigate = useNavigate();
    const residentLabelId = useId();
    const urlParams = useTypedParams(State.Search);
    return (
      <>
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
      </>
    );
  },
);

export const ResidentSelector = withPresenterManager({
  usePresenter,
  ManagedComponent,
  managerIsObserver: true,
  HydratorComponent: MainContentHydrator,
});
