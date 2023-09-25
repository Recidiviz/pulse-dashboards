// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2022 Recidiviz, Inc.
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

import { palette, Sans12, spacing, typography } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem, rgba } from "polished";
import React from "react";
import { Link, NavLink } from "react-router-dom";
import styled from "styled-components/macro";

import { useRootStore } from "../../components/StoreProvider";
import useIsMobile from "../../hooks/useIsMobile";
import { toTitleCase } from "../../utils";
import { OPPORTUNITY_CONFIGS } from "../../WorkflowsStore/Opportunity/OpportunityConfigs";
import {
  getJusticeInvolvedPersonTitle,
  getSystemIdFromOpportunityType,
} from "../../WorkflowsStore/utils";
import cssVars from "../CoreConstants.module.scss";
import { SystemId } from "../models/types";
import { NavigationLayout } from "../NavigationLayout";
import RecidivizLogo from "../RecidivizLogo";
import { WorkflowsPage, workflowsUrl } from "../views";

const Wrapper = styled.div<{ responsiveRevamp?: boolean }>`
  background-color: ${palette.marble1};
  min-height: 100vh;
  width: 100%;

  ${({ responsiveRevamp }) =>
    !responsiveRevamp &&
    `display: grid;
      grid-template-columns: ${rem(230)} minmax(0, ${rem(1268 + spacing.md)});`}
`;

const Sidebar = styled.nav`
  grid-column: 1;
  padding: ${rem(spacing.md)};
`;

const Main = styled.main<{
  responsiveRevamp?: boolean;
  isMobile?: boolean;
}>`
  grid-column: 2;
  padding-right: ${rem(spacing.md)};
  padding-top: ${rem(spacing.sm)};
  /* leaving extra space for the Intercom button */
  padding-bottom: ${rem(spacing.md * 4)};

  ${({ responsiveRevamp, isMobile }) =>
    responsiveRevamp &&
    `max-width: 75vw;
      margin: 0 auto;
      padding: ${
        isMobile
          ? `${rem(spacing.lg)} ${rem(spacing.md)}`
          : `${rem(spacing.xl)} ${rem(spacing.lg)}`
      };
      padding-bottom: ${rem(spacing.md * 5)};
      
      @media screen and (max-width: ${cssVars.breakpointSxs}) {
        max-width: 90vw;
      }

      @media screen and (max-width: ${cssVars.breakpointXs}) {
        max-width: unset;
      }`}
`;

const NavLinks = styled.ul`
  list-style: none;
  margin: 0;
  margin-top: ${rem(72)};
  padding: 0;

  li {
    margin-bottom: ${rem(spacing.xs)};
  }
`;

const NavSection = styled.ul`
  list-style: none;
  margin: 0;
  margin-top: ${rem(spacing.lg)};
  padding: 0;
`;

const NavSectionLabel = styled(Sans12)`
  color: ${rgba(palette.slate, 0.5)};
  font-size: ${rem(13)};
  line-height: ${rem(16)};
`;

const BrandedNavLink = styled(NavLink).attrs({ exact: true })`
  ${typography.Sans14}

  color: ${palette.slate80};

  &:hover,
  &:focus {
    color: ${palette.pine4};
    text-decoration: underline;
  }

  &.active {
    color: ${palette.pine4};
  }
`;

const SYSTEM_ID_TO_PATH: Record<SystemId, WorkflowsPage> = {
  SUPERVISION: "caseloadClients",
  INCARCERATION: "caseloadResidents",
  ALL: "home",
} as const;

export const WorkflowsNavLayout: React.FC = observer(
  function WorkflowsNavLayout({ children }) {
    const {
      workflowsStore,
      workflowsStore: {
        opportunityTypes,
        allowSupervisionTasks,
        workflowsSupportedSystems,
        featureVariants,
        homepage: workflowsHomepage,
      },
    } = useRootStore();
    const { isMobile } = useIsMobile(true);

    return (
      <Wrapper responsiveRevamp={!!featureVariants.responsiveRevamp}>
        {featureVariants.responsiveRevamp ? (
          <NavigationLayout isMethodologyExternal>
            <li>
              <BrandedNavLink to={workflowsUrl(workflowsHomepage)}>
                Home
              </BrandedNavLink>
            </li>
            {allowSupervisionTasks && (
              <li>
                <BrandedNavLink
                  to={workflowsUrl("tasks")}
                  onClick={() =>
                    workflowsStore.updateActiveSystem("SUPERVISION")
                  }
                >
                  Tasks
                </BrandedNavLink>
              </li>
            )}

            {workflowsSupportedSystems?.map((systemId: SystemId) => {
              return (
                <li key={systemId}>
                  <BrandedNavLink
                    to={workflowsUrl(SYSTEM_ID_TO_PATH[systemId])}
                    onClick={() => workflowsStore.updateActiveSystem(systemId)}
                  >
                    {toTitleCase(getJusticeInvolvedPersonTitle(systemId))}s
                  </BrandedNavLink>
                </li>
              );
            })}
          </NavigationLayout>
        ) : (
          <Sidebar>
            <Link
              to={workflowsUrl(workflowsHomepage)}
              onClick={() => workflowsStore.updateActiveSystem("ALL")}
            >
              <RecidivizLogo />
            </Link>
            <NavLinks>
              <li>
                <BrandedNavLink to={workflowsUrl(workflowsHomepage)}>
                  Home
                </BrandedNavLink>
              </li>
              {allowSupervisionTasks && (
                <li>
                  <BrandedNavLink
                    to={workflowsUrl("tasks")}
                    onClick={() =>
                      workflowsStore.updateActiveSystem("SUPERVISION")
                    }
                  >
                    Tasks
                  </BrandedNavLink>
                </li>
              )}

              {workflowsSupportedSystems?.map((systemId: SystemId) => {
                return (
                  <li key={systemId}>
                    <BrandedNavLink
                      to={workflowsUrl(SYSTEM_ID_TO_PATH[systemId])}
                      onClick={() =>
                        workflowsStore.updateActiveSystem(systemId)
                      }
                    >
                      All {toTitleCase(getJusticeInvolvedPersonTitle(systemId))}
                      s
                    </BrandedNavLink>
                  </li>
                );
              })}

              <li>
                <NavSection>
                  <li>
                    <NavSectionLabel>Shortcuts</NavSectionLabel>
                  </li>
                  {opportunityTypes.map((opportunityType) => {
                    const systemId =
                      getSystemIdFromOpportunityType(opportunityType);
                    if (workflowsSupportedSystems?.includes(systemId)) {
                      return (
                        <li key={opportunityType}>
                          <BrandedNavLink
                            className={`BrandedNavLink__${opportunityType}`}
                            to={workflowsUrl("opportunityClients", {
                              opportunityType,
                            })}
                            onClick={() =>
                              workflowsStore.updateActiveSystem(
                                getSystemIdFromOpportunityType(opportunityType)
                              )
                            }
                          >
                            {OPPORTUNITY_CONFIGS[opportunityType].label}
                          </BrandedNavLink>
                        </li>
                      );
                    }
                    return null;
                  })}
                </NavSection>
              </li>
            </NavLinks>
          </Sidebar>
        )}
        <Main
          responsiveRevamp={!!featureVariants.responsiveRevamp}
          isMobile={!!featureVariants.responsiveRevamp && isMobile}
        >
          {children}
        </Main>
      </Wrapper>
    );
  }
);
