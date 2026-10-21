// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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

import { spacing, typography } from "@recidiviz/design-system";
import { rem, rgba } from "polished";
import { type ReactElement } from "react";
import styled from "styled-components";

import { Icon, IconSVG, palette } from "~design-system";

// These Drive URLs stay the same when the docs are updated, so staff always
// land on the latest version.
export const US_TN_CLASSIFICATION_RESOURCE_LINKS = [
  {
    label: "Pilot User's Guide",
    url: "https://docs.google.com/document/d/11yeGtgd8TyeFEvEtMsOvITcJSJRu5sNSRAwj9gt7pBI/edit?usp=sharing",
  },
  {
    label: "Offense Severity List",
    url: "https://docs.google.com/spreadsheets/d/1YO-E01S_RPCJkXYkC1B6NQbuQXqU9iV-/edit?usp=sharing",
  },
] as const;

// Sits in FormContainer's dark header bar, under the "Last edited" message.
const Banner = styled.section`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${rem(spacing.xs)} ${rem(18)};
  width: fit-content;
  margin-top: ${rem(spacing.sm)};
  padding: ${rem(10)} ${rem(spacing.sm)};
  border: 1px dashed ${palette.data.gold1};
  border-radius: ${rem(6)};
`;

const BannerLabel = styled.span`
  ${typography.Sans12}
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${palette.white70};
`;

const ResourceLink = styled.a`
  ${typography.Sans16}
  display: inline-flex;
  align-items: center;
  gap: ${rem(spacing.sm)};
  padding-bottom: ${rem(2)};
  border-bottom: 1px solid ${rgba(palette.white, 0.25)};
  color: ${palette.white90};
  text-decoration: none;

  &:hover,
  &:focus {
    color: ${palette.white};
    border-bottom-color: ${palette.white70};
  }
`;

export function ClassificationResourceLinksBanner(): ReactElement {
  return (
    <Banner aria-label="Classification resources">
      <BannerLabel>Refer to</BannerLabel>
      {US_TN_CLASSIFICATION_RESOURCE_LINKS.map(({ label, url }) => (
        <ResourceLink
          key={label}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${label} (opens in new tab)`}
        >
          {label}
          <Icon kind={IconSVG.Open} width={12} aria-hidden="true" />
        </ResourceLink>
      ))}
    </Banner>
  );
}
