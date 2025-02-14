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
import { palette, spacing, typography } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import { FC, useId } from "react";
import { Link } from "react-router-dom";
import useMeasure from "react-use-measure";
import styled from "styled-components/macro";

import { withPresenterManager } from "~hydration-utils";

import { PAGE_LAYOUT_HEADER_GAP } from "../AppLayout/constants";
import { HeaderPortal } from "../AppLayout/HeaderPortal";
import { FullBleedContainer } from "../BaseLayout/BaseLayout";
import { useResidentOpportunityContext } from "../ResidentOpportunityHydrator/context";
import { useResidentsContext } from "../ResidentsHydrator/context";
import { useSingleResidentContext } from "../SingleResidentHydrator/context";
import { usePageTitle } from "../usePageTitle/usePageTitle";
import { AdditionalSection } from "./AdditionalSection";
import { OpportunityEligibilityPresenter } from "./OpportunityEligibilityPresenter";
import { RequirementsSection } from "./RequirementsSection";

const SIDEBAR_WIDTH = 120;

const Background = styled(FullBleedContainer)`
  height: ${rem(400)};
  pointer-events: none;
  position: absolute;
  top: -${rem(spacing.xl)};
`;

const Wrapper = styled.article<{ scrollMargin: number }>`
  padding-left: ${rem(SIDEBAR_WIDTH + spacing.xl * 2)};

  & [id] {
    scroll-margin-top: ${(props) => props.scrollMargin}px;
  }
`;

const Headline = styled.h1`
  ${typography.Sans24}

  color: ${palette.pine1};
  font-size: ${rem(34)};
  margin: 0 0 ${rem(spacing.sm)};
  text-wrap: balance;
`;

const Body = styled.div``;

const TableOfContents = styled.nav`
  margin-top: ${rem(PAGE_LAYOUT_HEADER_GAP)};
  position: absolute;
  width: ${rem(SIDEBAR_WIDTH)};

  h2 {
    ${typography.Sans14}

    color: ${palette.slate85};
    margin: 0 0 ${rem(spacing.md)};
  }

  ul {
    list-style: none;
    padding: 0;
  }

  li {
    margin: ${rem(spacing.sm)} 0;
  }

  a {
    color: ${palette.text.links};
    display: inline-block;
    padding: ${rem(spacing.sm)} 0;
  }
`;

const ManagedComponent: FC<{
  presenter: OpportunityEligibilityPresenter;
}> = observer(function OpportunityEligibility({ presenter }) {
  usePageTitle(presenter.title);

  const tocLabelId = useId();

  // we will align with the TOC position to keep anchor links
  // from scrolling past the sticky header
  const [measureRef, { top: topOfContent }] = useMeasure();

  return (
    <>
      <HeaderPortal>
        <TableOfContents aria-labelledby={tocLabelId} ref={measureRef}>
          <h2 id={tocLabelId}>On this page</h2>
          <ul>
            {presenter.tableOfContentsLinks.map((props) => (
              <li key={props.children}>
                <Link {...props} reloadDocument />
              </li>
            ))}
          </ul>
        </TableOfContents>
      </HeaderPortal>
      <div>
        <Background style={{ background: presenter.pageBackgroundStyle }} />
        <Wrapper scrollMargin={topOfContent}>
          <Headline>{presenter.title}</Headline>

          <Body>
            <RequirementsSection presenter={presenter} />

            {presenter.additionalSections.map((sectionContent) => (
              <AdditionalSection
                content={sectionContent}
                key={sectionContent.linkUrl}
              />
            ))}
          </Body>
        </Wrapper>
        <ScrollToHashElement />
      </div>
    </>
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
