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
import Markdown from "markdown-to-jsx";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import { FC } from "react";
import styled from "styled-components/macro";

import { withPresenterManager } from "~hydration-utils";

import { useResidentOpportunityContext } from "../ResidentOpportunityHydrator/context";
import { useResidentsContext } from "../ResidentsHydrator/context";
import { useSingleResidentContext } from "../SingleResidentHydrator/context";
import { usePageTitle } from "../usePageTitle/usePageTitle";
import { AdditionalSection } from "./AdditionalSection";
import { OpportunityEligibilityPresenter } from "./OpportunityEligibilityPresenter";
import { RequirementsSection } from "./RequirementsSection";
import { SummarySection } from "./SummarySection";

const Header = styled.header`
  margin: ${rem(spacing.xxl)} 0;
`;

const Headline = styled.h1`
  ${typography.Header34}

  color: ${palette.pine2};
  font-size: ${rem(34)};
  margin: 0 5% ${rem(spacing.lg)};
  text-align: center;
`;

const Subheading = styled.h2`
  ${typography.Sans18}

  color: ${palette.slate85};
  margin: 0 10%;
  text-align: center;

  strong {
    color: ${palette.pine1};
    font-weight: inherit;
  }
`;

const ManagedComponent: FC<{
  presenter: OpportunityEligibilityPresenter;
}> = observer(function OpportunityEligibility({ presenter }) {
  usePageTitle(presenter.htmlTitle);

  return (
    <article>
      <Header>
        <Headline>{presenter.headline}</Headline>
        {presenter.subheading && (
          <Subheading>
            <Markdown options={{ forceInline: true }}>
              {presenter.subheading}
            </Markdown>
          </Subheading>
        )}
      </Header>

      <SummarySection content={presenter.summaryContent} />

      <RequirementsSection presenter={presenter} />

      {presenter.additionalSections.map((sectionContent) => (
        <AdditionalSection
          content={sectionContent}
          key={sectionContent.linkUrl}
        />
      ))}
    </article>
  );
});

function usePresenter() {
  const { residentsStore } = useResidentsContext();
  const { resident } = useSingleResidentContext();
  const {
    opportunity: { opportunityConfig, eligibilityReport },
  } = useResidentOpportunityContext();

  return new OpportunityEligibilityPresenter(
    residentsStore,
    opportunityConfig,
    eligibilityReport,
    resident.pseudonymizedId,
  );
}

export const OpportunityEligibility = withPresenterManager({
  usePresenter,
  managerIsObserver: true,
  ManagedComponent,
});
