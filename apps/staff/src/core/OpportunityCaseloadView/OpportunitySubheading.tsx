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

import { Button, Sans16, spacing } from "@recidiviz/design-system";
import { rem } from "polished";
import { useState } from "react";
import MarkdownView from "react-showdown";
import styled from "styled-components/macro";

import { palette } from "~design-system";

import useIsMobile from "../../hooks/useIsMobile";

const StyledMarkdownView = styled(MarkdownView)`
  display: inline;

  p {
    font-family: inherit;
    line-height: inherit;
    font-weight: 400;

    &:last-child {
      display: inline; // put "view more" link on the same line
    }
  }

  ul {
    padding-inline-start: ${rem(spacing.lg)};
  }
`;
const ViewMoreButton = styled(Button)<{ expanded: boolean }>`
  font-size: inherit;
  color: ${palette.signal.notification};
  ${({ expanded }) =>
    expanded
      ? `display: block; 
       margin-top: 1rem`
      : `margin-left: 10px;`}
`;

const OpportunityStyledSubheading = styled(Sans16)`
  color: ${palette.slate70};
  padding-bottom: ${rem(spacing.md)};
`;

interface OpportunitySubheadingProps {
  subheading: string;
}

const OpportunitySubheading = ({ subheading }: OpportunitySubheadingProps) => {
  const MOBILE_SUBHEADING_CUTOFF = 300; // number of characters to cutoff and show "view more"

  const [expanded, setExpanded] = useState(false);
  const { isMobile } = useIsMobile(true);

  const visibleSubheading =
    isMobile && !expanded
      ? subheading.slice(0, MOBILE_SUBHEADING_CUTOFF)
      : subheading;

  return (
    <OpportunityStyledSubheading>
      <StyledMarkdownView
        markdown={visibleSubheading}
        options={{ openLinksInNewWindow: true }}
      />
      {isMobile &&
        subheading.length > MOBILE_SUBHEADING_CUTOFF &&
        (expanded ? (
          <ViewMoreButton
            kind="link"
            onClick={() => setExpanded(false)}
            expanded
          >
            View less <i className="fa fa-angle-up" />
          </ViewMoreButton>
        ) : (
          <ViewMoreButton
            kind="link"
            onClick={() => setExpanded(true)}
            expanded={false}
          >
            View more <i className="fa fa-angle-down" />
          </ViewMoreButton>
        ))}
    </OpportunityStyledSubheading>
  );
};

export default OpportunitySubheading;
