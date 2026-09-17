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
import { useParams } from "react-router-dom";

import { withPresenterManager } from "~hydration-utils";

import NotFound from "../../../components/NotFound";
import { useRootStore } from "../../../components/StoreProvider";
import { ParoleCaseProfilePresenter } from "../../../ParoleStore/presenters/ParoleCaseProfilePresenter";
import { TenantId } from "../../../RootStore/types";
import ModelHydrator from "../../ModelHydrator";
import { CASE_PROFILE_COMPONENTS_BY_TENANT } from "./caseProfileComponentsByTenant";

const ParoleCaseProfileContents = observer(function ParoleCaseProfileContents({
  presenter,
}: {
  presenter: ParoleCaseProfilePresenter;
}) {
  const { currentTenantId } = useRootStore();
  // ModelHydrator only renders this component once hydration has succeeded,
  // so `presenter.caseDetail` is safe to access here.
  const { caseDetail, config } = presenter;

  const StateCaseProfile = currentTenantId
    ? CASE_PROFILE_COMPONENTS_BY_TENANT[currentTenantId]
    : undefined;

  if (!StateCaseProfile) {
    throw new Error(
      `Tenant [${currentTenantId}] has no Parole case profile component.`,
    );
  }

  return <StateCaseProfile caseDetail={caseDetail} config={config} />;
});

function usePresenter({
  docId,
}: {
  docId: string;
  currentTenantId: TenantId | undefined;
}) {
  const { paroleStore } = useRootStore();
  return new ParoleCaseProfilePresenter(paroleStore, docId);
}

const ParoleCaseProfileHydrator = withPresenterManager({
  usePresenter,
  ManagedComponent: ParoleCaseProfileContents,
  managerIsObserver: false,
  HydratorComponent: ModelHydrator,
});

export function ParoleCaseProfile() {
  const { docId } = useParams<{ docId: string }>();
  const { currentTenantId } = useRootStore();

  if (!docId) return <NotFound />;

  return (
    <ParoleCaseProfileHydrator
      docId={docId}
      currentTenantId={currentTenantId}
    />
  );
}
