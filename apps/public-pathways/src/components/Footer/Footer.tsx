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
import styled from "styled-components";

import { publicPathwaysTypography } from "../../styles/publicPathwaysTypography";

const FooterWrapper = styled.footer`
  ${publicPathwaysTypography.Sans14}
  height: ${rem(100)};
  padding: ${rem(spacing.md)} 0 ${rem(spacing.md)} 0;
  display: flex;
  align-items: center;
  gap: ${rem(spacing.md)};
`;

const LogoLink = styled.a`
  display: flex;
  align-items: center;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.palette.focusColor};
    outline-offset: 2px;
    border-radius: 2px;
  }
`;

const Logo = styled.img`
  height: ${rem(40)};
`;

const RecidivizLogo = styled(Logo)`
  margin-top: ${rem(spacing.xs)};
`;

export function Footer() {
  return (
    <FooterWrapper>
      <LogoLink
        href="https://doccs.ny.gov/"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Visit the DOCCS website"
      >
        <Logo src="/DOCCS_logo.png" alt="DOCCS logo" />
      </LogoLink>
      <LogoLink
        href="https://recidiviz.org"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Visit the Recidiviz website"
      >
        <RecidivizLogo src="/recidiviz_logo_1.png" alt="Recidiviz logo" />
      </LogoLink>
    </FooterWrapper>
  );
}
