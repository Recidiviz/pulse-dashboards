// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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
import { rem } from "polished";
import { NavLink } from "react-router-dom";
import { useTypedParams } from "react-router-typesafe-routes/dom";
import styled from "styled-components/macro";

import chevronUrl from "../../assets/images/chevron.svg";
import { State } from "../../routes/routes";
import { HeaderBarContainer } from "../AppLayout/HeaderBarContainer";
import { useResidentOpportunityContext } from "../ResidentOpportunityHydrator/context";
import { findPageConfig } from "./utils";

const Nav = styled.nav.attrs({ "aria-label": "Breadcrumb" })`
  ol {
    ${typography.Sans14}

    padding: 0;
    display: flex;
    flex-wrap: wrap;
    gap: ${rem(spacing.md)};

    li {
      align-items: baseline;
      display: flex;
      gap: ${rem(spacing.md)};

      &:after {
        background: url(${chevronUrl});
        content: "";
        display: block;
        flex: 0 0 auto;
        width: ${rem(5)};
        height: ${rem(8)};
      }

      &:last-child {
        &:after {
          content: none;
        }
      }
    }

    a {
      color: ${palette.text.links};

      &[aria-current="page"] {
        color: ${palette.slate85};
        text-decoration: none;
      }
    }
  }
`;

export const BreadcrumbsNav = () => {
  const { pageSlug } = useTypedParams(
    State.Resident.Eligibility.Opportunity.InfoPage,
  );
  const {
    opportunity: { opportunityConfig },
  } = useResidentOpportunityContext();

  const pageConfig = findPageConfig(opportunityConfig, pageSlug);

  return (
    <HeaderBarContainer>
      <Nav>
        <ol>
          <li>
            <NavLink to="../" end>
              {opportunityConfig.name}
            </NavLink>
          </li>
          <li>
            <NavLink to="" end>
              {pageConfig.heading}
            </NavLink>
          </li>
        </ol>
      </Nav>
    </HeaderBarContainer>
  );
};
