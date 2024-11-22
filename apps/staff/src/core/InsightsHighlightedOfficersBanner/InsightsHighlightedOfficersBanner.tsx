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
import { rem } from "polished";
import React from "react";
import { Link } from "react-router-dom";
import simplur from "simplur";
import styled from "styled-components/macro";

import {
  HighlightedOfficersDetail,
  SupervisionOfficerIdentifiers,
} from "../../InsightsStore/presenters/types";
import {
  generateSerialListString,
  getFirstName,
  getSerialListSeparator,
} from "../../utils";
import { Banner } from "../sharedComponents";
import { insightsUrl } from "../views";

const OfficerLink = styled(Link)`
  color: ${palette.signal.links} !important;
  &:hover {
    text-decoration: underline;
  }
`;

const StyledBanner = styled(Banner)`
  ${typography.Sans16};
  border: ${rem(1)} solid ${palette.slate20};
  border-radius: 0;
  margin-top: ${rem(spacing.lg)};
`;

const formatNamesAsLinks = (
  officers: SupervisionOfficerIdentifiers[],
): JSX.Element => (
  <>
    {officers.map((officer, index) => (
      <React.Fragment key={officer.pseudonymizedId}>
        <OfficerLink
          to={insightsUrl("supervisionStaff", {
            officerPseudoId: officer.pseudonymizedId,
          })}
        >
          {officer.displayName}
        </OfficerLink>
        {getSerialListSeparator(index, officers.length)}
      </React.Fragment>
    ))}
  </>
);

export const highlightedOfficerText = (
  detail: HighlightedOfficersDetail,
  officerLabel: string,
  generateLinks: boolean,
  staffPage: boolean,
) => {
  const commonText = simplur`${[detail.numOfficers]} [is|are] in the top ${
    detail.topXPct
  }% of ${officerLabel}s in the state for highest ${detail.metricName} rate this year.`;

  if (staffPage) {
    const firstName = getFirstName(detail.officers[0].displayName);
    return `${firstName} ${commonText}`;
  }

  if (generateLinks) {
    const formattedLinks = formatNamesAsLinks(detail.officers);
    return (
      <>
        {formattedLinks} {commonText}
      </>
    );
  }

  const officerNames = detail.officers.map((officer) => officer.displayName);
  const formattedNames = generateSerialListString(officerNames);
  return `${formattedNames} ${commonText}`;
};

type InsightsHighlightedOfficersBannerType = {
  highlightedOfficers: HighlightedOfficersDetail[];
  supervisionOfficerLabel: string;
  generateLinks?: boolean;
  staffPage?: boolean;
};

const InsightsHighlightedOfficersBanner: React.FC<
  InsightsHighlightedOfficersBannerType
> = ({
  highlightedOfficers,
  supervisionOfficerLabel,
  generateLinks = false,
  staffPage = false,
}) => {
  return highlightedOfficers.map((detail) => {
    return (
      <StyledBanner key={detail.metricName}>
        {highlightedOfficerText(
          detail,
          supervisionOfficerLabel,
          generateLinks,
          staffPage,
        )}
      </StyledBanner>
    );
  });
};

export default InsightsHighlightedOfficersBanner;
