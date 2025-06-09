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

import { Icon, Sans14, spacing } from "@recidiviz/design-system";
import { rem } from "polished";
import { Link } from "react-router-dom";
import styled from "styled-components/macro";

import { palette } from "~design-system";

import { toTitleCase } from "../../utils";
import { Opportunity } from "../../WorkflowsStore";

const Banner = styled(Sans14)`
  color: ${palette.marble1};
  line-height: 1.5;
  background-color: ${palette.pine3};
  margin: 0 -${rem(spacing.md)};
  padding: ${rem(spacing.md)};
`;

const InlineArrow = styled(Icon).attrs({ size: 12, kind: "Arrow" })`
  display: inline-block;
  margin-left: 0.4em;
  margin-bottom: ${rem(spacing.xxs)};
`;

const ProfileLink = styled(Link)`
  color: ${palette.marble1};
  border-bottom: 1px solid ${palette.marble1};

  &:hover,
  &:active,
  &:focus {
    color: ${palette.signal.highlight};
    border-color: ${palette.signal.highlight};
  }
`;

export const OpportunityBanner = function OpportunityBanner({
  opportunity,
  title,
}: {
  opportunity: Opportunity;
  title: string;
}) {
  return (
    <Banner>
      {opportunity.previewBannerText}{" "}
      <ProfileLink to={opportunity.person.profileUrl}>
        See&nbsp;{toTitleCase(title)}&nbsp;Profile
        <InlineArrow />
      </ProfileLink>
    </Banner>
  );
};
