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

import { NavLink } from "react-router-dom";
import { useTypedParams } from "react-router-typesafe-routes/dom";

import { State } from "~@jii/paths";
import { useUsMaTranslations } from "~@jii/translation";

import { RESOURCE_CATEGORIES } from "../ctaConfigs";
import {
  Content,
  Divider,
  Links,
  SectionLabel,
  Wrapper,
} from "./ReentryNavBar.styles";

export const ReentryNavBar = () => {
  const { t } = useUsMaTranslations();
  const routeParams = useTypedParams(State.Resident);

  return (
    <Wrapper aria-label={t(($) => $.reentry.navBar.sectionLabel)}>
      <Content>
        <SectionLabel>{t(($) => $.reentry.navBar.sectionLabel)}</SectionLabel>
        <Divider />
        <Links>
          <NavLink
            to={State.Resident.UsMaReentry.Overview.buildPath(routeParams)}
            end
          >
            {t(($) => $.reentry.navBar.overview)}
          </NavLink>
          <NavLink
            to={State.Resident.UsMaReentry.Checklist.buildPath(routeParams)}
            end
          >
            {t(($) => $.reentry.navBar.checklist)}
          </NavLink>
          <NavLink
            to={State.Resident.UsMaReentry.Resources.CategoryResults.buildPath({
              ...routeParams,
              // For now, we only have one category to link directly to (housing) - if we get more,
              // this should link to a proper CRE landing page where users can select categories
              category: RESOURCE_CATEGORIES[0].category,
            })}
          >
            {t(($) => $.reentry.navBar.resourceExplorer)}
          </NavLink>
        </Links>
      </Content>
    </Wrapper>
  );
};
