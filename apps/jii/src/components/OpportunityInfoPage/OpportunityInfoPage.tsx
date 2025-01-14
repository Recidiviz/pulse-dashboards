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

import ScrollToHashElement from "@cascadia-code/scroll-to-hash-element";
import { Icon, palette, spacing, typography } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import { FC } from "react";
import { Link } from "react-router-dom";
import { useTypedParams } from "react-router-typesafe-routes/dom";
import styled from "styled-components/macro";

import { withPresenterManager } from "~hydration-utils";

import { State } from "../../routes/routes";
import { FullBleedContainer, PageContainer } from "../BaseLayout/BaseLayout";
import { ButtonLink } from "../ButtonLink/ButtonLink";
import { CopyWrapper } from "../CopyWrapper/CopyWrapper";
import { useResidentOpportunityContext } from "../ResidentOpportunityHydrator/context";
import { usePageTitle } from "../usePageTitle/usePageTitle";
import { OpportunityInfoPagePresenter } from "./OpportunityInfoPagePresenter";
import { TableOfContents } from "./TableOfContents";

const PageLinksFooter = styled(FullBleedContainer).attrs({ as: "footer" })`
  background: ${palette.marble3};
`;

const PageLinks = styled(PageContainer)`
  display: flex;
  flex-wrap: wrap;
  gap: ${rem(spacing.lg)};
  justify-content: space-between;
  margin-top: ${rem(spacing.xl * 2)};
  padding-bottom: ${rem(spacing.xl)};
  padding-top: ${rem(spacing.xxl)};

  h2 {
    ${typography.Sans24}
    color: ${palette.pine1};
  }

  ul {
    ${typography.Sans16};
    list-style-type: none;
    padding-inline-start: 0;
  }

  li {
    margin: ${rem(spacing.lg)} 0;
  }

  a {
    color: ${palette.text.links};
  }
`;

const ManagedComponent: FC<{
  presenter: OpportunityInfoPagePresenter;
}> = observer(function OpportunityInfoPage({ presenter }) {
  usePageTitle(presenter.heading);

  return (
    <>
      <ButtonLink to="../">
        <Icon kind="Arrow" rotate={180} size={13} />
        <span>Go back</span>
      </ButtonLink>
      <article>
        <CopyWrapper>{`# ${presenter.heading}`}</CopyWrapper>
        <TableOfContents presenter={presenter} />
        <CopyWrapper>{presenter.body}</CopyWrapper>
      </article>
      {presenter.pageLinks.length > 0 && (
        <PageLinksFooter>
          <PageLinks>
            <div>
              <h2>{presenter.pageLinksHeading}</h2>
              <ul>
                {presenter.pageLinks.map((link) => (
                  <li key={link.url}>
                    <Link to={link.url}>{link.text}</Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <ButtonLink to="#top" reloadDocument>
                <Icon kind="Arrow" rotate={-90} size={12} />
                <span>Back to top</span>
              </ButtonLink>
            </div>
          </PageLinks>
        </PageLinksFooter>
      )}
      <ScrollToHashElement />
    </>
  );
});

function usePresenter() {
  const { pageSlug } = useTypedParams(
    State.Resident.Eligibility.Opportunity.InfoPage,
  );
  const {
    opportunity: { opportunityConfig, eligibilityReport },
  } = useResidentOpportunityContext();

  return new OpportunityInfoPagePresenter(
    opportunityConfig,
    pageSlug,
    eligibilityReport,
  );
}

export const OpportunityInfoPage = withPresenterManager({
  usePresenter,
  managerIsObserver: true,
  ManagedComponent,
});
