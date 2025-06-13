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

import { observer } from "mobx-react-lite";
import { FC } from "react";
import { useTypedParams } from "react-router-typesafe-routes/dom";

import { withPresenterManager } from "~hydration-utils";

import { LinkedInfoPage } from "../../../../common/components/LinkedInfoPage/LinkedInfoPage";
import { State } from "../../../../routes/routes";
import { BackLink } from "../BackLink/BackLink";
import { useEGTDataContext } from "../EGTDataContext/context";
import { DefinitionPagePresenter } from "./DefinitionPresenter";

const ManagedComponent: FC<{
  presenter: DefinitionPagePresenter;
}> = observer(function Definition({ presenter }) {
  return (
    <>
      <BackLink {...presenter.backLink} />
      <LinkedInfoPage contents={presenter} />
    </>
  );
});

function usePresenter() {
  const { pageSlug } = useTypedParams(State.Resident.EGT.Definition);
  const { copy } = useEGTDataContext();

  return new DefinitionPagePresenter(pageSlug, copy);
}

export const Definition = withPresenterManager({
  usePresenter,
  managerIsObserver: false,
  ManagedComponent,
});
