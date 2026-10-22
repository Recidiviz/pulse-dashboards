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
import { NavLink } from "react-router-dom";
import { useTypedParams } from "react-router-typesafe-routes/dom";

import { useRootStore } from "~@jii/data";
import { State } from "~@jii/paths";
import { useCommonTranslations, useUsArTranslations } from "~@jii/translation";

import { Tabs, Wrapper } from "./ProgramsNavBar.styles";

export const ProgramsNavBar = observer(function ProgramsNavBar() {
  const {
    uiStore: { hideHeaderBar },
  } = useRootStore();
  const routeParams = useTypedParams(State.Resident);
  const { t } = useUsArTranslations();
  const { t: tCommon } = useCommonTranslations();

  return (
    <Wrapper
      $hideHeader={hideHeaderBar}
      aria-label={tCommon(($) => $.nav.programsLink)}
    >
      <Tabs>
        <NavLink
          to={State.Resident.ProgramCatalog.InPerson.buildPath(routeParams)}
          end
        >
          {t(($) => $.programs.navBar.inPerson)}
        </NavLink>
        <NavLink
          to={State.Resident.ProgramCatalog.OnMyTablet.buildPath(routeParams)}
        >
          {t(($) => $.programs.navBar.onMyTablet)}
        </NavLink>
      </Tabs>
    </Wrapper>
  );
});
