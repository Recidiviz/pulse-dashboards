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

import { observer } from "mobx-react-lite";

import { withPresenterManager } from "~hydration-utils";

import { useRootStore } from "../../components/StoreProvider";
import { SupervisionOfficerOutcomesPresenter } from "../../InsightsStore/presenters/SupervisionOfficerOutcomesPresenter";
import InsightsActionStrategyBanner from "../InsightsActionStrategyBanner";
import ModelHydrator from "../ModelHydrator";

const ManagedComponent = observer(function InsightsStaffActionStrategyBanner({
  presenter,
}: {
  presenter: SupervisionOfficerOutcomesPresenter;
}) {
  const {
    actionStrategyCopy,
    setUserHasSeenActionStrategy,
    disableSurfaceActionStrategies,
  } = presenter;

  if (actionStrategyCopy)
    return (
      <InsightsActionStrategyBanner
        actionStrategy={actionStrategyCopy}
        bannerViewedCallback={setUserHasSeenActionStrategy}
        disableBannerCallback={disableSurfaceActionStrategies}
      />
    );
});

function usePresenter() {
  const {
    insightsStore: { supervisionStore },
  } = useRootStore();

  if (!supervisionStore?.officerPseudoId) return null;

  return new SupervisionOfficerOutcomesPresenter(
    supervisionStore,
    supervisionStore.officerPseudoId,
  );
}

export const InsightsStaffActionStrategyBanner = withPresenterManager({
  usePresenter,
  ManagedComponent,
  managerIsObserver: true,
  HydratorComponent: ModelHydrator,
});
