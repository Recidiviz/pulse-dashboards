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

import { Icon, palette, spacing, typography } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import { FC } from "react";
import {
  useTypedParams,
  useTypedSearchParams,
} from "react-router-typesafe-routes/dom";
import styled from "styled-components/macro";

import { withPresenterManager } from "~hydration-utils";

import { stateConfigsByUrlSlug } from "../../configs/stateConstants";
import { State } from "../../routes/routes";
import { MainContentHydrator } from "../PageHydrator/MainContentHydrator";
import { useRootStore } from "../StoreProvider/useRootStore";
import { usePageTitle } from "../usePageTitle/usePageTitle";
import { LandingPageCopyWrapper } from "./LandingPageCopyWrapper";
import { LandingPageSelector } from "./LandingPageSelector";
import { LandingStateSpecificPresenter } from "./LandingStateSpecificPresenter";

const ExamplesWrapper = styled.ul`
  ${typography.Body14}

  color: ${palette.slate85};
  column-gap: ${rem(spacing.xl)};
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(${rem(175)}, 100%), 1fr));
  list-style-type: none;
  margin: 1em 0;
  padding: 0;
  row-gap: ${rem(spacing.lg)};
`;

const ManagedComponent: FC<{
  presenter: LandingStateSpecificPresenter;
}> = observer(function LandingStateSpecific({ presenter }) {
  return (
    <>
      <LandingPageCopyWrapper>{presenter.copy.intro}</LandingPageCopyWrapper>
      <LandingPageSelector
        label={presenter.copy.selectorLabel}
        placeholder={presenter.copy.selectorPlaceholder}
        options={presenter.selectorOptions}
        onChange={presenter.setSelectedConnection}
        disableButton={!presenter.selectedConnectionName}
        onButtonClick={presenter.goToLogin}
      />
      <LandingPageCopyWrapper>
        {presenter.copy.useCases.intro}
      </LandingPageCopyWrapper>
      <ExamplesWrapper>
        {presenter.copy.useCases.examples.map((e) => (
          <li key={e.description}>
            <Icon kind={e.icon} size={32} />
            <p>{e.description}</p>
          </li>
        ))}
      </ExamplesWrapper>
    </>
  );
});

function usePresenter() {
  const { stateSlug } = useTypedParams(State);
  const [{ returnToPath }] = useTypedSearchParams(State);
  const {
    loginConfigStore,
    userStore: { authClient },
  } = useRootStore();

  usePageTitle(stateConfigsByUrlSlug[stateSlug]?.displayName);

  return new LandingStateSpecificPresenter(
    loginConfigStore,
    authClient,
    stateSlug,
    returnToPath,
  );
}

export const LandingStateSpecific = withPresenterManager({
  usePresenter,
  managerIsObserver: false,
  HydratorComponent: MainContentHydrator,
  ManagedComponent,
});
