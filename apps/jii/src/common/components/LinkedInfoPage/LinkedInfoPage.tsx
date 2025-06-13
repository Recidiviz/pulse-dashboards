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
import { Icon, spacing, typography } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import { FC } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components/macro";

import { palette } from "~design-system";

import {
  FullBleedContainer,
  PageContainer,
} from "../../../components/BaseLayout/BaseLayout";
import { ButtonLink } from "../../../components/ButtonLink/ButtonLink";
import { InfoPage } from "../../../components/InfoPage/InfoPage";

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

export interface LinkedInfoPageProps {
  heading: string;
  body: string;
  pageLinksHeading: string;
  pageLinks: Array<{ text: string; url: string }>;
  topLinkText: string;
}

export const LinkedInfoPage: FC<{
  contents: LinkedInfoPageProps;
}> = observer(function OpportunityInfoPage({ contents }) {
  return (
    <>
      <InfoPage heading={contents.heading} body={contents.body} />
      {contents.pageLinks.length > 0 && (
        <PageLinksFooter>
          <PageLinks>
            <div>
              <h2>{contents.pageLinksHeading}</h2>
              <ul>
                {contents.pageLinks.map((link) => (
                  <li key={link.url}>
                    <Link to={link.url}>{link.text}</Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <ButtonLink to="#top" reloadDocument>
                <Icon kind="Arrow" rotate={-90} size={12} />
                <span>{contents.topLinkText}</span>
              </ButtonLink>
            </div>
          </PageLinks>
        </PageLinksFooter>
      )}
      <ScrollToHashElement />
    </>
  );
});
