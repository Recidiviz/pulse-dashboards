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
import { rem, rgba } from "polished";
import React from "react";
import { Link, NavLink } from "react-router-dom";
import styled from "styled-components/macro";

import RecidivizLogo from "../RecidivizLogo";
import { PATHWAYS_VIEWS, workflowsUrl } from "../views";

const Wrapper = styled.div`
  background-color: ${palette.marble1};
  display: grid;
  grid-template-columns: ${rem(230)} minmax(0, ${rem(1268 + spacing.md)});
  min-height: 100vh;
  width: 100%;
`;

const Sidebar = styled.nav`
  grid-column: 1;
  padding: ${rem(spacing.md)};
`;

const Main = styled.main`
  grid-column: 2;
  padding-right: ${rem(spacing.md)};
  padding-top: ${rem(spacing.sm)};
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
    font-weight: 600;
    text-decoration: underline;
  }

  &.active {
    color: ${palette.pine4};
    font-weight: 600;
  }
`;

export const WorkflowsNavLayout: React.FC = ({ children }) => {
  return (
    <Wrapper>
      <Sidebar>
        <Link to={`/${PATHWAYS_VIEWS.workflows}`}>
          <RecidivizLogo />
        </Link>
        <NavLinks>
          <li>
            <BrandedNavLink to={workflowsUrl("general")}>
              Clients
            </BrandedNavLink>
          </li>
          <li>
            <NavSection>
              <li>
                <NavSectionLabel>Shortcuts</NavSectionLabel>
              </li>
              <li>
                <BrandedNavLink to={workflowsUrl("compliantReporting")}>
                  Compliant Reporting
                </BrandedNavLink>
              </li>
            </NavSection>
          </li>
        </NavLinks>
      </Sidebar>
      <Main>{children}</Main>
    </Wrapper>
  );
};
