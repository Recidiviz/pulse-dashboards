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

import { NavLink, useMatch } from "react-router-dom";
import { useTypedParams } from "react-router-typesafe-routes/dom";

import type { ReentryPage } from "~@jii/data";
import { State } from "~@jii/paths";
import { useUsMaTranslations } from "~@jii/translation";

import { useReentryAnalytics } from "../../../hooks/useReentryAnalytics";
import { RESOURCE_CATEGORIES } from "../ctaConfigs";
import { Links, Wrapper } from "./ReentryNavBar.styles";

export const ReentryNavBar = () => {
  const { t } = useUsMaTranslations();
  const routeParams = useTypedParams(State.Resident);

  const isChecklistPage = !!useMatch(State.Resident.UsMaReentry.Checklist.path);
  const isResourcesPage = !!useMatch(
    `${State.Resident.UsMaReentry.Resources.path}/*`,
  );
  const guideMatch = useMatch(State.Resident.UsMaReentry.Guide.path);
  const isGuidePage = !!guideMatch;
  const trackEvent = useReentryAnalytics();

  const getDeparturePage = (): ReentryPage => {
    if (isGuidePage) return "topic_page";
    if (isChecklistPage) return "checklist";
    if (isResourcesPage) return "resource_explorer";
    return "home";
  };

  const trackClick = (destination: Exclude<ReentryPage, "topic_page">) =>
    trackEvent("frontend_reentry_local_nav_clicked", {
      departurePage: getDeparturePage(),
      topicId: guideMatch?.params.topicSlug,
      destination,
    });

  // Guides are reached from the Overview, so they keep it highlighted
  const overviewClassName = ({ isActive }: { isActive: boolean }) => {
    const isOverviewOrGuide = isActive || isGuidePage;
    return isOverviewOrGuide ? "active" : undefined;
  };

  return (
    <Wrapper aria-label={t(($) => $.reentry.navBar.sectionLabel)}>
      <Links>
        <NavLink
          to={State.Resident.UsMaReentry.Overview.buildPath(routeParams)}
          end
          className={overviewClassName}
          onClick={() => trackClick("home")}
        >
          {t(($) => $.reentry.navBar.overview)}
        </NavLink>
        <NavLink
          to={State.Resident.UsMaReentry.Checklist.buildPath(routeParams)}
          end
          onClick={() => trackClick("checklist")}
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
          onClick={() => trackClick("resource_explorer")}
        >
          {t(($) => $.reentry.navBar.resourceExplorer)}
        </NavLink>
      </Links>
    </Wrapper>
  );
};
