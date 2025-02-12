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

import { palette, spacing, typography } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import { FC } from "react";
// we are using useParams to make a custom hook in this file
// eslint-disable-next-line no-restricted-imports
import { NavLink, useNavigate, useParams } from "react-router-dom";
import styled from "styled-components/macro";

import { withPresenterManager } from "~hydration-utils";

import { State } from "../../routes/routes";
import { RouteParams } from "../../routes/utils";
import {
  Dropdown,
  DropdownMenu,
  DropdownMenuItem,
  DropdownToggle,
} from "../Dropdown/Dropdown";
import { useResidentsContext } from "../ResidentsHydrator/context";
import {
  LinkProps,
  ResidentNavMenuPresenter,
} from "./ResidentNavMenuPresenter";

const BORDER = 4;

const Wrapper = styled.nav`
  ${typography.Sans14}

  display: flex;
  gap: ${rem(spacing.lg)};
  align-items: stretch;
  align-self: stretch;

  & > * {
    align-content: center;
    color: ${palette.slate85};
    flex: 1 0 auto;
    min-width: ${rem(72)};
    padding: ${rem(BORDER)} 0;
    text-align: center;
    text-decoration: none;
  }

  a.active {
    border-top: ${rem(BORDER)} solid ${palette.pine4};
    color: ${palette.pine1};
    padding-top: 0;
  }
`;

const OpportunitiesMenu: FC<{ links: Array<LinkProps> }> = observer(
  function OpportunitiesMenu({ links }) {
    const navigate = useNavigate();

    return (
      <Dropdown>
        <DropdownToggle kind="borderless" showCaret>
          Opportunities
        </DropdownToggle>
        <DropdownMenu alignment="right">
          {links.map((link) => (
            // preferably these would be React Router Links but the design system
            // Dropdown component does not support this
            <DropdownMenuItem onClick={() => navigate(link.to)} key={link.to}>
              {link.children}
            </DropdownMenuItem>
          ))}
        </DropdownMenu>
      </Dropdown>
    );
  },
);

const ManagedComponent: FC<{ presenter: ResidentNavMenuPresenter }> = observer(
  function ResidentNavMenu({ presenter }) {
    return (
      <Wrapper>
        {presenter.homeLink && <NavLink end {...presenter.homeLink} />}
        {presenter.opportunityLinks && (
          <OpportunitiesMenu links={presenter.opportunityLinks} />
        )}
        {presenter.searchLink && <NavLink end {...presenter.searchLink} />}
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

  return new ResidentNavMenuPresenter(
    residentsStore.config,
    residentsStore.userStore,
    routeParams,
  );
}

export const ResidentNavMenu = withPresenterManager({
  usePresenter,
  ManagedComponent,
  managerIsObserver: true,
});
