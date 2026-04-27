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

import { observer } from "mobx-react-lite";
import { rem } from "polished";
import styled from "styled-components";

import { Icon, spacing } from "~design-system";

import { publicPathwaysPalette } from "../../styles/publicPathwaysPalette";
import { publicPathwaysTypography } from "../../styles/publicPathwaysTypography";
import { useRootStore } from "../StoreProvider";

const HeaderWrapper = styled.header`
  height: ${rem(100)};
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  border-bottom: 1px solid rgba(0, 0, 0, 0.15);
`;

const Brand = styled.div`
  display: flex;
  align-items: center;
  gap: ${rem(spacing.sm)};
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
  margin-top: -${rem(spacing.sm)};
`;

const Title = styled.p`
  ${publicPathwaysTypography.Header24}
  margin: 0;
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: ${rem(spacing.md)};
`;

const SiteNav = styled.nav`
  display: flex;
  align-items: center;
`;

const NavLink = styled.a`
  ${publicPathwaysTypography.Sans14}
  padding: ${rem(spacing.xs)} ${rem(spacing.sm)};
  color: inherit;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
    color: ${publicPathwaysPalette.signal.links};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.palette.focusColor};
    outline-offset: 2px;
    border-radius: 2px;
  }
`;

const DownloadButton = styled.button`
  ${publicPathwaysTypography.Sans14}
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  width: fit-content;
  min-width: 110px;
  height: 38px;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 50px;
  border: 1px solid ${publicPathwaysPalette.signal.links};
  background-color: ${publicPathwaysPalette.signal.links};
  color: white;
  cursor: pointer;
  outline: none;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.palette.focusColor};
    outline-offset: 2px;
  }
`;

export const Header = observer(function Header() {
  const { analyticsStore, metricsStore } = useRootStore();

  return (
    <HeaderWrapper>
      <Brand>
        <LogoLink
          href="https://doccs.ny.gov/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Visit the DOCCS website"
        >
          <Logo src="/DOCCS_logo.png" alt="DOCCS logo" />
        </LogoLink>
        <Title>NYS DOCCS</Title>
      </Brand>
      <HeaderActions>
        <SiteNav aria-label="Site navigation">
          <NavLink
            href="https://drive.google.com/file/d/1AkFPJP7721NudPWua39C5F0-Xiz1_b89/view"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => analyticsStore.trackMethodologyLinkClicked()}
          >
            How it works
          </NavLink>
        </SiteNav>
        <DownloadButton
          type="button"
          onClick={() => {
            metricsStore.download();
            analyticsStore.trackDownloadClicked({
              metricId: metricsStore.current.id,
            });
          }}
        >
          <Icon kind="DownloadArrowThin" color="white" size={12} />
          Download
        </DownloadButton>
      </HeaderActions>
    </HeaderWrapper>
  );
});
