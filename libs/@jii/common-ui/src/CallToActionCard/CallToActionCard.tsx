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

import { rem } from "polished";
import { Link } from "react-router-dom";
import styled from "styled-components";

import { spacing, typography } from "~design-system";

import { GoLink } from "../GoLink/GoLink";
import {
  IllustratedCard,
  IllustrationPlacement,
} from "../IllustratedCard/IllustratedCard";

const CardHeading = styled.h3`
  ${typography.Sans24}

  a {
    color: inherit;
    text-decoration: none;
  }

  margin-top: 0;
`;

const CardDescription = styled.p`
  ${typography.Sans16}
  color: black;

  margin-bottom: ${rem(spacing.lg)};
`;

type CallToActionCardProps = {
  linkTo: string;
  heading: string;
  description: string;
  linkText: string;
  illustrationSrc: string;
  illustrationBackground: string;
  illustrationPlacement?: IllustrationPlacement;
};

export function CallToActionCard({
  linkTo,
  heading,
  description,
  linkText,
  illustrationSrc,
  illustrationBackground,
  illustrationPlacement,
}: CallToActionCardProps) {
  return (
    <IllustratedCard
      illustrationSrc={illustrationSrc}
      illustrationBackground={illustrationBackground}
      illustrationPlacement={illustrationPlacement}
      illustrationLink={linkTo}
      // treated as decorative here since there is also a text CTA link
      illustrationAlt=""
    >
      <CardHeading>
        <Link to={linkTo}>{heading}</Link>
      </CardHeading>
      <CardDescription>{description}</CardDescription>
      <GoLink to={linkTo}>{linkText}</GoLink>
    </IllustratedCard>
  );
}
