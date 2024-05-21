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
import { useParams } from "react-router-dom";

import { Hydrator } from "~hydration-utils";

import { PSIStore } from "../../datastores/PSIStore";
import { CaseDetailsPresenter } from "../../presenters/CaseDetailsPresenter";
import { ErrorMessage } from "../Error";

const CaseDetailsWithPresenter = observer(function CaseDetailsWithPresenter({
  presenter,
}: {
  presenter: CaseDetailsPresenter;
}) {
  const { caseAttributes } = presenter;

  return <>{JSON.stringify(caseAttributes)}</>;
});

export const CaseDetails: React.FC<{
  psiStore: PSIStore;
}> = observer(function CaseDetails({ psiStore }) {
  const { psiCaseStore } = psiStore;
  const params = useParams();

  if (!params["caseId"]) {
    return <>No case ID found.</>;
  }

  const presenter = new CaseDetailsPresenter(psiCaseStore, params["caseId"]);

  return (
    <Hydrator hydratable={presenter} failed={<ErrorMessage />}>
      <CaseDetailsWithPresenter presenter={presenter} />
    </Hydrator>
  );
});
