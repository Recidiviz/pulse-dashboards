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
import { FC, memo } from "react";
import { useParams } from "react-router-dom";
import styled from "styled-components/macro";

import { NotFound } from "../NotFound/NotFound";
import { PageHydrator } from "../PageHydrator/PageHydrator";
import { useRootStore } from "../StoreProvider/useRootStore";
import { usePageTitle } from "../usePageTitle/usePageTitle";
import { LandingPageCopyWrapper } from "./LandingPageCopyWrapper";
import { LandingPageLayout } from "./LandingPageLayout";
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

const LandingStateSpecificWithPresenter: FC<{
  presenter: LandingStateSpecificPresenter;
}> = observer(function LandingStateSpecificWithPresenter({ presenter }) {
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

export const LandingStateSpecific = memo(function LandingStateSpecific() {
  usePageTitle(undefined);
  const { landingPageUrl } = useParams();
  const {
    loginConfigStore,
    userStore: { authClient },
  } = useRootStore();

  // this is just type safety, in practice we do not expect this param to ever be missing
  if (!landingPageUrl) return <NotFound />;

  const presenter = new LandingStateSpecificPresenter(
    loginConfigStore,
    authClient,
    landingPageUrl,
  );

  return (
    <LandingPageLayout>
      <PageHydrator hydratable={presenter}>
        <LandingStateSpecificWithPresenter presenter={presenter} />
      </PageHydrator>
    </LandingPageLayout>
  );
});
