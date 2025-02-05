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
import { FC } from "react";
import { useTypedParams } from "react-router-typesafe-routes/dom";
import styled from "styled-components/macro";

import { withPresenterManager } from "~hydration-utils";

import { State } from "../../routes/routes";
import { GoButton } from "../ButtonLink/GoButton";
import { CopyWrapper } from "../CopyWrapper/CopyWrapper";
import { useResidentsContext } from "../ResidentsHydrator/context";
import { usePageTitle } from "../usePageTitle/usePageTitle";
import { OpportunityComparisonPresenter } from "./OpportunityComparisonPresenter";

const ComparisonTable = styled.table`
  border-spacing: 0;
  margin-top: ${rem(spacing.xxl)};

  th {
    ${typography.Sans18}

    text-align: left;
  }

  th,
  td {
    border-top: 1px solid ${palette.slate20};
    border-left: 1px solid ${palette.slate20};
    padding: ${rem(spacing.md)} ${rem(spacing.lg)};
    text-wrap: balance;

    &:first-child {
      border-left: none;
      color: ${palette.slate85};
    }
  }
  tr:last-child td {
    border: none;
    padding-top: ${rem(spacing.xl)};
    vertical-align: top;
  }
`;

const LinkBox = styled.div`
  border: 1px solid ${palette.slate20};
  border-radius: ${rem(spacing.sm)};
  padding: ${rem(spacing.lg)};

  p {
    margin-top: 0;
  }
`;

const ManagedComponent: FC<{ presenter: OpportunityComparisonPresenter }> = ({
  presenter,
}) => {
  const { pageContents, opportunitySlugs } = presenter;
  usePageTitle(pageContents.heading);
  const { stateSlug, personPseudoId } = useTypedParams(
    State.Resident.Eligibility.Comparison,
  );

  return (
    <div>
      <CopyWrapper>
        {`# ${pageContents.heading}

${pageContents.body}`}
      </CopyWrapper>
      <ComparisonTable>
        <thead>
          <tr>
            <th></th>
            <th>{pageContents.tableHeadings[0]}</th>
            <th>{pageContents.tableHeadings[1]}</th>
          </tr>
        </thead>
        <tbody>
          {pageContents.tableRows.map((row) => (
            <tr key={row[0]}>
              {row.map((cell, i) => (
                <td key={i}>{cell}</td>
              ))}
            </tr>
          ))}
          <tr>
            <td></td>
            {opportunitySlugs.map((slug, i) => (
              <td key={slug}>
                <LinkBox>
                  <p>Interested in {pageContents.tableHeadings[i]}?</p>
                  <GoButton
                    to={State.Resident.Eligibility.Opportunity.buildPath({
                      stateSlug,
                      personPseudoId,
                      opportunitySlug: slug,
                    })}
                  >
                    {pageContents.linkText}
                  </GoButton>
                </LinkBox>
              </td>
            ))}
          </tr>
        </tbody>
      </ComparisonTable>
    </div>
  );
};

function usePresenter() {
  const { opportunitySlug1, opportunitySlug2 } = useTypedParams(
    State.Resident.Eligibility.Comparison,
  );
  const {
    residentsStore: { config },
  } = useResidentsContext();

  return new OpportunityComparisonPresenter(
    [opportunitySlug1, opportunitySlug2],
    config,
  );
}

export const OpportunityComparison = withPresenterManager({
  usePresenter,
  ManagedComponent,
  managerIsObserver: false,
});
