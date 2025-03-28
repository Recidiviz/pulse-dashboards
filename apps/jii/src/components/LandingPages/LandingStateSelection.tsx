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
import { useNavigate } from "react-router-dom";

import { withPresenterManager } from "~hydration-utils";

import { MainContentHydrator } from "../PageHydrator/MainContentHydrator";
import { useRootStore } from "../StoreProvider/useRootStore";
import { usePageTitle } from "../usePageTitle/usePageTitle";
import { LandingPageCopyWrapper } from "./LandingPageCopyWrapper";
import { LandingPageSelector } from "./LandingPageSelector";
import { LandingStateSelectionPresenter } from "./LandingStateSelectionPresenter";

const ManagedComponent: FC<{
  presenter: LandingStateSelectionPresenter;
}> = observer(function LoginStateSelection({ presenter }) {
  usePageTitle(undefined);

  const navigate = useNavigate();

  return (
    <>
      <LandingPageCopyWrapper>{presenter.copy.intro}</LandingPageCopyWrapper>

      <LandingPageSelector
        label={presenter.copy.selectorLabel}
        placeholder={presenter.copy.selectorPlaceholder}
        options={presenter.selectOptions}
        onChange={presenter.setSelectedOption}
        disableButton={!presenter.stateLandingPageUrl}
        onButtonClick={() => {
          // safe to assert because the button is disabled when value is missing
          navigate(presenter.stateLandingPageUrl as string);
        }}
      />
    </>
  );
});

function usePresenter() {
  const { loginConfigStore } = useRootStore();

  return new LandingStateSelectionPresenter(loginConfigStore);
}

export const LoginStateSelection = withPresenterManager({
  usePresenter,
  ManagedComponent,
  HydratorComponent: MainContentHydrator,
  managerIsObserver: false,
});
