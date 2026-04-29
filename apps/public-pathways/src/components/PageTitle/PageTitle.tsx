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

import { spacing } from "@recidiviz/design-system";
import { rem } from "polished";
import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";

import { publicPathwaysPalette } from "../../styles/publicPathwaysPalette";
import { publicPathwaysTypography } from "../../styles/publicPathwaysTypography";

const DESCRIPTION_MAX_WIDTH = 710;

const TitleSection = styled.section`
  padding-top: ${rem(spacing.xl)};
  padding-bottom: ${rem(spacing.lg)};
`;

const Title = styled.h1`
  ${publicPathwaysTypography.Header22}
  margin-bottom: ${rem(spacing.sm)};

  &:focus {
    outline: none;
  }
`;

const Description = styled.p`
  ${publicPathwaysTypography.Sans16}
  max-width: ${rem(DESCRIPTION_MAX_WIDTH)};
  line-height: 1.3;
  margin: 0;
`;

const LearnMoreLink = styled(Link)`
  ${publicPathwaysTypography.Sans16}
  color: ${publicPathwaysPalette.signal.links};
  text-decoration: underline;
  margin-left: ${rem(spacing.xs)};
  display: inline-flex;
  align-items: center;
  min-height: ${rem(24)};
  outline: none;

  &:focus-visible {
    outline: 2px solid ${publicPathwaysPalette.focusColor};
    outline-offset: 2px;
  }
`;

interface PageTitleProps {
  title: string;
  description: string;
  methodologyTo?: string;
}

export function PageTitle({
  title,
  description,
  methodologyTo,
}: PageTitleProps) {
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
  }, [title]);

  return (
    <TitleSection aria-labelledby="page-title">
      <Title
        ref={titleRef}
        tabIndex={-1}
        id="page-title"
        aria-describedby="page-description"
      >
        {title}
      </Title>
      <Description id="page-description">
        {description}
        {methodologyTo && (
          <LearnMoreLink
            to={methodologyTo}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Learn more about our methodology"
          >
            Learn more
          </LearnMoreLink>
        )}
      </Description>
    </TitleSection>
  );
}
