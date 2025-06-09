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

import { spacing, typography } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import { FC } from "react";
// we are using useParams to make a custom hook in this file
// eslint-disable-next-line no-restricted-imports
import { NavLink, useParams } from "react-router-dom";
import styled from "styled-components/macro";

import { palette } from "~design-system";
import { withPresenterManager } from "~hydration-utils";

import { State } from "../../routes/routes";
import { RouteParams } from "../../routes/utils";
import { useResidentsContext } from "../ResidentsHydrator/context";
import { NavMenu } from "./NavMenu";
import { ResidentNavBarPresenter } from "./ResidentNavBarPresenter";

const BORDER = 4;

const Wrapper = styled.nav`
  ${typography.Sans14}

  display: flex;
  gap: ${rem(spacing.sm)};
  align-items: stretch;
  align-self: stretch;

  & > a,
  & > button {
    align-content: center;
    color: ${palette.slate85};
    flex: 1 0 auto;
    min-width: ${rem(72)};
    padding: 0 0 ${rem(BORDER)};
    text-align: center;
    text-decoration: none;

    &.active {
      border-bottom: ${rem(BORDER)} solid ${palette.pine4};
      color: ${palette.pine1};
      padding-bottom: 0;
    }
  }
`;

const ManagedComponent: FC<{ presenter: ResidentNavBarPresenter }> = observer(
  function ResidentNavMenu({ presenter }) {
    return (
      <Wrapper>
        {presenter.homeLink && <NavLink {...presenter.homeLink} />}
        <NavMenu links={presenter.menuLinks} />
      </Wrapper>
    );
  },
);

/**
 * Can be called under a state route or a single resident route,
 * and will return the applicable typed URL params accordingly.
 */
function useParamsResidentOptional() {
  const currentRouteParams = useParams();

  let typedParams:
    | RouteParams<typeof State.Resident>
    | RouteParams<typeof State>;
  try {
    typedParams = State.Resident.getTypedParams(currentRouteParams);
  } catch {
    typedParams = State.getTypedParams(currentRouteParams);
  }

  return typedParams;
}

function usePresenter() {
  const { residentsStore } = useResidentsContext();

  const routeParams = useParamsResidentOptional();

  return new ResidentNavBarPresenter(
    residentsStore.config,
    residentsStore.userStore,
    routeParams,
  );
}

export const ResidentNavBar = withPresenterManager({
  usePresenter,
  ManagedComponent,
  managerIsObserver: true,
});
